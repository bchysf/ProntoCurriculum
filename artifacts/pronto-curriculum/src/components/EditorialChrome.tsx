import { useEffect, type ReactNode } from 'react';
import type { Page } from '../types';

// "Carta & Inchiostro" v3 — shared editorial chrome for blog, articles and tools.
// Mirrors the Home (pc3) design system: Switzer + Satoshi + IBM Plex Mono,
// white paper, aurora background, grain, reveal-on-scroll, frosted topbar.

const GRAIN = `url('data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="180" height="180"><filter id="n"><feTurbulence type="fractalNoise" baseFrequency="0.85" numOctaves="2"/></filter><rect width="180" height="180" filter="url(%23n)" opacity="0.55"/></svg>')`;

export const EDITORIAL_CSS = `
@import url('https://api.fontshare.com/v2/css?f[]=switzer@400,500,600,700&f[]=satoshi@400,500,700&display=swap');
@import url('https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@400;500&display=swap');

.pce {
  --paper: #FFFFFF;
  --card: #FFFFFF;
  --ink: #14171F;
  --ink-60: #565B66;
  --ink-40: #9297A1;
  --hair: rgba(20, 23, 31, 0.12);
  --hair-soft: rgba(20, 23, 31, 0.07);
  --accent: #2F2AE5;
  --accent-ink: #221FB4;
  --violet: #7C5CFF;
  --ease: cubic-bezier(0.16, 1, 0.3, 1);
  --f-display: 'Switzer', 'Helvetica Neue', Helvetica, Arial, sans-serif;
  --f-body: 'Satoshi', 'Helvetica Neue', sans-serif;
  --f-mono: 'IBM Plex Mono', monospace;
  font-family: var(--f-body);
  background: var(--paper);
  color: var(--ink);
  -webkit-font-smoothing: antialiased;
  line-height: 1.5;
  position: relative;
  overflow-x: hidden;
  min-height: 100vh;
}
.pce * { margin: 0; padding: 0; box-sizing: border-box; }
.pce .mono { font-family: var(--f-mono); font-size: 11px; letter-spacing: 0.14em; text-transform: uppercase; }
.pce .grain { position: fixed; inset: 0; z-index: 40; pointer-events: none; opacity: 0.04; background-image: ${GRAIN}; }
.pce .grad { background: linear-gradient(96deg, #6FA5FF 0%, #8F8CFF 48%, #BE9CFF 100%); -webkit-background-clip: text; background-clip: text; color: transparent; }

/* Aurora */
.pce .aurora { position: absolute; inset: 0; z-index: 0; pointer-events: none; overflow: hidden; }
.pce .aurora i { position: absolute; display: block; border-radius: 50%; filter: blur(70px); will-change: transform; }
.pce .aurora i:nth-child(1) { width: 52vw; height: 52vw; top: -12%; left: -10%; background: radial-gradient(circle, rgba(96, 130, 255, 0.16) 0%, transparent 62%); animation: pce-drift1 26s ease-in-out infinite alternate; }
.pce .aurora i:nth-child(2) { width: 44vw; height: 44vw; top: 16%; right: -12%; background: radial-gradient(circle, rgba(150, 110, 255, 0.14) 0%, transparent 62%); animation: pce-drift2 32s ease-in-out infinite alternate; }
.pce .aurora i:nth-child(3) { width: 48vw; height: 48vw; top: 52%; left: 18%; background: radial-gradient(circle, rgba(110, 100, 250, 0.11) 0%, transparent 62%); animation: pce-drift3 38s ease-in-out infinite alternate; }
.pce .aurora i:nth-child(4) { width: 40vw; height: 40vw; bottom: -8%; right: 6%; background: radial-gradient(circle, rgba(120, 150, 255, 0.13) 0%, transparent 62%); animation: pce-drift1 30s 4s ease-in-out infinite alternate-reverse; }
@keyframes pce-drift1 { from { transform: translate(0, 0) scale(1); } to { transform: translate(16vw, 14vh) scale(1.18); } }
@keyframes pce-drift2 { from { transform: translate(0, 0) scale(1.1); } to { transform: translate(-14vw, 22vh) scale(0.92); } }
@keyframes pce-drift3 { from { transform: translate(0, 0) scale(0.95); } to { transform: translate(12vw, -16vh) scale(1.15); } }

.pce .shell { max-width: 1200px; margin: 0 auto; padding: 0 40px; position: relative; z-index: 1; }

/* Reveal on scroll */
.pce .rv { opacity: 0; transform: translateY(20px); transition: opacity .7s var(--ease), transform .7s var(--ease); }
.pce .rv.on { opacity: 1; transform: none; }
.pce .rv.d1 { transition-delay: .08s; } .pce .rv.d2 { transition-delay: .16s; } .pce .rv.d3 { transition-delay: .24s; }

/* Topbar */
.pce .topbar { position: sticky; top: 0; z-index: 30; background: rgba(255,255,255,0.72); backdrop-filter: blur(14px); -webkit-backdrop-filter: blur(14px); border-bottom: 1px solid var(--hair-soft); }
.pce .topbar nav { display: flex; align-items: center; justify-content: space-between; height: 68px; }
.pce .brand { font-family: var(--f-display); font-weight: 700; font-size: 19px; letter-spacing: -0.03em; display: flex; align-items: center; gap: 8px; cursor: pointer; }
.pce .brand span { background: linear-gradient(90deg, var(--accent), var(--violet)); -webkit-background-clip: text; background-clip: text; color: transparent; }
.pce .brand img { width: 46px; height: 46px; object-fit: contain; flex-shrink: 0; }
.pce .nav-links { display: flex; gap: 30px; font-size: 13.5px; font-weight: 500; color: var(--ink-60); }
.pce .nav-links span { cursor: pointer; position: relative; transition: color .2s; }
.pce .nav-links span::after { content: ''; position: absolute; left: 0; right: 0; bottom: -4px; height: 1.5px; background: var(--accent); transform: scaleX(0); transform-origin: right; transition: transform .35s var(--ease); }
.pce .nav-links span:hover { color: var(--ink); }
.pce .nav-links span:hover::after { transform: scaleX(1); transform-origin: left; }
.pce .nav-links span.active { color: var(--ink); }
.pce .nav-links span.active::after { transform: scaleX(1); }

/* Buttons */
.pce .btn { display: inline-flex; align-items: center; justify-content: center; gap: 8px; border: none; cursor: pointer; font-family: var(--f-body); font-weight: 700; font-size: 14px; padding: 12px 22px; border-radius: 10px; transition: transform .25s var(--ease), background .2s, box-shadow .25s var(--ease), border-color .2s; text-decoration: none; }
.pce .btn:active { transform: scale(0.97); }
.pce .btn-ink { background: var(--accent); color: #fff; box-shadow: 0 1px 2px rgba(20,23,31,.15); }
.pce .btn-ink:hover { background: var(--accent-ink); transform: translateY(-1.5px); box-shadow: 0 10px 24px -10px rgba(47,42,229,.5); }
.pce .btn-line { background: transparent; color: var(--ink); border: 1px solid var(--hair); }
.pce .btn-line:hover { border-color: var(--ink); transform: translateY(-1.5px); }
.pce .btn-sm { padding: 9px 16px; font-size: 13px; }

/* Section headers */
.pce .sec-head { display: flex; align-items: baseline; justify-content: space-between; border-top: 1px solid var(--hair); padding-top: 18px; margin-bottom: 48px; gap: 24px; }
.pce .sec-num { color: var(--ink-40); flex-shrink: 0; }
.pce h2.sec-title { font-family: var(--f-display); font-weight: 700; font-size: clamp(28px, 3.2vw, 40px); letter-spacing: -0.03em; line-height: 1.05; }
.pce h2.sec-title .ac { background: linear-gradient(96deg, #6FA5FF 0%, #8F8CFF 48%, #BE9CFF 100%); -webkit-background-clip: text; background-clip: text; color: transparent; }

/* FAQ (details) */
.pce .faq { max-width: 840px; }
.pce .faq details { border-bottom: 1px solid var(--hair-soft); }
.pce .faq summary { cursor: pointer; list-style: none; display: flex; justify-content: space-between; align-items: center; gap: 20px; padding: 20px 0; font-family: var(--f-display); font-weight: 600; font-size: 16.5px; letter-spacing: -0.01em; }
.pce .faq summary::-webkit-details-marker { display: none; }
.pce .faq summary::after { content: '+'; font-family: var(--f-mono); color: var(--accent); font-size: 20px; flex-shrink: 0; transition: transform .3s var(--ease); }
.pce .faq details[open] summary::after { transform: rotate(45deg); }
.pce .faq details p { color: var(--ink-60); font-size: 14.5px; line-height: 1.7; padding-bottom: 20px; max-width: 740px; }

/* Article cards + avatars (shared by BlogHub and BlogArticle related grid) */
.pce .bh-ava { width: 40px; height: 40px; border-radius: 50%; background: linear-gradient(120deg, #6FA5FF, #BE9CFF); color: #fff; display: flex; align-items: center; justify-content: center; font-family: var(--f-display); font-weight: 700; font-size: 13px; flex-shrink: 0; }
.pce .bh-ava--sm { width: 30px; height: 30px; font-size: 10.5px; }
.pce .bh-card { display: flex; flex-direction: column; background: rgba(255,255,255,0.8); backdrop-filter: blur(6px); border: 1px solid var(--hair-soft); border-radius: 16px; padding: 26px; cursor: pointer; transition: transform .35s var(--ease), box-shadow .35s var(--ease), border-color .2s; }
.pce .bh-card:hover { transform: translateY(-4px); border-color: rgba(111, 140, 255, 0.4); box-shadow: 0 18px 40px -20px rgba(60, 70, 180, 0.2); }
.pce .bh-card__top { display: flex; align-items: center; justify-content: space-between; gap: 10px; margin-bottom: 16px; }
.pce .bh-card__cat { font-family: var(--f-mono); font-size: 9.5px; letter-spacing: 0.12em; text-transform: uppercase; color: var(--accent); }
.pce .bh-card__time { font-family: var(--f-mono); font-size: 9.5px; letter-spacing: 0.06em; color: var(--ink-40); white-space: nowrap; }
.pce .bh-card h3 { font-family: var(--f-display); font-weight: 600; font-size: 17.5px; letter-spacing: -0.02em; line-height: 1.25; margin-bottom: 10px; }
.pce .bh-card p { font-size: 13px; color: var(--ink-60); line-height: 1.6; flex: 1; margin-bottom: 20px; }
.pce .bh-card__foot { display: flex; align-items: center; justify-content: space-between; gap: 10px; border-top: 1px solid var(--hair-soft); padding-top: 14px; }
.pce .bh-card__author { display: flex; align-items: center; gap: 9px; }
.pce .bh-card__author b { font-size: 12px; font-weight: 700; display: block; line-height: 1.2; }
.pce .bh-card__author span { font-size: 10.5px; color: var(--ink-40); display: block; }
.pce .bh-card__arrow { font-family: var(--f-mono); color: var(--accent); font-size: 15px; transition: transform .3s var(--ease); }
.pce .bh-card:hover .bh-card__arrow { transform: translateX(4px); }

/* CTA band */
.pce .cta-band { border: 1px solid var(--hair-soft); background: rgba(255,255,255,0.75); backdrop-filter: blur(6px); border-radius: 18px; padding: 40px; display: flex; align-items: center; justify-content: space-between; gap: 32px; flex-wrap: wrap; transition: transform .35s var(--ease), box-shadow .35s var(--ease); }
.pce .cta-band:hover { transform: translateY(-3px); box-shadow: 0 18px 40px -20px rgba(60, 70, 180, 0.2); }
.pce .cta-band h3 { font-family: var(--f-display); font-weight: 700; font-size: clamp(20px, 2.4vw, 28px); letter-spacing: -0.02em; margin-bottom: 8px; }
.pce .cta-band p { font-size: 14.5px; color: var(--ink-60); line-height: 1.6; max-width: 560px; }
.pce .cta-band .mono { color: var(--accent); display: block; margin-bottom: 12px; }

/* Footer (mirrors Home) */
.pce .foot-grid { display: grid; grid-template-columns: 2.2fr 1fr 1fr 1fr; gap: 36px; padding: 64px 0 48px; border-top: 1px solid var(--hair-soft); }
.pce .foot-about { font-size: 13.5px; color: var(--ink-60); line-height: 1.7; max-width: 300px; margin-top: 14px; }
.pce .foot-col h4 { font-family: var(--f-mono); font-size: 10.5px; font-weight: 500; letter-spacing: .16em; text-transform: uppercase; color: var(--ink-40); margin-bottom: 16px; }
.pce .foot-col a { display: block; width: fit-content; color: var(--ink-60); text-decoration: none; font-size: 13.5px; padding: 5px 0; position: relative; transition: color .2s; }
.pce .foot-col a::after { content: ''; position: absolute; left: 0; right: 100%; bottom: 3px; height: 1px; background: var(--accent); transition: right .3s var(--ease); }
.pce .foot-col a:hover { color: var(--accent); }
.pce .foot-col a:hover::after { right: 0; }
.pce .foot-bottom { display: flex; justify-content: space-between; align-items: center; gap: 16px; flex-wrap: wrap; padding: 22px 0 36px; border-top: 1px solid var(--hair-soft); }
.pce footer .mono { color: var(--ink-40); }

@media (max-width: 900px) {
  .pce .shell { padding: 0 22px; }
  .pce .nav-links { display: none; }
  .pce .foot-grid { grid-template-columns: 1fr 1fr; }
  .pce .cta-band { padding: 28px 24px; }
}
@media (max-width: 560px) {
  .pce .shell { padding: 0 16px; }
  .pce .topbar nav { height: 58px; gap: 8px; }
  .pce .brand { font-size: 15px; gap: 6px; min-width: 0; }
  .pce .brand > span:first-of-type { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
  .pce .brand .mono { display: none; }
  .pce .brand img { width: 28px; height: 28px; }
  .pce .topbar .btn-sm { padding: 7px 10px; font-size: 11.5px; white-space: nowrap; flex-shrink: 0; }
  .pce .foot-grid { grid-template-columns: 1fr; }
}
@media (prefers-reduced-motion: reduce) {
  .pce .aurora i { animation: none !important; }
  .pce .rv { opacity: 1; transform: none; transition: none; }
}
`;

/** IntersectionObserver reveal for .pce .rv elements. Re-runs when `key` changes. */
export function useReveal(key?: unknown) {
  useEffect(() => {
    const els = document.querySelectorAll('.pce .rv');
    const io = new IntersectionObserver(
      entries => entries.forEach(e => { if (e.isIntersecting) e.target.classList.add('on'); }),
      { threshold: 0.12 },
    );
    els.forEach(el => io.observe(el));
    return () => io.disconnect();
  }, [key]);
}

function setMeta(selector: string, createEl: () => HTMLElement, setValue: (el: HTMLElement) => void) {
  let el = document.querySelector<HTMLElement>(selector);
  let created = false;
  if (!el) {
    el = createEl();
    document.head.appendChild(el);
    created = true;
  }
  const prev = el.getAttribute('content') ?? el.getAttribute('href') ?? '';
  setValue(el);
  return { el, created, prev };
}

/** Sets document title, meta description, canonical link and OG tags while the page is mounted. */
export function useSeoMeta(title: string, description: string, canonicalPath?: string) {
  useEffect(() => {
    const prevTitle = document.title;
    document.title = title;

    const desc = setMeta(
      'meta[name="description"]',
      () => { const m = document.createElement('meta'); m.setAttribute('name', 'description'); return m; },
      (el) => el.setAttribute('content', description),
    );
    const ogTitle = setMeta(
      'meta[property="og:title"]',
      () => { const m = document.createElement('meta'); m.setAttribute('property', 'og:title'); return m; },
      (el) => el.setAttribute('content', title),
    );
    const ogDesc = setMeta(
      'meta[property="og:description"]',
      () => { const m = document.createElement('meta'); m.setAttribute('property', 'og:description'); return m; },
      (el) => el.setAttribute('content', description),
    );

    const url = canonicalPath ? `https://prontocurriculum.it${canonicalPath}` : undefined;
    const canonical = url
      ? setMeta(
          'link[rel="canonical"]',
          () => { const l = document.createElement('link'); l.setAttribute('rel', 'canonical'); return l; },
          (el) => el.setAttribute('href', url),
        )
      : undefined;
    const ogUrl = url
      ? setMeta(
          'meta[property="og:url"]',
          () => { const m = document.createElement('meta'); m.setAttribute('property', 'og:url'); return m; },
          (el) => el.setAttribute('content', url),
        )
      : undefined;

    return () => {
      document.title = prevTitle;
      [desc, ogTitle, ogDesc, canonical, ogUrl].forEach((entry) => {
        if (!entry) return;
        if (entry.created) entry.el.remove();
        else if (entry.el.tagName === 'LINK') entry.el.setAttribute('href', entry.prev);
        else entry.el.setAttribute('content', entry.prev);
      });
    };
  }, [title, description, canonicalPath]);
}

interface EditorialChromeProps {
  onNavigate: (page: Page, slug?: string) => void;
  active?: 'blog' | 'calcolo-stipendio' | 'prezzi' | 'come-funziona';
  tagline?: string;
  children: ReactNode;
}

export default function EditorialChrome({ onNavigate, active, tagline, children }: EditorialChromeProps) {
  return (
    <div className="pce">
      <style>{EDITORIAL_CSS}</style>
      <div className="grain" aria-hidden="true" />
      <div className="aurora" aria-hidden="true"><i /><i /><i /><i /></div>

      <header className="topbar">
        <div className="shell">
          <nav aria-label="Navigazione principale">
            <div className="brand" onClick={() => onNavigate('home')}>
              <img src="/logo-icon.png" alt="" /><span>ProntoCurriculum</span>
              {tagline && <span className="mono" style={{ marginLeft: 10, color: 'var(--ink-40)', background: 'none', WebkitTextFillColor: 'initial', fontWeight: 400 }}>{tagline}</span>}
            </div>
            <div className="nav-links">
              <span onClick={() => onNavigate('home')}>Home</span>
              <span className={active === 'come-funziona' ? 'active' : ''} onClick={() => onNavigate('come-funziona')}>Come Funziona</span>
              <span className={active === 'prezzi' ? 'active' : ''} onClick={() => onNavigate('prezzi')}>Prezzi</span>
              <span className={active === 'blog' ? 'active' : ''} onClick={() => onNavigate('blog')}>Blog & Guide</span>
              <span className={active === 'calcolo-stipendio' ? 'active' : ''} onClick={() => onNavigate('calcolo-stipendio')}>Calcolatore Stipendio</span>
            </div>
            <div style={{ display: 'flex', gap: 10 }}>
              <button className="btn btn-ink btn-sm" onClick={() => onNavigate('builder-step1')}>Crea il tuo CV</button>
            </div>
          </nav>
        </div>
      </header>

      {children}

      <div className="shell">
        <footer>
          <div className="foot-grid">
            <div>
              <div className="brand" style={{ fontSize: 17, cursor: 'pointer' }} onClick={() => onNavigate('home')}>
                <img src="/logo-icon.png" alt="" style={{ width: 22, height: 22 }} /><span>ProntoCurriculum</span>
              </div>
              <p className="foot-about">
                Il CV builder italiano con AI integrata: template ottimizzati ATS,
                punteggio in tempo reale, traduzione in sei lingue e candidature tracciate.
              </p>
            </div>
            <nav className="foot-col" aria-label="Prodotto">
              <h4>Prodotto</h4>
              <a href="#" onClick={(e) => { e.preventDefault(); onNavigate('builder-step1'); }}>Crea il tuo CV</a>
              <a href="#" onClick={(e) => { e.preventDefault(); onNavigate('come-funziona'); }}>Come funziona</a>
              <a href="#" onClick={(e) => { e.preventDefault(); onNavigate('prezzi'); }}>Prezzi</a>
              <a href="#" onClick={(e) => { e.preventDefault(); onNavigate('tailor'); }}>CV su misura</a>
            </nav>
            <nav className="foot-col" aria-label="Risorse">
              <h4>Risorse</h4>
              <a href="#" onClick={(e) => { e.preventDefault(); onNavigate('blog'); }}>Tutto il blog →</a>
              <a href="#" onClick={(e) => { e.preventDefault(); onNavigate('blog-article', 'guida-cv'); }}>Guida al CV perfetto</a>
              <a href="#" onClick={(e) => { e.preventDefault(); onNavigate('blog-article', 'punteggio-ats'); }}>Cos'è il punteggio ATS</a>
              <a href="#" onClick={(e) => { e.preventDefault(); onNavigate('calcolo-stipendio'); }}>Calcolo stipendio netto</a>
            </nav>
            <nav className="foot-col" aria-label="Legale">
              <h4>Legale</h4>
              <a href="#" onClick={(e) => { e.preventDefault(); onNavigate('privacy'); }}>Privacy</a>
              <a href="#" onClick={(e) => { e.preventDefault(); onNavigate('terms'); }}>Termini</a>
              <a href="#" onClick={(e) => { e.preventDefault(); onNavigate('cookie'); }}>Cookie</a>
              <a href="mailto:info@prontocurriculum.it">Contatti</a>
            </nav>
          </div>
          <div className="foot-bottom">
            <span className="mono">© {new Date().getFullYear()} ProntoCurriculum — Fatto a mano in Italia</span>
          </div>
        </footer>
      </div>
    </div>
  );
}
