import { NextResponse } from 'next/server';
import { sql } from '@/lib/db';

export async function POST() {
  try {
    await sql`create table if not exists users (
      id uuid primary key default gen_random_uuid(),
      email text unique not null,
      name text,
      password_hash text not null,
      created_at timestamptz not null default now()
    )`;
    await sql`create table if not exists questions (
      id serial primary key,
      slug text unique not null,
      text text not null,
      position int not null,
      active boolean not null default true
    )`;
    await sql`create table if not exists answers (
      id uuid primary key default gen_random_uuid(),
      user_id uuid not null references users(id) on delete cascade,
      question_id int not null references questions(id) on delete cascade,
      content text not null,
      answered_on date not null default current_date,
      created_at timestamptz not null default now(),
      unique(user_id, question_id, answered_on)
    )`;
    await sql`alter table if exists answers drop constraint if exists answers_user_id_question_id_answered_on_key`;
    // Drop legacy unique constraint if present to allow multiple answers per day
    await sql`
      do $$
      declare
        conname text;
      begin
        select pc.conname into conname
        from pg_constraint pc
        join pg_class c on c.oid = pc.conrelid
        where c.relname = 'answers' and pc.contype = 'u';
        if conname is not null then
          execute 'alter table answers drop constraint ' || conname;
        end if;
      end $$;`;
    await sql`create table if not exists answer_counts (
      user_id uuid not null references users(id) on delete cascade,
      question_id int not null references questions(id) on delete cascade,
      content text not null,
      count int not null default 0,
      last_answered_on date,
      primary key (user_id, question_id, content)
    )`;
    // Helpful indexes
    await sql`create index if not exists idx_answers_user_q_date on answers(user_id, question_id, answered_on)`;
    await sql`create index if not exists idx_answers_user_date on answers(user_id, answered_on desc)`;
    await sql`create index if not exists idx_answer_counts_lookup on answer_counts(user_id, question_id, content)`;
    await sql`insert into questions (slug, text, position) values 
      ('hoy-bien', '¿Qué me hizo sentir bien hoy?', 1),
      ('futuro-mejor', '¿Qué me hubiera gustado haber hecho que mejore mi futuro?', 2)
      on conflict (slug) do nothing`;
    return NextResponse.json({ ok: true });
  } catch (error: any) {
    return NextResponse.json({ ok: false, error: error?.message ?? 'Unknown error' }, { status: 500 });
  }
}
