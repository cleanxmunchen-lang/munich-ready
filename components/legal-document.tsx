import type { ReactNode } from 'react';
import { Header } from '@/components/header';
import { Footer } from '@/components/footer';
import styles from './legal-document.module.css';

export function LegalDocument({ title, children }: { title: string; children: ReactNode }) {
  return (
    <>
      <Header />
      <main lang="de" className={`shell ${styles.document}`}>
        <p className="eyebrow">MUNICH READY · Rechtliches</p>
        <h1>{title}</h1>
        <article className={styles.content}>{children}</article>
      </main>
      <Footer />
    </>
  );
}
