import React from "react";
import type { Page } from "../types";
import BrandLogo from "../components/BrandLogo";
import { useSeoMeta } from "../components/EditorialChrome";

interface LegalProps {
  section: "privacy" | "terms" | "cookie";
  onNavigate: (page: Page) => void;
}

const PATHS: Record<LegalProps["section"], string> = {
  privacy: "/privacy",
  terms: "/termini",
  cookie: "/cookie",
};

const DESCRIPTIONS: Record<LegalProps["section"], string> = {
  privacy: "Informativa sulla privacy di ProntoCurriculum ai sensi del Regolamento UE 2016/679 (GDPR): dati raccolti, finalità del trattamento e diritti dell'utente.",
  terms: "Termini e condizioni di servizio di ProntoCurriculum: regole di utilizzo della piattaforma, abbonamenti e responsabilità.",
  cookie: "Informativa sui cookie di ProntoCurriculum: cookie tecnici, analitici e di terze parti utilizzati e come gestire le preferenze.",
};

export default function Legal({ section, onNavigate }: LegalProps) {
  const titles: Record<LegalProps["section"], string> = {
    privacy:
      "Informativa sulla Privacy ai sensi del Regolamento UE 2016/679 (GDPR)",
    terms: "Termini e Condizioni di Servizio",
    cookie: "Informativa sui Cookie (Cookie Policy)",
  };

  useSeoMeta(`${titles[section]} | ProntoCurriculum`, DESCRIPTIONS[section], PATHS[section]);

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "var(--bg)",
        color: "var(--text)",
        padding: "40px 20px 80px",
        fontFamily: "'Switzer', 'Plus Jakarta Sans', sans-serif",
      }}
    >
      <div style={{ maxWidth: 760, margin: "0 auto" }}>
        {/* Back navigation & Logo */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 32, flexWrap: "wrap", gap: 16 }}>
          <BrandLogo onClick={() => onNavigate("home")} iconSize={36} fontSize={19} />
          <button
            onClick={() => onNavigate("home")}
          style={{
            background: "#FFFFFF",
            border: "1px solid var(--border)",
            color: "var(--text)",
            padding: "8px 16px",
            borderRadius: 8,
            cursor: "pointer",
            fontSize: 14,
            fontWeight: 500,
            display: "inline-flex",
            alignItems: "center",
            gap: 6,
            marginBottom: 32,
            transition: "background 0.15s",
          }}
        >
          <span>←</span> Torna alla Home
        </button>
        </div>

        <article
          style={{
            background: "#FFFFFF",
            border: "1px solid var(--border-soft)",
            borderRadius: 16,
            padding: "36px 40px",
            lineHeight: 1.7,
            color: "var(--gray700)",
          }}
        >
          <h1
            style={{
              fontSize: 26,
              fontWeight: 700,
              color: "var(--navy)",
              marginBottom: 8,
              lineHeight: 1.3,
            }}
          >
            {titles[section]}
          </h1>
          <div
            style={{
              fontSize: 13,
              color: "var(--gray400)",
              marginBottom: 28,
              paddingBottom: 20,
              borderBottom: "1px solid var(--border-soft)",
            }}
          >
            Ultimo aggiornamento: 11 Luglio 2026
          </div>

          {section === "privacy" && (
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: 24,
                fontSize: 15,
              }}
            >
              <section>
                <h2
                  style={{
                    fontSize: 18,
                    fontWeight: 600,
                    color: "var(--navy)",
                    marginBottom: 10,
                  }}
                >
                  1. Titolare del Trattamento
                </h2>
                <p>
                  Il Titolare del trattamento dei dati personali raccolti
                  attraverso il sito <strong>ProntoCurriculum.it</strong> è
                  ProntoCurriculum (di seguito &quot;Titolare&quot;). Per
                  qualsiasi informazione, richiesta o esercizio dei diritti
                  previsti dal GDPR, è possibile contattare il Titolare
                  all&apos;indirizzo email:{" "}
                  <strong>privacy@prontocurriculum.it</strong>.
                </p>
              </section>

              <section>
                <h2
                  style={{
                    fontSize: 18,
                    fontWeight: 600,
                    color: "var(--navy)",
                    marginBottom: 10,
                  }}
                >
                  2. Tipologia di Dati Raccolti e Finalità
                </h2>
                <p>
                  ProntoCurriculum raccoglie e tratta le seguenti categorie di
                  dati personali:
                </p>
                <ul style={{ paddingLeft: 20, margin: "8px 0" }}>
                  <li>
                    <strong>Dati anagrafici e di contatto:</strong> nome,
                    cognome, indirizzo email, numero di telefono e città di
                    residenza inseriti durante la creazione o compilazione del
                    Curriculum Vitae.
                  </li>
                  <li>
                    <strong>Dati professionali e di studio:</strong> esperienze
                    lavorative, titoli di studio, competenze tecniche e
                    linguistiche inseriti nei template di CV o caricati tramite
                    documenti PDF/Word.
                  </li>
                  <li>
                    <strong>Dati di navigazione e tecnici:</strong> indirizzo
                    IP, tipo di browser, informazioni sul dispositivo e log di
                    autenticazione.
                  </li>
                  <li>
                    <strong>Dati di pagamento:</strong> elaborati in modo sicuro
                    esclusivamente dal provider di pagamento terzo (Stripe Inc.).
                    Il Titolare non memorizza i numeri delle carte di credito.
                  </li>
                </ul>
                <p>
                  I dati sono trattati esclusivamente per le seguenti finalità:
                  generazione, ottimizzazione, traduzione e salvataggio dei
                  curriculum vitae degli utenti; gestione dell&apos;account;
                  adempimenti di legge e obblighi di sicurezza.
                </p>
              </section>

              <section>
                <h2
                  style={{
                    fontSize: 18,
                    fontWeight: 600,
                    color: "var(--navy)",
                    marginBottom: 10,
                  }}
                >
                  3. Base Giuridica del Trattamento
                </h2>
                <p>Il trattamento si fonda sulle seguenti basi giuridiche:</p>
                <ul style={{ paddingLeft: 20, margin: "8px 0" }}>
                  <li>
                    <strong>Esecuzione del contratto e di misure precontrattuali (Art. 6.1.b GDPR):</strong>{" "}
                    fornitura dei servizi di creazione e ottimizzazione del CV
                    richiesti dall&apos;utente.
                  </li>
                  <li>
                    <strong>Consenso (Art. 6.1.a GDPR):</strong> per
                    l&apos;utilizzo di cookie analitici opzionali e
                    l&apos;eventuale invio di comunicazioni di servizio non
                    stretamente connesse al contratto.
                  </li>
                  <li>
                    <strong>Legittimo interesse (Art. 6.1.f GDPR):</strong> per
                    garantire la sicurezza informatica, prevenire frodi o abusi
                    e mantenere l&apos;infrastruttura di servizio.
                  </li>
                </ul>
              </section>

              <section>
                <h2
                  style={{
                    fontSize: 18,
                    fontWeight: 600,
                    color: "var(--navy)",
                    marginBottom: 10,
                  }}
                >
                  4. Utilizzo dell&apos;Intelligenza Artificiale (AI)
                </h2>
                <p>
                  Per fornire le funzionalità avanzate di analisi, scrittura,
                  adattamento e traduzione del curriculum (come
                  l&apos;ottimizzazione ATS e la formulazione delle mansioni),
                  ProntoCurriculum utilizza API di fornitori di intelligenza
                  artificiale selezionati (Google Gemini, Groq).
                </p>
                <p>
                  I dati trasmessi ai modelli AI sono strettamente limitati alle
                  informazioni testuali necessarie all&apos;elaborazione
                  richiesta. I fornitori AI partner sono vincolati da accordi di
                  trattamento dati conformi agli standard europei di sicurezza
                  (DPA) che impediscono l&apos;utilizzo dei dati personali dei
                  singoli utenti per l&apos;addestramento di modelli pubblici
                  senza ulteriore consenso esplicito.
                </p>
              </section>

              <section>
                <h2
                  style={{
                    fontSize: 18,
                    fontWeight: 600,
                    color: "var(--navy)",
                    marginBottom: 10,
                  }}
                >
                  5. Conservazione e Condivisione dei Dati
                </h2>
                <p>
                  I dati personali sono conservati su server protetti ad
                  elevata sicurezza tecnica. I CV salvati restano associati
                  all&apos;account dell&apos;utente fino a sua esplicita
                  richiesta di cancellazione. In assenza di un account
                  registrato, i dati generati temporaneamente vengono rimossi al
                  termine della sessione di navigazione salvo obblighi di legge.
                </p>
              </section>

              <section>
                <h2
                  style={{
                    fontSize: 18,
                    fontWeight: 600,
                    color: "var(--navy)",
                    marginBottom: 10,
                  }}
                >
                  6. Diritti dell&apos;Interessato
                </h2>
                <p>
                  Ai sensi degli articoli dal 15 al 22 del GDPR,
                  l&apos;interessato ha il diritto in qualsiasi momento di:
                </p>
                <ul style={{ paddingLeft: 20, margin: "8px 0" }}>
                  <li>
                    Ottenere la conferma dell&apos;esistenza dei propri dati e
                    accedere al loro contenuto (Diritto di accesso).
                  </li>
                  <li>
                    Richiedere l&apos;aggiornamento o la correzione di dati
                    inesatti (Diritto di rettifica).
                  </li>
                  <li>
                    Richiedere la cancellazione completa dei propri dati e
                    del proprio account (Diritto all&apos;oblio).
                  </li>
                  <li>
                    Limitare il trattamento o opporsi al trattamento per motivi
                    legittimi.
                  </li>
                  <li>
                    Ricevere i propri dati in un formato strutturato e leggibile
                    (Diritto alla portabilità).
                  </li>
                </ul>
                <p>
                  Per esercitare tali diritti o per qualsiasi richiesta in merito
                  alla privacy, è sufficiente inviare un&apos;email a:{" "}
                  <strong>privacy@prontocurriculum.it</strong>.
                </p>
              </section>
            </div>
          )}

          {section === "terms" && (
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: 24,
                fontSize: 15,
              }}
            >
              <section>
                <h2
                  style={{
                    fontSize: 18,
                    fontWeight: 600,
                    color: "var(--navy)",
                    marginBottom: 10,
                  }}
                >
                  1. Oggetto del Servizio
                </h2>
                <p>
                  I presenti Termini e Condizioni regolano l&apos;utilizzo della
                  piattaforma web <strong>ProntoCurriculum.it</strong>, uno
                  strumento digitale avanzato progettato per assistere gli
                  utenti nella creazione, ottimizzazione e traduzione di
                  Curriculum Vitae tramite l&apos;ausilio di modelli grafici
                  professionali e tecnologie di intelligenza artificiale (AI).
                </p>
              </section>

              <section>
                <h2
                  style={{
                    fontSize: 18,
                    fontWeight: 600,
                    color: "var(--navy)",
                    marginBottom: 10,
                  }}
                >
                  2. Modalità di Utilizzo e Account
                </h2>
                <p>
                  L&apos;accesso alle funzionalità base (come la creazione di un
                  primo CV) può essere effettuato gratuitamente. Per salvare,
                  modificare nel tempo, gestire candidature e accedere alle
                  funzioni avanzate è necessaria la creazione di un account (via
                  email o autenticazione federata come Google). L&apos;utente è
                  responsabile della correttezza dei dati inseriti e della
                  riservatezza delle proprie credenziali.
                </p>
              </section>

              <section>
                <h2
                  style={{
                    fontSize: 18,
                    fontWeight: 600,
                    color: "var(--navy)",
                    marginBottom: 10,
                  }}
                >
                  3. Piani e Pagamenti
                </h2>
                <p>
                  ProntoCurriculum offre piani di utilizzo gratuiti (con
                  possibili limitazioni, quali filigrane sui documenti o tetti
                  sulle operazioni AI) e piani a pagamento singoli o in
                  abbonamento (es. Singolo CV, Abbonamento Mensile o Annuale).
                </p>
                <p>
                  Tutti i pagamenti sono gestiti e protetti dalla piattaforma
                  terza Stripe Inc. In caso di acquisto di un abbonamento
                  ricorrente, l&apos;addebito avverrà automaticamente alla fine
                  di ciascun periodo di fatturazione, salvo disdetta
                  effettuata prima del rinnovo dall&apos;area utente.
                </p>
              </section>

              <section>
                <h2
                  style={{
                    fontSize: 18,
                    fontWeight: 600,
                    color: "var(--navy)",
                    marginBottom: 10,
                  }}
                >
                  4. Proprietà Intellettuale
                </h2>
                <p>
                  Il software, l&apos;interfaccia utente, il design, il logo, i
                  codici sorgente e i modelli grafici di ProntoCurriculum sono
                  di proprietà esclusiva del Titolare o dei suoi licenzianti.
                  L&apos;utente mantiene la piena titolarità intellettuale su
                  tutti i contenuti personali, i testi e le esperienze
                  lavorative inserite all&apos;interno del proprio curriculum.
                </p>
              </section>

              <section>
                <h2
                  style={{
                    fontSize: 18,
                    fontWeight: 600,
                    color: "var(--navy)",
                    marginBottom: 10,
                  }}
                >
                  5. Limitazione di Responsabilità
                </h2>
                <p>
                  ProntoCurriculum fornisce suggerimenti di scrittura e
                  valutazioni di compatibilità ATS sulla base di algoritmi ed
                  elaborazioni AI di ultima generazione. Il servizio è fornito
                  &quot;così com&apos;è&quot; (&quot;as is&quot;). Il Titolare
                  non garantisce in alcun modo l&apos;assunzione,
                  l&apos;ottenimento di colloqui di lavoro o il superamento
                  infallibile di specifici filtri automatizzati di selezione, e
                  non potrà essere ritenuto responsabile per eventuali imprecisioni
                  generate dall&apos;intelligenza artificiale o per danni
                  indiretti derivanti dall&apos;uso del servizio.
                </p>
              </section>

              <section>
                <h2
                  style={{
                    fontSize: 18,
                    fontWeight: 600,
                    color: "var(--navy)",
                    marginBottom: 10,
                  }}
                >
                  6. Legge Applicabile e Foro Competente
                </h2>
                <p>
                  I presenti Termini sono regolati dalla legge della Repubblica
                  Italiana. Per qualsiasi controversia derivante o connessa
                  all&apos;interpretazione o esecuzione del presente accordo
                  sarà competente in via esclusiva il Foro del luogo di
                  residenza o domicilio del consumatore in Italia, ove
                  applicabile.
                </p>
              </section>
            </div>
          )}

          {section === "cookie" && (
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: 24,
                fontSize: 15,
              }}
            >
              <section>
                <h2
                  style={{
                    fontSize: 18,
                    fontWeight: 600,
                    color: "var(--navy)",
                    marginBottom: 10,
                  }}
                >
                  1. Cosa sono i Cookie
                </h2>
                <p>
                  I cookie sono piccoli file di testo che i siti web visitati
                  dagli utenti inviano ai loro terminali (computer, tablet,
                  smartphone), dove vengono memorizzati per essere poi
                  ritrasmessi agli stessi siti alla visita successiva. I cookie
                  permettono di migliorare l&apos;esperienza di navigazione e la
                  sicurezza del sito.
                </p>
              </section>

              <section>
                <h2
                  style={{
                    fontSize: 18,
                    fontWeight: 600,
                    color: "var(--navy)",
                    marginBottom: 10,
                  }}
                >
                  2. Cookie Tecnici e Strettamente Necessari
                </h2>
                <p>
                  ProntoCurriculum utilizza cookie tecnici ed elementi tecnici di
                  archiviazione locale (`localStorage`) strettamente necessari
                  al corretto funzionamento dell&apos;applicazione. In
                  particolare:
                </p>
                <ul style={{ paddingLeft: 20, margin: "8px 0" }}>
                  <li>
                    <strong>Cookie di sessione (`sid`):</strong> necessari per
                    mantenere l&apos;autenticazione sicura dell&apos;utente al
                    proprio account e proteggere le richieste verso le API.
                  </li>
                  <li>
                    <strong>Preferenze di navigazione:</strong> salvataggio della
                    scelta di consenso cookie (`pc_cookie_consent`) e della
                    lingua di navigazione selezionata.
                  </li>
                </ul>
                <p>
                  Ai sensi della normativa vigente, per l&apos;installazione dei
                  cookie strettamente necessari non è richiesto il consenso
                  preventivo degli utenti.
                </p>
              </section>

              <section>
                <h2
                  style={{
                    fontSize: 18,
                    fontWeight: 600,
                    color: "var(--navy)",
                    marginBottom: 10,
                  }}
                >
                  3. Cookie Analitici e di Terze Parti
                </h2>
                <p>
                  Esclusivamente previo esplicito consenso dell&apos;utente
                  espresso tramite l&apos;apposito banner informativo, il sito
                  può attivare cookie analitici (es. Google Analytics GA4)
                  utilizzati per raccogliere informazioni in forma aggregata
                  sul numero degli utenti e su come questi visitano il sito,
                  al fine di ottimizzare le prestazioni e le funzionalità della
                  piattaforma.
                </p>
                <p>
                  Inoltre, durante l&apos;utilizzo del servizio o le procedure di
                  pagamento, possono essere caricati script o cookie di
                  fornitori terzi essenziali per la fornitura del servizio, tra
                  cui:
                </p>
                <ul style={{ paddingLeft: 20, margin: "8px 0" }}>
                  <li>
                    <strong>Stripe Inc.:</strong> cookie di sicurezza e antifrode
                    necessari per l&apos;elaborazione sicura dei pagamenti
                    online.
                  </li>
                  <li>
                    <strong>Fontshare / Google Fonts:</strong> caricamento di
                    font tipografici ottimizzati (senza tracciamento
                    pubblicitario dell&apos;utente).
                  </li>
                </ul>
              </section>

              <section>
                <h2
                  style={{
                    fontSize: 18,
                    fontWeight: 600,
                    color: "var(--navy)",
                    marginBottom: 10,
                  }}
                >
                  4. Gestione e Revoca del Consenso
                </h2>
                <p>
                  L&apos;utente può in ogni momento modificare o revocare il
                  proprio consenso ai cookie non necessari cancellando i dati di
                  navigazione (`localStorage` e cookie) dal proprio browser
                  oppure cliccando sulla voce di gestione cookie o contattando
                  l&apos;assistenza all&apos;indirizzo:{" "}
                  <strong>privacy@prontocurriculum.it</strong>.
                </p>
              </section>
            </div>
          )}

          <div
            style={{
              marginTop: 36,
              paddingTop: 24,
              borderTop: "1px solid var(--border-soft)",
              textAlign: "center",
            }}
          >
            <button
              onClick={() => onNavigate("home")}
              style={{
                background: "var(--navy)",
                color: "#FFFFFF",
                border: "none",
                padding: "10px 22px",
                borderRadius: 8,
                fontWeight: 600,
                fontSize: 14,
                cursor: "pointer",
              }}
            >
              Ho capito, torna a ProntoCurriculum
            </button>
          </div>
        </article>
      </div>
    </div>
  );
}
