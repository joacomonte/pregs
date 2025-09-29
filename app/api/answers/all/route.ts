import { NextResponse } from 'next/server';
import { sql } from '@/lib/db';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
  const userId = (session.user as any).id;
  const rows = await sql`
    select a.id, a.question_id, q.slug, a.content, a.answered_on, a.created_at
    from answers a
    join questions q on q.id = a.question_id
    where a.user_id = ${userId}
    order by a.answered_on desc, a.created_at desc`;
  return NextResponse.json(rows);
}


