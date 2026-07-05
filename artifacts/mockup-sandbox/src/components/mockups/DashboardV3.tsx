import { useEffect, useState } from "react";

// Dashboard "Carta & Inchiostro" - professional, minimal, intuitive.
// Same system as the landing: Switzer + Satoshi + IBM Plex Mono,
// white surfaces, hairlines, one ink accent, blue-to-violet gradient
// reserved for key numbers. No decoration that doesn't inform.

const CSS = `
@import url('https://api.fontshare.com/v2/css?f[]=switzer@400,500,600,700&f[]=satoshi@400,500,700&display=swap');
@import url('https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@400;500&display=swap');

.dv3 {
  --ink: #14171F;
  --ink-60: #565B66;
  --ink-40: #9297A1;
  --hair: rgba(20, 23, 31, 0.12);
  --hair-soft: rgba(20, 23, 31, 0.07);
  --accent: #2F2AE5;
  --accent-ink: #221FB4;
  --tint: #EEEDFC;
  --page: #FAFAFC;
  --ease: cubic-bezier(0.16, 1, 0.3, 1);
  --f-display: 'Switzer', 'Helvetica Neue', Helvetica, Arial, sans-serif;
  --f-body: 'Satoshi', 'Helvetica Neue', sans-serif;
  --f-mono: 'IBM Plex Mono', monospace;
  font-family: var(--f-body);
  background: var(--page);
  color: var(--ink);
  -webkit-font-smoothing: antialiased;
  min-height: 100vh;
  display: grid;
  grid-template-columns: 244px 1fr;
}
.dv3 * { margin: 0; padding: 0; box-sizing: border-box; }
.dv3 .mono { font-family: var(--f-mono); font-size: 10.5px; letter-spacing: 0.14em; text-transform: uppercase; color: var(--ink-40); }
.dv3 .grad { background: linear-gradient(96deg, #6FA5FF 0%, #8F8CFF 48%, #BE9CFF 100%); -webkit-background-clip: text; background-clip: text; color: transparent; }

/* SIDEBAR */
.dv3 .side { background: #FFFFFF; border-right: 1px solid var(--hair-soft); padding: 22px 14px; display: flex; flex-direction: column; position: sticky; top: 0; height: 100vh; }
.dv3 .brand { font-family: var(--f-display); font-weight: 700; font-size: 17px; letter-spacing: -0.03em; padding: 0 10px 22px; }
.dv3 .brand i { font-style: normal; color: var(--accent); }
.dv3 .side .mono { padding: 0 10px 10px; display: block; }
.dv3 .nav-item { display: flex; align-items: center; gap: 11px; width: 100%; padding: 10px 12px; border: none; background: transparent; border-radius: 10px; font-family: var(--f-body); font-size: 13.5px; font-weight: 500; color: var(--ink-60); cursor: pointer; text-align: left; transition: background .15s, color .15s; margin-bottom: 2px; }
.dv3 .nav-item:hover { background: #F4F4F8; color: var(--ink); }
.dv3 .nav-item.active { background: var(--tint); color: var(--accent); font-weight: 700; }
.dv3 .nav-item svg { flex-shrink: 0; }
.dv3 .nav-badge { margin-left: auto; font-family: var(--f-mono); font-size: 10px; background: #F4F4F8; border-radius: 99px; padding: 2px 8px; color: var(--ink-40); }
.dv3 .nav-item.active .nav-badge { background: rgba(47,42,229,.12); color: var(--accent); }
.dv3 .side-user { margin-top: auto; display: flex; align-items: center; gap: 10px; padding: 12px 10px; border-top: 1px solid var(--hair-soft); }
.dv3 .avatar { width: 34px; height: 34px; border-radius: 50%; background: linear-gradient(120deg, #6FA5FF, #BE9CFF); color: #fff; font-family: var(--f-display); font-weight: 700; font-size: 13px; display: flex; align-items: center; justify-content: center; }
.dv3 .side-user b { font-size: 13px; display: block; }
.dv3 .side-user span { font-size: 11px; color: var(--ink-40); }

/* MAIN */
.dv3 .main { padding: 0 36px 56px; min-width: 0; }
.dv3 .topbar { display: flex; align-items: center; gap: 16px; padding: 18px 0; border-bottom: 1px solid var(--hair-soft); margin-bottom: 32px; }
.dv3 .search { flex: 1; max-width: 380px; display: flex; align-items: center; gap: 9px; background: #FFFFFF; border: 1px solid var(--hair-soft); border-radius: 10px; padding: 9px 13px; color: var(--ink-40); font-size: 13px; transition: border-color .2s, box-shadow .2s; }
.dv3 .search:focus-within { border-color: var(--accent); box-shadow: 0 0 0 3px rgba(47,42,229,.1); }
.dv3 .search input { border: none; outline: none; background: none; font-family: inherit; font-size: 13px; color: var(--ink); width: 100%; }
.dv3 .search kbd { font-family: var(--f-mono); font-size: 10px; border: 1px solid var(--hair-soft); border-radius: 5px; padding: 2px 6px; color: var(--ink-40); }
.dv3 .top-right { margin-left: auto; display: flex; align-items: center; gap: 12px; }
.dv3 .icon-btn { width: 36px; height: 36px; border-radius: 10px; border: 1px solid var(--hair-soft); background: #fff; color: var(--ink-60); display: flex; align-items: center; justify-content: center; cursor: pointer; position: relative; transition: border-color .2s; }
.dv3 .icon-btn:hover { border-color: var(--hair); }
.dv3 .icon-btn .dot { position: absolute; top: 8px; right: 8px; width: 6px; height: 6px; border-radius: 50%; background: var(--accent); }

.dv3 .head { display: flex; align-items: flex-end; justify-content: space-between; gap: 20px; flex-wrap: wrap; margin-bottom: 28px; }
.dv3 h1 { font-family: var(--f-display); font-weight: 700; font-size: 28px; letter-spacing: -0.03em; }
.dv3 .head p { font-size: 13.5px; color: var(--ink-60); margin-top: 5px; }
.dv3 .btn { display: inline-flex; align-items: center; gap: 8px; border: none; cursor: pointer; font-family: var(--f-body); font-weight: 700; font-size: 13.5px; padding: 11px 18px; border-radius: 10px; transition: transform .25s var(--ease), background .2s, box-shadow .25s var(--ease); }
.dv3 .btn:active { transform: scale(.97); }
.dv3 .btn-ink { background: var(--accent); color: #fff; }
.dv3 .btn-ink:hover { background: var(--accent-ink); transform: translateY(-1px); box-shadow: 0 8px 20px -8px rgba(47,42,229,.5); }
.dv3 .btn-line { background: #fff; color: var(--ink); border: 1px solid var(--hair-soft); }
.dv3 .btn-line:hover { border-color: var(--hair); transform: translateY(-1px); }
.dv3 .btn-sm { padding: 8px 13px; font-size: 12.5px; }

/* STATS */
.dv3 .stats { display: grid; grid-template-columns: repeat(4, 1fr); gap: 14px; margin-bottom: 36px; }
.dv3 .stat { background: #fff; border: 1px solid var(--hair-soft); border-radius: 14px; padding: 20px 22px; transition: transform .3s var(--ease), box-shadow .3s var(--ease), border-color .2s; }
.dv3 .stat:hover { transform: translateY(-2px); border-color: rgba(111,140,255,.35); box-shadow: 0 14px 30px -18px rgba(60,70,180,.25); }
.dv3 .stat .mono { display: block; margin-bottom: 12px; }
.dv3 .stat-num { font-family: var(--f-display); font-weight: 700; font-size: 32px; letter-spacing: -0.03em; line-height: 1; }
.dv3 .stat-sub { font-family: var(--f-mono); font-size: 10.5px; margin-top: 9px; color: var(--ink-40); }
.dv3 .stat-sub.up { color: #12805C; }

/* LAYOUT */
.dv3 .cols { display: grid; grid-template-columns: 1fr 340px; gap: 28px; align-items: start; }
.dv3 .sec-label { display: flex; align-items: baseline; justify-content: space-between; margin-bottom: 14px; }
.dv3 .sec-label a { font-size: 12.5px; font-weight: 700; color: var(--accent); text-decoration: none; cursor: pointer; }
.dv3 .sec-label a:hover { text-decoration: underline; }

/* CV CARDS */
.dv3 .cv-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(210px, 1fr)); gap: 14px; margin-bottom: 36px; }
.dv3 .cv-card { background: #fff; border: 1px solid var(--hair-soft); border-radius: 14px; padding: 16px; cursor: pointer; transition: transform .3s var(--ease), box-shadow .3s var(--ease), border-color .2s; }
.dv3 .cv-card:hover { transform: translateY(-3px); border-color: rgba(111,140,255,.4); box-shadow: 0 16px 34px -18px rgba(60,70,180,.28); }
.dv3 .thumb { background: #FAFAFC; border: 1px solid var(--hair-soft); border-radius: 8px; padding: 14px 12px; margin-bottom: 13px; }
.dv3 .thumb i { display: block; height: 4px; border-radius: 2px; background: #E6E4F0; margin-bottom: 5px; }
.dv3 .thumb i.hd { height: 7px; width: 55%; background: #D5D2E6; margin-bottom: 8px; }
.dv3 .cv-name { font-family: var(--f-display); font-weight: 600; font-size: 14px; letter-spacing: -0.01em; }
.dv3 .cv-meta { display: flex; align-items: center; justify-content: space-between; margin-top: 5px; }
.dv3 .cv-date { font-size: 11.5px; color: var(--ink-40); }
.dv3 .cv-ats { font-family: var(--f-mono); font-size: 10px; color: var(--accent); background: var(--tint); border-radius: 99px; padding: 2px 8px; }
.dv3 .cv-new { border: 1.5px dashed var(--hair); border-radius: 14px; background: transparent; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 8px; color: var(--ink-40); font-size: 13px; font-weight: 500; font-family: var(--f-body); cursor: pointer; min-height: 180px; transition: all .25s; }
.dv3 .cv-new:hover { border-color: rgba(47,42,229,.4); color: var(--accent); background: rgba(47,42,229,.02); }

/* APPLICATIONS LIST */
.dv3 .rows { display: flex; flex-direction: column; gap: 10px; }
.dv3 .row { display: flex; align-items: center; gap: 13px; background: #fff; border: 1px solid var(--hair-soft); border-radius: 12px; padding: 13px 16px; transition: border-color .2s, box-shadow .3s var(--ease); }
.dv3 .row:hover { border-color: rgba(111,140,255,.35); box-shadow: 0 10px 24px -16px rgba(60,70,180,.25); }
.dv3 .row-body { flex: 1; min-width: 0; }
.dv3 .row-title { font-weight: 700; font-size: 13.5px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.dv3 .row-sub { font-size: 11.5px; color: var(--ink-40); margin-top: 2px; }
.dv3 .pill { font-family: var(--f-mono); font-size: 9.5px; letter-spacing: .08em; text-transform: uppercase; border-radius: 99px; padding: 4px 10px; flex-shrink: 0; }
.dv3 .pill-b { background: var(--tint); color: var(--accent); }
.dv3 .pill-g { background: #E4F5EC; color: #12805C; }
.dv3 .pill-y { background: #FBF3E2; color: #97690B; }

/* RIGHT PANELS */
.dv3 .panel { background: #fff; border: 1px solid var(--hair-soft); border-radius: 14px; padding: 22px; margin-bottom: 16px; }
.dv3 .panel h3 { font-family: var(--f-display); font-weight: 600; font-size: 15.5px; letter-spacing: -0.01em; margin-bottom: 4px; }
.dv3 .panel .psub { font-size: 12.5px; color: var(--ink-60); line-height: 1.55; }
.dv3 .prog { height: 6px; border-radius: 3px; background: #EFEDF6; overflow: hidden; margin: 16px 0 8px; }
.dv3 .prog i { display: block; height: 100%; width: 0; border-radius: 3px; background: linear-gradient(90deg, #6FA5FF, #BE9CFF); transition: width 1.2s var(--ease) .3s; }
.dv3 .prog-meta { display: flex; justify-content: space-between; }
.dv3 .check-list { margin-top: 14px; display: flex; flex-direction: column; gap: 9px; }
.dv3 .check-item { display: flex; align-items: center; gap: 9px; font-size: 12.5px; color: var(--ink-60); }
.dv3 .check-item .ok { width: 17px; height: 17px; border-radius: 50%; background: #E4F5EC; color: #12805C; font-size: 10px; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
.dv3 .check-item .todo { width: 17px; height: 17px; border-radius: 50%; border: 1.5px dashed var(--hair); flex-shrink: 0; }
.dv3 .check-item.pending { color: var(--ink-40); }
.dv3 .panel-cta { background: var(--tint); border: 1px solid rgba(47,42,229,.14); }
.dv3 .panel-cta .mono { color: var(--accent); }

@media (max-width: 1080px) { .dv3 .cols { grid-template-columns: 1fr; } .dv3 .stats { grid-template-columns: repeat(2, 1fr); } }
@media (max-width: 860px) { .dv3 { grid-template-columns: 1fr; } .dv3 .side { position: static; height: auto; flex-direction: row; align-items: center; overflow-x: auto; padding: 12px 16px; } .dv3 .side .mono, .dv3 .side-user { display: none; } .dv3 .brand { padding: 0 14px 0 0; } .dv3 .nav-item { width: auto; white-space: nowrap; } .dv3 .main { padding: 0 20px 40px; } }
`;

function Icon({ d, size = 16 }: { d: string; size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor"
      strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      {d.split('|').map((p, i) => <path key={i} d={p} />)}
    </svg>
  );
}

const IC = {
  grid: 'M3 3h7v7H3z|M14 3h7v7h-7z|M3 14h7v7H3z|M14 14h7v7h-7z',
  doc: 'M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z|M14 2v6h6|M16 13H8|M16 17H8',
  spark: 'M12 3l1.9 5.6 5.6 1.9-5.6 1.9L12 18l-1.9-5.6L4.5 10.5l5.6-1.9z',
  list: 'M8 6h13|M8 12h13|M8 18h13|M3 6h.01|M3 12h.01|M3 18h.01',
  briefcase: 'M3 9a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z|M9 7V5a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v2',
  search: 'M21 21l-4.3-4.3|M11 19a8 8 0 1 0 0-16 8 8 0 0 0 0 16z',
  bell: 'M18 8a6 6 0 0 0-12 0c0 7-3 9-3 9h18s-3-2-3-9|M13.7 21a2 2 0 0 1-3.4 0',
  plus: 'M12 5v14|M5 12h14',
};

// Count-up for stat numbers
function useCountUp() {
  useEffect(() => {
    const els = document.querySelectorAll<HTMLElement>('.dv3 [data-count]');
    els.forEach(el => {
      const target = Number(el.dataset.count);
      const t0 = performance.now();
      const dur = 1100;
      const step = (t: number) => {
        const p = Math.min(1, (t - t0) / dur);
        const e = 1 - Math.pow(1 - p, 3);
        el.textContent = String(Math.round(target * e));
        if (p < 1) requestAnimationFrame(step);
      };
      requestAnimationFrame(step);
    });
  }, []);
}

const NAV = [
  { icon: IC.grid, label: 'Dashboard', active: true },
  { icon: IC.doc, label: 'I miei CV', badge: '3' },
  { icon: IC.spark, label: 'CV su misura' },
  { icon: IC.list, label: 'Candidature', badge: '5' },
  { icon: IC.briefcase, label: 'Archivio esperienze' },
];

const CVS = [
  { name: 'CV Marketing 2026', date: 'Modificato 2 giorni fa', ats: 'ATS 92' },
  { name: 'CV English version', date: 'Modificato 1 settimana fa', ats: 'ATS 88' },
  { name: 'CV Europass', date: 'Modificato 3 settimane fa', ats: 'ATS 90' },
];

const APPS = [
  { title: 'Marketing Manager — Lumina Retail', sub: 'CV su misura · inviata 2 giorni fa', pill: 'Inviata', cls: 'pill-b' },
  { title: 'Digital Lead — Adriatica Media', sub: 'CV su misura · inviata 5 giorni fa', pill: 'In review', cls: 'pill-y' },
  { title: 'Brand Manager — Velvet Studio', sub: 'Colloquio giovedì · ore 15:00', pill: 'Colloquio', cls: 'pill-g' },
];

export default function DashboardV3() {
  useCountUp();
  const [progress, setProgress] = useState(0);
  useEffect(() => { const t = setTimeout(() => setProgress(80), 300); return () => clearTimeout(t); }, []);

  return (
    <div className="dv3">
      <style>{CSS}</style>

      {/* SIDEBAR */}
      <aside className="side">
        <div className="brand">ProntoCurriculum<i>.</i></div>
        <span className="mono">Menu</span>
        {NAV.map(item => (
          <button key={item.label} className={`nav-item${item.active ? ' active' : ''}`}>
            <Icon d={item.icon} />
            {item.label}
            {item.badge && <span className="nav-badge">{item.badge}</span>}
          </button>
        ))}
        <div className="side-user">
          <div className="avatar">GF</div>
          <div>
            <b>Giulia Ferraro</b>
            <span>Piano gratuito</span>
          </div>
        </div>
      </aside>

      {/* MAIN */}
      <main className="main">
        <div className="topbar">
          <label className="search">
            <Icon d={IC.search} size={14} />
            <input placeholder="Cerca CV, candidature, esperienze…" />
            <kbd>⌘K</kbd>
          </label>
          <div className="top-right">
            <button className="icon-btn" aria-label="Notifiche"><Icon d={IC.bell} size={15} /><span className="dot" /></button>
            <div className="avatar" style={{ width: 36, height: 36 }}>GF</div>
          </div>
        </div>

        <div className="head">
          <div>
            <h1>Bentornata, Giulia.</h1>
            <p>Una candidatura è passata a <b>Colloquio</b> — il CV Marketing sta funzionando.</p>
          </div>
          <div style={{ display: 'flex', gap: 10 }}>
            <button className="btn btn-line"><Icon d={IC.spark} size={14} /> CV su misura</button>
            <button className="btn btn-ink"><Icon d={IC.plus} size={14} /> Nuovo CV</button>
          </div>
        </div>

        {/* STATS */}
        <div className="stats">
          <div className="stat"><span className="mono">CV creati</span><div className="stat-num" data-count="3">0</div><div className="stat-sub">3 attivi</div></div>
          <div className="stat"><span className="mono">Candidature</span><div className="stat-num" data-count="5">0</div><div className="stat-sub up">+2 questa settimana</div></div>
          <div className="stat"><span className="mono">Colloqui</span><div className="stat-num grad" data-count="1">0</div><div className="stat-sub up">Giovedì · ore 15:00</div></div>
          <div className="stat"><span className="mono">Miglior ATS</span><div className="stat-num" data-count="92">0</div><div className="stat-sub">CV Marketing 2026</div></div>
        </div>

        <div className="cols">
          {/* LEFT */}
          <div>
            <div className="sec-label">
              <span className="mono">I miei CV</span>
              <a>Vedi tutti</a>
            </div>
            <div className="cv-grid">
              {CVS.map(cv => (
                <div className="cv-card" key={cv.name}>
                  <div className="thumb" aria-hidden="true">
                    <i className="hd" /><i /><i style={{ width: '82%' }} /><i style={{ width: '90%' }} /><i style={{ width: '68%' }} /><i style={{ width: '76%' }} />
                  </div>
                  <div className="cv-name">{cv.name}</div>
                  <div className="cv-meta">
                    <span className="cv-date">{cv.date}</span>
                    <span className="cv-ats">{cv.ats}</span>
                  </div>
                </div>
              ))}
              <button className="cv-new"><Icon d={IC.plus} size={18} /> Nuovo CV</button>
            </div>

            <div className="sec-label">
              <span className="mono">Candidature recenti</span>
              <a>Vedi tutte</a>
            </div>
            <div className="rows">
              {APPS.map(app => (
                <div className="row" key={app.title}>
                  <div className="row-body">
                    <div className="row-title">{app.title}</div>
                    <div className="row-sub">{app.sub}</div>
                  </div>
                  <span className={`pill ${app.cls}`}>{app.pill}</span>
                  <button className="btn btn-line btn-sm">Apri</button>
                </div>
              ))}
            </div>
          </div>

          {/* RIGHT */}
          <div>
            <div className="panel">
              <h3>Completa il profilo</h3>
              <p className="psub">Un profilo completo genera CV su misura più precisi.</p>
              <div className="prog"><i style={{ width: `${progress}%` }} /></div>
              <div className="prog-meta"><span className="mono">80% completo</span><span className="mono">2 passi rimasti</span></div>
              <div className="check-list">
                <div className="check-item"><span className="ok">✓</span> Dati personali e contatti</div>
                <div className="check-item"><span className="ok">✓</span> Esperienze lavorative</div>
                <div className="check-item"><span className="ok">✓</span> Competenze</div>
                <div className="check-item pending"><span className="todo" /> Foto profilo</div>
                <div className="check-item pending"><span className="todo" /> Sommario professionale</div>
              </div>
            </div>

            <div className="panel">
              <h3>Prossimo passo</h3>
              <p className="psub">Il colloquio con <b>Velvet Studio</b> è giovedì alle 15:00. Ripassa il CV inviato e l'annuncio originale.</p>
              <button className="btn btn-line btn-sm" style={{ marginTop: 14 }}>Rivedi candidatura</button>
            </div>

            <div className="panel panel-cta">
              <span className="mono" style={{ display: 'block', marginBottom: 10 }}>Standard</span>
              <h3>PDF senza filigrana</h3>
              <p className="psub">Template premium, esportazioni illimitate e cover letter AI.</p>
              <button className="btn btn-ink btn-sm" style={{ marginTop: 14 }}>Passa a Standard</button>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
