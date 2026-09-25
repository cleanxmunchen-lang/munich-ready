import type { Metadata } from 'next';
import { LegalDocument } from '@/components/legal-document';

export const metadata: Metadata = {
  title: 'Datenschutzerklärung | MUNICH READY',
  description: 'Informationen zum Datenschutz bei MUNICH READY: Website, Bestellungen, Zahlungen und Ihre Rechte.',
};

export default function Datenschutz() {
  return (
    <LegalDocument title="Datenschutzerklärung">
      <p>Diese Hinweise erklären, wie wir personenbezogene Daten beim Besuch von munichready.store, bei Bestellungen und bei Kontaktanfragen verarbeiten.</p>

      <h2>1. Verantwortlicher und Datenschutzkontakt</h2>
      <address>
        Samuel Shestel, Einzelunternehmer<br />
        MUNICH READY<br />
        Bittlmairstraße 7<br />
        85051 Ingolstadt, Deutschland
      </address>
      <p>
        Telefon: <a href="tel:+491791424701">+49 179 1424701</a><br />
        E-Mail: <a href="mailto:cleanx.munchen@gmail.com">cleanx.munchen@gmail.com</a>
      </p>
      <p>Über diese Kontaktdaten erreichen Sie uns auch mit Fragen zum Datenschutz und zur Ausübung Ihrer Rechte.</p>

      <h2>2. Bereitstellung der Website und Hosting</h2>
      <p>Unsere Website wird bei Vercel Inc., USA, gehostet. Beim Aufruf werden technisch erforderliche Verbindungsdaten verarbeitet: insbesondere IP-Adresse, Zeitpunkt des Zugriffs, angeforderte URL, Browser- und Geräteinformationen sowie technische Fehler- und Sicherheitsinformationen. URLs können auch einen Hotelcode oder nach einer Zahlung eine Checkout-Kennung enthalten.</p>
      <p>Diese Verarbeitung dient der Auslieferung der Website, dem sicheren Betrieb und der Fehlerbehebung. Grundlage ist Art. 6 Abs. 1 lit. f DSGVO; unser berechtigtes Interesse besteht an einer funktionsfähigen und vor Missbrauch geschützten Website. Vercel verarbeitet hierfür Daten als Hosting-Dienstleister. Weitere Informationen finden Sie in den <a href="https://vercel.com/legal/privacy-notice">Datenschutzhinweisen von Vercel</a>.</p>

      <h2>3. Bestellungen und Lieferung</h2>
      <p>Für die Bearbeitung einer Bestellung verarbeiten wir folgende Angaben:</p>
      <ul>
        <li>Name, Telefonnummer und Hotel beziehungsweise Lieferziel; optional Zimmernummer und besondere Lieferhinweise;</li>
        <li>bestellte Produkte und Kits, Mengen, gegebenenfalls Kabelauswahl sowie Lieferart;</li>
        <li>Bestellnummer, Bestellzeitpunkt, Zwischensumme, Liefergebühr, Gesamtbetrag und Währung;</li>
        <li>Zahlungs- und Lieferstatus, Zahlungsreferenzen sowie gegebenenfalls Hotelzuordnung und Provision.</li>
      </ul>
      <p>Die für Bestellung, Bezahlung und Lieferung erforderliche Verarbeitung erfolgt nach Art. 6 Abs. 1 lit. b DSGVO. Name, Telefonnummer, Warenkorb und Lieferziel benötigen wir, um die Bestellung abwickeln zu können. Zimmernummer und besondere Hinweise sind freiwillig. Bitte tragen Sie dort keine Gesundheitsdaten oder andere sensible Angaben ein. Ein Kundenkonto ist nicht erforderlich.</p>
      <p>Wenn Sie die Zahlung starten, speichern wir die Bestellung bereits vor der Weiterleitung zu Stripe. Auch bei abgebrochener oder fehlgeschlagener Zahlung kann deshalb ein Bestelldatensatz vorhanden sein. Eine Zahlung wird erst nach Prüfung der Zahlungsbestätigung als bezahlt verbucht.</p>
      <p>Für die Übergabe an eine Hotelrezeption werden die zur Zuordnung und Lieferung benötigten Angaben verwendet, insbesondere Name und gegebenenfalls Zimmernummer. Gesetzlich erforderliche Aufbewahrung und Nachweise beruhen auf Art. 6 Abs. 1 lit. c DSGVO.</p>

      <h2>4. Datenbank und Backend: Supabase</h2>
      <p>Wir nutzen Supabase für die Datenbankinfrastruktur. Die aktuellen Anbieterbedingungen nennen Supabase Pte. Ltd., Singapur. Dort werden die oben beschriebenen Bestell-, Kontakt-, Liefer- und Zahlungsstatusdaten sowie Partnerhotels, Hotelcodes und Provisionsbeträge gespeichert. Der Zugriff der Website auf die Datenbank erfolgt serverseitig; Kundinnen und Kunden benötigen kein Supabase-Konto.</p>
      <p>Die Verarbeitung dient der Bestellabwicklung und Verwaltung. Es gelten die für den jeweiligen Zweck genannten Rechtsgrundlagen, insbesondere Art. 6 Abs. 1 lit. b und c DSGVO sowie für die Partnerabrechnung Art. 6 Abs. 1 lit. f DSGVO. Supabase stellt die Infrastruktur als Auftragsverarbeiter bereit. Informationen: <a href="https://supabase.com/privacy">Datenschutzhinweise von Supabase</a>.</p>

      <h2>5. Zahlung über Stripe Checkout</h2>
      <p>Die Zahlung erfolgt auf einer von Stripe bereitgestellten Checkout-Seite. Für Händler in Deutschland nennen die <a href="https://stripe.com/legal/ssa">Stripe-Vertragsbedingungen</a> Stripe Payments Europe, Limited und Stripe Technology Europe, Limited, jeweils Irland, als beteiligte Gesellschaften.</p>
      <p>Zur Erstellung der Zahlung übermitteln wir Produktbezeichnungen, Mengen, Preise, Liefergebühr, Währung, gewählte Sprache sowie Bestellkennung und Bestellnummer. Zahlungs- und gegebenenfalls Rechnungs- oder Kontaktdaten geben Sie direkt bei Stripe ein. Stripe verarbeitet außerdem technische Daten wie IP-Adresse und Geräteinformationen und kann Daten zur Zahlungsabwicklung und Betrugsprävention verwenden.</p>
      <p>Wir speichern in unserer Bestelldatenbank Stripe-Referenzen und den Zahlungsstatus, keine vollständigen Kartennummern oder Kartenprüfnummern. Rechtsgrundlage unserer Zahlungsabwicklung ist Art. 6 Abs. 1 lit. b DSGVO. Stripe verarbeitet Daten je nach Tätigkeit als Auftragsverarbeiter oder eigenständig Verantwortlicher, etwa zur Erfüllung eigener gesetzlicher Pflichten. Einzelheiten, einschließlich Empfängern und internationaler Verarbeitung, erläutern die <a href="https://stripe.com/de/privacy">Datenschutzhinweise von Stripe</a>.</p>

      <h2>6. Hotelcodes und Partnerprovisionen</h2>
      <p>Hotel-Links und QR-Codes können einen Empfehlungsparameter enthalten, zum Beispiel <code>?ref=hotel01</code>. Der Hotelcode wird aus der URL übernommen, für die Anzeige des Partnerhotels abgefragt und zusammen mit dem Warenkorb im sessionStorage Ihres Browsers gespeichert. Dadurch bleibt die Zuordnung beim Wechsel zur Kasse erhalten. Die QR-Codes selbst werden ohne einen externen QR-Dienst erzeugt.</p>
      <p>Bei einer Bestellung wird der Code dem Bestelldatensatz zugeordnet. Bei einem gültigen Partnerhotel werden außerdem das Hotel und nach erfolgreicher Zahlung dessen Provision hinterlegt. Die Zuordnung ist daher <strong>nicht anonym</strong>: Sie kann mit Ihren Bestell- und Kontaktdaten verknüpft werden. Auch ein übermittelter Code ohne zugeordnetes aktives Partnerhotel kann im Bestelldatensatz enthalten sein.</p>
      <p>Die Verarbeitung der Bestellzuordnung für die Partnerabrechnung dient unserem berechtigten Interesse an der korrekten Abrechnung vermittelter Bestellungen nach Art. 6 Abs. 1 lit. f DSGVO. Sie können dieser Verarbeitung aus Gründen Ihrer besonderen Situation widersprechen. Die datenschutzrechtliche Grundlage dieser Abrechnung ist von den Anforderungen an die Speicherung des Codes auf Ihrem Endgerät zu unterscheiden.</p>

      <h2>7. Browserspeicher und Cookies</h2>
      <p>Die Website verwendet folgende Speichermechanismen:</p>
      <ul>
        <li><strong>Warenkorb (sessionStorage, <code>munich-ready-cart</code>):</strong> enthält Produkt- und Kitkennungen, Mengen, Kabelauswahl, Lieferart und gegebenenfalls den Hotelcode. Name, Telefonnummer und Lieferhinweise werden nicht in diesem Warenkorbspeicher abgelegt. Die Daten bleiben während der Seitensitzung verfügbar; beim Schließen des Tabs werden sie üblicherweise entfernt. Eine Sitzungswiederherstellung des Browsers kann sie wiederherstellen. Die Website setzt keine eigene zeitliche Ablaufgrenze und löscht diesen Speicher nicht automatisch nach einer Zahlung.</li>
        <li><strong>Sprache (localStorage, <code>munich-ready-language</code>):</strong> nach Ihrer ausdrücklichen Sprachwahl wird „en“ oder „de“ gespeichert. Ohne gespeicherte Wahl orientiert sich die Website an der Browsersprache. Die Einstellung bleibt ohne festes Ablaufdatum erhalten, bis sie geändert oder über den Browser gelöscht wird.</li>
        <li><strong>Administration (Cookie, <code>munich_ready_admin</code>):</strong> wird nur nach erfolgreicher Anmeldung im Verwaltungsbereich gesetzt. Es dient der Zugangssicherung, enthält eine signierte Sitzungskennung und läuft nach acht Stunden ab. Beim Abmelden wird es gelöscht. Es ist für JavaScript nicht lesbar, wird im Produktivbetrieb nur verschlüsselt übertragen und verwendet SameSite=Strict. Für einen Einkauf ist keine Admin-Anmeldung erforderlich.</li>
      </ul>
      <p>Für Speicherzugriffe, die zur Bereitstellung einer ausdrücklich gewünschten Funktion unbedingt erforderlich sind, gilt § 25 Abs. 2 Nr. 2 TDDDG. Dazu gehören die Warenkorbfunktion, die ausdrücklich gewählte Sprache und die angeforderte Admin-Sitzung. Die zugehörige personenbezogene Verarbeitung erfolgt zur Vertragsanbahnung beziehungsweise -erfüllung nach Art. 6 Abs. 1 lit. b DSGVO oder zum sicheren und bedienbaren Betrieb nach Art. 6 Abs. 1 lit. f DSGVO.</p>
      <p>Die Speicherung des Hotelcodes zur Provisionszuordnung ist ein zusätzlicher Zweck und nicht allein deshalb erforderlich, weil sie im selben Speicher wie der Warenkorb erfolgt. Der Code wird derzeit automatisch übernommen; eine gesonderte Einwilligungsabfrage findet dafür nicht statt.</p>
      <p>Sie können gespeicherte Daten in den Einstellungen Ihres Browsers löschen oder die Speicherung beschränken. Dadurch können Warenkorb, Sprachwahl oder Admin-Anmeldung verloren gehen. Auf der externen Stripe-Seite gelten zusätzlich die <a href="https://stripe.com/legal/cookies-policy">Cookie-Hinweise von Stripe</a>.</p>

      <h2>8. Kontakt und externe Links</h2>
      <p>Bei Kontakt per E-Mail oder Telefon verarbeiten wir Ihre Kontaktdaten und den Inhalt Ihrer Anfrage. Bestellbezogene Anfragen bearbeiten wir auf Grundlage von Art. 6 Abs. 1 lit. b DSGVO, sonstige Anfragen nach Art. 6 Abs. 1 lit. f DSGVO aufgrund unseres Interesses an einer sachgerechten Beantwortung. E-Mails an unsere Gmail-Adresse werden über den E-Mail-Dienst von Google verarbeitet; dessen <a href="https://policies.google.com/privacy?hl=de">Datenschutzhinweise</a> erläutern die Verarbeitung durch den Anbieter.</p>
      <p>Die Bestätigungsseite enthält einen externen WhatsApp-Link. Es ist kein WhatsApp-Widget eingebunden. Erst wenn Sie den Link öffnen, wechseln Sie zu WhatsApp; dabei verarbeitet der Anbieter Verbindungsdaten und bei einer Nachricht die von Ihnen übermittelten Inhalte. Für den Europäischen Wirtschaftsraum ist WhatsApp Ireland Limited zuständig. Weitere Informationen: <a href="https://www.whatsapp.com/legal/privacy-policy-eea">Datenschutzhinweise von WhatsApp</a>. Sie können uns stattdessen per E-Mail oder Telefon erreichen.</p>

      <h2>9. Reichweitenmessung und externe Inhalte</h2>
      <p>Auf unserer Website sind keine Analyse- oder Werbepixel eingebunden. Produktbilder werden über die Website bereitgestellt; für die Schrift werden Systemschriften verwendet. Es werden keine Schriftdateien von Google Fonts nachgeladen. Die Hotelzuordnung ist in Abschnitt 6 beschrieben.</p>

      <h2>10. Empfänger und internationale Verarbeitung</h2>
      <p>Zugriff erhalten die für die Bestellabwicklung zuständigen Personen sowie die oben genannten Hosting-, Datenbank- und Zahlungsdienstleister im Rahmen ihrer Aufgaben. Für die Lieferung erhält die gewählte Empfangsstelle die notwendigen Übergabeinformationen. Eine Hotelzuordnung gibt Partnerhotels keinen automatischen Zugang zum Verwaltungsbereich oder zu Ihrer vollständigen Bestellung.</p>
      <p>Bei Vercel, Supabase, Stripe und den von Ihnen genutzten Kommunikationsdiensten kann eine Verarbeitung außerhalb der EU und des Europäischen Wirtschaftsraums, insbesondere in den USA und in Singapur, stattfinden. Eine ausschließlich deutsche oder europäische Verarbeitung wird nicht zugesichert.</p>
      <p>Für Drittlandübermittlungen kommen nach Art. 44 ff. DSGVO insbesondere Angemessenheitsbeschlüsse oder geeignete Garantien wie EU-Standardvertragsklauseln in Betracht. Die von den Anbietern vorgesehenen Regelungen und Garantien sind in den Datenverarbeitungsbedingungen von <a href="https://vercel.com/legal/dpa">Vercel</a>, <a href="https://supabase.com/legal/customer-resources/data-processing-addendum">Supabase</a> und <a href="https://stripe.com/legal/dpa">Stripe</a> beschrieben. Auskünfte zu den für Ihre Daten einschlägigen Garantien und eine Kopie können Sie über unseren Datenschutzkontakt anfordern.</p>

      <h2>11. Speicherdauer</h2>
      <p>Maßgeblich für die Speicherdauer sind die Erforderlichkeit für Bestellung, Lieferung und Rückfragen, gesetzliche Aufbewahrungspflichten sowie die Durchsetzung oder Abwehr von Ansprüchen. Für steuer- und handelsrechtlich erforderliche Unterlagen gelten die jeweiligen gesetzlichen Fristen; sie rechtfertigen keine pauschale Aufbewahrung aller Angaben einer Bestellung.</p>
      <p>Das Beenden oder Abbrechen einer Zahlung führt nicht automatisch zur Löschung des Bestelldatensatzes. Für technische Protokolle richtet sich die Dauer nach dem Betriebs- und Sicherheitszweck sowie den Aufbewahrungseinstellungen des jeweiligen Dienstes. Die Dauer der Browserspeicherung finden Sie in Abschnitt 7. Sie können sich mit Fragen zur Aufbewahrung einzelner Daten oder einem Löschungsersuchen an uns wenden.</p>

      <h2>12. Ihre Rechte</h2>
      <p>Unter den jeweiligen gesetzlichen Voraussetzungen haben Sie folgende Rechte:</p>
      <ul>
        <li>Auskunft über Ihre personenbezogenen Daten und eine Kopie (Art. 15 DSGVO);</li>
        <li>Berichtigung unrichtiger und Vervollständigung unvollständiger Daten (Art. 16 DSGVO);</li>
        <li>Löschung, soweit insbesondere keine Aufbewahrungspflicht entgegensteht (Art. 17 DSGVO);</li>
        <li>Einschränkung der Verarbeitung (Art. 18 DSGVO);</li>
        <li>Datenübertragbarkeit bei automatisierter Verarbeitung auf Grundlage einer Einwilligung oder eines Vertrags (Art. 20 DSGVO);</li>
        <li>Widerspruch aus Gründen Ihrer besonderen Situation gegen Verarbeitungen auf Grundlage von Art. 6 Abs. 1 lit. f DSGVO (Art. 21 DSGVO).</li>
      </ul>
      <p>Soweit Sie eine Einwilligung erteilt haben, können Sie diese jederzeit für die Zukunft widerrufen. Die Rechtmäßigkeit der bisherigen Verarbeitung bleibt davon unberührt. Wenden Sie sich zur Ausübung Ihrer Rechte an <a href="mailto:cleanx.munchen@gmail.com">cleanx.munchen@gmail.com</a>.</p>
      <p>Sie können sich außerdem bei einer Datenschutzaufsichtsbehörde beschweren, insbesondere an Ihrem Aufenthaltsort, Arbeitsplatz oder am Ort des vermuteten Verstoßes (Art. 77 DSGVO). Für private Unternehmen in Bayern ist das <a href="https://www.lda.bayern.de/de/beschwerde.html">Bayerische Landesamt für Datenschutzaufsicht (BayLDA)</a> eine zuständige Anlaufstelle.</p>
      <p>Stand: 25. September 2026.</p>
    </LegalDocument>
  );
}
