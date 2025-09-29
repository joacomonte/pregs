'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import styles from './AllAnswersClient.module.css';

type AnswerRow = {
  id: string;
  question_id: number;
  slug: string;
  content: string;
  answered_on: string;
  created_at: string;
};

export default function AllAnswersClient() {
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);
  const [rows, setRows] = useState<AnswerRow[]>([]);
  const [menuOpenId, setMenuOpenId] = useState<string | null>(null);
  const menuRef = useRef<HTMLDivElement | null>(null);
  const [felizSummary, setFelizSummary] = useState<string>('');


  useEffect(() => {
    function onDocClick(ev: MouseEvent) {
      if (!menuOpenId) return;
      const target = ev.target as Node;
      if (menuRef.current && !menuRef.current.contains(target)) {
        setMenuOpenId(null);
      }
    }
    document.addEventListener('mousedown', onDocClick);
    return () => document.removeEventListener('mousedown', onDocClick);
  }, [menuOpenId]);

  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        const res = await fetch('/api/answers/all');
        if (!res.ok) throw new Error('No autorizado');
        const data: AnswerRow[] = await res.json();
        setRows(data);
      } catch (e: any) {
        setErr(e?.message || 'Error cargando respuestas');
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  type Grouped = { content: string; count: number; lastDate: string; ids: string[] };

  const groupAndSort = useCallback((list: AnswerRow[]): Grouped[] => {
    const map = new Map<string, Grouped>();
    for (const r of list) {
      const key = (r.content || '').trim();
      if (key.length === 0) continue;
      const cur = map.get(key);
      const lastDate = r.answered_on || r.created_at;
      if (!cur) {
        map.set(key, { content: key, count: 1, lastDate, ids: [r.id] });
      } else {
        cur.count += 1;
        cur.ids.push(r.id);
        if (lastDate > cur.lastDate) cur.lastDate = lastDate;
      }
    }
    return Array.from(map.values()).sort((a, b) => {
      if (b.count !== a.count) return b.count - a.count;
      return b.lastDate.localeCompare(a.lastDate);
    });
  }, []);

  const felices = useMemo(() => groupAndSort(rows.filter(r => r.slug === 'hoy-bien')), [rows, groupAndSort]);
  const futuro = useMemo(() => groupAndSort(rows.filter(r => r.slug === 'futuro-mejor')), [rows, groupAndSort]);

  useEffect(() => {
    (async () => {
      try {
        if (felices.length === 0) {
          // keep blank when no items
          setFelizSummary('');
          return;
        }
        const res = await fetch('/api/ai-summary', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            title: 'Cosas que me hicieron feliz',
            items: felices.slice(0, 50).map(g => ({ content: g.content, count: g.count })),
          }),
        });
        if (!res.ok) throw new Error('No se pudo resumir');
        const data = await res.json();
        setFelizSummary(data.summary || '');
      } catch {
        // keep blank on errors
        setFelizSummary('');
      }
    })();
  }, [felices]);

  function startEditGroup(content: string, slug: string) {
    setMenuOpenId(null);
    setRows(prev => prev.map(r => (r.slug === slug && r.content === content) ? ({ ...(r as any), _editing: true } as any) : r));
  }

  // Inline edit is not used in grouped minimal UI; keep placeholders minimal

  function deleteLocalGroup(content: string, slug: string) {
    setRows(prev => prev.filter(r => !(r.slug === slug && r.content === content)));
    if (menuOpenId) setMenuOpenId(null);
  }

  if (loading) return <div className={styles.loading}>Cargando…</div>;
  if (err) return <div className={styles.error}>{err}</div>;

  return (
    <div className={styles.wrapper}>
      <section>
          <h2 className={styles.title}>Cosas que me hicieron feliz</h2>
        <ul className={styles.list}>
          {felices.map(group => (
            <li key={group.content} className={styles.item}>
              <button
                aria-label="Opciones"
                onClick={() => setMenuOpenId(prev => prev === group.content ? null : group.content)}
                className={styles.menuBtn}
              >⋯</button>
              <span className={styles.content}>{group.content}</span>
              <span className={styles.badge}>{group.count}</span>
              {menuOpenId === group.content && (
                <div className={styles.menu} ref={menuRef}>
                  <button onClick={() => { startEditGroup(group.content, 'hoy-bien'); }} className={styles.menuItem}>Modificar</button>
                  <button onClick={() => deleteLocalGroup(group.content, 'hoy-bien')} className={`${styles.menuItem} ${styles.menuDanger}`}>Eliminar</button>
                </div>
              )}
            </li>
          ))}
          {felices.length === 0 && <li style={{ opacity: 0.6, fontSize: 13 }}>Sin elementos todavía</li>}
        </ul>
        <div className={styles.summary}>{felizSummary}</div>
      </section>

      <section>
          <h2 className={styles.title}>Cosas que dijiste que querías hacer</h2>
        <ul className={styles.list}>
          {futuro.map(group => (
            <li key={group.content} className={styles.item}>
              <button
                aria-label="Opciones"
                onClick={() => setMenuOpenId(prev => prev === group.content ? null : group.content)}
                className={styles.menuBtn}
              >⋯</button>
              <span className={styles.content}>{group.content}</span>
              <span className={styles.badge}>{group.count}</span>
              {menuOpenId === group.content && (
                <div className={styles.menu} ref={menuRef}>
                  <button onClick={() => { startEditGroup(group.content, 'futuro-mejor'); }} className={styles.menuItem}>Modificar</button>
                  <button onClick={() => deleteLocalGroup(group.content, 'futuro-mejor')} className={`${styles.menuItem} ${styles.menuDanger}`}>Eliminar</button>
                </div>
              )}
            </li>
          ))}
          {futuro.length === 0 && <li style={{ opacity: 0.6, fontSize: 13 }}>Sin elementos todavía</li>}
        </ul>
      </section>
    </div>
  );
}


