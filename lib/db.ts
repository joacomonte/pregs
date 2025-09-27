import { neon } from '@neondatabase/serverless';

export const sql = neon(process.env.DATABASE_URL!);

export type DbUser = {
  id: string;
  email: string;
  name: string | null;
  password_hash: string;
  created_at: string;
};
