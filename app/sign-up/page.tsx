'use client';

import { useState } from 'react';
import Link from 'next/link';
import { signIn } from 'next-auth/react';
import styles from './page.module.css';

export default function SignUpPage() {
  const [email, setEmail] = useState('');
  const [apodo, setApodo] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [ok, setOk] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setOk(null);
    const res = await fetch('/api/sign-up', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password, apodo }),
    });
    setLoading(false);
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(data.error || 'No se pudo crear la cuenta');
    } else {
      // Auto login después de crear la cuenta
      const login = await signIn('credentials', { email, password, redirect: false });
      if (!login?.error) {
        window.location.href = '/';
        return;
      }
      setOk('Cuenta creada. Ya puedes iniciar sesión.');
    }
  }

  return (
    <main className={styles.main}>
      <div className={styles.card}>
        <h1 className={styles.title}>Crear cuenta</h1>
        <form onSubmit={onSubmit}>
          <div className={styles.field}>
            <label htmlFor="apodo">Apodo</label>
            <input id="apodo" className={styles.input} type="text" value={apodo} onChange={(e) => setApodo(e.target.value)} />
          </div>
          <div className={styles.field}>
            <label htmlFor="email">Email</label>
            <input id="email" className={styles.input} type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
          </div>
          <div className={styles.field}>
            <label htmlFor="password">Contraseña</label>
            <input id="password" className={styles.input} type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
          </div>
          {error && <p style={{ color: 'crimson', fontSize: 14 }}>{error}</p>}
          {ok && <p style={{ color: 'green', fontSize: 14 }}>{ok}</p>}
          <button className={styles.button} type="submit" disabled={loading}>{loading ? 'Creando…' : 'Crear cuenta'}</button>
        </form>
        <p className={styles.helper}>¿Ya tienes cuenta? <Link href="/login">Iniciar sesión</Link></p>
      </div>
    </main>
  );
}
