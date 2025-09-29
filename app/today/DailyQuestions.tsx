"use client";

import { useEffect, useState } from "react";
import styles from "./DailyQuestions.module.css";
import AllAnswersClient from "./AllAnswersClient";

export default function DailyQuestions() {
  const [loading, setLoading] = useState(true);
  const [rows, setRows] = useState<Array<{ question_id: number; slug: string; content: string; last_content: string | null; same_content_count: number }>>([]);
  const [saving, setSaving] = useState(false);
  const [ok, setOk] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        const res = await fetch("/api/answers");
        if (!res.ok) throw new Error("No autorizado");
        const data = await res.json();
        setRows((data as Array<any>).map((d) => ({ ...d, content: "" })));
      } catch (e: any) {
        setErr(e?.message || "Error cargando preguntas");
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
      const res = await fetch("/api/answers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ answers: rows.map((r) => ({ question_id: r.question_id, content: r.content })) }),
      });
      if (!res.ok) throw new Error("No se pudo guardar");
      setOk("Guardado");
      setSubmitted(true);
    } catch (e: any) {
      setErr(e?.message || "Error guardando");
    } finally {
      setSaving(false);
    }
  }

  if (loading) return <div className={styles.wrapper}>Cargando…</div>;
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
        {rows.map((r, i) => (
          <div key={r.question_id} className={styles.q}>
            <div className={styles.label}>
              {(() => {
                const last = r.last_content || null;
                if (r.slug === "hoy-bien") {
                  return last ? `La última vez te hizo feliz ${last}. ¿Qué te hizo feliz hoy?` : "¿Qué me hizo sentir bien hoy?";
                }
                if (r.slug === "futuro-mejor") {
                  return last ? `La ultima vez no pudiste ${last}. ¿Que te hubiera gustado hacer hoy para mejorar tu futuro?` : "¿Qué me hubiera gustado haber hecho que mejore mi futuro?";
                }
                return "";
              })()}
            </div>
            <div className={styles.inputGroup}>
              <input
                autoComplete="off"
                className={`${styles.input} ${styles.control}`}
                placeholder={i === 0 ? "Ej: juntarme con amigos" : "Ej: ir a entrenar o estudiar por 30 min"}
                value={r.content}
                onChange={(e) => {
                  const v = e.target.value;
                  setRows((prev) => prev.map((p) => (p.question_id === r.question_id ? { ...p, content: v } : p)));
                }}
              />
              {r.last_content && (
                <button
                  type="button"
                  className={`${styles.pillButton} ${styles.control}`}
                  onClick={() => {
                    const prevAns = r.last_content as string;
                    setRows((prev) => prev.map((p) => (p.question_id === r.question_id ? { ...p, content: prevAns } : p)));
                  }}
                >
                  Lo mismo
                </button>
              )}
            </div>
          </div>
        ))}
        {ok && <div className={styles.hint}>{ok}</div>}
        {err && (
          <div className={styles.hint} style={{ color: "crimson" }}>
            {err}
          </div>
        )}
        <div className={styles.actions}>
          <button onClick={guardar} disabled={saving} className={styles.button}>
            {saving ? "Guardando…" : "Guardar"}
          </button>
        </div>
      </div>
    </>
  );
}
