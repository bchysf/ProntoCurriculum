import React, { useState, useMemo } from 'react';
import type { Page } from '../types';
import { BLOG_ARTICLES } from '../data/blogArticles';
import EditorialChrome, { useReveal, useSeoMeta } from '../components/EditorialChrome';

interface BlogHubProps {
  onNavigate: (page: Page, slug?: string) => void;
}

const HUB_CSS = `
.pce .bh-hero { padding: 72px 0 64px; }
.pce .bh-eyebrow { color: var(--ink-40); margin-bottom: 26px; }
.pce .bh-eyebrow b { color: var(--accent); font-weight: 500; }
.pce .bh-hero h1 { font-family: var(--f-display); font-weight: 700; font-size: clamp(40px, 5.4vw, 76px); line-height: 0.98; letter-spacing: -0.04em; max-width: 900px; }
.pce .bh-hero .sub { font-size: 16.5px; color: var(--ink-60); max-width: 520px; line-height: 1.65; margin-top: 24px; font-weight: 500; }

/* Featured article */
.pce .bh-featured { display: grid; grid-template-columns: 1.15fr 0.85fr; gap: 0; border: 1px solid var(--hair-soft); border-radius: 20px; overflow: hidden; background: rgba(255,255,255,0.8); backdrop-filter: blur(6px); margin-top: 56px; cursor: pointer; transition: transform .35s var(--ease), box-shadow .35s var(--ease); }
.pce .bh-featured:hover { transform: translateY(-4px); box-shadow: 0 24px 60px -28px rgba(60, 70, 180, 0.28); }
.pce .bh-featured__body { padding: 44px 48px; display: flex; flex-direction: column; align-items: flex-start; }
.pce .bh-featured__body .mono { color: var(--accent); margin-bottom: 18px; }
.pce .bh-featured__body h2 { font-family: var(--f-display); font-weight: 700; font-size: clamp(24px, 2.6vw, 34px); letter-spacing: -0.03em; line-height: 1.1; margin-bottom: 14px; }
.pce .bh-featured__body p { font-size: 14.5px; color: var(--ink-60); line-height: 1.65; margin-bottom: 24px; }
.pce .bh-featured__meta { display: flex; align-items: center; gap: 12px; margin-bottom: 26px; }
.pce .bh-featured__visual { background: #14171F; padding: 44px 40px; display: flex; flex-direction: column; justify-content: center; gap: 22px; position: relative; overflow: hidden; }
.pce .bh-featured__visual::after { content: ''; position: absolute; width: 340px; height: 340px; border-radius: 50%; right: -120px; bottom: -140px; background: radial-gradient(circle, rgba(111,165,255,0.22) 0%, transparent 65%); }
.pce .bh-quote { font-family: var(--f-display); font-weight: 600; font-size: 19px; letter-spacing: -0.01em; line-height: 1.4; color: #F3F1EA; position: relative; z-index: 1; }
.pce .bh-quote i { font-style: normal; background: linear-gradient(96deg, #6FA5FF, #BE9CFF); -webkit-background-clip: text; background-clip: text; color: transparent; }
.pce .bh-stats { display: flex; gap: 12px; position: relative; z-index: 1; }
.pce .bh-stat { flex: 1; border: 1px solid rgba(255,255,255,0.1); border-radius: 12px; padding: 14px 12px; }
.pce .bh-stat b { display: block; font-family: var(--f-display); font-weight: 700; font-size: 22px; letter-spacing: -0.02em; background: linear-gradient(120deg, #6FA5FF, #BE9CFF); -webkit-background-clip: text; background-clip: text; color: transparent; }
.pce .bh-stat span { font-family: var(--f-mono); font-size: 9.5px; letter-spacing: 0.08em; text-transform: uppercase; color: #8A8F9C; display: block; margin-top: 5px; line-height: 1.4; }

/* Featured meta */
.pce .bh-meta-name { font-weight: 700; font-size: 13.5px; line-height: 1.25; }
.pce .bh-meta-role { font-size: 12px; color: var(--ink-40); line-height: 1.35; }

/* Filters */
.pce .bh-filters { display: flex; align-items: center; justify-content: space-between; gap: 20px; flex-wrap: wrap; border-top: 1px solid var(--hair); padding-top: 18px; margin-bottom: 40px; }
.pce .bh-tabs { display: flex; gap: 8px; flex-wrap: wrap; }
.pce .bh-tab { font-family: var(--f-mono); font-size: 10.5px; letter-spacing: 0.1em; text-transform: uppercase; border: 1px solid var(--hair); border-radius: 99px; padding: 8px 15px; background: transparent; color: var(--ink-60); cursor: pointer; transition: all .25s var(--ease); }
.pce .bh-tab:hover { border-color: var(--accent); color: var(--accent); }
.pce .bh-tab--on { background: var(--accent); border-color: var(--accent); color: #fff; }
.pce .bh-search { position: relative; }
.pce .bh-search input { font-family: var(--f-body); font-size: 13.5px; border: 1px solid var(--hair); border-radius: 10px; padding: 10px 34px 10px 14px; width: 250px; background: rgba(255,255,255,0.85); color: var(--ink); outline: none; transition: border-color .2s, box-shadow .2s; }
.pce .bh-search input:focus { border-color: var(--accent); box-shadow: 0 0 0 3px rgba(47,42,229,0.1); }
.pce .bh-search input::placeholder { color: var(--ink-40); }
.pce .bh-search .clr { position: absolute; right: 10px; top: 50%; transform: translateY(-50%); border: none; background: none; color: var(--ink-40); font-size: 16px; cursor: pointer; padding: 2px 4px; }

/* Article grid (card styles shared via EditorialChrome) */
.pce .bh-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 18px; }
.pce .bh-empty { text-align: center; padding: 72px 20px; border: 1px dashed var(--hair); border-radius: 16px; }
.pce .bh-empty h3 { font-family: var(--f-display); font-weight: 600; font-size: 19px; margin-bottom: 8px; }
.pce .bh-empty p { font-size: 13.5px; color: var(--ink-60); margin-bottom: 20px; }

/* Newsletter */
.pce .bh-news { background: #14171F; border-radius: 20px; padding: 52px 48px; display: grid; grid-template-columns: 1.1fr 0.9fr; gap: 44px; align-items: center; position: relative; overflow: hidden; }
.pce .bh-news::after { content: ''; position: absolute; width: 420px; height: 420px; border-radius: 50%; left: -140px; top: -180px; background: radial-gradient(circle, rgba(124,92,255,0.25) 0%, transparent 65%); }
.pce .bh-news > * { position: relative; z-index: 1; }
.pce .bh-news .mono { color: #9DB6FF; display: block; margin-bottom: 16px; }
.pce .bh-news h2 { font-family: var(--f-display); font-weight: 700; font-size: clamp(22px, 2.6vw, 32px); letter-spacing: -0.03em; line-height: 1.1; color: #F3F1EA; margin-bottom: 12px; }
.pce .bh-news p { font-size: 14px; color: #A6ACBA; line-height: 1.65; }
.pce .bh-news form { display: flex; gap: 10px; }
.pce .bh-news input { flex: 1; font-family: var(--f-body); font-size: 14px; border: 1px solid rgba(255,255,255,0.16); border-radius: 10px; padding: 13px 16px; background: rgba(255,255,255,0.06); color: #F3F1EA; outline: none; transition: border-color .2s; min-width: 0; }
.pce .bh-news input::placeholder { color: #6A707E; }
.pce .bh-news input:focus { border-color: #8F8CFF; }
.pce .bh-news .priv { font-family: var(--f-mono); font-size: 10px; letter-spacing: 0.05em; color: #6A707E; display: block; margin-top: 12px; }
.pce .bh-news .ok { display: flex; align-items: center; gap: 14px; color: #F3F1EA; }
.pce .bh-news .ok .ck { width: 42px; height: 42px; border-radius: 50%; background: linear-gradient(120deg, #6FA5FF, #BE9CFF); display: flex; align-items: center; justify-content: center; font-size: 18px; flex-shrink: 0; }
.pce .bh-news .ok b { font-family: var(--f-display); font-size: 15.5px; display: block; margin-bottom: 3px; }
.pce .bh-news .ok span { font-size: 12.5px; color: #A6ACBA; line-height: 1.5; }

@media (max-width: 900px) {
  .pce .bh-hero { padding: 48px 0 48px; }
  .pce .bh-featured { grid-template-columns: 1fr; }
  .pce .bh-featured__body { padding: 30px 26px; }
  .pce .bh-featured__visual { padding: 30px 26px; }
  .pce .bh-grid { grid-template-columns: 1fr; }
  .pce .bh-search input { width: 100%; }
  .pce .bh-search { width: 100%; }
  .pce .bh-news { grid-template-columns: 1fr; padding: 36px 26px; gap: 28px; }
  .pce .bh-news form { flex-direction: column; }
}
`;

export default function BlogHub({ onNavigate }: BlogHubProps) {
  const [selectedCategory, setSelectedCategory] = useState<string>('TUTTI');
  const [searchQuery, setSearchQuery] = useState('');
  const [emailInput, setEmailInput] = useState('');
  const [subscribed, setSubscribed] = useState(false);

  useReveal();
  useSeoMeta(
    'Blog & Guide Carriera — CV, ATS, Colloqui e Stipendi | ProntoCurriculum',
    'Guide pratiche su curriculum, punteggio ATS, lettera di presentazione, colloqui e mercato del lavoro in Italia, scritte dal team di ProntoCurriculum.',
    '/blog',
  );

  const categories = useMemo(() => {
    const set = new Set<string>();
    BLOG_ARTICLES.forEach(a => set.add(a.category));
    return ['TUTTI', ...Array.from(set)];
  }, []);

  const featuredArticle = useMemo(() => BLOG_ARTICLES.find(a => a.featured) || BLOG_ARTICLES[0], []);

  const filteredArticles = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return BLOG_ARTICLES.filter(article => {
      const matchesCategory = selectedCategory === 'TUTTI' || article.category === selectedCategory;
      const matchesSearch = q === '' ||
        article.title.toLowerCase().includes(q) ||
        article.subtitle.toLowerCase().includes(q) ||
        article.author.name.toLowerCase().includes(q);
      return matchesCategory && matchesSearch;
    });
  }, [selectedCategory, searchQuery]);

  const handleSubscribe = (e: React.FormEvent) => {
    e.preventDefault();
    if (!emailInput || !emailInput.includes('@')) return;
    setSubscribed(true);
  };

  return (
    <EditorialChrome onNavigate={onNavigate} active="blog">
      <style>{HUB_CSS}</style>
      <main>
        <div className="shell">
          {/* HERO + FEATURED */}
          <section className="bh-hero">
            <div className="mono bh-eyebrow rv on">Blog & Guide <b>·</b> Risorse per la carriera</div>
            <h1 className="rv on d1">Leggi oggi, <span className="grad">firmi domani.</span></h1>
            <p className="sub rv on d2">
              Guide pratiche su CV, algoritmi ATS, colloqui e stipendi — scritte da chi
              seleziona candidati ogni giorno, senza fuffa motivazionale.
            </p>

            <article
              className="bh-featured rv on d2"
              onClick={() => onNavigate('blog-article', featuredArticle.slug)}
              aria-label={`Articolo in evidenza: ${featuredArticle.title}`}
            >
              <div className="bh-featured__body">
                <span className="mono">In evidenza · {featuredArticle.category}</span>
                <h2>{featuredArticle.title}</h2>
                <p>{featuredArticle.subtitle}</p>
                <div className="bh-featured__meta">
                  <div className="bh-ava">{featuredArticle.author.initials}</div>
                  <div>
                    <div className="bh-meta-name">{featuredArticle.author.name}</div>
                    <div className="bh-meta-role">{featuredArticle.author.role} · {featuredArticle.readTime}</div>
                  </div>
                </div>
                <button className="btn btn-ink">Leggi l'articolo →</button>
              </div>
              <div className="bh-featured__visual" aria-hidden="true">
                <div className="bh-quote">
                  "La differenza tra un CV scartato e una convocazione sta nei primi <i>6 secondi</i> di lettura."
                </div>
                <div className="bh-stats">
                  <div className="bh-stat"><b>75%</b><span>CV filtrati da ATS</span></div>
                  <div className="bh-stat"><b>6 sec</b><span>Prima scansione recruiter</span></div>
                  <div className="bh-stat"><b>+85%</b><span>Colloqui col tailoring</span></div>
                </div>
              </div>
            </article>
          </section>

          {/* FILTERS */}
          <section aria-label="Filtra gli articoli">
            <div className="bh-filters rv">
              <div className="bh-tabs" role="tablist" aria-label="Categorie">
                {categories.map(cat => (
                  <button
                    key={cat}
                    role="tab"
                    aria-selected={selectedCategory === cat}
                    className={`bh-tab${selectedCategory === cat ? ' bh-tab--on' : ''}`}
                    onClick={() => setSelectedCategory(cat)}
                  >
                    {cat === 'TUTTI' ? 'Tutti gli articoli' : cat}
                  </button>
                ))}
              </div>
              <div className="bh-search">
                <input
                  type="text"
                  placeholder="Cerca guide o parole chiave…"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  aria-label="Cerca articoli"
                />
                {searchQuery && <button className="clr" onClick={() => setSearchQuery('')} aria-label="Cancella ricerca">×</button>}
              </div>
            </div>

            {/* GRID */}
            {filteredArticles.length === 0 ? (
              <div className="bh-empty rv on">
                <h3>Nessun articolo trovato{searchQuery ? ` per "${searchQuery}"` : ''}</h3>
                <p>Prova con una parola chiave diversa o cambia categoria.</p>
                <button className="btn btn-line btn-sm" onClick={() => { setSearchQuery(''); setSelectedCategory('TUTTI'); }}>
                  Reset filtri
                </button>
              </div>
            ) : (
              <div className="bh-grid">
                {filteredArticles.map((article, i) => (
                  <article
                    key={article.slug}
                    className={`bh-card rv${i % 3 === 1 ? ' d1' : i % 3 === 2 ? ' d2' : ''}`}
                    onClick={() => onNavigate('blog-article', article.slug)}
                  >
                    <div className="bh-card__top">
                      <span className="bh-card__cat">{article.category}</span>
                      <span className="bh-card__time">{article.readTime}</span>
                    </div>
                    <h3>{article.title}</h3>
                    <p>{article.subtitle}</p>
                    <div className="bh-card__foot">
                      <div className="bh-card__author">
                        <div className="bh-ava bh-ava--sm">{article.author.initials}</div>
                        <div>
                          <b>{article.author.name}</b>
                          <span>{article.date}</span>
                        </div>
                      </div>
                      <span className="bh-card__arrow">→</span>
                    </div>
                  </article>
                ))}
              </div>
            )}
          </section>

          {/* CALCOLATORE CTA */}
          <section style={{ padding: '72px 0 0' }} aria-label="Calcolatore stipendio netto">
            <div className="cta-band rv">
              <div>
                <span className="mono">Strumenti gratuiti</span>
                <h3>Quanto vale davvero quella RAL?</h3>
                <p>
                  Stai valutando un'offerta? Trasforma il lordo annuo in netto mensile con aliquote IRPEF,
                  esonero contributivo e addizionali regionali aggiornate al 2026.
                </p>
              </div>
              <button className="btn btn-ink" onClick={() => onNavigate('calcolo-stipendio')}>
                Calcola lo stipendio netto →
              </button>
            </div>
          </section>

          {/* NEWSLETTER */}
          <section style={{ padding: '28px 0 88px' }} aria-label="Newsletter">
            <div className="bh-news rv">
              <div>
                <span className="mono">Newsletter di carriera</span>
                <h2>I segreti dei recruiter, ogni martedì nella tua inbox.</h2>
                <p>
                  Un riassunto di 3 minuti con strategie per i colloqui, modelli CV di tendenza e
                  aggiornamenti sugli algoritmi ATS. Oltre 14.000 iscritti in Italia.
                </p>
              </div>
              <div>
                {subscribed ? (
                  <div className="ok">
                    <span className="ck">✓</span>
                    <div>
                      <b>Iscrizione completata!</b>
                      <span>Controlla la posta per confermare l'indirizzo e scaricare il kit di 5 modelli CV.</span>
                    </div>
                  </div>
                ) : (
                  <>
                    <form onSubmit={handleSubscribe}>
                      <input
                        type="email"
                        placeholder="La tua email professionale"
                        value={emailInput}
                        onChange={(e) => setEmailInput(e.target.value)}
                        required
                        aria-label="Email per la newsletter"
                      />
                      <button type="submit" className="btn btn-ink">Iscriviti gratis</button>
                    </form>
                    <span className="priv">100% gratuito · niente spam · cancellazione in un clic</span>
                  </>
                )}
              </div>
            </div>
          </section>
        </div>
      </main>
    </EditorialChrome>
  );
}
