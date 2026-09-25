import type { Metadata } from 'next';
import { LegalDocument } from '@/components/legal-document';

export const metadata: Metadata = {
  title: 'Impressum | MUNICH READY',
  description: 'Anbieterkennzeichnung und Kontaktinformationen von MUNICH READY, Samuel Shestel.',
};

export default function Impressum() {
  return (
    <LegalDocument title="Impressum">
      <h2>Angaben gemäß § 5 DDG</h2>
      <address>
        Samuel Shestel<br />
        MUNICH READY<br />
        Bittlmairstraße 7<br />
        85051 Ingolstadt<br />
        Deutschland
      </address>
      <h2>Kontakt</h2>
      <p>
        Telefon: <a href="tel:+491791424701">+49 179 1424701</a><br />
        E-Mail: <a href="mailto:cleanx.munchen@gmail.com">cleanx.munchen@gmail.com</a>
      </p>
    </LegalDocument>
  );
}
