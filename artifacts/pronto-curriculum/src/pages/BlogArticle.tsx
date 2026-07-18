import React, { useEffect, useMemo, useRef, useState } from 'react';
import type { Page } from '../types';
import { BLOG_ARTICLES, BlogArticleData } from '../data/blogArticles';
import EditorialChrome, { useReveal, useSeoMeta } from '../components/EditorialChrome';

interface BlogArticleProps {
  slug?: string;
  onNavigate: (page: Page, slug?: string) => void;
}

const ARTICLE_CSS = `
/* Reading progress */
.pce .ba-progress { position: fixed; top: 0; left: 0; right: 0; height: 3px; z-index: 50; background: transparent; pointer-events: none; }
.pce .ba-progress i { display: block; height: 100%; width: 0; background: linear-gradient(90deg, var(--accent), var(--violet)); transition: width .1s linear; }

.pce .ba-head { padding: 64px 0 40px; max-width: 800px; }
.pce .ba-crumb { display: flex; align-items: center; gap: 10px; color: var(--ink-40); margin-bottom: 26px; flex-wrap: wrap; }
.pce .ba-crumb a { color: var(--ink-40); text-decoration: none; cursor: pointer; transition: color .2s; }
.pce .ba-crumb a:hover { color: var(--accent); }
.pce .ba-crumb b { color: var(--accent); font-weight: 500; }
.pce .ba-head h1 { font-family: var(--f-display); font-weight: 700; font-size: clamp(32px, 4.4vw, 54px); line-height: 1.02; letter-spacing: -0.035em; margin-bottom: 20px; }
.pce .ba-head .sub { font-size: 17px; color: var(--ink-60); line-height: 1.6; font-weight: 500; margin-bottom: 30px; }
.pce .ba-byline { display: flex; align-items: center; gap: 14px; border-top: 1px solid var(--hair-soft); border-bottom: 1px solid var(--hair-soft); padding: 16px 0; flex-wrap: wrap; }
.pce .ba-ava { width: 44px; height: 44px; border-radius: 50%; background: linear-gradient(120deg, #6FA5FF, #BE9CFF); color: #fff; display: flex; align-items: center; justify-content: center; font-family: var(--f-display); font-weight: 700; font-size: 14px; flex-shrink: 0; }
.pce .ba-byline b { font-size: 14px; font-weight: 700; display: block; line-height: 1.3; }
.pce .ba-byline span { font-size: 12px; color: var(--ink-40); display: block; }
.pce .ba-byline .meta { margin-left: auto; font-family: var(--f-mono); font-size: 10.5px; letter-spacing: 0.08em; text-transform: uppercase; color: var(--ink-40); }

/* Layout */
.pce .ba-layout { display: grid; grid-template-columns: minmax(0, 1fr) 280px; gap: 64px; align-items: start; padding-bottom: 40px; }
.pce .ba-main { max-width: 760px; min-width: 0; }

/* Takeaways */
.pce .ba-takeaways { border: 1px solid rgba(111, 140, 255, 0.35); background: rgba(111, 140, 255, 0.06); border-radius: 16px; padding: 26px 28px; margin: 36px 0 8px; }
.pce .ba-takeaways .mono { color: var(--accent); display: block; margin-bottom: 14px; }
.pce .ba-takeaways li { list-style: none; position: relative; padding-left: 26px; font-size: 14.5px; line-height: 1.6; color: var(--ink); margin-bottom: 10px; }
.pce .ba-takeaways li:last-child { margin-bottom: 0; }
.pce .ba-takeaways li::before { content: '→'; position: absolute; left: 0; top: 0; font-family: var(--f-mono); color: var(--accent); }

/* Body typography */
.pce .ba-section { padding-top: 44px; }
.pce .ba-section h2 { font-family: var(--f-display); font-weight: 700; font-size: clamp(22px, 2.4vw, 29px); letter-spacing: -0.025em; line-height: 1.15; margin-bottom: 18px; scroll-margin-top: 90px; }
.pce .ba-prose { font-size: 15.5px; color: var(--ink-60); line-height: 1.75; }
.pce .ba-prose p { margin-bottom: 16px; }
.pce .ba-prose b { color: var(--ink); font-weight: 700; }
.pce .ba-prose ul, .pce .ba-prose ol { margin: 0 0 16px 0; padding-left: 22px; }
.pce .ba-prose li { margin-bottom: 10px; }
.pce .ba-prose li::marker { color: var(--accent); }
.pce .ba-prose a { color: var(--accent); text-decoration: none; font-weight: 500; border-bottom: 1px solid rgba(47,42,229,0.25); transition: border-color .2s; }
.pce .ba-prose a:hover { border-color: var(--accent); }
.pce .ba-prose table { width: 100%; border-collapse: collapse; margin: 8px 0 20px; font-size: 13.5px; }
.pce .ba-prose th, .pce .ba-prose td { text-align: left; padding: 10px 14px; border-bottom: 1px solid var(--hair-soft); }
.pce .ba-prose th { font-family: var(--f-mono); font-size: 10.5px; letter-spacing: 0.1em; text-transform: uppercase; color: var(--ink-40); font-weight: 500; }

/* Callouts */
.pce .ba-callout { border-radius: 14px; padding: 22px 24px; margin: 24px 0 8px; border: 1px solid; }
.pce .ba-callout b.t { font-family: var(--f-display); font-weight: 700; font-size: 14.5px; letter-spacing: -0.01em; display: block; margin-bottom: 8px; color: var(--ink); }
.pce .ba-callout p { font-size: 13.5px; line-height: 1.65; color: var(--ink-60); margin: 0; }
.pce .ba-callout--tip { border-color: rgba(111, 140, 255, 0.35); background: rgba(111, 140, 255, 0.06); }
.pce .ba-callout--ats { border-color: rgba(124, 92, 255, 0.35); background: rgba(124, 92, 255, 0.06); }
.pce .ba-callout--warning { border-color: rgba(217, 119, 6, 0.3); background: rgba(217, 119, 6, 0.05); }
.pce .ba-callout--quote { border-color: var(--hair-soft); background: rgba(255,255,255,0.7); border-left: 3px solid var(--accent); font-style: normal; }
.pce .ba-callout .mono { display: block; margin-bottom: 8px; }
.pce .ba-callout--tip .mono, .pce .ba-callout--quote .mono { color: var(--accent); }
.pce .ba-callout--ats .mono { color: var(--violet); }
.pce .ba-callout--warning .mono { color: #B45309; }

/* Inline CTA */
.pce .ba-cta { border: 1px solid var(--hair-soft); background: #14171F; border-radius: 16px; padding: 28px 30px; margin: 36px 0 8px; display: flex; align-items: center; justify-content: space-between; gap: 24px; flex-wrap: wrap; position: relative; overflow: hidden; }
.pce .ba-cta::after { content: ''; position: absolute; width: 260px; height: 260px; border-radius: 50%; right: -80px; top: -110px; background: radial-gradient(circle, rgba(111,165,255,0.2) 0%, transparent 65%); }
.pce .ba-cta > * { position: relative; z-index: 1; }
.pce .ba-cta b { font-family: var(--f-display); font-weight: 700; font-size: 17px; letter-spacing: -0.015em; color: #F3F1EA; display: block; margin-bottom: 6px; }
.pce .ba-cta p { font-size: 13px; color: #A6ACBA; line-height: 1.6; margin: 0; max-width: 440px; }

/* Sidebar / TOC */
.pce .ba-side { position: sticky; top: 92px; }
.pce .ba-side .mono { color: var(--ink-40); display: block; margin-bottom: 14px; }
.pce .ba-toc { display: flex; flex-direction: column; border-left: 1px solid var(--hair-soft); }
.pce .ba-toc a { font-size: 13px; color: var(--ink-60); text-decoration: none; padding: 7px 0 7px 16px; line-height: 1.4; border-left: 2px solid transparent; margin-left: -1.5px; transition: color .2s, border-color .2s; }
.pce .ba-toc a:hover { color: var(--ink); }
.pce .ba-toc a.on { color: var(--accent); border-left-color: var(--accent); font-weight: 500; }
.pce .ba-side-cta { margin-top: 28px; border: 1px solid var(--hair-soft); background: rgba(255,255,255,0.8); backdrop-filter: blur(6px); border-radius: 14px; padding: 22px; }
.pce .ba-side-cta .mono { color: var(--accent); margin-bottom: 10px; }
.pce .ba-side-cta b { font-family: var(--f-display); font-weight: 700; font-size: 15.5px; letter-spacing: -0.015em; display: block; margin-bottom: 6px; }
.pce .ba-side-cta p { font-size: 12.5px; color: var(--ink-60); line-height: 1.55; margin-bottom: 16px; }

/* Author bio */
.pce .ba-bio { display: flex; gap: 18px; border: 1px solid var(--hair-soft); background: rgba(255,255,255,0.8); border-radius: 16px; padding: 26px 28px; margin-top: 48px; }
.pce .ba-bio .ba-ava { width: 54px; height: 54px; font-size: 17px; }
.pce .ba-bio b { font-family: var(--f-display); font-weight: 700; font-size: 15.5px; display: block; }
.pce .ba-bio .role { font-family: var(--f-mono); font-size: 10px; letter-spacing: 0.1em; text-transform: uppercase; color: var(--accent); display: block; margin: 4px 0 10px; }
.pce .ba-bio p { font-size: 13px; color: var(--ink-60); line-height: 1.65; margin: 0; }

/* Related */
.pce .ba-related { padding: 72px 0 88px; }
.pce .ba-rel-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 18px; }

@media (max-width: 900px) {
  .pce .ba-layout { grid-template-columns: 1fr; gap: 0; }
  .pce .ba-side { display: none; }
  .pce .ba-head { padding: 44px 0 28px; }
  .pce .ba-byline .meta { margin-left: 0; width: 100%; }
  .pce .ba-rel-grid { grid-template-columns: 1fr; }
  .pce .ba-cta { padding: 24px 22px; }
}
`;

function useReadingProgress() {
  const barRef = useRef<HTMLElement | null>(null);
  useEffect(() => {
    const onScroll = () => {
      const doc = document.documentElement;
      const total = doc.scrollHeight - doc.clientHeight;
      const p = total > 0 ? Math.min(1, doc.scrollTop / total) : 0;
      if (barRef.current) barRef.current.style.width = `${(p * 100).toFixed(1)}%`;
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener('scroll', onScroll);
  }, []);
  return barRef;
}

/** Scrollspy: highlights the TOC entry of the section currently in view. */
function useScrollSpy(ids: string[], slug?: string) {
  const [activeId, setActiveId] = useState<string | null>(null);
  useEffect(() => {
    const els = ids.map(id => document.getElementById(id)).filter(Boolean) as HTMLElement[];
    if (els.length === 0) return;
    const io = new IntersectionObserver(
      entries => {
        const visible = entries.filter(e => e.isIntersecting);
        if (visible.length > 0) setActiveId(visible[0].target.id);
      },
      { rootMargin: '-90px 0px -60% 0px' },
    );
    els.forEach(el => io.observe(el));
    return () => io.disconnect();
  }, [ids.join(','), slug]);
  return activeId;
}

export default function BlogArticle({ slug, onNavigate }: BlogArticleProps) {
  const article: BlogArticleData = useMemo(
    () => BLOG_ARTICLES.find(a => a.slug === slug) || BLOG_ARTICLES[0],
    [slug],
  );

  const relatedArticles = useMemo(() => {
    if (!article.relatedSlugs) return BLOG_ARTICLES.slice(0, 3);
    return BLOG_ARTICLES
      .filter(a => article.relatedSlugs.includes(a.slug) && a.slug !== article.slug)
      .slice(0, 3);
  }, [article]);

  useReveal(article.slug);
  useSeoMeta(`${article.title} | ProntoCurriculum`, article.metaDescription);
  const progressRef = useReadingProgress();
  const sectionIds = useMemo(() => article.sections.map(s => s.id), [article]);
  const activeSection = useScrollSpy(sectionIds, article.slug);

  useEffect(() => {
    window.scrollTo({ top: 0 });
  }, [slug]);

  // Internal links inside article HTML: <a data-page="..." data-slug="...">
  const handleBodyClick = (e: React.MouseEvent) => {
    const link = (e.target as HTMLElement).closest('a[data-page]');
    if (!link) return;
    e.preventDefault();
    const page = link.getAttribute('data-page') as Page;
    const linkSlug = link.getAttribute('data-slug') || undefined;
    onNavigate(page, linkSlug);
  };

  const jsonLd = useMemo(() => {
    const graph: object[] = [
      {
        '@type': 'Article',
        headline: article.title,
        description: article.metaDescription,
        datePublished: article.dateISO,
        inLanguage: 'it-IT',
        author: { '@type': 'Person', name: article.author.name, jobTitle: article.author.role },
        publisher: { '@type': 'Organization', name: 'ProntoCurriculum', url: 'https://prontocurriculum.it' },
      },
      {
        '@type': 'BreadcrumbList',
        itemListElement: [
          { '@type': 'ListItem', position: 1, name: 'Home', item: 'https://prontocurriculum.it/' },
          { '@type': 'ListItem', position: 2, name: 'Blog & Guide', item: 'https://prontocurriculum.it/blog' },
          { '@type': 'ListItem', position: 3, name: article.title },
        ],
      },
    ];
    if (article.faq && article.faq.length > 0) {
      graph.push({
        '@type': 'FAQPage',
        mainEntity: article.faq.map(f => ({
          '@type': 'Question',
          name: f.q,
          acceptedAnswer: { '@type': 'Answer', text: f.a },
        })),
      });
    }
    return { '@context': 'https://schema.org', '@graph': graph };
  }, [article]);

  return (
    <EditorialChrome onNavigate={onNavigate} active="blog">
      <style>{ARTICLE_CSS}</style>
      <div className="ba-progress" aria-hidden="true"><i ref={progressRef as React.RefObject<HTMLElement>} /></div>

      <main>
        <div className="shell">
          {/* HEADER */}
          <header className="ba-head">
            <div className="mono ba-crumb rv on">
              <a onClick={() => onNavigate('home')}>Home</a><b>/</b>
              <a onClick={() => onNavigate('blog')}>Blog & Guide</a><b>/</b>
              <span>{article.category}</span>
            </div>
            <h1 className="rv on d1">{article.title}</h1>
            <p className="sub rv on d2">{article.subtitle}</p>
            <div className="ba-byline rv on d2">
              <div className="ba-ava">{article.author.initials}</div>
              <div>
                <b>{article.author.name}</b>
                <span>{article.author.role}</span>
              </div>
              <span className="meta">{article.date} · {article.readTime}</span>
            </div>
          </header>

          {/* BODY + TOC */}
          <div className="ba-layout">
            <article className="ba-main" onClick={handleBodyClick}>
              {article.keyTakeaways.length > 0 && (
                <div className="ba-takeaways rv on d3">
                  <span className="mono">In sintesi</span>
                  <ul>
                    {article.keyTakeaways.map((point, i) => <li key={i}>{point}</li>)}
                  </ul>
                </div>
              )}

              {article.sections.map((section, idx) => (
                <section key={section.id} id={section.id} className="ba-section">
                  <h2>{section.title}</h2>
                  <div className="ba-prose" dangerouslySetInnerHTML={{ __html: section.content }} />

                  {section.callout && (
                    <div className={`ba-callout ba-callout--${section.callout.type || 'tip'}`}>
                      <span className="mono">
                        {section.callout.type === 'ats' ? 'Analisi ATS'
                          : section.callout.type === 'warning' ? 'Attenzione'
                          : section.callout.type === 'quote' ? 'Esempio'
                          : 'Consiglio pratico'}
                      </span>
                      <b className="t">{section.callout.title}</b>
                      <p>{section.callout.text}</p>
                    </div>
                  )}

                  {idx === 1 && (
                    <div className="ba-cta">
                      <div>
                        <b>Applica subito queste regole al tuo CV</b>
                        <p>
                          L'editor AI controlla keyword, struttura e punteggio ATS in tempo reale,
                          ed esporta un PDF impaginato alla perfezione in pochi minuti.
                        </p>
                      </div>
                      <button className="btn btn-ink" onClick={(e) => { e.stopPropagation(); onNavigate('builder-step1'); }}>
                        Crea il tuo CV gratis →
                      </button>
                    </div>
                  )}
                </section>
              ))}

              {/* FAQ */}
              {article.faq && article.faq.length > 0 && (
                <section className="ba-section" aria-label="Domande frequenti">
                  <h2>Domande frequenti</h2>
                  <div className="faq">
                    {article.faq.map(f => (
                      <details key={f.q}>
                        <summary>{f.q}</summary>
                        <p>{f.a}</p>
                      </details>
                    ))}
                  </div>
                </section>
              )}

              {/* AUTHOR BIO */}
              <div className="ba-bio">
                <div className="ba-ava">{article.author.initials}</div>
                <div>
                  <b>Scritto da {article.author.name}</b>
                  <span className="role">{article.author.role}</span>
                  <p>
                    Si occupa di selezione del personale, tecnologie HR e algoritmi ATS. Collabora con
                    università e agenzie per il lavoro italiane per definire gli standard del curriculum
                    e della lettera di presentazione.
                  </p>
                </div>
              </div>
            </article>

            {/* SIDEBAR */}
            <aside className="ba-side" aria-label="Indice dei contenuti">
              <span className="mono">Indice</span>
              <nav className="ba-toc">
                {article.sections.map(sec => (
                  <a
                    key={sec.id}
                    href={`#${sec.id}`}
                    className={activeSection === sec.id ? 'on' : ''}
                    onClick={(e) => {
                      e.preventDefault();
                      document.getElementById(sec.id)?.scrollIntoView({ behavior: 'smooth' });
                    }}
                  >
                    {sec.title}
                  </a>
                ))}
              </nav>
              <div className="ba-side-cta">
                <span className="mono">Editor ATS</span>
                <b>Il CV che supera i filtri</b>
                <p>Punteggio ATS in tempo reale e template verificati per il mercato italiano.</p>
                <button className="btn btn-ink btn-sm" style={{ width: '100%' }} onClick={() => onNavigate('builder-step1')}>
                  Prova il builder →
                </button>
              </div>
            </aside>
          </div>

          {/* RELATED */}
          {relatedArticles.length > 0 && (
            <section className="ba-related" aria-label="Articoli correlati">
              <div className="sec-head rv">
                <h2 className="sec-title">Continua a <span className="ac">leggere.</span></h2>
                <span className="mono sec-num">Articoli correlati</span>
              </div>
              <div className="ba-rel-grid">
                {relatedArticles.map((rel, i) => (
                  <article
                    key={rel.slug}
                    className={`bh-card rv${i === 1 ? ' d1' : i === 2 ? ' d2' : ''}`}
                    onClick={() => onNavigate('blog-article', rel.slug)}
                  >
                    <div className="bh-card__top">
                      <span className="bh-card__cat">{rel.category}</span>
                      <span className="bh-card__time">{rel.readTime}</span>
                    </div>
                    <h3>{rel.title}</h3>
                    <p>{rel.subtitle}</p>
                    <div className="bh-card__foot">
                      <div className="bh-card__author">
                        <div className="bh-ava bh-ava--sm">{rel.author.initials}</div>
                        <div>
                          <b>{rel.author.name}</b>
                          <span>{rel.date}</span>
                        </div>
                      </div>
                      <span className="bh-card__arrow">→</span>
                    </div>
                  </article>
                ))}
              </div>
            </section>
          )}
        </div>
      </main>

      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
    </EditorialChrome>
  );
}
