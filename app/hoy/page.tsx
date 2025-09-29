'use client';

import { useEffect, useState } from 'react';
import styles from './page.module.css';

export default function HoyPage() {
  const [loading, setLoading] = useState(true);
  const [rows, setRows] = useState<Array<{ question_id: number; slug: string; content: string; last_content: string | null; same_content_count: number }>>([]);
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
        setRows((data as Array<any>).map(d => ({ ...d, content: '' })));
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
              <div className={styles.label}>
                {(() => {
                  const last = r.last_content || null;
                  if (r.slug === 'hoy-bien') {
                    return last
                      ? `La última vez te hizo feliz ${last}. ¿Qué te hizo feliz hoy?`
                      : '¿Qué me hizo sentir bien hoy?';
                  }
                  if (r.slug === 'futuro-mejor') {
                    return last
                      ? `La última vez hubieras hecho ${last} para mejorar tu futuro. ¿Qué harás hoy?`
                      : '¿Qué me hubiera gustado haber hecho que mejore mi futuro?';
                  }
                  return '';
                })()}
              </div>
              <div className={styles.inputGroup} style={{ marginTop: 6, marginBottom: 8 }}>
                <input
                  autoComplete="off"
                  className={styles.input}
                  placeholder={i === 0 ? 'Ej: juntarme con amigos' : 'Ej: ir a entrenar o estudiar por 30 min'}
                  value={r.content}
                  onChange={(e) => {
                    const v = e.target.value;
                    setRows(prev => prev.map(p => p.question_id === r.question_id ? { ...p, content: v } : p));
                  }}
                />
                {r.last_content && (
                  <button
                    type="button"
                    className={styles.pillButton}
                    onClick={() => {
                      const prevAns = r.last_content as string;
                      setRows(prev => prev.map(p => p.question_id === r.question_id ? { ...p, content: prevAns } : p));
                    }}
                  >Lo mismo</button>
                )}
              </div>
              {r.content && r.same_content_count > 1 && (
                <div className={styles.meta}>Repetiste esta misma respuesta {r.same_content_count} veces</div>
              )}
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
