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
  [t('pz.faq.q3'), t('pz.faq.a3')],
  [t('pz.faq.q5'), t('pz.faq.a5')],
];

const PZ_CSS = `
.pce .pz-hero { padding: 72px 0 56px; text-align: center; }
.pce .pz-hero .eyebrow { color: var(--ink-40); margin-bottom: 24px; justify-content: center; display: flex; }
.pce .pz-hero .eyebrow b { color: var(--accent); font-weight: 500; }
.pce .pz-hero h1 { font-family: var(--f-display); font-weight: 700; font-size: clamp(38px, 5.2vw, 68px); line-height: 0.98; letter-spacing: -0.04em; }
.pce .pz-hero .sub { font-size: 16px; color: var(--ink-60); max-width: 560px; line-height: 1.65; margin: 22px auto 0; font-weight: 500; }

.pce .pz-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 20px; padding-bottom: 32px; align-items: stretch; max-width: 760px; margin: 0 auto; }
.pce .pz-card { display: flex; flex-direction: column; background: rgba(255,255,255,0.82); backdrop-filter: blur(6px); border: 1px solid var(--hair-soft); border-radius: 18px; padding: 34px 30px; transition: transform .35s var(--ease), box-shadow .35s var(--ease), border-color .2s; }
.pce .pz-card:hover { transform: translateY(-4px); box-shadow: 0 18px 40px -20px rgba(60, 70, 180, 0.2); }
.pce .pz-card--hi { border-color: var(--accent); background: #14171F; color: #F3F1EA; position: relative; overflow: hidden; }
.pce .pz-card--hi::after { content: ''; position: absolute; width: 260px; height: 260px; border-radius: 50%; right: -100px; top: -110px; background: radial-gradient(circle, rgba(124,92,255,0.28) 0%, transparent 65%); }
.pce .pz-card > * { position: relative; z-index: 1; }
.pce .pz-badge { font-family: var(--f-mono); font-size: 9.5px; letter-spacing: 0.1em; text-transform: uppercase; color: var(--accent); background: rgba(47,42,229,0.08); border-radius: 99px; padding: 5px 11px; width: fit-content; margin-bottom: 16px; }
.pce .pz-card--hi .pz-badge { color: #C9D6FF; background: rgba(255,255,255,0.1); }
.pce .pz-card h3 { font-family: var(--f-display); font-weight: 700; font-size: 22px; letter-spacing: -0.02em; margin-bottom: 8px; }
.pce .pz-card .pz-desc { font-size: 13.5px; color: var(--ink-60); line-height: 1.6; margin-bottom: 22px; min-height: 40px; }
.pce .pz-card--hi .pz-desc { color: #A6ACBA; }
.pce .pz-price { font-family: var(--f-display); font-weight: 700; font-size: 42px; letter-spacing: -0.02em; margin-bottom: 20px; }
.pce .pz-price span { font-size: 14px; font-weight: 500; color: var(--ink-40); }
.pce .pz-card--hi .pz-price span { color: #8A8F9C; }
.pce .pz-feats { list-style: none; display: flex; flex-direction: column; gap: 10px; margin: 0 0 26px; flex: 1; }
.pce .pz-feats li { font-size: 13.5px; color: var(--ink-60); line-height: 1.5; display: flex; gap: 9px; align-items: flex-start; }
.pce .pz-card--hi .pz-feats li { color: #C9CDD8; }
.pce .pz-feats li b { color: var(--accent); flex-shrink: 0; }
.pce .pz-card--hi .pz-feats li b { color: #9DB6FF; }

@media (max-width: 640px) {
  .pce .pz-grid { grid-template-columns: 1fr; }
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

            <div className="pz-card pz-card--hi rv on d2">
              <span className="pz-badge">{t('pz.oneTime')}</span>
              <h3>{t('pz.singleCV')}</h3>
              <p className="pz-desc">{t('pz.singleDesc')}</p>
              <div className="pz-price">€1,99<span>{t('pz.once')}</span></div>
              <ul className="pz-feats">
                <li><b>✓</b> {t('pz.single1')}</li>
                <li><b>✓</b> {t('pz.single2')}</li>
                <li><b>✓</b> {t('pz.single3')}</li>
              </ul>
              <button className="btn btn-ink" style={{ width: '100%' }} onClick={() => onModal('pricing')}>
                {t('pz.buySingle')}
              </button>
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
