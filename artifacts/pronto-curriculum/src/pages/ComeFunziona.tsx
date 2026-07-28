import { useMemo } from 'react';
import type { Page } from '../types';
import EditorialChrome, { useReveal, useSeoMeta } from '../components/EditorialChrome';
import { useT } from '../i18n/LanguageContext';

interface ComeFunzionaProps {
  onNavigate: (page: Page, slug?: string) => void;
}

type TFn = (key: string) => string;

const buildBuilderSteps = (t: TFn): Array<[string, string, string]> => [
  ['01', t('cf.b1.title'), t('cf.b1.desc')],
  ['02', t('cf.b2.title'), t('cf.b2.desc')],
  ['03', t('cf.b3.title'), t('cf.b3.desc')],
  ['04', t('cf.b4.title'), t('cf.b4.desc')],
];

const buildTailorSteps = (t: TFn): Array<[string, string, string]> => [
  ['01', t('cf.t1.title'), t('cf.t1.desc')],
  ['02', t('cf.t2.title'), t('cf.t2.desc')],
  ['03', t('cf.t3.title'), t('cf.t3.desc')],
  ['04', t('cf.t4.title'), t('cf.t4.desc')],
];

const buildFaqItems = (t: TFn): Array<[string, string]> => [
  [t('cf.faq.q1'), t('cf.faq.a1')],
  [t('cf.faq.q2'), t('cf.faq.a2')],
  [t('cf.faq.q3'), t('cf.faq.a3')],
  [t('cf.faq.q4'), t('cf.faq.a4')],
  [t('cf.faq.q5'), t('cf.faq.a5')],
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
  const t = useT();
  const BUILDER_STEPS = buildBuilderSteps(t);
  const TAILOR_STEPS = buildTailorSteps(t);
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
    <EditorialChrome onNavigate={onNavigate} active="come-funziona">
      <style>{CF_CSS}</style>
      <main>
        <div className="shell">
          {/* HERO */}
          <section className="cf-hero">
            <div className="mono eyebrow rv on">{t('cf.eyebrow')}</div>
            <h1 className="rv on d1">{t('cf.h1')} <span className="grad">{t('cf.h1ac')}</span></h1>
            <p className="sub rv on d2">
              {t('cf.heroSub')}
            </p>
          </section>

          {/* BUILDER STEPS */}
          <section className="sec">
            <div className="sec-head rv">
              <h2 className="sec-title">{t('cf.createIn4')} <span className="ac">{t('cf.in4steps')}</span></h2>
              <span className="mono sec-num">{t('cf.cvBuilder')}</span>
            </div>
            <div className="cf-steps">
              {BUILDER_STEPS.map(([n, title, d], i) => (
                <div className={`cf-step rv d${i}`} key={n}>
                  <div className="cf-step-num">{n}</div>
                  <h3>{title}</h3>
                  <p>{d}</p>
                </div>
              ))}
            </div>
            <div className="rv" style={{ marginTop: 40 }}>
              <button className="btn btn-ink" onClick={() => onNavigate('builder-step1')}>
                {t('cf.createNow')}
              </button>
            </div>
          </section>

          {/* TAILOR STEPS */}
          <section className="sec" style={{ paddingTop: 88 }}>
            <div className="sec-head rv">
              <h2 className="sec-title">{t('cf.adaptTo')} <span className="ac">{t('cf.everyOffer')}</span></h2>
              <span className="mono sec-num">{t('cf.tailorSection')}</span>
            </div>
            <div className="cf-steps">
              {TAILOR_STEPS.map(([n, title, d], i) => (
                <div className={`cf-step rv d${i}`} key={n}>
                  <div className="cf-step-num">{n}</div>
                  <h3>{title}</h3>
                  <p>{d}</p>
                </div>
              ))}
            </div>
            <div className="rv" style={{ marginTop: 40, display: 'flex', gap: 12, flexWrap: 'wrap' }}>
              <button className="btn btn-ink" onClick={() => onNavigate('tailor')}>
                {t('cf.adaptYourCV')}
              </button>
              <button className="btn btn-line" onClick={() => onNavigate('jobs')}>
                {t('cf.browseJobs')}
              </button>
            </div>
          </section>

          {/* WHY IT WORKS */}
          <section className="sec" style={{ paddingTop: 88 }}>
            <div className="sec-head rv">
              <h2 className="sec-title">{t('cf.whyWorks')} <span className="ac">{t('cf.itWorks')}</span></h2>
              <span className="mono sec-num">{t('cf.method')}</span>
            </div>
            <div className="cf-steps" style={{ gridTemplateColumns: 'repeat(3, 1fr)' }}>
              <div className="cf-step rv d0" style={{ padding: 0, borderLeft: 'none' }}>
                <h3>{t('cf.why1title')}</h3>
                <p>{t('cf.why1desc')}</p>
              </div>
              <div className="cf-step rv d1" style={{ padding: '0 26px', borderLeft: '1px solid var(--hair-soft)' }}>
                <h3>{t('cf.why2title')}</h3>
                <p>{t('cf.why2desc')}</p>
              </div>
              <div className="cf-step rv d2" style={{ padding: '0 26px', borderLeft: '1px solid var(--hair-soft)' }}>
                <h3>{t('cf.why3title')}</h3>
                <p>{t('cf.why3desc')}</p>
              </div>
            </div>
          </section>

          {/* FAQ */}
          <section className="sec" style={{ padding: '88px 0 0' }} aria-label="Domande frequenti">
            <div className="sec-head rv">
              <h2 className="sec-title">{t('home.sec6.h2a')} <span className="ac">{t('home.sec6.h2b')}</span></h2>
              <span className="mono sec-num">{t('cf.faqProduct')}</span>
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
                <span className="mono">{t('cf.readyToStart')}</span>
                <h3>{t('cf.readyCvTitle')}</h3>
                <p>{t('cf.readyCvSub')}</p>
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
