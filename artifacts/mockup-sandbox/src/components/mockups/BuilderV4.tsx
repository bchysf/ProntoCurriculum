import { useState } from "react";

// ─────────────────────────────────────────────────────────────────────────────
// BuilderV4 — "Scrivania" · restyling completo dell'area Crea CV.
// Obiettivo: chiarezza da grande competitor (resume.io / FlowCV), zero emoji,
// AI presente ma discreta, tutte le funzionalità attuali riorganizzate:
//   topbar documento (nome, salvataggio, ATS, export) · rail a step numerati
//   · form una-sezione-per-volta · anteprima A4 con zoom · galleria template
//   (12 esistenti + 4 nuovi) · analisi ATS come vista dedicata · strumenti
//   (importa, CV su misura, traduzione) raggruppati.
// Sistema: Carta & Inchiostro (Switzer/Satoshi/Plex Mono, ink, accent indigo).
// ─────────────────────────────────────────────────────────────────────────────

const CSS = `
@import url('https://api.fontshare.com/v2/css?f[]=switzer@400,500,600,700&f[]=satoshi@400,500,700&display=swap');
@import url('https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@400;500&display=swap');
@import url('https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,500;9..144,640&display=swap');

.bv4 {
  --ink: #14171F;
  --ink-60: #565B66;
  --ink-40: #9297A1;
  --hair: rgba(20, 23, 31, 0.12);
  --hair-soft: rgba(20, 23, 31, 0.07);
  --accent: #2F2AE5;
  --accent-ink: #221FB4;
  --tint: #EEEDFC;
  --page: #F6F6F9;
  --ok: #12805C;
  --warn: #B7791F;
  --f-display: 'Switzer', 'Helvetica Neue', Arial, sans-serif;
  --f-body: 'Satoshi', 'Helvetica Neue', sans-serif;
  --f-mono: 'IBM Plex Mono', monospace;
  font-family: var(--f-body);
  background: var(--page);
  color: var(--ink);
  -webkit-font-smoothing: antialiased;
  height: 100vh;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}
.bv4 * { margin: 0; padding: 0; box-sizing: border-box; }
.bv4 .mono { font-family: var(--f-mono); font-size: 10px; letter-spacing: .13em; text-transform: uppercase; color: var(--ink-40); }
.bv4 button { font-family: var(--f-body); cursor: pointer; }

/* ── TOPBAR ─────────────────────────────────────────────────── */
.bv4 .top {
  height: 54px; background: #fff; border-bottom: 1px solid var(--hair-soft);
  display: flex; align-items: center; gap: 14px; padding: 0 16px; flex-shrink: 0;
}
.bv4 .top .back { display: flex; align-items: center; gap: 7px; border: none; background: none; color: var(--ink-60); font-size: 13px; font-weight: 500; padding: 7px 9px; border-radius: 8px; }
.bv4 .top .back:hover { background: #F2F2F6; color: var(--ink); }
.bv4 .doc { display: flex; align-items: center; gap: 9px; min-width: 0; }
.bv4 .doc-name { font-family: var(--f-display); font-weight: 600; font-size: 14.5px; letter-spacing: -0.01em; border: 1px solid transparent; padding: 5px 8px; border-radius: 7px; }
.bv4 .doc-name:hover { border-color: var(--hair); }
.bv4 .doc-saved { font-size: 11.5px; color: var(--ink-40); display: flex; align-items: center; gap: 5px; white-space: nowrap; }
.bv4 .doc-saved i { width: 6px; height: 6px; border-radius: 50%; background: var(--ok); display: inline-block; }
.bv4 .top-right { margin-left: auto; display: flex; align-items: center; gap: 8px; }

.bv4 .ats-chip {
  display: flex; align-items: center; gap: 9px; background: #fff; border: 1px solid var(--hair);
  border-radius: 9px; padding: 7px 11px; font-size: 12px; font-weight: 700; color: var(--ink);
}
.bv4 .ats-chip:hover { border-color: var(--accent); }
.bv4 .ats-track { width: 72px; height: 5px; background: #EDEDF2; border-radius: 99px; overflow: hidden; }
.bv4 .ats-fill { height: 100%; width: 72%; background: var(--ok); border-radius: 99px; }
.bv4 .ats-n { font-family: var(--f-mono); font-size: 11.5px; color: var(--ok); }

.bv4 .btn { display: inline-flex; align-items: center; gap: 7px; border: none; font-weight: 700; font-size: 13px; padding: 9px 14px; border-radius: 9px; transition: all .15s; }
.bv4 .btn-ink { background: var(--accent); color: #fff; }
.bv4 .btn-ink:hover { background: var(--accent-ink); }
.bv4 .btn-line { background: #fff; color: var(--ink); border: 1px solid var(--hair); }
.bv4 .btn-line:hover { border-color: var(--ink-40); }
.bv4 .btn-ghost { background: transparent; color: var(--ink-60); }
.bv4 .btn-ghost:hover { color: var(--ink); background: #F2F2F6; }
.bv4 .btn-sm { padding: 7px 11px; font-size: 12.5px; }

/* ── BODY GRID ──────────────────────────────────────────────── */
.bv4 .body { flex: 1; display: flex; min-height: 0; }

/* rail */
.bv4 .rail { width: 216px; background: #fff; border-right: 1px solid var(--hair-soft); padding: 16px 10px 12px; display: flex; flex-direction: column; gap: 2px; flex-shrink: 0; overflow-y: auto; }
.bv4 .rail .mono { padding: 0 10px 8px; }
.bv4 .step { display: flex; align-items: center; gap: 10px; padding: 8px 10px; border-radius: 9px; border: none; background: none; font-size: 13px; font-weight: 500; color: var(--ink-60); text-align: left; width: 100%; }
.bv4 .step:hover { background: #F4F4F8; color: var(--ink); }
.bv4 .step.active { background: var(--tint); color: var(--accent-ink); font-weight: 700; }
.bv4 .step .n {
  width: 21px; height: 21px; border-radius: 50%; border: 1.5px solid var(--hair);
  font-family: var(--f-mono); font-size: 10.5px; display: flex; align-items: center; justify-content: center; flex-shrink: 0; color: var(--ink-40); background: #fff;
}
.bv4 .step.done .n { background: var(--ok); border-color: var(--ok); color: #fff; }
.bv4 .step.active .n { border-color: var(--accent); color: var(--accent); }
.bv4 .rail hr { border: none; border-top: 1px solid var(--hair-soft); margin: 12px 4px; }
.bv4 .tool { display: flex; align-items: center; gap: 10px; padding: 8px 10px; border-radius: 9px; border: none; background: none; font-size: 12.5px; font-weight: 500; color: var(--ink-60); text-align: left; width: 100%; }
.bv4 .tool:hover { background: #F4F4F8; color: var(--ink); }
.bv4 .tool svg { flex-shrink: 0; color: var(--ink-40); }
.bv4 .tool .tag { margin-left: auto; font-family: var(--f-mono); font-size: 9px; background: var(--tint); color: var(--accent); padding: 2px 6px; border-radius: 99px; }

/* form column */
.bv4 .form-col { flex: 1; min-width: 0; overflow-y: auto; padding: 26px 32px 40px; }
.bv4 .form-inner { max-width: 640px; margin: 0 auto; }
.bv4 .sec-head h2 { font-family: var(--f-display); font-size: 21px; font-weight: 700; letter-spacing: -0.02em; }
.bv4 .sec-head p { font-size: 13px; color: var(--ink-60); margin-top: 4px; line-height: 1.5; }
.bv4 .sec-head { margin-bottom: 20px; display: flex; align-items: flex-end; justify-content: space-between; gap: 14px; }

.bv4 .exp-card { background: #fff; border: 1px solid var(--hair-soft); border-radius: 13px; margin-bottom: 12px; overflow: hidden; }
.bv4 .exp-head { display: flex; align-items: center; gap: 10px; padding: 13px 16px; }
.bv4 .exp-head .grip { color: var(--ink-40); cursor: grab; font-size: 13px; letter-spacing: -2px; }
.bv4 .exp-title b { font-size: 13.5px; display: block; }
.bv4 .exp-title span { font-size: 11.5px; color: var(--ink-40); }
.bv4 .exp-head .spacer { margin-left: auto; }
.bv4 .icon-btn { width: 28px; height: 28px; border-radius: 7px; border: none; background: none; color: var(--ink-40); display: flex; align-items: center; justify-content: center; }
.bv4 .icon-btn:hover { background: #F2F2F6; color: var(--ink); }

.bv4 .exp-body { padding: 4px 16px 16px; border-top: 1px solid var(--hair-soft); }
.bv4 .frow { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; margin-top: 12px; }
.bv4 .fgroup label { display: block; font-size: 11.5px; font-weight: 700; color: var(--ink-60); margin-bottom: 5px; }
.bv4 .fgroup input, .bv4 .fgroup textarea {
  width: 100%; border: 1px solid var(--hair); border-radius: 9px; padding: 9px 11px;
  font-family: var(--f-body); font-size: 13px; color: var(--ink); background: #fff; outline: none; resize: vertical;
}
.bv4 .fgroup input:focus, .bv4 .fgroup textarea:focus { border-color: var(--accent); box-shadow: 0 0 0 3px rgba(47,42,229,.09); }
.bv4 .full { grid-column: 1 / -1; }
.bv4 .desc-foot { display: flex; align-items: center; gap: 6px; margin-top: 8px; }
.bv4 .ai-quiet {
  display: inline-flex; align-items: center; gap: 6px; border: none; background: none;
  font-size: 12px; font-weight: 700; color: var(--accent); padding: 5px 8px; border-radius: 7px;
}
.bv4 .ai-quiet:hover { background: var(--tint); }
.bv4 .hint { font-size: 11px; color: var(--ink-40); margin-left: auto; }

.bv4 .add-block {
  width: 100%; border: 1.5px dashed var(--hair); background: none; border-radius: 13px;
  padding: 15px; font-size: 13px; font-weight: 700; color: var(--ink-60); margin-top: 2px;
}
.bv4 .add-block:hover { border-color: var(--accent); color: var(--accent); background: rgba(47,42,229,.03); }

.bv4 .sec-foot { display: flex; justify-content: space-between; align-items: center; margin-top: 26px; }

/* preview column */
.bv4 .prev-col { width: 44%; max-width: 620px; min-width: 380px; background: #ECECF1; border-left: 1px solid var(--hair-soft); display: flex; flex-direction: column; flex-shrink: 0; }
.bv4 .prev-bar { display: flex; align-items: center; gap: 8px; padding: 10px 14px; background: rgba(255,255,255,.65); backdrop-filter: blur(6px); border-bottom: 1px solid var(--hair-soft); }
.bv4 .tpl-pick { display: flex; align-items: center; gap: 8px; background: #fff; border: 1px solid var(--hair); border-radius: 9px; padding: 6px 10px; font-size: 12.5px; font-weight: 700; }
.bv4 .tpl-pick i { width: 14px; height: 18px; border-radius: 2px; background: linear-gradient(180deg, var(--ink) 30%, #fff 30%); border: 1px solid var(--hair); display: inline-block; }
.bv4 .zoom { margin-left: auto; display: flex; align-items: center; gap: 2px; background: #fff; border: 1px solid var(--hair); border-radius: 9px; padding: 2px; }
.bv4 .zoom button { width: 26px; height: 24px; border: none; background: none; color: var(--ink-60); font-size: 14px; border-radius: 7px; }
.bv4 .zoom button:hover { background: #F2F2F6; }
.bv4 .zoom span { font-family: var(--f-mono); font-size: 10.5px; padding: 0 6px; color: var(--ink-60); }
.bv4 .pageno { font-family: var(--f-mono); font-size: 10.5px; color: var(--ink-40); }

.bv4 .prev-scroll { flex: 1; overflow: auto; display: flex; justify-content: center; padding: 22px 18px; }
.bv4 .a4 { width: 425px; height: 601px; background: #fff; box-shadow: 0 10px 34px rgba(20,23,31,.14); border-radius: 3px; padding: 34px 36px; position: relative; flex-shrink: 0; overflow: hidden; }

/* fake CV render (template "Zurigo") */
.bv4 .cv-name { font-family: var(--f-display); font-weight: 700; font-size: 22px; letter-spacing: -0.02em; }
.bv4 .cv-role { font-size: 11px; color: #566; margin-top: 3px; }
.bv4 .cv-meta { font-size: 8.5px; color: #99a; margin-top: 5px; }
.bv4 .cv-rule { border: none; border-top: 1.5px solid #14171F; margin: 14px 0 12px; }
.bv4 .cv-grid { display: grid; grid-template-columns: 86px 1fr; gap: 8px 16px; }
.bv4 .cv-lab { font-size: 7.5px; letter-spacing: .12em; text-transform: uppercase; color: #99a; font-weight: 700; padding-top: 2px; }
.bv4 .cv-b { font-size: 9.5px; line-height: 1.55; color: #333; }
.bv4 .cv-b b { display: block; font-size: 10px; color: #14171F; }
.bv4 .cv-b .d { color: #99a; font-size: 8.5px; margin-bottom: 2px; }
.bv4 .cv-sep { grid-column: 1 / -1; border: none; border-top: 1px solid #EAEAEE; margin: 4px 0; }
.bv4 .wmark { position: absolute; inset: 0; display: flex; align-items: center; justify-content: center; pointer-events: none; }
.bv4 .wmark span { font-family: var(--f-display); font-weight: 700; font-size: 34px; color: rgba(47,42,229,.06); transform: rotate(-35deg); white-space: nowrap; }

/* ── VIEW SWITCHER (solo mockup) ───────────────────────────── */
.bv4 .views { position: fixed; bottom: 16px; left: 50%; transform: translateX(-50%); display: flex; gap: 4px; background: var(--ink); padding: 5px; border-radius: 99px; box-shadow: 0 12px 30px rgba(20,23,31,.35); z-index: 60; }
.bv4 .views button { border: none; background: none; color: rgba(255,255,255,.65); font-size: 12px; font-weight: 700; padding: 7px 14px; border-radius: 99px; }
.bv4 .views button.on { background: #fff; color: var(--ink); }

/* ── TEMPLATE GALLERY ──────────────────────────────────────── */
.bv4 .gal { flex: 1; overflow-y: auto; padding: 28px 36px 80px; }
.bv4 .gal-inner { max-width: 1060px; margin: 0 auto; }
.bv4 .gal-head { display: flex; align-items: flex-end; justify-content: space-between; margin-bottom: 8px; }
.bv4 .gal-head h2 { font-family: var(--f-display); font-size: 22px; font-weight: 700; letter-spacing: -0.02em; }
.bv4 .gal-head p { font-size: 13px; color: var(--ink-60); margin-top: 4px; }
.bv4 .fchips { display: flex; gap: 6px; margin: 16px 0 20px; }
.bv4 .fchip { border: 1px solid var(--hair); background: #fff; border-radius: 99px; padding: 6px 13px; font-size: 12px; font-weight: 700; color: var(--ink-60); }
.bv4 .fchip.on { background: var(--ink); border-color: var(--ink); color: #fff; }
.bv4 .tgrid { display: grid; grid-template-columns: repeat(auto-fill, minmax(190px, 1fr)); gap: 18px; }
.bv4 .tcard { background: none; border: none; text-align: left; }
.bv4 .tthumb { aspect-ratio: 210/280; background: #fff; border: 1px solid var(--hair-soft); border-radius: 10px; box-shadow: 0 2px 10px rgba(20,23,31,.05); overflow: hidden; position: relative; padding: 13px 14px; transition: all .18s; }
.bv4 .tcard:hover .tthumb { transform: translateY(-3px); box-shadow: 0 14px 28px rgba(20,23,31,.13); border-color: var(--hair); }
.bv4 .tcard.sel .tthumb { outline: 2.5px solid var(--accent); outline-offset: 2px; }
.bv4 .tmeta { display: flex; align-items: center; gap: 7px; padding: 9px 3px 0; }
.bv4 .tmeta b { font-size: 12.5px; }
.bv4 .tmeta .ats { margin-left: auto; font-family: var(--f-mono); font-size: 9px; color: var(--ok); }
.bv4 .newb { position: absolute; top: 8px; right: 8px; background: var(--accent); color: #fff; font-size: 9px; font-weight: 800; letter-spacing: .06em; padding: 3px 7px; border-radius: 99px; }
.bv4 .selb { position: absolute; top: 8px; left: 8px; background: var(--ink); color: #fff; font-size: 9px; font-weight: 800; padding: 3px 7px; border-radius: 99px; }

/* thumbnail primitives */
.bv4 .tt-name { font-weight: 800; color: #1c1f26; font-size: 10px; letter-spacing: -0.01em; }
.bv4 .tt-line { height: 3px; border-radius: 2px; background: #E7E7EC; margin-top: 4px; }
.bv4 .tt-sec { height: 4px; width: 42%; border-radius: 2px; margin: 9px 0 5px; }

/* ── ATS VIEW ──────────────────────────────────────────────── */
.bv4 .ats-view { flex: 1; overflow-y: auto; padding: 28px 36px 80px; }
.bv4 .ats-inner { max-width: 860px; margin: 0 auto; }
.bv4 .panel { background: #fff; border: 1px solid var(--hair-soft); border-radius: 13px; padding: 20px; margin-bottom: 14px; }
.bv4 .score-row { display: flex; gap: 22px; align-items: center; }
.bv4 .ring { width: 92px; height: 92px; border-radius: 50%; background: conic-gradient(var(--ok) 0 72%, #EDEDF2 72% 100%); display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
.bv4 .ring i { width: 70px; height: 70px; border-radius: 50%; background: #fff; display: flex; align-items: center; justify-content: center; font-family: var(--f-display); font-weight: 700; font-size: 21px; font-style: normal; }
.bv4 .kpi { flex: 1; }
.bv4 .kpi-row { display: flex; align-items: center; gap: 10px; padding: 7px 0; border-bottom: 1px solid var(--hair-soft); }
.bv4 .kpi-row:last-child { border-bottom: none; }
.bv4 .kpi-row b { font-size: 12.5px; width: 170px; font-weight: 600; }
.bv4 .kbar { flex: 1; height: 5px; background: #EDEDF2; border-radius: 99px; overflow: hidden; }
.bv4 .kbar i { display: block; height: 100%; border-radius: 99px; }
.bv4 .kpi-row .val { font-family: var(--f-mono); font-size: 10.5px; width: 46px; text-align: right; }
.bv4 .jd-box textarea { width: 100%; border: 1px solid var(--hair); border-radius: 10px; min-height: 88px; padding: 11px 13px; font-family: var(--f-body); font-size: 13px; outline: none; resize: vertical; }
.bv4 .kws { display: flex; flex-wrap: wrap; gap: 6px; margin-top: 12px; }
.bv4 .kw { font-size: 11.5px; font-weight: 700; padding: 4px 10px; border-radius: 99px; }
.bv4 .kw.ok { background: #E7F5EE; color: var(--ok); }
.bv4 .kw.miss { background: #FDF0F0; color: #B23B3B; }
`;

// ── icons ────────────────────────────────────────────────────────────────────
function Ic({ d, s = 15 }: { d: string; s?: number }) {
  return (
    <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor"
      strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      {d.split("|").map((p, i) => <path key={i} d={p} />)}
    </svg>
  );
}
const I = {
  back: "M19 12H5|M12 19l-7-7 7-7",
  down: "M12 5v14|M5 12l7 7 7-7",
  eye: "M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7z|M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6z",
  doc: "M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z|M14 2v6h6",
  spark: "M12 3l1.9 5.6 5.6 1.9-5.6 1.9L12 18l-1.9-5.6L4.5 10.5l5.6-1.9z",
  trash: "M3 6h18|M8 6V4a1 1 0 0 1 1-1h6a1 1 0 0 1 1 1v2|M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6",
  chev: "M6 9l6 6 6-6",
  imp: "M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4|M7 10l5 5 5-5|M12 15V3",
  target: "M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20z|M12 18a6 6 0 1 0 0-12 6 6 0 0 0 0 12z|M12 14a2 2 0 1 0 0-4 2 2 0 0 0 0 4z",
  globe: "M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20z|M2 12h20|M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z",
  gauge: "M12 20a8 8 0 1 0-8-8|M12 12l4-4",
  mail: "M4 4h16a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2z|M22 6l-10 7L2 6",
  plus: "M12 5v14|M5 12h14",
  dots: "M12 13a1 1 0 1 0 0-2 1 1 0 0 0 0 2z|M19 13a1 1 0 1 0 0-2 1 1 0 0 0 0 2z|M5 13a1 1 0 1 0 0-2 1 1 0 0 0 0 2z",
};

// ── template thumbnails ──────────────────────────────────────────────────────
type Tpl = { id: string; name: string; isNew?: boolean; cat: "classici" | "moderni" | "nuovi" };

const TEMPLATES: Tpl[] = [
  { id: "zurigo", name: "Zurigo", isNew: true, cat: "nuovi" },
  { id: "atlante", name: "Atlante", isNew: true, cat: "nuovi" },
  { id: "sereno", name: "Sereno", isNew: true, cat: "nuovi" },
  { id: "verona", name: "Verona", isNew: true, cat: "nuovi" },
  { id: "modern", name: "Moderno", cat: "moderni" },
  { id: "minimal", name: "Minimal", cat: "moderni" },
  { id: "executive", name: "Executive", cat: "classici" },
  { id: "professionale", name: "Professionale", cat: "classici" },
  { id: "europass", name: "Europass", cat: "classici" },
  { id: "classico", name: "Classico", cat: "classici" },
  { id: "tecnico", name: "Tecnico", cat: "moderni" },
  { id: "compatto", name: "Compatto", cat: "moderni" },
  { id: "milano", name: "Milano", cat: "moderni" },
  { id: "elegante", name: "Elegante", cat: "classici" },
  { id: "nordico", name: "Nordico", cat: "moderni" },
  { id: "corporate", name: "Corporate", cat: "classici" },
];

function Lines({ n = 3, w = [100, 92, 74] }: { n?: number; w?: number[] }) {
  return <>{Array.from({ length: n }).map((_, i) => <div key={i} className="tt-line" style={{ width: `${w[i % w.length]}%` }} />)}</>;
}

function Thumb({ id }: { id: string }) {
  switch (id) {
    case "zurigo": // svizzero: nome grande, regola nera, griglia label/contenuto
      return (
        <div>
          <div className="tt-name" style={{ fontSize: 12 }}>Giulia Ferraro</div>
          <div className="tt-line" style={{ width: "38%", background: "#C9C9D2" }} />
          <div style={{ borderTop: "2px solid #1c1f26", margin: "8px 0 7px" }} />
          <div style={{ display: "grid", gridTemplateColumns: "26% 1fr", gap: "5px 8px" }}>
            <div className="tt-line" style={{ width: "90%", background: "#C9C9D2", marginTop: 1 }} />
            <div><Lines n={2} /></div>
            <div className="tt-line" style={{ width: "90%", background: "#C9C9D2", marginTop: 1 }} />
            <div><Lines n={3} /></div>
            <div className="tt-line" style={{ width: "90%", background: "#C9C9D2", marginTop: 1 }} />
            <div><Lines n={2} w={[88, 66]} /></div>
          </div>
        </div>
      );
    case "atlante": // banda laterale ink
      return (
        <div style={{ display: "grid", gridTemplateColumns: "32% 1fr", gap: 9, height: "100%" }}>
          <div style={{ background: "#1c1f26", borderRadius: 5, padding: "9px 7px" }}>
            <div style={{ width: 22, height: 22, borderRadius: "50%", background: "#3d4250", marginBottom: 7 }} />
            <div className="tt-line" style={{ background: "#4a4f5c", width: "92%" }} />
            <div className="tt-line" style={{ background: "#4a4f5c", width: "70%" }} />
            <div className="tt-sec" style={{ background: "#6b6fff", width: "60%" }} />
            <div className="tt-line" style={{ background: "#4a4f5c" }} />
            <div className="tt-line" style={{ background: "#4a4f5c", width: "80%" }} />
          </div>
          <div>
            <div className="tt-name">Luca Bianchi</div>
            <div className="tt-sec" style={{ background: "#1c1f26" }} />
            <Lines n={3} />
            <div className="tt-sec" style={{ background: "#1c1f26" }} />
            <Lines n={2} w={[95, 70]} />
          </div>
        </div>
      );
    case "sereno": // banda tinta chiara, arrotondato
      return (
        <div>
          <div style={{ background: "#E9F0FB", borderRadius: 7, padding: "9px 10px", marginBottom: 8 }}>
            <div className="tt-name">Sara Conti</div>
            <div className="tt-line" style={{ width: "44%", background: "#B9CDEB" }} />
          </div>
          <div className="tt-sec" style={{ background: "#4C7DD0", borderRadius: 99 }} />
          <Lines n={3} />
          <div className="tt-sec" style={{ background: "#4C7DD0", borderRadius: 99 }} />
          <Lines n={2} w={[90, 64]} />
        </div>
      );
    case "verona": // editoriale serif
      return (
        <div style={{ textAlign: "center" }}>
          <div style={{ fontFamily: "Fraunces, Georgia, serif", fontWeight: 640, fontSize: 13, color: "#1c1f26" }}>Elena Vitale</div>
          <div className="tt-line" style={{ width: "30%", margin: "5px auto 0", background: "#C9C9D2" }} />
          <div style={{ borderTop: "1px solid #1c1f26", borderBottom: "1px solid #1c1f26", height: 3, margin: "8px 0" }} />
          <div style={{ textAlign: "left" }}>
            <div className="tt-sec" style={{ background: "#8a6d3b", margin: "6px auto 5px 0" }} />
            <Lines n={3} />
            <div className="tt-sec" style={{ background: "#8a6d3b" }} />
            <Lines n={2} w={[86, 60]} />
          </div>
        </div>
      );
    case "europass":
      return (
        <div>
          <div style={{ background: "#003399", borderRadius: 4, padding: "8px 9px", marginBottom: 8 }}>
            <div className="tt-name" style={{ color: "#fff" }}>Mario Rossi</div>
            <div className="tt-line" style={{ width: "42%", background: "#3b63c4" }} />
          </div>
          <div className="tt-sec" style={{ background: "#003399" }} />
          <Lines n={3} />
          <div className="tt-sec" style={{ background: "#003399" }} />
          <Lines n={2} />
        </div>
      );
    case "modern": case "executive": case "professionale": case "compatto":
      return (
        <div>
          <div style={{ background: "#1c2b4a", borderRadius: 4, padding: "8px 9px", marginBottom: 8 }}>
            <div className="tt-name" style={{ color: "#fff" }}>Mario Rossi</div>
            <div className="tt-line" style={{ width: "42%", background: "#41527a" }} />
          </div>
          <div className="tt-sec" style={{ background: id === "professionale" ? "#1c2b4a" : "#C9A84C" }} />
          <Lines n={3} />
          <div className="tt-sec" style={{ background: id === "professionale" ? "#1c2b4a" : "#C9A84C" }} />
          <Lines n={2} />
        </div>
      );
    case "elegante":
      return (
        <div style={{ background: "#FBF7EE", borderRadius: 5, height: "100%", padding: "9px 10px" }}>
          <div style={{ fontFamily: "Fraunces, Georgia, serif", fontWeight: 640, fontSize: 12, color: "#2c2416" }}>Mario Rossi</div>
          <div style={{ borderTop: "1px solid #C9A84C", margin: "6px 0" }} />
          <div className="tt-sec" style={{ background: "#96643299" }} />
          <Lines n={3} />
          <div className="tt-sec" style={{ background: "#96643299" }} />
          <Lines n={2} w={[88, 58]} />
        </div>
      );
    case "tecnico":
      return (
        <div>
          <div style={{ background: "#2D3748", borderRadius: 4, padding: "8px 9px", marginBottom: 8 }}>
            <div className="tt-name" style={{ color: "#fff", fontFamily: "var(--f-mono)", fontSize: 9 }}>MARIO_ROSSI</div>
          </div>
          <div className="tt-sec" style={{ background: "#4299E1" }} />
          <Lines n={3} />
          <div className="tt-sec" style={{ background: "#4299E1" }} />
          <Lines n={2} />
        </div>
      );
    case "nordico":
      return (
        <div>
          <div className="tt-name" style={{ color: "#1E4E34" }}>Mario Rossi</div>
          <div className="tt-line" style={{ width: "36%", background: "#BFD5C8" }} />
          <div className="tt-sec" style={{ background: "#1E4E34", marginTop: 10 }} />
          <Lines n={3} />
          <div className="tt-sec" style={{ background: "#1E4E34" }} />
          <Lines n={2} w={[90, 62]} />
        </div>
      );
    case "corporate":
      return (
        <div>
          <div style={{ background: "#ECEFF4", borderRadius: 4, padding: "8px 9px", marginBottom: 8 }}>
            <div className="tt-name">Mario Rossi</div>
            <div className="tt-line" style={{ width: "42%", background: "#C9CFDA" }} />
          </div>
          <div className="tt-sec" style={{ background: "#1c2b4a" }} />
          <Lines n={3} />
          <div className="tt-sec" style={{ background: "#1c2b4a" }} />
          <Lines n={2} />
        </div>
      );
    default: // minimal / classico / milano
      return (
        <div>
          <div className="tt-name">Mario Rossi</div>
          <div className="tt-line" style={{ width: "36%", background: "#C9C9D2" }} />
          <div style={{ borderTop: "1.5px solid #1c2b4a", margin: "7px 0" }} />
          <div className="tt-sec" style={{ background: "#1c2b4a" }} />
          <Lines n={3} />
          <div className="tt-sec" style={{ background: "#1c2b4a" }} />
          <Lines n={2} w={[88, 60]} />
        </div>
      );
  }
}

// ── sub-views ────────────────────────────────────────────────────────────────
const STEPS = [
  { n: 1, label: "Dati personali", done: true },
  { n: 2, label: "Profilo", done: true },
  { n: 3, label: "Esperienze", active: true },
  { n: 4, label: "Formazione" },
  { n: 5, label: "Competenze" },
  { n: 6, label: "Lingue" },
];

function EditorView() {
  return (
    <div className="body">
      {/* RAIL */}
      <aside className="rail">
        <span className="mono">Sezioni del CV</span>
        {STEPS.map(s => (
          <button key={s.n} className={`step${s.active ? " active" : ""}${s.done ? " done" : ""}`}>
            <span className="n">{s.done ? "✓" : s.n}</span>
            {s.label}
          </button>
        ))}
        <hr />
        <span className="mono">Strumenti</span>
        <button className="tool"><Ic d={I.imp} s={14} /> Importa esperienze</button>
        <button className="tool"><Ic d={I.target} s={14} /> CV su misura <span className="tag">AI</span></button>
        <button className="tool"><Ic d={I.globe} s={14} /> Traduci CV <span className="tag">AI</span></button>
        <button className="tool"><Ic d={I.mail} s={14} /> Lettera di presentazione</button>
      </aside>

      {/* FORM */}
      <div className="form-col">
        <div className="form-inner">
          <div className="sec-head">
            <div>
              <h2>Esperienze lavorative</h2>
              <p>Parti dalla più recente. Descrivi risultati concreti: numeri e verbi d'azione contano più delle mansioni.</p>
            </div>
            <button className="ai-quiet"><Ic d={I.spark} s={13} /> Ottimizza sezione</button>
          </div>

          {/* card aperta */}
          <div className="exp-card">
            <div className="exp-head">
              <span className="grip">⋮⋮</span>
              <div className="exp-title">
                <b>Lead Developer — Tech Solutions Srl</b>
                <span>Mar 2020 – Presente · Milano</span>
              </div>
              <span className="spacer" />
              <button className="icon-btn" title="Elimina"><Ic d={I.trash} s={13} /></button>
              <button className="icon-btn" title="Comprimi"><Ic d={I.chev} s={13} /></button>
            </div>
            <div className="exp-body">
              <div className="frow">
                <div className="fgroup"><label>Ruolo</label><input defaultValue="Lead Developer" /></div>
                <div className="fgroup"><label>Azienda</label><input defaultValue="Tech Solutions Srl" /></div>
              </div>
              <div className="frow">
                <div className="fgroup"><label>Città</label><input defaultValue="Milano" /></div>
                <div className="frow" style={{ marginTop: 0 }}>
                  <div className="fgroup"><label>Dal</label><input defaultValue="Mar 2020" /></div>
                  <div className="fgroup"><label>Al</label><input placeholder="Presente" /></div>
                </div>
              </div>
              <div className="frow">
                <div className="fgroup full">
                  <label>Descrizione</label>
                  <textarea rows={4} defaultValue={"• Ho guidato un team di 5 sviluppatori nella progettazione di microservizi cloud-native.\n• Ridotto i tempi di deployment del 40% con automazione CI/CD.\n• Migliorato le performance del sistema del 60%."} />
                  <div className="desc-foot">
                    <button className="ai-quiet"><Ic d={I.spark} s={13} /> Migliora testo</button>
                    <button className="ai-quiet" style={{ color: "var(--ink-60)" }}>Suggerimenti (2)</button>
                    <span className="hint">3 punti · verbi d'azione ✓ · metriche ✓</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* card compresse */}
          <div className="exp-card">
            <div className="exp-head">
              <span className="grip">⋮⋮</span>
              <div className="exp-title">
                <b>Full-stack Developer — StartApp</b>
                <span>Gen 2018 – Feb 2020 · Torino</span>
              </div>
              <span className="spacer" />
              <button className="icon-btn"><Ic d={I.trash} s={13} /></button>
              <button className="icon-btn" style={{ transform: "rotate(-90deg)" }}><Ic d={I.chev} s={13} /></button>
            </div>
          </div>

          <button className="add-block">+ Aggiungi esperienza</button>

          <div className="sec-foot">
            <button className="btn btn-ghost">← Profilo</button>
            <button className="btn btn-ink">Continua: Formazione →</button>
          </div>
        </div>
      </div>

      {/* PREVIEW */}
      <div className="prev-col">
        <div className="prev-bar">
          <button className="tpl-pick"><i /> Template · Zurigo <Ic d={I.chev} s={12} /></button>
          <span className="pageno">Pagina 1 di 1</span>
          <div className="zoom">
            <button>−</button><span>72%</span><button>+</button>
          </div>
        </div>
        <div className="prev-scroll">
          <div className="a4">
            <div className="wmark"><span>ProntoCurriculum.it</span></div>
            <div className="cv-name">Mario Rossi</div>
            <div className="cv-role">Senior Software Engineer</div>
            <div className="cv-meta">mario.rossi@email.com · +39 333 1234567 · Milano</div>
            <hr className="cv-rule" />
            <div className="cv-grid">
              <div className="cv-lab">Profilo</div>
              <div className="cv-b">Ingegnere del software con 8 anni di esperienza nello sviluppo di applicazioni web scalabili. Specializzato in architetture cloud e metodologie Agile.</div>
              <hr className="cv-sep" />
              <div className="cv-lab">Esperienza</div>
              <div className="cv-b">
                <b>Lead Developer — Tech Solutions Srl</b>
                <div className="d">Mar 2020 – Presente · Milano</div>
                Ho guidato un team di 5 sviluppatori nella progettazione di microservizi cloud-native. Deployment −40% con CI/CD, performance +60%.
              </div>
              <div /><div className="cv-b" style={{ marginTop: 4 }}>
                <b>Full-stack Developer — StartApp</b>
                <div className="d">Gen 2018 – Feb 2020 · Torino</div>
                Sviluppo di piattaforme SaaS in React e Node.js per clienti enterprise.
              </div>
              <hr className="cv-sep" />
              <div className="cv-lab">Formazione</div>
              <div className="cv-b"><b>Laurea Magistrale in Ingegneria Informatica</b><div className="d">Università degli Studi di Milano · 2014 – 2016 · 110/110 e lode</div></div>
              <hr className="cv-sep" />
              <div className="cv-lab">Competenze</div>
              <div className="cv-b">JavaScript · Python · React · Node.js · AWS · Docker</div>
              <hr className="cv-sep" />
              <div className="cv-lab">Lingue</div>
              <div className="cv-b">Inglese — C1 Avanzato</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function GalleryView() {
  const [cat, setCat] = useState<"tutti" | Tpl["cat"]>("tutti");
  const shown = TEMPLATES.filter(t => cat === "tutti" || t.cat === cat);
  return (
    <div className="gal">
      <div className="gal-inner">
        <div className="gal-head">
          <div>
            <h2>Scegli il template</h2>
            <p>Tutti i modelli superano i controlli ATS. Cambi template quando vuoi, senza perdere i contenuti.</p>
          </div>
          <button className="btn btn-line btn-sm">Torna all'editor</button>
        </div>
        <div className="fchips">
          {(["tutti", "nuovi", "moderni", "classici"] as const).map(c => (
            <button key={c} className={`fchip${cat === c ? " on" : ""}`} onClick={() => setCat(c)}>
              {c === "tutti" ? "Tutti" : c === "nuovi" ? "Nuovi" : c === "moderni" ? "Moderni" : "Classici"}
            </button>
          ))}
        </div>
        <div className="tgrid">
          {shown.map(t => (
            <button key={t.id} className={`tcard${t.id === "zurigo" ? " sel" : ""}`}>
              <div className="tthumb">
                {t.isNew && <span className="newb">NUOVO</span>}
                {t.id === "zurigo" && <span className="selb">IN USO</span>}
                <Thumb id={t.id} />
              </div>
              <div className="tmeta">
                <b>{t.name}</b>
                <span className="ats">ATS ✓ 100%</span>
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

function AtsView() {
  return (
    <div className="ats-view">
      <div className="ats-inner">
        <div className="gal-head" style={{ marginBottom: 18 }}>
          <div>
            <h2>Analisi ATS</h2>
            <p>Il punteggio misura quanto il CV supera i filtri automatici dei recruiter. Aggiornato in tempo reale a ogni modifica.</p>
          </div>
          <button className="btn btn-line btn-sm">Torna all'editor</button>
        </div>

        <div className="panel">
          <div className="score-row">
            <div className="ring"><i>72</i></div>
            <div className="kpi">
              <div className="kpi-row">
                <b>Parsing strutturale</b>
                <div className="kbar"><i style={{ width: "86%", background: "var(--ok)" }} /></div>
                <span className="val" style={{ color: "var(--ok)" }}>26/30</span>
              </div>
              <div className="kpi-row">
                <b>Keyword match</b>
                <div className="kbar"><i style={{ width: "52%", background: "var(--warn)" }} /></div>
                <span className="val" style={{ color: "var(--warn)" }}>26/50</span>
              </div>
              <div className="kpi-row">
                <b>Rigore cronologico e metrico</b>
                <div className="kbar"><i style={{ width: "100%", background: "var(--ok)" }} /></div>
                <span className="val" style={{ color: "var(--ok)" }}>20/20</span>
              </div>
            </div>
          </div>
        </div>

        <div className="panel jd-box">
          <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", marginBottom: 10 }}>
            <b style={{ fontSize: 14, fontFamily: "var(--f-display)" }}>Confronta con un annuncio</b>
            <span style={{ fontSize: 11.5, color: "var(--ink-40)" }}>Il match keyword si calcola sull'annuncio incollato</span>
          </div>
          <textarea placeholder="Incolla qui il testo dell'offerta di lavoro…" defaultValue={"Cerchiamo un Senior Software Engineer con esperienza in React, TypeScript, Kubernetes e CI/CD. Gradita esperienza di leadership tecnica…"} />
          <div className="kws">
            <span className="kw ok">✓ React</span>
            <span className="kw ok">✓ CI/CD</span>
            <span className="kw ok">✓ leadership</span>
            <span className="kw miss">✗ TypeScript</span>
            <span className="kw miss">✗ Kubernetes</span>
          </div>
          <div style={{ display: "flex", gap: 8, marginTop: 14 }}>
            <button className="btn btn-ink btn-sm"><Ic d={I.spark} s={13} /> Integra le keyword mancanti</button>
            <button className="btn btn-line btn-sm">Ricalcola</button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── main ─────────────────────────────────────────────────────────────────────
export default function BuilderV4() {
  const [view, setView] = useState<"editor" | "template" | "ats">("editor");
  return (
    <div className="bv4">
      <style>{CSS}</style>

      {/* TOPBAR */}
      <div className="top">
        <button className="back"><Ic d={I.back} s={14} /> Dashboard</button>
        <div className="doc">
          <span className="doc-name">CV Mario Rossi — Software Engineer</span>
          <span className="doc-saved"><i /> Salvato ora</span>
        </div>
        <div className="top-right">
          <button className="ats-chip" onClick={() => setView("ats")}>
            <span className="mono" style={{ color: "var(--ink-60)" }}>ATS</span>
            <span className="ats-track"><span className="ats-fill" style={{ display: "block" }} /></span>
            <span className="ats-n">72</span>
          </button>
          <button className="btn btn-ghost btn-sm"><Ic d={I.eye} s={14} /> Anteprima</button>
          <button className="btn btn-line btn-sm"><Ic d={I.doc} s={14} /> DOCX</button>
          <button className="btn btn-ink btn-sm"><Ic d={I.down} s={14} /> Scarica PDF</button>
          <button className="icon-btn" title="Altro"><Ic d={I.dots} s={16} /></button>
        </div>
      </div>

      {view === "editor" && <EditorView />}
      {view === "template" && <GalleryView />}
      {view === "ats" && <AtsView />}

      {/* view switcher — solo per il mockup */}
      <div className="views">
        <button className={view === "editor" ? "on" : ""} onClick={() => setView("editor")}>Editor</button>
        <button className={view === "template" ? "on" : ""} onClick={() => setView("template")}>Template</button>
        <button className={view === "ats" ? "on" : ""} onClick={() => setView("ats")}>Analisi ATS</button>
      </div>
    </div>
  );
}
