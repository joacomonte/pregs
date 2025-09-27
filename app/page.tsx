
import { getServerSession } from "next-auth";
import Link from "next/link";
import styles from "./home.module.css";
import { authOptions } from "@/lib/auth";
import DailyQuestions from "./today/DailyQuestions";

export default async function Home() {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return (
      <main className={styles.main}>
        <div className={styles.actionCard}>
          <h1 className={styles.title}>Bienvenido</h1>
          <div className={styles.ctaRow}>
            <Link className={styles.cta} href="/login">Iniciar sesión</Link>
            <Link className={styles.ctaAlt} href="/sign-up">Crear cuenta</Link>
          </div>
        </div>
      </main>
    );
  }

  const apodo = (session.user as any)?.name;
  const displayApodo = typeof apodo === 'string' && apodo.length > 0
    ? apodo.charAt(0).toUpperCase() + apodo.slice(1)
    : '';
  return (
    <main className={styles.main}>
      <div className="flex flex-col gap-4">
        <h1 className={styles.greeting}>¡Qué bueno verte por acá, {displayApodo}! 👋</h1>
        <p className={styles.sub}>[frase inspiradora].</p>
      </div>
      <DailyQuestions />
    </main>
  );
}
