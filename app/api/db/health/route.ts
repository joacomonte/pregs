import { NextResponse } from 'next/server';
import { neon } from '@neondatabase/serverless';

export async function GET() {
  try {
    const sql = neon(process.env.DATABASE_URL!);
    const result = await sql`select 1 as ok`;
    return NextResponse.json({ ok: true, result }, { status: 200 });
  } catch (error: any) {
    return NextResponse.json({ ok: false, error: error?.message ?? 'Unknown error' }, { status: 500 });
  }
}
