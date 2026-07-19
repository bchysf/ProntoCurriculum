import { useMemo } from 'react';
import type { Page } from '../types';
import EditorialChrome, { useReveal, useSeoMeta } from '../components/EditorialChrome';

interface ComeFunzionaProps {
  onNavigate: (page: Page, slug?: string) => void;
}

const BUILDER_STEPS: Array<[string, string, string]> = [
  ['01', 'Carica o parti da zero', 'Importa il tuo vecchio CV in PDF o il profilo LinkedIn, oppure rispondi alle domande guidate partendo da un modello vuoto.'],
  ['02', 'Scegli il template', 'Nove modelli professionali — Moderno, Minimal, Milano, Europass e altri — tutti ottimizzati per i sistemi ATS italiani ed europei.'],
  ['03', "Scrivi con l'AI", "L'AI riformula ogni esperienza con verbi d'azione e risultati misurabili, e ti segnala parole chiave mancanti rispetto al tuo settore."],
  ['04', 'Controlla il punteggio ATS e scarica', 'Parsing, keyword e metriche calcolati in tempo reale: sai sempre se il CV supererà i filtri, poi scarichi il PDF pronto per la candidatura.'],
];

const TAILOR_STEPS: Array<[string, string, string]> = [
  ['01', "Incolla l'annuncio", "L'AI legge l'offerta di lavoro ed estrae le keyword che i recruiter e i filtri ATS cercano davvero."],
  ['02', 'CV su misura in un click', 'Le esperienze del tuo archivio vengono riordinate per rilevanza e i testi riscritti per rispecchiare quell\'offerta specifica.'],
  ['03', 'Genera la lettera di presentazione', "Con lo stesso contesto, l'AI scrive una lettera di presentazione coerente in pochi secondi, con il tono che preferisci."],
  ['04', 'Traccia la candidatura', 'Ogni versione del CV resta collegata alla candidatura inviata: sai sempre cosa hai mandato, a chi e quando.'],
];

const FAQ_ITEMS: Array<[string, string]> = [
  ['Devo registrarmi per creare un CV?', 'No. Puoi creare, ottimizzare e scaricare un CV completo senza account. La registrazione serve solo per salvare i progressi, tracciare le candidature e rimuovere la filigrana con un piano a pagamento.'],
  ['Quanto tempo serve per creare un CV con l\'AI?', 'In media 5-10 minuti se parti da un CV o profilo LinkedIn esistente, 15-20 minuti se scrivi da zero rispondendo alle domande guidate.'],
  ['Cos\'è il punteggio ATS e perché è importante?', 'Gli ATS (Applicant Tracking System) sono i software che la maggior parte delle aziende usa per filtrare i CV prima che un umano li legga. Il punteggio ATS di ProntoCurriculum stima quanto bene il tuo CV verrà letto e classificato da questi sistemi, in base a formattazione, parsing e keyword.'],
  ['Posso creare un CV in un\'altra lingua?', 'Sì, ogni CV può essere tradotto in 6 lingue mantenendo l\'impaginazione e adattando automaticamente le convenzioni locali (es. formato data, ordine di nome e cognome).'],
  ['I dati che carico vengono usati per addestrare l\'AI?', 'No. I fornitori AI partner (Google Gemini, Groq) sono vincolati da accordi che escludono l\'uso dei tuoi dati per addestrare modelli pubblici. Trovi tutti i dettagli nella nostra Privacy Policy.'],
];

const CF_CSS = `
.pce .cf-hero { padding: 72px 0 56px; }
.pce .cf-hero .eyebrow { color: var(--ink-40); margin-bottom: 24px; }
.pce .cf-hero .eyebrow b { color: var(--accent); font-weight: 500; }
.pce .cf-hero h1 { font-family: var(--f-display); font-weight: 700; font-size: clamp(38px, 5.2vw, 68px); line-height: 0.98; letter-spacing: -0.04em; max-width: 900px; }
.pce .cf-hero .sub { font-size: 16px; color: var(--ink-60); max-width: 560px; line-height: 1.65; margin-top: 22px; font-weight: 500; }

.pce .cf-steps { display: grid; grid-template-columns: repeat(4, 1fr); gap: 0; }
.pce .cf-step { padding: 0 26px; border-left: 1px solid var(--hair-soft); }
.pce .cf-step:first-child { padding-left: 0; border-left: none; }
.pce .cf-step-num { font-family: var(--f-display); font-weight: 700; font-size: 44px; letter-spacing: -0.04em; line-height: 1; margin-bottom: 16px; background: linear-gradient(120deg, #6FA5FF, #BE9CFF); -webkit-background-clip: text; background-clip: text; color: transparent; }
.pce .cf-step h3 { font-family: var(--f-display); font-size: 16px; font-weight: 600; letter-spacing: -0.01em; margin-bottom: 8px; }
.pce .cf-step p { font-size: 13.5px; color: var(--ink-60); line-height: 1.6; }

@media (max-width: 900px) {
  .pce .cf-steps { grid-template-columns: 1fr; gap: 32px; }
  .pce .cf-step { padding: 0; border-left: none; }
}
`;

export default function ComeFunziona({ onNavigate }: ComeFunzionaProps) {
  useReveal();
  useSeoMeta(
    'Come Funziona ProntoCurriculum — CV, CV su Misura e Candidature | ProntoCurriculum',
    'Scopri come ProntoCurriculum crea il tuo CV con l\'AI in pochi minuti, lo adatta a ogni offerta di lavoro e ti aiuta a tracciare le candidature, dal template al colloquio.',
    '/come-funziona',
  );

  const faqSchema = useMemo(() => ({
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: FAQ_ITEMS.map(([q, a]) => ({
      '@type': 'Question',
      name: q,
      acceptedAnswer: { '@type': 'Answer', text: a },
    })),
  }), []);

  return (
    <EditorialChrome onNavigate={onNavigate} active="come-funziona">
      <style>{CF_CSS}</style>
      <main>
        <div className="shell">
          {/* HERO */}
          <section className="cf-hero">
            <div className="mono eyebrow rv on">Guida al prodotto <b>·</b> Dal CV al colloquio</div>
            <h1 className="rv on d1">Come funziona <span className="grad">ProntoCurriculum.</span></h1>
            <p className="sub rv on d2">
              Tre strumenti, un solo flusso: crea il CV con l'AI, adattalo a ogni offerta di lavoro
              e tieni traccia di ogni candidatura inviata. Ecco come, passo per passo.
            </p>
          </section>

          {/* BUILDER STEPS */}
          <section className="sec">
            <div className="sec-head rv">
              <h2 className="sec-title">Creare il CV <span className="ac">in 4 passi.</span></h2>
              <span className="mono sec-num">01 — CV Builder</span>
            </div>
            <div className="cf-steps">
              {BUILDER_STEPS.map(([n, t, d], i) => (
                <div className={`cf-step rv d${i}`} key={n}>
                  <div className="cf-step-num">{n}</div>
                  <h3>{t}</h3>
                  <p>{d}</p>
                </div>
              ))}
            </div>
            <div className="rv" style={{ marginTop: 40 }}>
              <button className="btn btn-ink" onClick={() => onNavigate('builder-step1')}>
                Crea il tuo CV ora →
              </button>
            </div>
          </section>

          {/* TAILOR STEPS */}
          <section className="sec" style={{ paddingTop: 88 }}>
            <div className="sec-head rv">
              <h2 className="sec-title">Adattarlo a <span className="ac">ogni offerta.</span></h2>
              <span className="mono sec-num">02 — CV su misura</span>
            </div>
            <div className="cf-steps">
              {TAILOR_STEPS.map(([n, t, d], i) => (
                <div className={`cf-step rv d${i}`} key={n}>
                  <div className="cf-step-num">{n}</div>
                  <h3>{t}</h3>
                  <p>{d}</p>
                </div>
              ))}
            </div>
            <div className="rv" style={{ marginTop: 40, display: 'flex', gap: 12, flexWrap: 'wrap' }}>
              <button className="btn btn-ink" onClick={() => onNavigate('tailor')}>
                Adatta il tuo CV →
              </button>
              <button className="btn btn-line" onClick={() => onNavigate('jobs')}>
                Sfoglia le offerte di lavoro
              </button>
            </div>
          </section>

          {/* WHY IT WORKS */}
          <section className="sec" style={{ paddingTop: 88 }}>
            <div className="sec-head rv">
              <h2 className="sec-title">Perché <span className="ac">funziona.</span></h2>
              <span className="mono sec-num">03 — Il metodo</span>
            </div>
            <div className="cf-steps" style={{ gridTemplateColumns: 'repeat(3, 1fr)' }}>
              <div className="cf-step rv d0" style={{ padding: 0, borderLeft: 'none' }}>
                <h3>Il punteggio che i recruiter non ti dicono</h3>
                <p>Ogni CV viene analizzato con gli stessi criteri di parsing usati dagli ATS aziendali: formattazione, struttura delle sezioni e densità di keyword.</p>
              </div>
              <div className="cf-step rv d1" style={{ padding: '0 26px', borderLeft: '1px solid var(--hair-soft)' }}>
                <h3>Riscrive, non inventa</h3>
                <p>L'AI riformula quello che le racconti — non genera esperienze false. Il risultato resta accurato e verificabile in un eventuale colloquio.</p>
              </div>
              <div className="cf-step rv d2" style={{ padding: '0 26px', borderLeft: '1px solid var(--hair-soft)' }}>
                <h3>Un CV, sei mercati</h3>
                <p>Traduzione in 6 lingue mantenendo l'impaginazione, per candidarti in Italia e all'estero senza ricominciare da zero.</p>
              </div>
            </div>
          </section>

          {/* FAQ */}
          <section className="sec" style={{ padding: '88px 0 0' }} aria-label="Domande frequenti">
            <div className="sec-head rv">
              <h2 className="sec-title">Domande <span className="ac">frequenti.</span></h2>
              <span className="mono sec-num">FAQ — Prodotto</span>
            </div>
            <div className="faq rv">
              {FAQ_ITEMS.map(([q, a]) => (
                <details key={q}>
                  <summary>{q}</summary>
                  <p>{a}</p>
                </details>
              ))}
            </div>
          </section>

          {/* FINAL CTA */}
          <section style={{ padding: '72px 0 88px' }} aria-label="Crea il tuo CV">
            <div className="cta-band rv">
              <div>
                <span className="mono">Pronto a iniziare?</span>
                <h3>Il tuo CV, pronto in pochi minuti.</h3>
                <p>Gratis per iniziare, senza registrazione. Sblocchi il download senza filigrana solo quando vuoi.</p>
              </div>
              <button className="btn btn-ink" onClick={() => onNavigate('builder-step1')}>
                Crea il tuo CV →
              </button>
            </div>
          </section>
        </div>
      </main>

      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }} />
    </EditorialChrome>
  );
}
