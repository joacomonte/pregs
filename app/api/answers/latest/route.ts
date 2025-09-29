import { NextResponse } from 'next/server';
import { sql } from '@/lib/db';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export async function GET(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
  const userId = (session.user as any).id;

  const { searchParams } = new URL(req.url);
  const slug = searchParams.get('slug');
  if (!slug) return NextResponse.json({ error: 'slug requerido' }, { status: 400 });

  const rows = await sql`
    select a.content
    from answers a
    join questions q on q.id = a.question_id
    where a.user_id = ${userId} and q.slug = ${slug}
    order by a.answered_on desc, a.created_at desc
    limit 1` as any[];

  const latest = (rows?.[0]?.content || '').trim();
  return NextResponse.json({ content: latest || null });
}


