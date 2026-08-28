// Shared HTML shell for server-rendered SEO/GEO pages (pSEO hub & spoke pages,
// city/region profiles, etc). Every SSR route in ssr/routes.ts reuses this.
//
// Visual identity is a manual mirror of the frontend's "Carta & Inchiostro" v3
// design system (artifacts/pronto-curriculum/src/components/EditorialChrome.tsx,
// EDITORIAL_CSS). There is no shared package between api-server and the
// frontend, so if EditorialChrome's CSS or footer links change, this file
// must be updated by hand to stay in sync.

const GRAIN =
  `url('data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="180" height="180">` +
  `<filter id="n"><feTurbulence type="fractalNoise" baseFrequency="0.85" numOctaves="2"/></filter>` +
  `<rect width="180" height="180" filter="url(%23n)" opacity="0.55"/></svg>')`;

const SHELL_CSS = `
@import url('https://api.fontshare.com/v2/css?f[]=switzer@400,500,600,700&f[]=satoshi@400,500,700&display=swap');
@import url('https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@400;500&display=swap');
.pce { --paper:#FFFFFF; --card:#FFFFFF; --ink:#14171F; --ink-60:#565B66; --ink-40:#9297A1; --hair:rgba(20,23,31,.12); --hair-soft:rgba(20,23,31,.07); --accent:#2F2AE5; --accent-ink:#221FB4; --violet:#7C5CFF; --ease:cubic-bezier(.16,1,.3,1); --f-display:'Switzer','Helvetica Neue',Helvetica,Arial,sans-serif; --f-body:'Satoshi','Helvetica Neue',sans-serif; --f-mono:'IBM Plex Mono',monospace; font-family:var(--f-body); background:var(--paper); color:var(--ink); -webkit-font-smoothing:antialiased; line-height:1.5; position:relative; overflow-x:hidden; min-height:100vh; }
.pce * { margin:0; padding:0; box-sizing:border-box; }
.pce .mono { font-family:var(--f-mono); font-size:11px; letter-spacing:.14em; text-transform:uppercase; }
.pce .grain { position:fixed; inset:0; z-index:40; pointer-events:none; opacity:.04; background-image:${GRAIN}; }
.pce .grad { background:linear-gradient(96deg,#6FA5FF 0%,#8F8CFF 48%,#BE9CFF 100%); -webkit-background-clip:text; background-clip:text; color:transparent; }
.pce .aurora { position:absolute; inset:0; z-index:0; pointer-events:none; overflow:hidden; }
.pce .aurora i { position:absolute; display:block; border-radius:50%; filter:blur(70px); }
.pce .aurora i:nth-child(1) { width:52vw; height:52vw; top:-12%; left:-10%; background:radial-gradient(circle,rgba(96,130,255,.16) 0%,transparent 62%); }
.pce .aurora i:nth-child(2) { width:44vw; height:44vw; top:16%; right:-12%; background:radial-gradient(circle,rgba(150,110,255,.14) 0%,transparent 62%); }
.pce .aurora i:nth-child(3) { width:48vw; height:48vw; top:52%; left:18%; background:radial-gradient(circle,rgba(110,100,250,.11) 0%,transparent 62%); }
.pce .aurora i:nth-child(4) { width:40vw; height:40vw; bottom:-8%; right:6%; background:radial-gradient(circle,rgba(120,150,255,.13) 0%,transparent 62%); }
.pce .shell { max-width:1200px; margin:0 auto; padding:0 40px; position:relative; z-index:1; }
.pce .topbar { position:sticky; top:0; z-index:30; background:rgba(255,255,255,.72); backdrop-filter:blur(14px); -webkit-backdrop-filter:blur(14px); border-bottom:1px solid var(--hair-soft); }
.pce .topbar nav { display:flex; align-items:center; justify-content:space-between; height:68px; }
.pce .brand { font-family:var(--f-display); font-weight:700; font-size:19px; letter-spacing:-.03em; display:flex; align-items:center; gap:8px; text-decoration:none; color:var(--ink); }
.pce .brand span { background:linear-gradient(90deg,var(--accent),var(--violet)); -webkit-background-clip:text; background-clip:text; color:transparent; }
.pce .brand img { width:46px; height:46px; object-fit:contain; flex-shrink:0; }
.pce .nav-links { display:flex; gap:30px; font-size:13.5px; font-weight:500; color:var(--ink-60); }
.pce .nav-links a { color:inherit; text-decoration:none; }
.pce .nav-links a:hover { color:var(--ink); }
.pce .btn { display:inline-flex; align-items:center; justify-content:center; gap:8px; border:none; cursor:pointer; font-family:var(--f-body); font-weight:700; font-size:14px; padding:12px 22px; border-radius:10px; text-decoration:none; }
.pce .btn-ink { background:var(--accent); color:#fff; box-shadow:0 1px 2px rgba(20,23,31,.15); }
.pce .btn-ink:hover { background:var(--accent-ink); }
.pce .btn-line { background:transparent; color:var(--ink); border:1px solid var(--hair); }
.pce .btn-sm { padding:9px 16px; font-size:13px; }
.pce .crumb { display:flex; align-items:center; gap:8px; flex-wrap:wrap; color:var(--ink-40); font-size:13px; padding:28px 0 0; }
.pce .crumb a { color:var(--ink-40); text-decoration:none; }
.pce .crumb a:hover { color:var(--accent); }
.pce .crumb b { color:var(--accent); font-weight:500; }
.pce .hero { padding:36px 0 40px; max-width:820px; }
.pce .hero h1 { font-family:var(--f-display); font-weight:700; font-size:clamp(30px,4.2vw,50px); line-height:1.04; letter-spacing:-.035em; margin-bottom:18px; }
.pce .hero .sub { font-size:16.5px; color:var(--ink-60); line-height:1.65; font-weight:500; }
.pce .hero-art { width:100%; max-width:1120px; aspect-ratio:21/6; border-radius:20px; overflow:hidden; border:1px solid var(--hair-soft); margin:8px 0 12px; }
.pce .hero-art svg { display:block; }
.pce .answer { border:1px solid rgba(111,140,255,.35); background:rgba(111,140,255,.06); border-radius:16px; padding:24px 26px; margin:28px 0 8px; font-size:15px; line-height:1.65; color:var(--ink); max-width:760px; }
.pce .stats { display:grid; grid-template-columns:repeat(auto-fit,minmax(180px,1fr)); gap:16px; margin:40px 0; }
.pce .stat { border:1px solid var(--hair-soft); background:rgba(255,255,255,.8); border-radius:14px; padding:22px; }
.pce .stat .n { font-family:var(--f-display); font-weight:700; font-size:28px; letter-spacing:-.02em; color:var(--accent); }
.pce .stat .l { font-size:12.5px; color:var(--ink-60); margin-top:6px; line-height:1.4; }
.pce .sec { padding-top:44px; max-width:800px; }
.pce .sec h2 { font-family:var(--f-display); font-weight:700; font-size:clamp(22px,2.4vw,29px); letter-spacing:-.025em; line-height:1.15; margin-bottom:16px; }
.pce .prose { font-size:15.5px; color:var(--ink-60); line-height:1.75; }
.pce .prose p { margin-bottom:16px; }
.pce .prose b { color:var(--ink); font-weight:700; }
.pce .prose ul { margin:0 0 16px 0; padding-left:22px; }
.pce .prose li { margin-bottom:8px; }
.pce table.data { width:100%; border-collapse:collapse; margin:8px 0 8px; font-size:13.5px; }
.pce table.data th, .pce table.data td { text-align:left; padding:10px 14px; border-bottom:1px solid var(--hair-soft); }
.pce table.data th { font-family:var(--f-mono); font-size:10.5px; letter-spacing:.1em; text-transform:uppercase; color:var(--ink-40); font-weight:500; }
.pce .grid-cards { display:grid; grid-template-columns:repeat(auto-fill,minmax(200px,1fr)); gap:14px; margin:8px 0; }
.pce .city-card { display:block; border:1px solid var(--hair-soft); background:rgba(255,255,255,.8); border-radius:14px; padding:20px; text-decoration:none; color:inherit; }
.pce .city-card:hover { border-color:rgba(111,140,255,.4); }
.pce .city-card b { font-family:var(--f-display); font-weight:700; font-size:15.5px; display:block; margin-bottom:6px; }
.pce .city-card span { font-size:12.5px; color:var(--ink-60); }
.pce .faq { max-width:800px; }
.pce .faq details { border-bottom:1px solid var(--hair-soft); }
.pce .faq summary { cursor:pointer; list-style:none; display:flex; justify-content:space-between; align-items:center; gap:20px; padding:18px 0; font-family:var(--f-display); font-weight:600; font-size:16px; letter-spacing:-.01em; }
.pce .faq summary::-webkit-details-marker { display:none; }
.pce .faq summary::after { content:'+'; font-family:var(--f-mono); color:var(--accent); font-size:20px; }
.pce .faq details[open] summary::after { content:'\\2212'; }
.pce .faq details p { color:var(--ink-60); font-size:14.5px; line-height:1.7; padding-bottom:18px; max-width:740px; }
.pce .cta-band { border:1px solid var(--hair-soft); background:rgba(255,255,255,.75); border-radius:18px; padding:40px; display:flex; align-items:center; justify-content:space-between; gap:32px; flex-wrap:wrap; margin:56px 0; }
.pce .cta-band h3 { font-family:var(--f-display); font-weight:700; font-size:clamp(20px,2.4vw,26px); letter-spacing:-.02em; margin-bottom:8px; }
.pce .cta-band p { font-size:14.5px; color:var(--ink-60); line-height:1.6; max-width:540px; }
.pce .src { font-size:12px; color:var(--ink-40); margin-top:8px; }
.pce .src a { color:var(--ink-40); }
.pce .foot-grid { display:grid; grid-template-columns:2.2fr 1fr 1fr 1fr; gap:36px; padding:64px 0 48px; border-top:1px solid var(--hair-soft); }
.pce .foot-about { font-size:13.5px; color:var(--ink-60); line-height:1.7; max-width:300px; margin-top:14px; }
.pce .foot-col h4 { font-family:var(--f-mono); font-size:10.5px; font-weight:500; letter-spacing:.16em; text-transform:uppercase; color:var(--ink-40); margin-bottom:16px; }
.pce .foot-col a { display:block; width:fit-content; color:var(--ink-60); text-decoration:none; font-size:13.5px; padding:5px 0; }
.pce .foot-col a:hover { color:var(--accent); }
.pce .foot-bottom { display:flex; justify-content:space-between; align-items:center; gap:16px; flex-wrap:wrap; padding:22px 0 36px; border-top:1px solid var(--hair-soft); }
.pce footer .mono { color:var(--ink-40); }
@media (max-width:900px) { .pce .shell{padding:0 22px;} .pce .nav-links{display:none;} .pce .foot-grid{grid-template-columns:1fr 1fr;} .pce .cta-band{padding:28px 24px;} }
@media (max-width:560px) { .pce .shell{padding:0 16px;} .pce .foot-grid{grid-template-columns:1fr;} }
`;

export interface SsrPageOptions {
  title: string;
  description: string;
  canonicalPath: string;
  bodyHtml: string;
  schemaJson?: object[];
  ogImage?: string;
}

export function renderSsrPage(opts: SsrPageOptions): string {
  const canonical = `https://prontocurriculum.it${opts.canonicalPath}`;
  const schemaBlocks = (opts.schemaJson ?? [])
    .map((s) => `<script type="application/ld+json">${JSON.stringify(s)}</script>`)
    .join("\n");

  return `<!DOCTYPE html>
<html lang="it">
<head>
<meta charset="UTF-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<title>${escapeHtml(opts.title)}</title>
<meta name="description" content="${escapeHtml(opts.description)}" />
<link rel="canonical" href="${canonical}" />
<meta property="og:type" content="website" />
<meta property="og:title" content="${escapeHtml(opts.title)}" />
<meta property="og:description" content="${escapeHtml(opts.description)}" />
<meta property="og:url" content="${canonical}" />
<meta property="og:image" content="${opts.ogImage ?? "https://prontocurriculum.it/opengraph.jpg"}" />
<meta name="twitter:card" content="summary_large_image" />
<link rel="icon" href="/logo-icon.png" />
${schemaBlocks}
<style>${SHELL_CSS}</style>
</head>
<body>
<div class="pce">
  <div class="grain" aria-hidden="true"></div>
  <div class="aurora" aria-hidden="true"><i></i><i></i><i></i><i></i></div>
  <header class="topbar">
    <div class="shell">
      <nav aria-label="Navigazione principale">
        <a class="brand" href="/"><img src="/logo-icon.png" alt="" /><span>ProntoCurriculum</span></a>
        <div class="nav-links">
          <a href="/come-funziona">Come funziona</a>
          <a href="/prezzi">Prezzi</a>
          <a href="/blog">Blog e guide</a>
          <a href="/calcolo-stipendio">Calcolo stipendio</a>
          <a href="/strumenti">Strumenti</a>
          <a href="/lavoro/lombardia">Lavoro in Lombardia</a>
        </div>
        <a class="btn btn-ink btn-sm" href="/crea-cv">Crea il tuo CV</a>
      </nav>
    </div>
  </header>

  <div class="shell">
    ${opts.bodyHtml}
  </div>

  <div class="shell">
    <footer>
      <div class="foot-grid">
        <div>
          <a class="brand" style="font-size:17px" href="/"><img src="/logo-icon.png" alt="" style="width:22px;height:22px" /><span>ProntoCurriculum</span></a>
          <p class="foot-about">Crea il tuo curriculum ottimizzato ATS in pochi minuti, con guide e strumenti gratuiti per la ricerca di lavoro in Italia.</p>
        </div>
        <nav class="foot-col" aria-label="Prodotto">
          <h4>Prodotto</h4>
          <a href="/crea-cv">Crea CV</a>
          <a href="/come-funziona">Come funziona</a>
          <a href="/prezzi">Prezzi</a>
        </nav>
        <nav class="foot-col" aria-label="Risorse">
          <h4>Risorse</h4>
          <a href="/blog">Tutte le guide</a>
          <a href="/guida-cv">Guida al CV</a>
          <a href="/calcolo-stipendio">Calcolo stipendio</a>
          <a href="/strumenti">Strumenti</a>
          <a href="/lavoro/lombardia">Lavoro in Lombardia</a>
        </nav>
        <nav class="foot-col" aria-label="Legale">
          <h4>Legale</h4>
          <a href="/privacy">Privacy</a>
          <a href="/termini">Termini</a>
          <a href="mailto:info@prontocurriculum.it">Contatti</a>
        </nav>
      </div>
      <div class="foot-bottom">
        <span class="mono">&copy; ${new Date().getFullYear()} ProntoCurriculum — fatto in Italia</span>
      </div>
    </footer>
  </div>
</div>
</body>
</html>`;
}

export function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}
