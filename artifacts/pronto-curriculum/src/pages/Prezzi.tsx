import { useMemo } from 'react';
import type { ModalType, Page } from '../types';
import EditorialChrome, { useReveal, useSeoMeta } from '../components/EditorialChrome';

interface PrezziProps {
  onNavigate: (page: Page, slug?: string) => void;
  onModal: (modal: ModalType) => void;
}

const FAQ_ITEMS: Array<[string, string]> = [
  ['Posso usare ProntoCurriculum gratis?', 'Sì. Puoi creare, ottimizzare e scaricare un CV gratuitamente senza registrazione. Il piano gratuito applica una piccola filigrana al PDF: per rimuoverla basta passare a un piano a pagamento in qualsiasi momento.'],
  ['Che differenza c\'è tra Piano Mensile e Piano Annuale?', 'Il Piano Mensile include fino a 100 CV al mese, rephrasing AI e download senza filigrana, con addebito ricorrente ogni mese. Il Piano Annuale offre CV illimitati per 12 mesi a un prezzo forfettario più conveniente sull\'anno.'],
  ['Cos\'è il Singolo CV?', 'È un acquisto una tantum, senza abbonamento: paghi una volta e scarichi quel CV senza filigrana. Ideale se ti serve un solo documento ben fatto per una candidatura specifica.'],
  ['Posso disdire l\'abbonamento quando voglio?', 'Sì, puoi annullare il rinnovo in qualsiasi momento dall\'area account prima della data di rinnovo: continuerai ad avere accesso fino alla fine del periodo già pagato.'],
  ['I pagamenti sono sicuri?', 'Tutti i pagamenti sono gestiti da Stripe, leader mondiale nei pagamenti online. ProntoCurriculum non memorizza mai i dati della tua carta.'],
  ['Lo sconto del -30% è permanente?', 'Sì, il prezzo scontato mostrato è quello che paghi effettivamente, non un\'offerta a tempo: nessun aumento nascosto al rinnovo.'],
];

const PZ_CSS = `
.pce .pz-hero { padding: 72px 0 56px; text-align: center; }
.pce .pz-hero .eyebrow { color: var(--ink-40); margin-bottom: 24px; justify-content: center; display: flex; }
.pce .pz-hero .eyebrow b { color: var(--accent); font-weight: 500; }
.pce .pz-hero h1 { font-family: var(--f-display); font-weight: 700; font-size: clamp(38px, 5.2vw, 68px); line-height: 0.98; letter-spacing: -0.04em; }
.pce .pz-hero .sub { font-size: 16px; color: var(--ink-60); max-width: 560px; line-height: 1.65; margin: 22px auto 0; font-weight: 500; }

.pce .pz-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 18px; padding-bottom: 32px; align-items: stretch; }
.pce .pz-card { display: flex; flex-direction: column; background: rgba(255,255,255,0.82); backdrop-filter: blur(6px); border: 1px solid var(--hair-soft); border-radius: 18px; padding: 30px 26px; transition: transform .35s var(--ease), box-shadow .35s var(--ease), border-color .2s; }
.pce .pz-card:hover { transform: translateY(-4px); box-shadow: 0 18px 40px -20px rgba(60, 70, 180, 0.2); }
.pce .pz-card--hi { border-color: var(--accent); background: #14171F; color: #F3F1EA; position: relative; overflow: hidden; }
.pce .pz-card--hi::after { content: ''; position: absolute; width: 260px; height: 260px; border-radius: 50%; right: -100px; top: -110px; background: radial-gradient(circle, rgba(124,92,255,0.28) 0%, transparent 65%); }
.pce .pz-card > * { position: relative; z-index: 1; }
.pce .pz-badge { font-family: var(--f-mono); font-size: 9.5px; letter-spacing: 0.1em; text-transform: uppercase; color: var(--accent); background: rgba(47,42,229,0.08); border-radius: 99px; padding: 5px 11px; width: fit-content; margin-bottom: 16px; }
.pce .pz-card--hi .pz-badge { color: #C9D6FF; background: rgba(255,255,255,0.1); }
.pce .pz-card h3 { font-family: var(--f-display); font-weight: 700; font-size: 19px; letter-spacing: -0.02em; margin-bottom: 8px; }
.pce .pz-card .pz-desc { font-size: 13px; color: var(--ink-60); line-height: 1.6; margin-bottom: 22px; min-height: 40px; }
.pce .pz-card--hi .pz-desc { color: #A6ACBA; }
.pce .pz-price { font-family: var(--f-display); font-weight: 700; font-size: 38px; letter-spacing: -0.02em; margin-bottom: 2px; }
.pce .pz-price span { font-size: 14px; font-weight: 500; color: var(--ink-40); }
.pce .pz-card--hi .pz-price span { color: #8A8F9C; }
.pce .pz-old { font-family: var(--f-mono); font-size: 12.5px; color: var(--ink-40); text-decoration: line-through; margin-bottom: 20px; display: block; }
.pce .pz-card--hi .pz-old { color: #6A707E; }
.pce .pz-feats { list-style: none; display: flex; flex-direction: column; gap: 10px; margin: 22px 0 26px; flex: 1; }
.pce .pz-feats li { font-size: 13.5px; color: var(--ink-60); line-height: 1.5; display: flex; gap: 9px; align-items: flex-start; }
.pce .pz-card--hi .pz-feats li { color: #C9CDD8; }
.pce .pz-feats li b { color: var(--accent); flex-shrink: 0; }
.pce .pz-card--hi .pz-feats li b { color: #9DB6FF; }

.pce .pz-compare { border: 1px solid var(--hair-soft); border-radius: 18px; overflow: hidden; margin: 12px 0 8px; }
.pce .pz-compare table { width: 100%; border-collapse: collapse; font-size: 13.5px; }
.pce .pz-compare th, .pce .pz-compare td { padding: 14px 18px; text-align: center; border-bottom: 1px solid var(--hair-soft); }
.pce .pz-compare th:first-child, .pce .pz-compare td:first-child { text-align: left; color: var(--ink-60); }
.pce .pz-compare thead th { font-family: var(--f-display); font-weight: 700; background: rgba(20,23,31,0.02); }
.pce .pz-compare tbody tr:last-child td { border-bottom: none; }

@media (max-width: 1000px) {
  .pce .pz-grid { grid-template-columns: 1fr 1fr; }
}
@media (max-width: 640px) {
  .pce .pz-grid { grid-template-columns: 1fr; }
  .pce .pz-compare { overflow-x: auto; }
}
`;

export default function Prezzi({ onNavigate, onModal }: PrezziProps) {
  useReveal();
  useSeoMeta(
    'Prezzi ProntoCurriculum — CV Gratis o Illimitati da €1,99 | ProntoCurriculum',
    'Confronta i piani ProntoCurriculum: crea CV gratis con filigrana, oppure scegli il Piano Mensile, Annuale o il Singolo CV senza filigrana. Sconto -30% permanente, pagamenti sicuri con Stripe.',
    '/prezzi',
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
    <EditorialChrome onNavigate={onNavigate} active="prezzi">
      <style>{PZ_CSS}</style>
      <main>
        <div className="shell">
          {/* HERO */}
          <section className="pz-hero">
            <div className="mono eyebrow rv on">Prezzi trasparenti <b>·</b> Nessun costo nascosto</div>
            <h1 className="rv on d1">Un piano per <span className="grad">ogni candidatura.</span></h1>
            <p className="sub rv on d2">
              Inizia gratis: crea e scarica il tuo CV in pochi minuti. Passa a un piano a pagamento
              solo quando vuoi rimuovere la filigrana e sbloccare le funzioni AI illimitate.
            </p>
          </section>

          {/* PLANS */}
          <section className="pz-grid" aria-label="Piani disponibili">
            <div className="pz-card rv on d1">
              <span className="pz-badge">Gratis</span>
              <h3>Piano Free</h3>
              <p className="pz-desc">Per provare la piattaforma senza impegno.</p>
              <div className="pz-price">€0<span>/sempre</span></div>
              <span className="pz-old" style={{ visibility: 'hidden' }}>€0,00</span>
              <ul className="pz-feats">
                <li><b>✓</b> CV illimitati con filigrana</li>
                <li><b>✓</b> Template ottimizzati ATS</li>
                <li><b>✓</b> Punteggio ATS in tempo reale</li>
                <li><b>✓</b> Traduzione in 6 lingue</li>
              </ul>
              <button className="btn btn-line" style={{ width: '100%' }} onClick={() => onNavigate('builder-step1')}>
                Inizia gratis
              </button>
            </div>

            <div className="pz-card rv on d2">
              <span className="pz-badge">-30%</span>
              <h3>Piano Mensile</h3>
              <p className="pz-desc">Per chi cerca lavoro attivamente questo mese.</p>
              <div className="pz-price">€6,99<span>/mese</span></div>
              <span className="pz-old">€9,99/mese</span>
              <ul className="pz-feats">
                <li><b>✓</b> Fino a 100 CV al mese</li>
                <li><b>✓</b> Download senza filigrana</li>
                <li><b>✓</b> Rephrasing AI delle esperienze</li>
                <li><b>✓</b> CV su misura per ogni offerta</li>
              </ul>
              <button className="btn btn-line" style={{ width: '100%' }} onClick={() => onModal('pricing')}>
                Scegli Mensile
              </button>
            </div>

            <div className="pz-card pz-card--hi rv on d3">
              <span className="pz-badge">Più scelto · -30%</span>
              <h3>Piano Annuale</h3>
              <p className="pz-desc">Per l'intera ricerca di lavoro, al miglior prezzo.</p>
              <div className="pz-price">€34,99<span>/anno</span></div>
              <span className="pz-old">€49,99/anno</span>
              <ul className="pz-feats">
                <li><b>✓</b> CV illimitati per 12 mesi</li>
                <li><b>✓</b> Download senza filigrana</li>
                <li><b>✓</b> Rephrasing AI delle esperienze</li>
                <li><b>✓</b> CV su misura per ogni offerta</li>
                <li><b>✓</b> Lettere di presentazione AI</li>
              </ul>
              <button className="btn btn-ink" style={{ width: '100%' }} onClick={() => onModal('pricing')}>
                Scegli Annuale →
              </button>
            </div>

            <div className="pz-card rv on d3">
              <span className="pz-badge">Una tantum · -30%</span>
              <h3>Singolo CV</h3>
              <p className="pz-desc">Ti serve un solo CV impeccabile, senza abbonamento.</p>
              <div className="pz-price">€1,99<span>/una volta</span></div>
              <span className="pz-old">€2,99</span>
              <ul className="pz-feats">
                <li><b>✓</b> 1 download senza filigrana</li>
                <li><b>✓</b> Rephrasing AI incluso</li>
                <li><b>✓</b> Nessun rinnovo automatico</li>
              </ul>
              <button className="btn btn-line" style={{ width: '100%' }} onClick={() => onModal('pricing')}>
                Acquista singolo CV
              </button>
            </div>
          </section>

          {/* COMPARISON */}
          <section className="sec" style={{ padding: '48px 0 0' }} aria-label="Confronto dettagliato dei piani">
            <div className="sec-head rv">
              <h2 className="sec-title">Confronto <span className="ac">dettagliato.</span></h2>
              <span className="mono sec-num">Tutte le funzioni</span>
            </div>
            <div className="pz-compare rv">
              <table>
                <thead>
                  <tr><th>Funzione</th><th>Free</th><th>Mensile</th><th>Annuale</th><th>Singolo</th></tr>
                </thead>
                <tbody>
                  <tr><td>Template ottimizzati ATS</td><td>✓</td><td>✓</td><td>✓</td><td>✓</td></tr>
                  <tr><td>Punteggio ATS in tempo reale</td><td>✓</td><td>✓</td><td>✓</td><td>✓</td></tr>
                  <tr><td>Download senza filigrana</td><td>—</td><td>✓</td><td>✓</td><td>✓</td></tr>
                  <tr><td>Rephrasing AI esperienze</td><td>—</td><td>✓</td><td>✓</td><td>✓</td></tr>
                  <tr><td>CV su misura per offerta</td><td>—</td><td>✓</td><td>✓</td><td>—</td></tr>
                  <tr><td>Lettera di presentazione AI</td><td>—</td><td>✓</td><td>✓</td><td>—</td></tr>
                  <tr><td>Traduzione in 6 lingue</td><td>✓</td><td>✓</td><td>✓</td><td>✓</td></tr>
                  <tr><td>CV inclusi</td><td>Illimitati</td><td>100/mese</td><td>Illimitati</td><td>1</td></tr>
                </tbody>
              </table>
            </div>
          </section>

          {/* FAQ */}
          <section className="sec" style={{ padding: '72px 0 0' }} aria-label="Domande frequenti sui prezzi">
            <div className="sec-head rv">
              <h2 className="sec-title">Domande <span className="ac">frequenti.</span></h2>
              <span className="mono sec-num">FAQ — Prezzi</span>
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
                <span className="mono">Nessuna carta richiesta per iniziare</span>
                <h3>Il tuo prossimo CV parte gratis.</h3>
                <p>
                  Crea il curriculum ora e decidi solo dopo se sbloccare il download senza filigrana.
                </p>
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
