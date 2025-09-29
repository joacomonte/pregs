import { NextResponse } from 'next/server';
import { sql } from '@/lib/db';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
  const userId = (session.user as any).id;
  const rows = await sql`
    with latest as (
      select distinct on (question_id)
        question_id,
        content
      from answers
      where user_id = ${userId}
      order by question_id, answered_on desc, created_at desc
    ),
    today as (
      select distinct on (question_id)
        question_id, content
      from answers
      where user_id = ${userId} and answered_on = current_date
      order by question_id, created_at desc
    )
    select 
      q.id as question_id,
      q.slug as slug,
      coalesce(t.content, '') as content,
      l.content as last_content,
      coalesce(ac.count, 0) as same_content_count
    from questions q
    left join today t on t.question_id = q.id
    left join latest l on l.question_id = q.id
    left join answer_counts ac on ac.user_id = ${userId} and ac.question_id = q.id and ac.content = coalesce(t.content, '')
    where q.active = true
    order by q.position asc`;
  return NextResponse.json(rows);
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
  const userId = (session.user as any).id;
  const body = await req.json();
  const answers: Array<{ question_id?: number; slug?: string; content: string }> = body?.answers ?? [];
  if (!Array.isArray(answers)) return NextResponse.json({ error: 'Formato inválido' }, { status: 400 });
  for (const a of answers) {
    const content = (a.content || '').trim();
    if (content.length === 0) continue;
    let qid = a.question_id;
    if (!qid && a.slug) {
      const found = await sql`select id from questions where slug = ${a.slug} limit 1`;
      qid = found?.[0]?.id as number | undefined;
    }
    if (!qid) continue;
    await sql`
      insert into answers (user_id, question_id, content, answered_on)
      values (${userId}, ${qid}, ${content}, current_date)`;
    await sql`
      insert into answer_counts (user_id, question_id, content, count, last_answered_on)
      values (${userId}, ${qid}, ${content}, 1, current_date)
      on conflict (user_id, question_id, content) do update set 
        count = answer_counts.count + 1,
        last_answered_on = excluded.last_answered_on`;
  }
  return NextResponse.json({ ok: true });
}
