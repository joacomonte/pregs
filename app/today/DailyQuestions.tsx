"use client";

import { useEffect, useState } from "react";
import styles from "./DailyQuestions.module.css";
import AllAnswersClient from "./AllAnswersClient";

export default function DailyQuestions() {
  const [feliz, setFeliz] = useState("");
  const [futuro, setFuturo] = useState("");
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);
  const [felizSugerencia, setFelizSugerencia] = useState<string | null>(null);
  const [felizTimer, setFelizTimer] = useState<any>(null);
  const [futuroSugerencia, setFuturoSugerencia] = useState<string | null>(null);
  const [futuroTimer, setFuturoTimer] = useState<any>(null);
  const [lastFeliz, setLastFeliz] = useState<string | null>(null);
  const [lastFuturo, setLastFuturo] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const [lf, lfu] = await Promise.all([
          fetch('/api/answers/latest?slug=hoy-bien').then(r => r.ok ? r.json() : { content: null }),
          fetch('/api/answers/latest?slug=futuro-mejor').then(r => r.ok ? r.json() : { content: null }),
        ]);
        setLastFeliz((lf?.content || '').trim() || null);
        setLastFuturo((lfu?.content || '').trim() || null);
      } catch {}
    })();
  }, []);

  async function guardar() {
    setSaving(true);
    setErr(null);
    try {
      const answers = [
        { slug: "hoy-bien", content: feliz.trim() },
        { slug: "futuro-mejor", content: futuro.trim() },
      ].filter((a) => a.content.length > 0);
      const res = await fetch("/api/answers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ answers }),
      });
      if (!res.ok) throw new Error("No se pudo guardar");
      setSubmitted(true);
    } catch (e: any) {
      setErr(e?.message || "Error guardando");
    } finally {
      setSaving(false);
    }
  }

  if (err) return <div className={styles.wrapper}>{err}</div>;

  if (submitted) {
    return (
      <div className={styles.wrapper}>
        <AllAnswersClient />
      </div>
    );
  }

  return (
    <>
      <div className={styles.wrapper}>
        <div>
          <div className={styles.label}>
            {lastFeliz ? `La última vez te hizo feliz ${lastFeliz}. ¿Qué te hizo feliz hoy?` : "¿Qué me hizo sentir bien hoy?"}
          </div>
          <div className={styles.inputGroup}>
            <input 
              autoComplete="off" 
              className={`${styles.input} ${styles.control}`} 
              placeholder="Ej: juntarme con amigos" 
              value={feliz} 
              onChange={(e) => {
                const v = e.target.value;
                setFeliz(v);
                setFelizSugerencia(null);
                if (felizTimer) clearTimeout(felizTimer);
                const t = setTimeout(async () => {
                  const q = v.trim();
                  if (q.length < 3) return;
                  try {
                    const res = await fetch('/api/answers/similar', {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({ slug: 'hoy-bien', query: q })
                    });
                    if (!res.ok) return;
                    const data = await res.json();
                    setFelizSugerencia(data?.match || null);
                  } catch {}
                }, 600);
                setFelizTimer(t);
              }} />
          </div>
          {felizSugerencia && (
            <button
              type="button"
              className="text-start text-sm text-green-300 font-bold cursor-pointer pt-2"
              onClick={() => setFeliz(felizSugerencia)}
              style={{ marginTop: 6 }}
            >
              Una vez te hizo feliz: “{felizSugerencia}”. Si es muy similar click acá.
            </button>
          )}
        </div>

        <div>
          <div className={styles.label}>
            {lastFuturo ? `La ultima vez no pudiste ${lastFuturo}. ¿Que te hubiera gustado hacer hoy para mejorar tu futuro?` : "¿Qué me hubiera gustado haber hecho que mejore mi futuro?"}
          </div>
          <div className={styles.inputGroup}>
            <input 
              autoComplete="off" 
              className={`${styles.input} ${styles.control}`} 
              placeholder="Ej: ir a entrenar o estudiar por 30 min" 
              value={futuro} 
              onChange={(e) => {
                const v = e.target.value;
                setFuturo(v);
                setFuturoSugerencia(null);
                if (futuroTimer) clearTimeout(futuroTimer);
                const t = setTimeout(async () => {
                  const q = v.trim();
                  if (q.length < 3) return;
                  try {
                    const res = await fetch('/api/answers/similar', {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({ slug: 'futuro-mejor', query: q })
                    });
                    if (!res.ok) return;
                    const data = await res.json();
                    setFuturoSugerencia(data?.match || null);
                  } catch {}
                }, 600);
                setFuturoTimer(t);
              }} />
          </div>
          {futuroSugerencia && (
            <button
              type="button"
              className="text-start text-sm text-green-300 font-bold cursor-pointer pt-2"
              onClick={() => setFuturo(futuroSugerencia)}
              style={{ marginTop: 6 }}
            >
              Una vez dijiste que querías: “{futuroSugerencia}”. Si es muy similar click acá.
            </button>
          )}
        </div>
      </div>
      {err && (<div className={styles.hint} style={{ color: "crimson" }}>{err}</div>)}
      <div className={styles.actions}>
        <button 
          onClick={guardar} 
          disabled={saving} 
          className={styles.button}>
          {saving ? "Guardando…" : "Guardar"}
        </button>
        <button
          type="button"
          onClick={() => setSubmitted(true)}
          className={styles.secondaryButton}
        >
          Ir al resumen
        </button>
      </div>
    </>
  );
}
