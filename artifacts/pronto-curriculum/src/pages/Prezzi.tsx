import { useMemo } from 'react';
import type { ModalType, Page } from '../types';
import EditorialChrome, { useReveal, useSeoMeta } from '../components/EditorialChrome';
import { useT } from '../i18n/LanguageContext';

interface PrezziProps {
  onNavigate: (page: Page, slug?: string) => void;
  onModal: (modal: ModalType) => void;
}

type TFn = (key: string) => string;

const buildFaqItems = (t: TFn): Array<[string, string]> => [
  [t('pz.faq.q1'), t('pz.faq.a1')],
  [t('pz.faq.q2'), t('pz.faq.a2')],
  [t('pz.faq.q3'), t('pz.faq.a3')],
  [t('pz.faq.q4'), t('pz.faq.a4')],
  [t('pz.faq.q5'), t('pz.faq.a5')],
  [t('pz.faq.q6'), t('pz.faq.a6')],
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
  const t = useT();
  useSeoMeta(
    t('seo.prezzi.title'),
    t('seo.prezzi.desc'),
    '/prezzi',
  );
  const FAQ_ITEMS = buildFaqItems(t);

  const faqSchema = useMemo(() => ({
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: FAQ_ITEMS.map(([q, a]) => ({
      '@type': 'Question',
      name: q,
      acceptedAnswer: { '@type': 'Answer', text: a },
    })),
  }), [FAQ_ITEMS]);

  return (
    <EditorialChrome onNavigate={onNavigate} active="prezzi">
      <style>{PZ_CSS}</style>
      <main>
        <div className="shell">
          {/* HERO */}
          <section className="pz-hero">
            <div className="mono eyebrow rv on">{t('pz.eyebrow')}</div>
            <h1 className="rv on d1">{t('pz.h1a')} <span className="grad">{t('pz.h1b')}</span></h1>
            <p className="sub rv on d2">
              {t('pz.heroSub')}
            </p>
          </section>

          {/* PLANS */}
          <section className="pz-grid" aria-label="Piani disponibili">
            <div className="pz-card rv on d1">
              <span className="pz-badge">{t('pz.free')}</span>
              <h3>{t('pz.freePlan')}</h3>
              <p className="pz-desc">{t('pz.freeDesc')}</p>
              <div className="pz-price">€0<span>{t('pz.forever')}</span></div>
              <span className="pz-old" style={{ visibility: 'hidden' }}>€0,00</span>
              <ul className="pz-feats">
                <li><b>✓</b> {t('pz.free1')}</li>
                <li><b>✓</b> {t('pz.free2')}</li>
                <li><b>✓</b> {t('pz.free3')}</li>
                <li><b>✓</b> {t('pz.free4')}</li>
              </ul>
              <button className="btn btn-line" style={{ width: '100%' }} onClick={() => onNavigate('builder-step1')}>
                {t('pz.startFree')}
              </button>
            </div>

            <div className="pz-card rv on d2">
              <span className="pz-badge">-30%</span>
              <h3>{t('pz.monthlyPlan')}</h3>
              <p className="pz-desc">{t('pz.monthlyDesc')}</p>
              <div className="pz-price">€6,99<span>{t('pz.perMonth')}</span></div>
              <span className="pz-old">€9,99{t('pz.perMonth')}</span>
              <ul className="pz-feats">
                <li><b>✓</b> {t('pz.monthly1')}</li>
                <li><b>✓</b> {t('pz.noWatermark')}</li>
                <li><b>✓</b> {t('pz.aiRephrasing')}</li>
                <li><b>✓</b> {t('pz.tailoredCV')}</li>
              </ul>
              <button className="btn btn-line" style={{ width: '100%' }} onClick={() => onModal('pricing')}>
                {t('pz.chooseMonthly')}
              </button>
            </div>

            <div className="pz-card pz-card--hi rv on d3">
              <span className="pz-badge">{t('pz.mostChosen')}</span>
              <h3>{t('pz.annualPlan')}</h3>
              <p className="pz-desc">{t('pz.annualDesc')}</p>
              <div className="pz-price">€34,99<span>{t('pz.perYear')}</span></div>
              <span className="pz-old">€49,99{t('pz.perYear')}</span>
              <ul className="pz-feats">
                <li><b>✓</b> {t('pz.annual1')}</li>
                <li><b>✓</b> {t('pz.noWatermark')}</li>
                <li><b>✓</b> {t('pz.aiRephrasing')}</li>
                <li><b>✓</b> {t('pz.tailoredCV')}</li>
                <li><b>✓</b> {t('pz.coverLettersAI')}</li>
              </ul>
              <button className="btn btn-ink" style={{ width: '100%' }} onClick={() => onModal('pricing')}>
                {t('pz.chooseAnnual')}
              </button>
            </div>

            <div className="pz-card rv on d3">
              <span className="pz-badge">{t('pz.oneTime')}</span>
              <h3>{t('pz.singleCV')}</h3>
              <p className="pz-desc">{t('pz.singleDesc')}</p>
              <div className="pz-price">€1,99<span>{t('pz.once')}</span></div>
              <span className="pz-old">€2,99</span>
              <ul className="pz-feats">
                <li><b>✓</b> {t('pz.single1')}</li>
                <li><b>✓</b> {t('pz.single2')}</li>
                <li><b>✓</b> {t('pz.single3')}</li>
              </ul>
              <button className="btn btn-line" style={{ width: '100%' }} onClick={() => onModal('pricing')}>
                {t('pz.buySingle')}
              </button>
            </div>
          </section>

          {/* COMPARISON */}
          <section className="sec" style={{ padding: '48px 0 0' }} aria-label="Confronto dettagliato dei piani">
            <div className="sec-head rv">
              <h2 className="sec-title">{t('pz.compareTitle')} <span className="ac">{t('pz.compareTitleAc')}</span></h2>
              <span className="mono sec-num">{t('pz.allFeatures')}</span>
            </div>
            <div className="pz-compare rv">
              <table>
                <thead>
                  <tr><th>{t('pz.feature')}</th><th>{t('pz.free')}</th><th>{t('pz.monthlyCol')}</th><th>{t('pz.annualCol')}</th><th>{t('pz.singleCol')}</th></tr>
                </thead>
                <tbody>
                  <tr><td>{t('pz.atsTemplates')}</td><td>✓</td><td>✓</td><td>✓</td><td>✓</td></tr>
                  <tr><td>{t('pz.atsScore')}</td><td>✓</td><td>✓</td><td>✓</td><td>✓</td></tr>
                  <tr><td>{t('pz.dlNoWatermark')}</td><td>—</td><td>✓</td><td>✓</td><td>✓</td></tr>
                  <tr><td>{t('pz.aiRephrasingExp')}</td><td>—</td><td>✓</td><td>✓</td><td>✓</td></tr>
                  <tr><td>{t('pz.tailoredCVOffer')}</td><td>—</td><td>✓</td><td>✓</td><td>—</td></tr>
                  <tr><td>{t('pz.coverLetterAI')}</td><td>—</td><td>✓</td><td>✓</td><td>—</td></tr>
                  <tr><td>{t('pz.translation6Langs')}</td><td>✓</td><td>✓</td><td>✓</td><td>✓</td></tr>
                  <tr><td>{t('pz.cvIncluded')}</td><td>{t('pz.unlimited')}</td><td>{t('pz.perMonthCount')}</td><td>{t('pz.unlimited')}</td><td>1</td></tr>
                </tbody>
              </table>
            </div>
          </section>

          {/* FAQ */}
          <section className="sec" style={{ padding: '72px 0 0' }} aria-label="Domande frequenti sui prezzi">
            <div className="sec-head rv">
              <h2 className="sec-title">{t('pz.faqTitle')} <span className="ac">{t('pz.faqTitleAc')}</span></h2>
              <span className="mono sec-num">{t('pz.faqPricing')}</span>
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
                <span className="mono">{t('pz.noCardRequired')}</span>
                <h3>{t('pz.finalCtaTitle')}</h3>
                <p>
                  {t('pz.finalCtaSub')}
                </p>
              </div>
              <button className="btn btn-ink" onClick={() => onNavigate('builder-step1')}>
                {t('pz.finalCta')}
              </button>
            </div>
          </section>
        </div>
      </main>

      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }} />
    </EditorialChrome>
  );
}
