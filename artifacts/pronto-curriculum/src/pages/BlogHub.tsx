import React, { useState, useMemo, useEffect } from 'react';
import type { Page } from '../types';
import { BLOG_ARTICLES, BlogArticleData } from '../data/blogArticles';
import BrandLogo from '../components/BrandLogo';

interface BlogHubProps {
  onNavigate: (page: Page, slug?: string) => void;
}

export default function BlogHub({ onNavigate }: BlogHubProps) {
  const [selectedCategory, setSelectedCategory] = useState<string>('TUTTI GLI ARTICOLI');
  const [searchQuery, setSearchQuery] = useState('');
  const [emailInput, setEmailInput] = useState('');
  const [subscribed, setSubscribed] = useState(false);

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  const categories = useMemo(() => {
    const set = new Set<string>();
    BLOG_ARTICLES.forEach(a => set.add(a.category));
    return ['TUTTI GLI ARTICOLI', ...Array.from(set)];
  }, []);

  const featuredArticle = useMemo(() => {
    return BLOG_ARTICLES.find(a => a.featured) || BLOG_ARTICLES[0];
  }, []);

  const filteredArticles = useMemo(() => {
    return BLOG_ARTICLES.filter(article => {
      const matchesCategory = selectedCategory === 'TUTTI GLI ARTICOLI' || article.category === selectedCategory;
      const matchesSearch = searchQuery.trim() === '' || 
        article.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        article.subtitle.toLowerCase().includes(searchQuery.toLowerCase()) ||
        article.author.name.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesCategory && matchesSearch;
    });
  }, [selectedCategory, searchQuery]);

  const handleSubscribe = (e: React.FormEvent) => {
    e.preventDefault();
    if (!emailInput || !emailInput.includes('@')) {
      alert('Inserisci un indirizzo email valido.');
      return;
    }
    setSubscribed(true);
  };

  return (
    <div className="sf-blog-page">
      {/* Top Navigation Bar */}
      <header className="sf-blog-header">
        <div className="sf-blog-header__inner">
          <div className="sf-blog-header__brand" onClick={() => onNavigate('home')}>
            <BrandLogo iconSize={36} fontSize={19} />
            <span className="sf-blog-header__tagline">BLOG & RISORSE PER LA CARRIERA</span>
          </div>
          <div className="sf-blog-header__actions">
            <button className="btn btn-ghost btn-sm" onClick={() => onNavigate('home')}>
              ← Torna al Builder
            </button>
            <button className="btn btn-gold btn-sm" onClick={() => onNavigate('builder-step1')}>
              Crea il tuo CV Ora
            </button>
          </div>
        </div>
      </header>

      {/* Featured / Spotlight Hero Section (Salesforce Signature Layout) */}
      <section className="sf-hero">
        <div className="sf-hero__inner">
          <div className="sf-hero__split">
            <div className="sf-hero__content">
              <div className="sf-hero__badge mono">IN EVIDENZA · {featuredArticle.category}</div>
              <h1 className="sf-hero__title" onClick={() => onNavigate('blog-article', featuredArticle.slug)}>
                {featuredArticle.title}
              </h1>
              <p className="sf-hero__subtitle">{featuredArticle.subtitle}</p>
              
              <div className="sf-hero__meta">
                <div className="sf-author__avatar mono">{featuredArticle.author.initials}</div>
                <div className="sf-author__info">
                  <span className="sf-author__name">{featuredArticle.author.name}</span>
                  <span className="sf-author__role">{featuredArticle.author.role}</span>
                </div>
                <div className="sf-meta__dots">·</div>
                <span className="sf-meta__readtime">{featuredArticle.readTime}</span>
              </div>

              <div className="sf-hero__cta-group">
                <button 
                  className="btn btn-gold btn-lg" 
                  onClick={() => onNavigate('blog-article', featuredArticle.slug)}
                >
                  Leggi l'articolo in evidenza →
                </button>
              </div>
            </div>

            <div className="sf-hero__visual" onClick={() => onNavigate('blog-article', featuredArticle.slug)}>
              <div className="sf-hero__visual-card">
                <div className="sf-visual__tag">🎯 FOCUS SELEZIONE ATS</div>
                <div className="sf-visual__quote">
                  "Nel 2026, la differenza tra un CV scartato e una convocazione a colloquio sta nei primi 6 secondi di lettura algoritmica."
                </div>
                <div className="sf-visual__stats">
                  <div className="sf-stat-box">
                    <span className="sf-stat-num">75%</span>
                    <span className="sf-stat-label">CV filtrati da ATS</span>
                  </div>
                  <div className="sf-stat-box">
                    <span className="sf-stat-num">6 sec</span>
                    <span className="sf-stat-label">Tempo medio recruiter</span>
                  </div>
                  <div className="sf-stat-box">
                    <span className="sf-stat-num">+85%</span>
                    <span className="sf-stat-label">Colloqui con Tailoring</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Category Tabs & Search Bar */}
      <section className="sf-filter-section">
        <div className="sf-filter__inner">
          <div className="sf-category-tabs">
            {categories.map((cat) => (
              <button
                key={cat}
                className={`sf-cat-tab ${selectedCategory === cat ? 'sf-cat-tab--active' : ''}`}
                onClick={() => setSelectedCategory(cat)}
              >
                {cat}
              </button>
            ))}
          </div>

          <div className="sf-search-box">
            <span className="sf-search-icon">🔍</span>
            <input
              type="text"
              className="sf-search-input"
              placeholder="Cerca guide, consigli o parole chiave..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            {searchQuery && (
              <button className="sf-search-clear" onClick={() => setSearchQuery('')}>×</button>
            )}
          </div>
        </div>
      </section>

      {/* Articles Grid (Salesforce Card Architecture) */}
      <main className="sf-grid-section">
        <div className="sf-grid__inner">
          {filteredArticles.length === 0 ? (
            <div className="sf-empty-state">
              <h3>Nessun articolo trovato per "{searchQuery}"</h3>
              <p>Prova a cercare una parola chiave diversa o seleziona una categoria differente.</p>
              <button className="btn btn-line btn-sm" onClick={() => { setSearchQuery(''); setSelectedCategory('TUTTI GLI ARTICOLI'); }}>
                Reset filtri
              </button>
            </div>
          ) : (
            <div className="sf-articles-grid">
              {filteredArticles.map((article) => (
                <article key={article.slug} className="sf-card" onClick={() => onNavigate('blog-article', article.slug)}>
                  <div className="sf-card__top">
                    <span className="sf-card__category">{article.category}</span>
                    <span className="sf-card__readtime">{article.readTime}</span>
                  </div>

                  <h3 className="sf-card__title">{article.title}</h3>
                  <p className="sf-card__excerpt">{article.subtitle}</p>

                  {article.keyTakeaways && article.keyTakeaways.length > 0 && (
                    <div className="sf-card__highlight">
                      💡 {article.keyTakeaways[0]}
                    </div>
                  )}

                  <div className="sf-card__footer">
                    <div className="sf-author-mini">
                      <div className="sf-author__avatar--mini mono">{article.author.initials}</div>
                      <div className="sf-author__details">
                        <span className="sf-author__name--mini">{article.author.name}</span>
                        <span className="sf-author__date--mini">{article.date}</span>
                      </div>
                    </div>
                    <span className="sf-card__arrow">→</span>
                  </div>
                </article>
              ))}
            </div>
          )}
        </div>
      </main>

      {/* Signature Salesforce-Style Newsletter Banner */}
      <section className="sf-newsletter">
        <div className="sf-newsletter__inner">
          <div className="sf-newsletter__content">
            <div className="sf-newsletter__badge mono">NEWSLETTER DI CARRIERA</div>
            <h2>I segreti dei Recruiter direttamente nella tua casella email</h2>
            <p>
              Ogni martedì inviamo un riassunto esclusivo di 3 minuti con strategie per superare i colloqui, modelli CV di tendenza e aggiornamenti sugli algoritmi ATS. Unisciti a oltre 14.000 candidati in Italia.
            </p>
          </div>

          <div className="sf-newsletter__form-wrapper">
            {subscribed ? (
              <div className="sf-newsletter__success">
                <span style={{ fontSize: 28 }}>🎉</span>
                <div>
                  <h4>Iscrizione completata con successo!</h4>
                  <p>Controlla la tua casella di posta per confermare l'indirizzo e scaricare il kit gratuito di 5 modelli CV.</p>
                </div>
              </div>
            ) : (
              <form className="sf-newsletter__form" onSubmit={handleSubscribe}>
                <input
                  type="email"
                  className="sf-newsletter__input"
                  placeholder="La tua email professionale (es. mario.rossi@email.it)"
                  value={emailInput}
                  onChange={(e) => setEmailInput(e.target.value)}
                  required
                />
                <button type="submit" className="btn btn-gold sf-newsletter__btn">
                  Iscriviti Gratis →
                </button>
              </form>
            )}
            <span className="sf-newsletter__privacy">
              🔒 100% gratuito. Nessuno spam. Puoi cancellarti in qualsiasi momento con un clic.
            </span>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="sf-blog-footer">
        <div className="sf-blog-footer__inner">
          <div className="sf-footer__left">
            <BrandLogo onClick={() => onNavigate('home')} iconSize={30} fontSize={16} style={{ marginBottom: 8 }} />
            <p>© {new Date().getFullYear()} ProntoCurriculum. Il punto di riferimento per il CV scientifico e certificato ATS in Italia.</p>
          </div>
          <div className="sf-footer__links">
            <a href="#" onClick={(e) => { e.preventDefault(); onNavigate('privacy'); }}>Privacy Policy</a>
            <a href="#" onClick={(e) => { e.preventDefault(); onNavigate('terms'); }}>Termini di Servizio</a>
            <a href="#" onClick={(e) => { e.preventDefault(); onNavigate('cookie'); }}>Cookie Policy</a>
            <a href="mailto:info@prontocurriculum.it">Contatti Redazione</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
