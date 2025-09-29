import { NextRequest, NextResponse } from 'next/server';
import { sql } from '@/lib/db';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { GoogleGenAI } from '@google/genai';

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    const userId = (session.user as any).id;

    const body = await req.json();
    const { slug, query } = body as { slug?: string; query?: string };
    const q = (query || '').trim();
    if (!slug || q.length < 3) {
      return NextResponse.json({ match: null });
    }

    const rows = await sql`
      select a.content, max(a.created_at) as last_created
      from answers a
      join questions q on q.id = a.question_id
      where a.user_id = ${userId} and q.slug = ${slug}
      group by a.content
      order by last_created desc
      limit 200`;
    const items: string[] = rows.map((r: any) => (r.content || '').trim()).filter((s: string) => s.length > 0);
    if (items.length === 0) return NextResponse.json({ match: null });

    // Quick prefilter by simple similarity to reduce tokens
    const lowerQ = q.toLowerCase();
    const prefiltered = Array.from(new Set(items))
      .map(s => s.trim())
      .filter(s => s.length > 0)
      .slice(0, 200)
      .sort((a, b) => {
        const sa = jaccardLike(lowerQ, a.toLowerCase());
        const sb = jaccardLike(lowerQ, b.toLowerCase());
        return sb - sa;
      })
      .slice(0, 30);

    const apiKey = process.env.GOOGLE_API_KEY || process.env.GEMINI_API_KEY || process.env.GOOGLE_GENAI_API_KEY;
    if (!apiKey) {
      // Fallback: return the most similar candidate always
      const top = prefiltered[0] || null;
      return NextResponse.json({ match: top });
    }

    const ai = new GoogleGenAI({ apiKey });
    const list = prefiltered.map((s, i) => `${i + 1}. ${s}`).join('\n');
    const prompt = `Instrucciones (ES): Eres un matcher de similitud semántica breve.\n
Devuelve SOLO un JSON válido con exactamente estos campos: {"matched": true, "text": "<frase>"}.\n
Reglas:\n- Compara la ENTRADA con la LISTA (mismo usuario, contexto diario).\n- Selecciona SIEMPRE la frase MÁS SIMILAR de la LISTA.\n- Considera sinónimos y variantes en español (pasear/caminar, salir/ir, corredor/camino, etc.).\n- Tolera pequeños errores tipográficos (perrros -> perros).\n- Aplica lematización y variaciones morfológicas (singular/plural, conjugaciones).\n- "text" debe ser EXACTAMENTE una frase de la LISTA (no la reformules).\n- No inventes elementos que no estén en la LISTA.\n
Ejemplos de equivalencia:\n- "salir a caminar con los perrros" ≈ "ir al corredor con los perros"\n- "pasear con perros" ≈ "caminar con perros"\n
Salida: SOLO el JSON, sin texto adicional.\n
ENTRADA: "${q}"\nLISTA:\n${list}`;

    const response = await ai.models.generateContent({ model: 'gemini-2.5-flash', contents: prompt });
    const text = ((response as any)?.text || '').trim();
    let match: string | null = null;
    try {
      const parsed = JSON.parse(text);
      if (parsed && parsed.matched && typeof parsed.text === 'string' && parsed.text.length > 0) {
        // Ensure it comes from our candidates
        const found = prefiltered.find(s => s.toLowerCase() === parsed.text.toLowerCase());
        match = found || null;
      }
    } catch {
      // fallback to heuristic top candidate
      match = prefiltered[0] || null;
    }

    // If AI says no match, still return the most similar candidate
    if (!match) match = prefiltered[0] || null;

    return NextResponse.json({ match });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || 'Error' }, { status: 500 });
  }
}

function jaccardLike(a: string, b: string): number {
  const as = new Set(a.split(/\s+/).filter(Boolean));
  const bs = new Set(b.split(/\s+/).filter(Boolean));
  const inter = new Set([...as].filter(x => bs.has(x))).size;
  const uni = new Set([...as, ...bs]).size || 1;
  return inter / uni;
}


