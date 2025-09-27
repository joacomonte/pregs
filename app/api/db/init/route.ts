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
    await sql`insert into questions (slug, text, position) values 
      ('hoy-bien', '¿Qué me hizo sentir bien hoy?', 1),
      ('futuro-mejor', '¿Qué me hubiera gustado haber hecho que mejore mi futuro?', 2)
      on conflict (slug) do nothing`;
    return NextResponse.json({ ok: true });
  } catch (error: any) {
    return NextResponse.json({ ok: false, error: error?.message ?? 'Unknown error' }, { status: 500 });
  }
}
