import React, { useEffect } from 'react';
import type { Page } from '../types';
import { BLOG_ARTICLES, BlogArticleData } from '../data/blogArticles';
import BrandLogo from '../components/BrandLogo';

interface BlogArticleProps {
  slug?: string;
  onNavigate: (page: Page, slug?: string) => void;
}

export default function BlogArticle({ slug, onNavigate }: BlogArticleProps) {
  const article: BlogArticleData = React.useMemo(() => {
    return BLOG_ARTICLES.find(a => a.slug === slug) || BLOG_ARTICLES[0];
  }, [slug]);

  const relatedArticles = React.useMemo(() => {
    if (!article.relatedSlugs) return BLOG_ARTICLES.slice(0, 3);
    return BLOG_ARTICLES.filter(a => article.relatedSlugs.includes(a.slug) && a.slug !== article.slug).slice(0, 3);
  }, [article]);

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [slug]);

  return (
    <div className="sf-blog-page">
      {/* Sticky Navigation Bar */}
      <header className="sf-blog-header">
        <div className="sf-blog-header__inner">
          <div className="sf-blog-header__brand" onClick={() => onNavigate('blog')}>
            <BrandLogo iconSize={36} fontSize={19} />
            <span className="sf-blog-header__tagline">BLOG & RISORSE</span>
          </div>
          <div className="sf-blog-header__actions">
            <button className="btn btn-ghost btn-sm" onClick={() => onNavigate('blog')}>
              ← Tutti gli articoli
            </button>
            <button className="btn btn-gold btn-sm" onClick={() => onNavigate('builder-step1')}>
              Crea CV con AI
            </button>
          </div>
        </div>
      </header>

      <div className="sf-article-layout">
        {/* Main Article Container */}
        <main className="sf-article-main">
          {/* Article Header Bar */}
          <div className="sf-article__meta-header">
            <span className="sf-card__category">{article.category}</span>
            <span className="sf-meta__readtime">⏱️ {article.readTime}</span>
            <span className="sf-meta__readtime">📅 {article.date}</span>
          </div>

          <h1 className="sf-article__title">{article.title}</h1>
          <p className="sf-article__subtitle">{article.subtitle}</p>

          {/* Author Profile Bar */}
          <div className="sf-article__author-bar">
            <div className="sf-author__avatar mono">{article.author.initials}</div>
            <div className="sf-author__info">
              <span className="sf-author__name">{article.author.name}</span>
              <span className="sf-author__role">{article.author.role}</span>
            </div>
          </div>

          {/* Salesforce Signature Box: Key Takeaways / Punti Chiave */}
          {article.keyTakeaways && article.keyTakeaways.length > 0 && (
            <div className="sf-takeaways-box">
              <div className="sf-takeaways__header">
                <span className="sf-takeaways__icon">⚡</span>
                <h4>Punti Chiave (In Sintesi)</h4>
              </div>
              <ul className="sf-takeaways__list">
                {article.keyTakeaways.map((point, index) => (
                  <li key={index}>{point}</li>
                ))}
              </ul>
            </div>
          )}

          {/* Article Sections */}
          <div className="sf-article__body">
            {article.sections.map((section, idx) => (
              <section key={section.id || idx} id={section.id} className="sf-article__section">
                <h2>{section.title}</h2>
                <div 
                  className="sf-article__content-html"
                  dangerouslySetInnerHTML={{ __html: section.content }} 
                />

                {section.callout && (
                  <div className={`sf-article-callout sf-callout--${section.callout.type || 'tip'}`}>
                    <div className="sf-callout__title">
                      {section.callout.type === 'ats' ? '⚡ ' : section.callout.type === 'quote' ? '💬 ' : '💡 '}
                      {section.callout.title}
                    </div>
                    <p className="sf-callout__text">{section.callout.text}</p>
                  </div>
                )}

                {/* Mid-Article Interactive Conversion Box after Section 2 */}
                {idx === 1 && (
                  <div className="sf-inline-cta">
                    <div className="sf-inline-cta__text">
                      <h4>🚀 Vuoi applicare subito queste regole al tuo CV?</h4>
                      <p>Il nostro editor AI controlla la densità di parole chiave, impagina il testo secondo la singola pagina A4 ed esporta in PDF e Word (.docx) nitidi in 5 minuti.</p>
                    </div>
                    <button className="btn btn-gold btn-md" onClick={() => onNavigate('builder-step1')}>
                      Inizia ora dal modello Modern →
                    </button>
                  </div>
                )}
              </section>
            ))}
          </div>

          {/* Author Bottom Bio Box */}
          <div className="sf-author-bio-box">
            <div className="sf-author__avatar--large mono">{article.author.initials}</div>
            <div className="sf-author-bio__content">
              <h4>Scritto da {article.author.name}</h4>
              <p className="sf-author-bio__role">{article.author.role}</p>
              <p className="sf-author-bio__desc">
                Esperto/a di selezione del personale, tecnologie HR e algoritmi ATS. Collabora regolarmente con le principali università e agenzie per il lavoro italiane per definire i nuovi standard del curriculum vitae e della lettera di presentazione.
              </p>
            </div>
          </div>
        </main>

        {/* Sticky Table of Contents Sidebar (Salesforce Layout Right) */}
        <aside className="sf-article-sidebar">
          <div className="sf-sidebar__sticky">
            <h4 className="sf-sidebar__title">Indice dei Contenuti</h4>
            <nav className="sf-toc">
              {article.sections.map((sec, idx) => (
                <a key={sec.id || idx} href={`#${sec.id}`} className="sf-toc__link">
                  {sec.title}
                </a>
              ))}
            </nav>

            <div className="sf-sidebar__cta-widget">
              <div className="sf-widget__badge mono">EDITOR ATS</div>
              <h5>Crea il tuo CV perfetto ora</h5>
              <p>Compatibilità 100% con i software di selezione delle aziende italiane.</p>
              <button className="btn btn-gold btn-sm sf-widget__btn" onClick={() => onNavigate('builder-step1')}>
                Prova il Builder AI →
              </button>
            </div>
          </div>
        </aside>
      </div>

      {/* Related Articles Section (Articoli Correlati) */}
      {relatedArticles.length > 0 && (
        <section className="sf-related-section">
          <div className="sf-related__inner">
            <h2 className="sf-related__title">Articoli Correlati e Guide Approfondite</h2>
            <div className="sf-articles-grid">
              {relatedArticles.map((rel) => (
                <article key={rel.slug} className="sf-card" onClick={() => onNavigate('blog-article', rel.slug)}>
                  <div className="sf-card__top">
                    <span className="sf-card__category">{rel.category}</span>
                    <span className="sf-card__readtime">{rel.readTime}</span>
                  </div>
                  <h3 className="sf-card__title">{rel.title}</h3>
                  <p className="sf-card__excerpt">{rel.subtitle}</p>
                  <div className="sf-card__footer">
                    <div className="sf-author-mini">
                      <div className="sf-author__avatar--mini mono">{rel.author.initials}</div>
                      <span className="sf-author__name--mini">{rel.author.name}</span>
                    </div>
                    <span className="sf-card__arrow">→</span>
                  </div>
                </article>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Footer */}
      <footer className="sf-blog-footer">
        <div className="sf-blog-footer__inner">
          <div className="sf-footer__left">
            <BrandLogo onClick={() => onNavigate('home')} iconSize={30} fontSize={16} style={{ marginBottom: 8 }} />
            <p>© {new Date().getFullYear()} ProntoCurriculum. Il punto di riferimento per il CV scientifico e certificato ATS in Italia.</p>
          </div>
          <div className="sf-footer__links">
            <a href="#" onClick={(e) => { e.preventDefault(); onNavigate('blog'); }}>Tutti gli articoli</a>
            <a href="#" onClick={(e) => { e.preventDefault(); onNavigate('privacy'); }}>Privacy Policy</a>
            <a href="#" onClick={(e) => { e.preventDefault(); onNavigate('terms'); }}>Termini di Servizio</a>
            <a href="#" onClick={(e) => { e.preventDefault(); onNavigate('cookie'); }}>Cookie Policy</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
