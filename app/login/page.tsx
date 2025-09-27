'use client';

import { useState } from 'react';
import { signIn } from 'next-auth/react';
import Link from 'next/link';
import styles from './page.module.css';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const res = await signIn('credentials', { email, password, redirect: false });
    setLoading(false);
    if (res?.error) setError('Correo o contraseña incorrectos');
    else window.location.href = '/';
  }

  return (
    <main className={styles.main}>
      <div className={styles.card}>
        <h1 className={styles.title}>Iniciar sesión</h1>
        <form onSubmit={onSubmit}>
          <div className={styles.field}>
            <label htmlFor="email">Correo</label>
            <input id="email" className={styles.input} type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
          </div>
          <div className={styles.field}>
            <label htmlFor="password">Contraseña</label>
            <input id="password" className={styles.input} type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
          </div>
          {error && <p style={{ color: 'crimson', fontSize: 14 }}>{error}</p>}
          <button className={styles.button} type="submit" disabled={loading}>{loading ? 'Ingresando…' : 'Iniciar sesión'}</button>
        </form>
        <p className={styles.helper}>¿No tienes cuenta? <Link href="/sign-up">Crea una</Link></p>
      </div>
    </main>
  );
}
