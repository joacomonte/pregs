import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenAI } from '@google/genai';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { title, items } = body as { title?: string; items?: Array<{ content: string; count?: number }> };
    if (!Array.isArray(items)) {
      return NextResponse.json({ error: 'Bad request' }, { status: 400 });
    }

    const apiKey = process.env.GOOGLE_API_KEY || process.env.GEMINI_API_KEY || process.env.GOOGLE_GENAI_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: 'Missing GOOGLE_API_KEY' }, { status: 500 });
    }

    const ai = new GoogleGenAI({ apiKey });
    const textList = items.map(i => `${i.content}${i.count ? ` (x${i.count})` : ''}`).join('\n');
    const prompt = `En una sola frase breve y simple, escribe un resumen o conclusión basado en los ítems de la lista${title ? ` titulada "${title}"` : ''}. Manténlo informal y positivo si aplica. Lista:\n${textList}`;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
    });

    const text = (response as any)?.text || '';
    return NextResponse.json({ summary: text?.trim() || '' });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || 'AI error' }, { status: 500 });
  }
}


