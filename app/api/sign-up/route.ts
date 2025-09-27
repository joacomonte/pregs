import { NextResponse } from 'next/server';
import { sql } from '@/lib/db';
import bcrypt from 'bcryptjs';

export async function POST(req: Request) {
  try {
    const { email, password, apodo } = await req.json();
    if (!email || !password) {
      return NextResponse.json({ error: 'Falta email o contraseña' }, { status: 400 });
    }
    const existing = await sql`select id from users where email = ${email}`;
    if (existing.length) {
      return NextResponse.json({ error: 'El email ya está en uso' }, { status: 409 });
    }
    const password_hash = await bcrypt.hash(password, 10);
    const rows = await sql`insert into users (email, name, password_hash) values (${email}, ${apodo ?? null}, ${password_hash}) returning id`;
    return NextResponse.json({ id: rows[0].id }, { status: 201 });
  } catch (err: any) {
    return NextResponse.json({ error: err?.message ?? 'Error desconocido' }, { status: 500 });
  }
}
