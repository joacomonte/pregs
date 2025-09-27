import { NextResponse } from 'next/server';
import { sql } from '@/lib/db';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
  const userId = (session.user as any).id;
  const rows = await sql`
    select q.id as question_id, q.text, coalesce(a.content, '') as content
    from questions q
    left join answers a on a.question_id = q.id and a.user_id = ${userId} and a.answered_on = current_date
    where q.active = true
    order by q.position asc`;
  return NextResponse.json(rows);
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
  const userId = (session.user as any).id;
  const body = await req.json();
  const answers: Array<{ question_id: number; content: string }> = body?.answers ?? [];
  if (!Array.isArray(answers)) return NextResponse.json({ error: 'Formato inválido' }, { status: 400 });
  for (const a of answers) {
    await sql`
      insert into answers (user_id, question_id, content, answered_on)
      values (${userId}, ${a.question_id}, ${a.content}, current_date)
      on conflict (user_id, question_id, answered_on) do update set content = excluded.content`;
  }
  return NextResponse.json({ ok: true });
}
