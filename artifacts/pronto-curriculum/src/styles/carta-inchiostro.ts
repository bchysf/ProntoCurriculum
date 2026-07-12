// Shared "Carta & Inchiostro" design system — class prefix `.dv3`.
// Used by Dashboard, the CV creation wizard, and the CV editor so all three
// share the exact same tokens, fonts and component classes.
export const CARTA_INCHIOSTRO_CSS = `
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
.dv3 .side { background: #FFFFFF; border-right: 1px solid var(--hair-soft); padding: 16px 12px 12px; display: flex; flex-direction: column; position: sticky; top: 0; height: 100vh; overflow-y: auto; }
.dv3 .brand { font-family: var(--f-display); font-weight: 700; font-size: 16px; letter-spacing: -0.03em; padding: 0 10px 14px; cursor: pointer; display: flex; align-items: center; gap: 8px; }
.dv3 .brand span { background: linear-gradient(90deg, var(--accent), #7C5CFF); -webkit-background-clip: text; background-clip: text; color: transparent; }
.dv3 .brand img { width: 22px; height: 22px; object-fit: contain; flex-shrink: 0; }
.dv3 .side .mono { padding: 0 10px 8px; display: block; }
.dv3 .nav-item { display: flex; align-items: center; gap: 10px; width: 100%; padding: 8px 11px; border: none; background: transparent; border-radius: 9px; font-family: var(--f-body); font-size: 13px; font-weight: 500; color: var(--ink-60); cursor: pointer; text-align: left; transition: background .15s, color .15s; margin-bottom: 1px; }
.dv3 .nav-item:hover { background: #F4F4F8; color: var(--ink); }
.dv3 .nav-item.active { background: var(--tint); color: var(--accent); font-weight: 700; }
.dv3 .nav-item.locked { color: var(--ink-40); }
.dv3 .nav-item svg { flex-shrink: 0; }
.dv3 .nav-badge { margin-left: auto; font-family: var(--f-mono); font-size: 10px; background: #F4F4F8; border-radius: 99px; padding: 2px 8px; color: var(--ink-40); }
.dv3 .nav-item.active .nav-badge { background: rgba(47,42,229,.12); color: var(--accent); }
.dv3 .side-user { display: flex; align-items: center; gap: 9px; padding: 10px 8px 0; border-top: 1px solid var(--hair-soft); }
.dv3 .avatar { width: 30px; height: 30px; border-radius: 50%; background: linear-gradient(120deg, #6FA5FF, #BE9CFF); color: #fff; font-family: var(--f-display); font-weight: 700; font-size: 12px; display: flex; align-items: center; justify-content: center; flex-shrink: 0; overflow: hidden; }
.dv3 .avatar img { width: 100%; height: 100%; object-fit: cover; }
.dv3 .side-user b { font-size: 12.5px; display: block; }
.dv3 .side-user span { font-size: 10.5px; color: var(--ink-40); }

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

.dv3 .head { display: flex; align-items: flex-end; justify-content: space-between; gap: 20px; flex-wrap: wrap; margin-bottom: 28px; }
.dv3 h1 { font-family: var(--f-display); font-weight: 700; font-size: 28px; letter-spacing: -0.03em; }
.dv3 .head p { font-size: 13.5px; color: var(--ink-60); margin-top: 5px; }
.dv3 .btn { display: inline-flex; align-items: center; gap: 8px; border: none; cursor: pointer; font-family: var(--f-body); font-weight: 700; font-size: 13.5px; padding: 11px 18px; border-radius: 10px; transition: transform .25s var(--ease), background .2s, box-shadow .25s var(--ease); }
.dv3 .btn:active { transform: scale(.97); }
.dv3 .btn:disabled { opacity: .45; cursor: not-allowed; transform: none !important; }
.dv3 .btn-ink { background: var(--accent); color: #fff; }
.dv3 .btn-ink:hover:not(:disabled) { background: var(--accent-ink); transform: translateY(-1px); box-shadow: 0 8px 20px -8px rgba(47,42,229,.5); }
.dv3 .btn-line { background: #fff; color: var(--ink); border: 1px solid var(--hair-soft); }
.dv3 .btn-line:hover:not(:disabled) { border-color: var(--hair); transform: translateY(-1px); }
.dv3 .btn-sm { padding: 8px 13px; font-size: 12.5px; }
.dv3 .btn-ghost { background: transparent; color: var(--ink-60); border: none; }
.dv3 .btn-ghost:hover { color: var(--ink); }
.dv3 .btn-danger { color: #EF4444; }

/* STATS */
.dv3 .stats { display: grid; grid-template-columns: repeat(4, 1fr); gap: 14px; margin-bottom: 36px; }
.dv3 .stat { background: #fff; border: 1px solid var(--hair-soft); border-radius: 14px; padding: 20px 22px; transition: transform .3s var(--ease), box-shadow .3s var(--ease), border-color .2s; cursor: pointer; }
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
.dv3 .cv-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(200px, 1fr)); gap: 14px; margin-bottom: 36px; }
.dv3 .cv-card { background: #fff; border: 1px solid var(--hair-soft); border-radius: 14px; padding: 16px; cursor: pointer; transition: transform .3s var(--ease), box-shadow .3s var(--ease), border-color .2s; }
.dv3 .cv-card:hover { transform: translateY(-3px); border-color: rgba(111,140,255,.4); box-shadow: 0 16px 34px -18px rgba(60,70,180,.28); }
.dv3 .thumb { background: #FAFAFC; border: 1px solid var(--hair-soft); border-radius: 8px; padding: 14px 12px; margin-bottom: 13px; }
.dv3 .thumb i { display: block; height: 4px; border-radius: 2px; background: #E6E4F0; margin-bottom: 5px; }
.dv3 .thumb i.hd { height: 7px; width: 55%; background: #D5D2E6; margin-bottom: 8px; }
.dv3 .cv-name { font-family: var(--f-display); font-weight: 600; font-size: 14px; letter-spacing: -0.01em; }
.dv3 .cv-meta { display: flex; align-items: center; justify-content: space-between; margin-top: 5px; flex-wrap: wrap; gap: 4px; }
.dv3 .cv-date { font-size: 11.5px; color: var(--ink-40); }
.dv3 .cv-ats { font-family: var(--f-mono); font-size: 10px; color: var(--accent); background: var(--tint); border-radius: 99px; padding: 2px 8px; }
.dv3 .cv-actions { display: flex; gap: 6px; margin-top: 10px; }
.dv3 .cv-new { border: 1.5px dashed var(--hair); border-radius: 14px; background: transparent; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 8px; color: var(--ink-40); font-size: 13px; font-weight: 500; font-family: var(--f-body); cursor: pointer; min-height: 180px; transition: all .25s; width: 100%; }
.dv3 .cv-new:hover { border-color: rgba(47,42,229,.4); color: var(--accent); background: rgba(47,42,229,.02); }

/* RENAME */
.dv3 .rename-row { display: flex; gap: 6px; margin-top: 6px; }
.dv3 .rename-input { flex: 1; border: 1px solid var(--accent); border-radius: 8px; padding: 6px 10px; font-family: var(--f-body); font-size: 13px; color: var(--ink); outline: none; background: #fff; }

/* APPLICATIONS LIST */
.dv3 .rows { display: flex; flex-direction: column; gap: 10px; margin-bottom: 36px; }
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

/* PROFILE EDIT FORM */
.dv3 .profile-form { margin-top: 18px; border-top: 1px solid var(--hair-soft); padding-top: 18px; }
.dv3 .form-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
.dv3 .form-label { font-family: var(--f-mono); font-size: 10px; letter-spacing: .12em; color: var(--ink-40); display: block; margin-bottom: 5px; }
.dv3 .form-input { width: 100%; border: 1px solid var(--hair); border-radius: 8px; padding: 9px 12px; font-family: var(--f-body); font-size: 13px; color: var(--ink); background: #fff; outline: none; transition: border-color .2s, box-shadow .2s; }
.dv3 .form-input:focus { border-color: var(--accent); box-shadow: 0 0 0 3px rgba(47,42,229,.1); }
.dv3 textarea.form-input { resize: vertical; font-family: var(--f-body); line-height: 1.5; }
.dv3 .form-actions { display: flex; gap: 10px; margin-top: 14px; }

/* PROFILE META */
.dv3 .profile-meta { display: flex; gap: 14px; flex-wrap: wrap; margin-top: 8px; }
.dv3 .profile-meta span { display: flex; align-items: center; gap: 5px; font-size: 12px; color: var(--ink-60); }
.dv3 .skill-chips { display: flex; gap: 6px; flex-wrap: wrap; margin-top: 10px; }
.dv3 .skill-chip { font-family: var(--f-mono); font-size: 10px; border: 1px solid var(--hair); border-radius: 6px; padding: 3px 9px; color: var(--ink-60); }

/* EMPTY STATE */
.dv3 .empty { text-align: center; padding: 40px 20px; border: 1.5px dashed var(--hair); border-radius: 14px; color: var(--ink-40); font-size: 13.5px; margin-bottom: 36px; }
.dv3 .empty p { margin-bottom: 12px; }

/* LOCK */
.dv3 .lock-state { display: flex; flex-direction: column; align-items: center; justify-content: center; min-height: 60vh; gap: 16px; text-align: center; }
.dv3 .lock-state h2 { font-family: var(--f-display); font-weight: 700; font-size: 26px; letter-spacing: -0.02em; }
.dv3 .lock-icon { width: 52px; height: 52px; border-radius: 16px; background: var(--tint); color: var(--accent); display: flex; align-items: center; justify-content: center; }

/* LOADING */
.dv3 .loading-state { display: flex; align-items: center; justify-content: center; min-height: 60vh; flex-direction: column; gap: 16px; color: var(--ink-40); font-size: 13px; }
.dv3 .spinner { width: 28px; height: 28px; border: 2.5px solid var(--hair); border-top-color: var(--accent); border-radius: 50%; animation: dvspin .7s linear infinite; }
@keyframes dvspin { to { transform: rotate(360deg); } }

/* WIZARD */
.dv3 .wiz { display: block; min-height: 100vh; }
.dv3 .wiz-shell { max-width: 720px; margin: 0 auto; padding: 56px 24px 80px; }
.dv3 .wiz-steps { display: flex; align-items: center; gap: 8px; margin-bottom: 40px; }
.dv3 .wiz-step-dot { width: 8px; height: 8px; border-radius: 50%; background: var(--hair); transition: background .2s, transform .2s; }
.dv3 .wiz-step-dot.done { background: var(--accent); }
.dv3 .wiz-step-dot.active { background: var(--accent); transform: scale(1.4); }
.dv3 .wiz-step-line { flex: 1; height: 1px; background: var(--hair-soft); }
.dv3 .wiz-head { margin-bottom: 32px; }
.dv3 .wiz-head .mono { display: block; margin-bottom: 10px; }
.dv3 .wiz-head h1 { margin-bottom: 8px; }
.dv3 .wiz-head p { font-size: 13.5px; color: var(--ink-60); }
.dv3 .wiz-options { display: grid; grid-template-columns: repeat(3, 1fr); gap: 14px; }
.dv3 .wiz-option { background: #fff; border: 1.5px solid var(--hair-soft); border-radius: 14px; padding: 22px 18px; text-align: left; cursor: pointer; transition: border-color .2s, transform .2s var(--ease), box-shadow .2s var(--ease); }
.dv3 .wiz-option:hover { border-color: rgba(111,140,255,.4); transform: translateY(-2px); box-shadow: 0 14px 30px -18px rgba(60,70,180,.25); }
.dv3 .wiz-option.selected { border-color: var(--accent); background: var(--tint); }
.dv3 .wiz-option-icon { width: 38px; height: 38px; border-radius: 10px; background: var(--tint); color: var(--accent); display: flex; align-items: center; justify-content: center; margin-bottom: 14px; }
.dv3 .wiz-option h3 { font-family: var(--f-display); font-weight: 600; font-size: 14.5px; margin-bottom: 5px; }
.dv3 .wiz-option p { font-size: 12px; color: var(--ink-60); line-height: 1.5; }
.dv3 .wiz-langs { display: flex; flex-wrap: wrap; gap: 10px; }
.dv3 .wiz-lang { display: flex; align-items: center; gap: 8px; background: #fff; border: 1.5px solid var(--hair-soft); border-radius: 12px; padding: 12px 18px; cursor: pointer; font-family: var(--f-body); font-size: 13.5px; font-weight: 500; color: var(--ink); transition: border-color .2s, transform .2s; }
.dv3 .wiz-lang:hover { border-color: rgba(111,140,255,.4); transform: translateY(-1px); }
.dv3 .wiz-lang.selected { border-color: var(--accent); background: var(--tint); color: var(--accent-ink); font-weight: 700; }
.dv3 .wiz-dropzone { border: 1.5px dashed var(--hair); border-radius: 14px; padding: 40px 24px; text-align: center; cursor: pointer; transition: border-color .2s, background .2s; }
.dv3 .wiz-dropzone:hover, .dv3 .wiz-dropzone.drag { border-color: var(--accent); background: var(--tint); }
.dv3 .wiz-dropzone-icon { width: 44px; height: 44px; border-radius: 12px; background: var(--tint); color: var(--accent); display: flex; align-items: center; justify-content: center; margin: 0 auto 14px; }
.dv3 .wiz-footer { display: flex; justify-content: space-between; align-items: center; margin-top: 32px; }
.dv3 .wiz-error { margin-top: 14px; font-size: 12.5px; color: #B42318; background: #FEF3F2; border: 1px solid #FDA29B; border-radius: 8px; padding: 10px 14px; }
.dv3 .tpl-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 14px; }
.dv3 .tpl-card { background: #fff; border: 1.5px solid var(--hair-soft); border-radius: 14px; padding: 12px; cursor: pointer; text-align: left; transition: border-color .2s, transform .2s var(--ease), box-shadow .2s var(--ease); }
.dv3 .tpl-card:hover { border-color: rgba(111,140,255,.4); transform: translateY(-2px); box-shadow: 0 14px 30px -18px rgba(60,70,180,.25); }
.dv3 .tpl-card.selected { border-color: var(--accent); }
.dv3 .tpl-preview { background: var(--page); border-radius: 8px; overflow: hidden; margin-bottom: 10px; }
.dv3 .tpl-name { font-family: var(--f-display); font-weight: 600; font-size: 13px; }
.dv3 .tpl-badge { font-family: var(--f-mono); font-size: 9.5px; letter-spacing: .04em; border-radius: 99px; padding: 2px 8px; color: #fff; display: inline-block; margin-top: 5px; }

/* EDITOR ACCORDION PANELS */
.dv3 .acc { background: #fff; border: 1px solid var(--hair-soft); border-radius: 14px; margin-bottom: 12px; overflow: hidden; }
.dv3 .acc-trigger { width: 100%; display: flex; align-items: center; justify-content: space-between; gap: 10px; padding: 16px 18px; border: none; background: transparent; cursor: pointer; text-align: left; font-family: var(--f-display); font-weight: 600; font-size: 14px; color: var(--ink); }
.dv3 .acc-trigger.open { color: var(--accent); }
.dv3 .acc-chevron { font-family: var(--f-mono); font-size: 10px; color: var(--ink-40); transition: transform .2s var(--ease); }
.dv3 .acc-trigger.open .acc-chevron { color: var(--accent); }
.dv3 .acc-content { padding: 0 18px 20px; border-top: 1px solid var(--hair-soft); padding-top: 18px; }

/* AI ASSISTANT — floating draggable window */
.dv3 .ai-float { position: fixed; width: 320px; max-height: min(70vh, 560px); background: linear-gradient(180deg, #FBFBFF 0%, #fff 60%); border: 1px solid rgba(47,42,229,.18); border-radius: 14px; box-shadow: 0 24px 60px -20px rgba(30,20,120,.4); z-index: 80; display: flex; flex-direction: column; overflow: hidden; }
.dv3 .ai-float-head { display: flex; align-items: center; gap: 8px; padding: 11px 8px 11px 14px; cursor: grab; user-select: none; background: rgba(255,255,255,.7); border-bottom: 1px solid var(--hair-soft); touch-action: none; }
.dv3 .ai-float-head:active { cursor: grabbing; }
.dv3 .ai-float-head .ico { width: 24px; height: 24px; border-radius: 7px; background: var(--tint); color: var(--accent); display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
.dv3 .ai-float-head .title { font-family: var(--f-display); font-weight: 600; font-size: 13px; flex: 1; }
.dv3 .ai-float-actions { display: flex; gap: 2px; }
.dv3 .ai-float-actions button { width: 24px; height: 24px; border-radius: 6px; border: none; background: transparent; color: var(--ink-40); cursor: pointer; font-size: 13px; line-height: 1; display: flex; align-items: center; justify-content: center; }
.dv3 .ai-float-actions button:hover { background: var(--tint); color: var(--accent); }
.dv3 .ai-float-body { padding: 14px; overflow-y: auto; }
.dv3 .ai-float-sub { font-size: 11.5px; color: var(--ink-60); margin-bottom: 14px; }
.dv3 .ai-float-reopen { position: fixed; z-index: 80; display: flex; align-items: center; gap: 8px; padding: 12px 18px; border-radius: 99px; border: none; background: var(--accent); color: #fff; font-family: var(--f-body); font-weight: 700; font-size: 13px; cursor: pointer; box-shadow: 0 14px 30px -10px rgba(47,42,229,.5); transition: transform .2s var(--ease), background .2s; }
.dv3 .ai-float-reopen:hover { background: var(--accent-ink); transform: translateY(-1px); }
.dv3 .ai-tip { display: flex; gap: 9px; align-items: flex-start; padding: 10px 0; border-top: 1px solid var(--hair-soft); font-size: 12.5px; line-height: 1.5; color: var(--ink-60); }
.dv3 .ai-tip:first-of-type { border-top: none; }
.dv3 .ai-tip .dot { width: 5px; height: 5px; border-radius: 50%; background: var(--accent); margin-top: 6px; flex-shrink: 0; }
.dv3 .ai-panel-empty { font-size: 12px; color: var(--ink-40); text-align: center; padding: 18px 0; }

@media (max-width: 1080px) { .dv3 .cols { grid-template-columns: 1fr; } .dv3 .stats { grid-template-columns: repeat(2, 1fr); } }
@media (max-width: 860px) {
  .dv3 { grid-template-columns: 1fr; }
  .dv3 .side { position: static; height: auto; flex-direction: row; align-items: center; overflow-x: auto; padding: 12px 16px; flex-wrap: nowrap; }
  .dv3 .side .mono, .dv3 .side-user, .dv3 .side-foot { display: none; }
  .dv3 .brand { padding: 0 14px 0 0; white-space: nowrap; }
  .dv3 .nav-item { width: auto; white-space: nowrap; }
  .dv3 .main { padding: 0 20px 40px; }
  .dv3 .stats { grid-template-columns: repeat(2, 1fr); }
  .dv3 .head { flex-direction: column; align-items: flex-start; }
  .dv3 .form-grid { grid-template-columns: 1fr; }
  .dv3 .wiz-options, .dv3 .tpl-grid { grid-template-columns: 1fr; }
}
`;
