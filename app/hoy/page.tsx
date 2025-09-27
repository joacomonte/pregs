'use client';

import { useEffect, useState } from 'react';
import styles from './page.module.css';

export default function HoyPage() {
  const [loading, setLoading] = useState(true);
  const [rows, setRows] = useState<Array<{ question_id: number; text: string; content: string }>>([]);
  const [saving, setSaving] = useState(false);
  const [ok, setOk] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        const res = await fetch('/api/answers');
        if (!res.ok) throw new Error('No autorizado');
        const data = await res.json();
        setRows(data);
      } catch (e: any) {
        setErr(e?.message || 'Error cargando preguntas');
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  async function guardar() {
    setSaving(true);
    setOk(null);
    setErr(null);
    try {
      const res = await fetch('/api/answers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ answers: rows.map(r => ({ question_id: r.question_id, content: r.content })) })
      });
      if (!res.ok) throw new Error('No se pudo guardar');
      setOk('Guardado');
    } catch (e: any) {
      setErr(e?.message || 'Error guardando');
    } finally {
      setSaving(false);
    }
  }

  if (loading) return <main className={styles.main}><div className={styles.card}>Cargando…</div></main>;
  if (err) return <main className={styles.main}><div className={styles.card}>{err}</div></main>;

  return (
    <main className={styles.main}>
      <div className={styles.card}>
        <h1 className={styles.title}>Tus notas de hoy</h1>
        <div className={styles.row}>
          {rows.map((r, i) => (
            <div className={styles.q} key={r.question_id}>
              <div className={styles.label}>{r.text}</div>
              <input
                className={styles.input}
                placeholder={i === 0 ? 'Ej: juntarme con amigos' : 'Ej: ir a entrenar o estudiar por 30 min'}
                value={r.content}
                onChange={(e) => {
                  const v = e.target.value;
                  setRows(prev => prev.map(p => p.question_id === r.question_id ? { ...p, content: v } : p));
                }}
              />
            </div>
          ))}
        </div>
        {ok && <div className={styles.hint}>{ok}</div>}
        {err && <div className={styles.hint} style={{ color: 'crimson' }}>{err}</div>}
        <div className={styles.actions}>
          <button className={styles.button} onClick={guardar} disabled={saving}>{saving ? 'Guardando…' : 'Guardar'}</button>
        </div>
      </div>
    </main>
  );
}
