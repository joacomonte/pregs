'use client';

import { useEffect, useState } from 'react';
import styles from './DailyQuestions.module.css';

export default function DailyQuestions() {
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

  if (loading) return <div className={styles.wrapper}>Cargando…</div>;
  if (err) return <div className={styles.wrapper}>{err}</div>;

  return (
    <div className={styles.wrapper}>
      {rows.map((r, i) => (
        <div key={r.question_id} style={{ marginTop: 12 }}>
          <div style={{ fontWeight: 600, marginBottom: 6 }}>{r.text}</div>
          <input
            style={{ width: '100%', border: '1px solid var(--border)', borderRadius: 12, padding: '12px 14px', fontSize: 16 }}
            placeholder={i === 0 ? 'Ej: juntarme con amigos' : 'Ej: ir a entrenar o estudiar por 30 min'}
            value={r.content}
            onChange={(e) => {
              const v = e.target.value;
              setRows(prev => prev.map(p => p.question_id === r.question_id ? { ...p, content: v } : p));
            }}
          />
        </div>
      ))}
      {ok && <div style={{ marginTop: 8, fontSize: 12, opacity: 0.8 }}>{ok}</div>}
      {err && <div style={{ marginTop: 8, fontSize: 12, color: 'crimson' }}>{err}</div>}
      <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
        <button onClick={guardar} disabled={saving} style={{ border: 'none', background: 'var(--primary)', color: '#fff', padding: '12px 14px', borderRadius: 10, fontWeight: 600 }}>{saving ? 'Guardando…' : 'Guardar'}</button>
      </div>
    </div>
  );
}
