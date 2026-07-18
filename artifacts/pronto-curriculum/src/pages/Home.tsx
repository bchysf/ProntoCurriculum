import { useEffect, useRef, useState, type ReactNode } from "react";
import { Page, ModalType } from '../types';
import { useAuth } from '../hooks/use-auth';

// "Carta & Inchiostro" v3 — RedesignV3 integrated into the main app.
// Switzer + Satoshi + IBM Plex Mono, white + aurora bg.

interface HomeProps {
  onNavigate: (page: Page) => void;
  onModal: (modal: ModalType) => void;
}

const CYCLE = 9000;

const write = (i: number) => {
  const start = 6 + i * 6.5;
  const end = start + 5;
  return `
  @keyframes w${i} {
    0%, ${start}% { width: 0; }
    ${end}% { width: var(--w); }
    100% { width: var(--w); }
  }`;
};

const GRAIN = `url('data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="180" height="180"><filter id="n"><feTurbulence type="fractalNoise" baseFrequency="0.85" numOctaves="2"/></filter><rect width="180" height="180" filter="url(%23n)" opacity="0.55"/></svg>')`;

const CSS = `
@import url('https://api.fontshare.com/v2/css?f[]=switzer@400,500,600,700&f[]=satoshi@400,500,700&display=swap');
@import url('https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@400;500&display=swap');

.pc3 {
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
}
.pc3 * { margin: 0; padding: 0; box-sizing: border-box; }
.pc3 .mono { font-family: var(--f-mono); font-size: 11px; letter-spacing: 0.14em; text-transform: uppercase; }
.pc3 .grain { position: absolute; inset: 0; z-index: 40; pointer-events: none; opacity: 0.04; background-image: ${GRAIN}; }

/* Flowing blue-to-violet aurora over the whole page */
.pc3 .aurora { position: absolute; inset: 0; z-index: 0; pointer-events: none; overflow: hidden; }
.pc3 .aurora i { position: absolute; display: block; border-radius: 50%; filter: blur(70px); will-change: transform; }
.pc3 .aurora i:nth-child(1) { width: 52vw; height: 52vw; top: -12%; left: -10%; background: radial-gradient(circle, rgba(96, 130, 255, 0.16) 0%, transparent 62%); animation: drift1 26s ease-in-out infinite alternate; }
.pc3 .aurora i:nth-child(2) { width: 44vw; height: 44vw; top: 16%; right: -12%; background: radial-gradient(circle, rgba(150, 110, 255, 0.14) 0%, transparent 62%); animation: drift2 32s ease-in-out infinite alternate; }
.pc3 .aurora i:nth-child(3) { width: 48vw; height: 48vw; top: 52%; left: 18%; background: radial-gradient(circle, rgba(110, 100, 250, 0.11) 0%, transparent 62%); animation: drift3 38s ease-in-out infinite alternate; }
.pc3 .aurora i:nth-child(4) { width: 40vw; height: 40vw; bottom: -8%; right: 6%; background: radial-gradient(circle, rgba(120, 150, 255, 0.13) 0%, transparent 62%); animation: drift1 30s 4s ease-in-out infinite alternate-reverse; }
@keyframes drift1 { from { transform: translate(0, 0) scale(1); } to { transform: translate(16vw, 14vh) scale(1.18); } }
@keyframes drift2 { from { transform: translate(0, 0) scale(1.1); } to { transform: translate(-14vw, 22vh) scale(0.92); } }
@keyframes drift3 { from { transform: translate(0, 0) scale(0.95); } to { transform: translate(12vw, -16vh) scale(1.15); } }

/* Light blue to light violet gradient text */
.pc3 .grad { background: linear-gradient(96deg, #6FA5FF 0%, #8F8CFF 48%, #BE9CFF 100%); -webkit-background-clip: text; background-clip: text; color: transparent; }

.pc3 .shell { max-width: 1200px; margin: 0 auto; padding: 0 40px; position: relative; z-index: 1; }

/* Reveal on scroll */
.pc3 .rv { opacity: 0; transform: translateY(20px); transition: opacity .7s var(--ease), transform .7s var(--ease); }
.pc3 .rv.on { opacity: 1; transform: none; }
.pc3 .rv.d1 { transition-delay: .08s; } .pc3 .rv.d2 { transition-delay: .16s; } .pc3 .rv.d3 { transition-delay: .24s; }

/* NAV — sticky, frosted */
.pc3 .topbar { position: sticky; top: 0; z-index: 30; background: rgba(255,255,255,0.72); backdrop-filter: blur(14px); -webkit-backdrop-filter: blur(14px); border-bottom: 1px solid var(--hair-soft); }
.pc3 .topbar nav { display: flex; align-items: center; justify-content: space-between; height: 68px; }
.pc3 .brand { font-family: var(--f-display); font-weight: 700; font-size: 19px; letter-spacing: -0.03em; display: flex; align-items: center; gap: 8px; }
.pc3 .brand span { background: linear-gradient(90deg, var(--accent), var(--violet)); -webkit-background-clip: text; background-clip: text; color: transparent; }
.pc3 .brand img { width: 46px; height: 46px; object-fit: contain; flex-shrink: 0; }
.pc3 .nav-links { display: flex; gap: 30px; font-size: 13.5px; font-weight: 500; color: var(--ink-60); }
.pc3 .nav-links span { cursor: pointer; position: relative; transition: color .2s; }
.pc3 .nav-links span::after { content: ''; position: absolute; left: 0; right: 0; bottom: -4px; height: 1.5px; background: var(--accent); transform: scaleX(0); transform-origin: right; transition: transform .35s var(--ease); }
.pc3 .nav-links span:hover { color: var(--ink); }
.pc3 .nav-links span:hover::after { transform: scaleX(1); transform-origin: left; }

.pc3 .btn { display: inline-flex; align-items: center; gap: 8px; border: none; cursor: pointer; font-family: var(--f-body); font-weight: 700; font-size: 14px; padding: 12px 22px; border-radius: 10px; transition: transform .25s var(--ease), background .2s, box-shadow .25s var(--ease); }
.pc3 .btn:active { transform: scale(0.97); }
.pc3 .btn-ink { background: var(--accent); color: #fff; box-shadow: 0 1px 2px rgba(20,23,31,.15); }
.pc3 .btn-ink:hover { background: var(--accent-ink); transform: translateY(-1.5px); box-shadow: 0 10px 24px -10px rgba(47,42,229,.5); }
.pc3 .btn-line { background: transparent; color: var(--ink); border: 1px solid var(--hair); }
.pc3 .btn-line:hover { border-color: var(--ink); transform: translateY(-1.5px); }
.pc3 .btn-sm { padding: 9px 16px; font-size: 13px; }

/* HERO - full-width staggered headline, then copy + 3D demo row */
.pc3 .hero { padding: 72px 0 100px; }
.pc3 .eyebrow { color: var(--ink-40); margin-bottom: 30px; }
.pc3 .eyebrow b { color: var(--accent); font-weight: 500; }
.pc3 h1 { font-family: var(--f-display); font-weight: 700; font-size: clamp(52px, 7vw, 104px); line-height: 0.96; letter-spacing: -0.04em; }
.pc3 h1 .l2 { display: block; padding-left: 8%; }
.pc3 .hero-row { display: grid; grid-template-columns: 0.95fr 1.05fr; gap: 72px; align-items: center; margin-top: 72px; }
.pc3 .sub { font-size: 17px; color: var(--ink-60); max-width: 430px; line-height: 1.6; margin: 0 0 36px; font-weight: 500; }
.pc3 .cta-row { display: flex; gap: 14px; align-items: center; margin-bottom: 28px; }
.pc3 .trust { font-family: var(--f-mono); font-size: 11.5px; letter-spacing: 0.04em; color: var(--ink-40); }
.pc3 .trust b { color: var(--ink); font-weight: 500; }

/* 3D stage */
.pc3 .demo { position: relative; perspective: 1400px; }
.pc3 .orbit { position: absolute; top: 50%; left: 50%; width: 580px; height: 580px; transform: translate(-50%, -50%); animation: spin 14s linear infinite; pointer-events: none; overflow: visible; }
@keyframes spin { to { transform: translate(-50%, -50%) rotate(360deg); } }
.pc3 .halo { position: absolute; top: 50%; left: 50%; width: 640px; height: 640px; transform: translate(-50%, -50%); border-radius: 50%; background: radial-gradient(circle, rgba(47,42,229,0.09) 0%, rgba(124,92,255,0.05) 45%, transparent 68%); pointer-events: none; }

.pc3 .stack { position: relative; transform-style: preserve-3d; will-change: transform; }
.pc3 .sheet { background: var(--card); border: 1px solid var(--hair-soft); border-radius: 8px; padding: 34px 32px 30px; box-shadow: 0 1px 2px rgba(20,23,31,.05), 0 18px 40px -18px rgba(20,23,31,.16), 0 48px 90px -40px rgba(20,23,31,.22); position: relative; z-index: 3; transform: translateZ(0) rotate(0.8deg); }
.pc3 .ghost { position: absolute; inset: 0; background: #fff; border: 1px solid var(--hair-soft); border-radius: 8px; }
.pc3 .ghost-1 { transform: translateZ(-70px) translate(26px, 20px) rotate(4deg); opacity: .8; box-shadow: 0 12px 30px -16px rgba(20,23,31,.2); }
.pc3 .ghost-2 { transform: translateZ(-140px) translate(-22px, 34px) rotate(-3.5deg); opacity: .5; }

.pc3 .sheet-name { font-family: var(--f-display); font-weight: 600; letter-spacing: -0.02em; font-size: 23px; overflow: hidden; white-space: nowrap; animation: wname ${CYCLE}ms infinite var(--ease); }
@keyframes wname { 0%, 2% { max-width: 0; } 8% { max-width: 300px; } 100% { max-width: 300px; } }
.pc3 .sheet-role { font-size: 12px; color: var(--ink-60); margin: 3px 0 18px; }
.pc3 .rule { border: none; border-top: 1px solid var(--hair-soft); margin-bottom: 16px; }
.pc3 .slabel { font-family: var(--f-mono); font-size: 9px; letter-spacing: 0.18em; text-transform: uppercase; color: var(--ink-40); margin-bottom: 9px; }
.pc3 .wl { height: 7px; border-radius: 4px; background: #EFEDF6; margin-bottom: 7px; overflow: hidden; position: relative; }
.pc3 .wl::after { content: ''; position: absolute; inset: 0 auto 0 0; width: 0; border-radius: 4px; background: #DBD9E8; }
${Array.from({ length: 7 }, (_, i) => write(i)).join('')}
${Array.from({ length: 7 }, (_, i) => `.pc3 .wl:nth-of-type(${i + 1})::after { --w: 100%; animation: w${i} ${CYCLE}ms infinite; }`).join('\n')}

.pc3 .ats-line { display: flex; align-items: center; gap: 12px; margin-top: 20px; padding-top: 14px; border-top: 1px solid var(--hair-soft); }
.pc3 .ats-label { font-family: var(--f-mono); font-size: 10px; letter-spacing: 0.12em; color: var(--ink-60); white-space: nowrap; }
.pc3 .ats-bar { flex: 1; height: 4px; border-radius: 3px; background: #EFEDF6; overflow: hidden; }
.pc3 .ats-fill3 { height: 100%; border-radius: 3px; background: linear-gradient(90deg, #6FA5FF, #8F8CFF); width: 0; animation: barfill ${CYCLE}ms infinite; }
@keyframes barfill { 0%, 52% { width: 0; } 78% { width: 92%; } 100% { width: 92%; } }
.pc3 .ats-num { font-family: var(--f-mono); font-size: 12px; font-weight: 500; color: var(--accent); min-width: 52px; text-align: right; }

/* Floating chips at depth */
.pc3 .chip { position: absolute; display: flex; align-items: center; gap: 8px; background: #fff; border: 1px solid var(--hair-soft); border-radius: 10px; padding: 9px 13px; font-family: var(--f-mono); font-size: 11px; letter-spacing: 0.06em; box-shadow: 0 14px 30px -14px rgba(20,23,31,.25); z-index: 4; }
.pc3 .chip b { color: var(--accent); font-weight: 500; }
.pc3 .chip-ats { top: -18px; right: -26px; transform: translateZ(70px); animation: float 5.5s ease-in-out infinite alternate; }
.pc3 .chip-pdf { bottom: -14px; left: -30px; transform: translateZ(50px); animation: float 6.5s .8s ease-in-out infinite alternate; }
@keyframes float { from { margin-top: 0; } to { margin-top: -12px; } }

.pc3 .stamp { position: absolute; top: 88px; right: -6px; font-family: var(--f-mono); font-size: 12px; font-weight: 500; letter-spacing: 0.2em; color: var(--accent); border: 2px solid var(--accent); border-radius: 6px; padding: 7px 13px; background: rgba(255,255,255,0.85); transform: rotate(8deg) translateZ(90px); opacity: 0; animation: stamp ${CYCLE}ms infinite; z-index: 5; }
@keyframes stamp {
  0%, 76% { opacity: 0; transform: rotate(8deg) translateZ(90px) scale(1.7); }
  82% { opacity: 1; transform: rotate(8deg) translateZ(90px) scale(1); }
  100% { opacity: 1; transform: rotate(8deg) translateZ(90px) scale(1); }
}

/* MARQUEE */
.pc3 .mq { border-top: 1px solid var(--hair-soft); border-bottom: 1px solid var(--hair-soft); overflow: hidden; padding: 18px 0; background: rgba(255,255,255,0.6); position: relative; z-index: 1; }
.pc3 .mq-track { display: flex; gap: 56px; width: max-content; animation: mq 36s linear infinite; }
.pc3 .mq:hover .mq-track { animation-play-state: paused; }
@keyframes mq { from { transform: translateX(0); } to { transform: translateX(-50%); } }
.pc3 .mq-item { font-family: var(--f-mono); font-size: 11px; letter-spacing: 0.16em; text-transform: uppercase; color: var(--ink-40); display: flex; align-items: center; gap: 56px; white-space: nowrap; }
.pc3 .mq-item i { font-style: normal; background: linear-gradient(96deg, #6FA5FF, #BE9CFF); -webkit-background-clip: text; background-clip: text; color: transparent; }

/* SECTIONS */
.pc3 .sec { padding: 96px 0; }
.pc3 .sec-head { display: flex; align-items: baseline; justify-content: space-between; border-top: 1px solid var(--hair); padding-top: 18px; margin-bottom: 56px; gap: 24px; }
.pc3 .sec-num { color: var(--ink-40); flex-shrink: 0; }
.pc3 h2 { font-family: var(--f-display); font-weight: 700; font-size: clamp(30px, 3.2vw, 44px); letter-spacing: -0.03em; line-height: 1.05; }
.pc3 h2 .ac { background: linear-gradient(96deg, #6FA5FF 0%, #8F8CFF 48%, #BE9CFF 100%); -webkit-background-clip: text; background-clip: text; color: transparent; }

/* Steps */
.pc3 .steps { display: grid; grid-template-columns: repeat(3, 1fr); }
.pc3 .step { padding: 0 32px; border-left: 1px solid var(--hair-soft); }
.pc3 .step:first-child { padding-left: 0; border-left: none; }
.pc3 .step-num { font-family: var(--f-display); font-weight: 700; font-size: 52px; letter-spacing: -0.04em; line-height: 1; margin-bottom: 18px; background: linear-gradient(120deg, #6FA5FF, #BE9CFF); -webkit-background-clip: text; background-clip: text; color: transparent; }
.pc3 .step h3 { font-family: var(--f-display); font-size: 17px; font-weight: 600; letter-spacing: -0.01em; margin-bottom: 8px; }
.pc3 .step p { font-size: 14px; color: var(--ink-60); line-height: 1.65; }

/* Bento */
.pc3 .bento { display: grid; grid-template-columns: repeat(3, 1fr); gap: 16px; }
.pc3 .cell { background: rgba(255,255,255,0.75); backdrop-filter: blur(6px); border: 1px solid var(--hair-soft); border-radius: 14px; padding: 28px; transition: transform .35s var(--ease), box-shadow .35s var(--ease), border-color .2s; }
.pc3 .cell:hover { transform: translateY(-4px); border-color: rgba(111, 140, 255, 0.4); box-shadow: 0 18px 40px -20px rgba(60, 70, 180, 0.2); }
.pc3 .cell-wide { grid-column: span 2; }
.pc3 .cell .mono { color: var(--accent); display: block; margin-bottom: 14px; }
.pc3 .cell h3 { font-family: var(--f-display); font-weight: 600; letter-spacing: -0.02em; font-size: 20px; margin-bottom: 8px; }
.pc3 .cell p { font-size: 13.5px; color: var(--ink-60); line-height: 1.6; }
.pc3 .langs { display: flex; gap: 8px; margin-top: 18px; flex-wrap: wrap; }
.pc3 .lang { font-family: var(--f-mono); font-size: 11px; border: 1px solid var(--hair); border-radius: 6px; padding: 4px 9px; color: var(--ink-60); transition: all .2s; }
.pc3 .cell:hover .lang { border-color: rgba(111, 140, 255, 0.45); color: var(--accent); }
.pc3 .score-demo { display: flex; align-items: baseline; gap: 8px; margin-top: 18px; }
.pc3 .score-big { font-family: var(--f-display); font-weight: 700; letter-spacing: -0.04em; font-size: 58px; line-height: 1; background: linear-gradient(120deg, #6FA5FF, #BE9CFF); -webkit-background-clip: text; background-clip: text; color: transparent; }
.pc3 .score-sub { font-family: var(--f-mono); font-size: 11px; color: var(--ink-40); }

/* EXPLAINER PLAYERS */
.pc3 .player { background: #14171F; border-radius: 18px; overflow: hidden; box-shadow: 0 34px 80px -34px rgba(20,23,31,.5); }
.pc3 .pl-chrome { display: flex; align-items: center; gap: 8px; padding: 14px 20px; border-bottom: 1px solid rgba(255,255,255,.08); }
.pc3 .pl-dot { width: 9px; height: 9px; border-radius: 50%; background: rgba(255,255,255,.16); }
.pc3 .pl-title { font-family: var(--f-mono); font-size: 10.5px; letter-spacing: .14em; text-transform: uppercase; color: #8A8F9C; margin-left: 10px; }
.pc3 .pl-live { margin-left: auto; font-family: var(--f-mono); font-size: 9.5px; letter-spacing: .16em; color: #9DB6FF; display: flex; align-items: center; gap: 6px; }
.pc3 .pl-live::before { content: ''; width: 6px; height: 6px; border-radius: 50%; background: #6FA5FF; animation: blink 1.6s ease-in-out infinite; }
@keyframes blink { 0%, 100% { opacity: 1; } 50% { opacity: .3; } }
.pc3 .pl-body { display: grid; grid-template-columns: 310px 1fr; }
.pc3 .pl-side { padding: 22px 18px; display: flex; flex-direction: column; gap: 4px; }
.pc3 .pl-step { text-align: left; background: transparent; border: none; cursor: pointer; padding: 13px 14px; border-radius: 12px; transition: background .25s; font-family: var(--f-body); }
.pc3 .pl-step:hover { background: rgba(255,255,255,.04); }
.pc3 .pl-step.active { background: rgba(255,255,255,.07); }
.pc3 .pl-step-label { color: #6A707E; font-family: var(--f-mono); font-size: 10px; letter-spacing: .14em; text-transform: uppercase; }
.pc3 .pl-step.active .pl-step-label { color: #9DB6FF; }
.pc3 .pl-step-title { color: #F3F1EA; font-weight: 700; font-size: 14.5px; margin-top: 4px; }
.pc3 .pl-step-desc { color: #565B66; font-size: 12.5px; line-height: 1.5; margin-top: 3px; transition: color .35s; }
.pc3 .pl-step.active .pl-step-desc { color: #A6ACBA; }
.pc3 .pl-prog { display: block; height: 3px; border-radius: 2px; background: rgba(255,255,255,.12); margin-top: 11px; overflow: hidden; opacity: 0; transition: opacity .3s; }
.pc3 .pl-step.active .pl-prog { opacity: 1; }
.pc3 .pl-prog i { display: block; height: 100%; width: 0; background: linear-gradient(90deg, #6FA5FF, #BE9CFF); animation: plprog var(--dur) linear forwards; }
@keyframes plprog { to { width: 100%; } }
.pc3 .pl-screen { position: relative; background: #F4F4FA; margin: 16px; margin-left: 0; border-radius: 12px; min-height: 380px; overflow: hidden; }
.pc3 .pl-view { position: absolute; inset: 0; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 14px; opacity: 0; transform: translateY(14px) scale(.985); transition: opacity .5s var(--ease), transform .5s var(--ease); pointer-events: none; }
.pc3 .pl-view.active { opacity: 1; transform: none; }
.pc3 .pl-cap { font-family: var(--f-mono); font-size: 10px; letter-spacing: .16em; text-transform: uppercase; color: var(--ink-40); }

/* Mini scenes inside the players */
.pc3 .mini-cards { display: flex; gap: 14px; }
.pc3 .mini-card { width: 92px; height: 120px; background: #fff; border: 1.5px solid var(--hair-soft); border-radius: 8px; padding: 9px 8px; transition: all .6s var(--ease); }
.pc3 .mini-card i { display: block; height: 4px; border-radius: 2px; background: #E6E4F0; margin-bottom: 5px; }
.pc3 .mini-card i.hd { height: 7px; width: 60%; background: #D5D2E6; margin-bottom: 8px; }
.pc3 .pl-view.active .mini-card:nth-child(2) { border-color: #8F8CFF; transform: translateY(-8px); box-shadow: 0 16px 30px -14px rgba(100,95,230,.4); transition-delay: .5s; }
.pc3 .mini-form { width: 260px; background: #fff; border: 1px solid var(--hair-soft); border-radius: 10px; padding: 18px 16px; }
.pc3 .mini-form .fl { height: 8px; border-radius: 4px; background: #EFEDF6; margin-bottom: 9px; overflow: hidden; position: relative; }
.pc3 .mini-form .fl::after { content: ''; position: absolute; inset: 0 auto 0 0; width: 0; border-radius: 4px; background: linear-gradient(90deg, #C9CFF5, #D9CFF8); }
.pc3 .pl-view.active .mini-form .fl:nth-child(1)::after { animation: flw 1s var(--ease) .3s forwards; }
.pc3 .pl-view.active .mini-form .fl:nth-child(2)::after { animation: flw 1s var(--ease) .9s forwards; }
.pc3 .pl-view.active .mini-form .fl:nth-child(3)::after { animation: flw 1s var(--ease) 1.5s forwards; }
.pc3 .pl-view.active .mini-form .fl:nth-child(4)::after { animation: flw 1s var(--ease) 2.1s forwards; }
@keyframes flw { to { width: 92%; } }
.pc3 .spark-chip { display: inline-flex; align-items: center; gap: 6px; font-family: var(--f-mono); font-size: 10px; letter-spacing: .1em; color: var(--accent); background: #EDECFC; border-radius: 99px; padding: 5px 12px; }
.pc3 .pl-view.active .spark-chip { animation: blink 1.8s ease-in-out infinite; }
.pc3 .mini-gauge { width: 260px; background: #fff; border: 1px solid var(--hair-soft); border-radius: 10px; padding: 20px 18px; }
.pc3 .mini-gauge .gnum { font-family: var(--f-display); font-weight: 700; font-size: 44px; letter-spacing: -0.03em; background: linear-gradient(120deg, #6FA5FF, #BE9CFF); -webkit-background-clip: text; background-clip: text; color: transparent; line-height: 1; }
.pc3 .mini-gauge .gbar { height: 6px; border-radius: 3px; background: #EFEDF6; margin-top: 14px; overflow: hidden; }
.pc3 .mini-gauge .gbar i { display: block; height: 100%; width: 0; border-radius: 3px; background: linear-gradient(90deg, #6FA5FF, #BE9CFF); }
.pc3 .pl-view.active .mini-gauge .gbar i { animation: flw 1.4s var(--ease) .4s forwards; }
.pc3 .mini-pdf { display: flex; align-items: center; gap: 12px; background: #fff; border: 1px solid var(--hair-soft); border-radius: 12px; padding: 16px 20px; font-family: var(--f-mono); font-size: 12px; }
.pc3 .pl-view.active .mini-pdf { animation: pop .6s var(--ease) .4s backwards; }
@keyframes pop { from { opacity: 0; transform: scale(.85); } to { opacity: 1; transform: scale(1); } }
.pc3 .mini-pdf .dl { width: 34px; height: 34px; border-radius: 10px; background: var(--accent); color: #fff; display: flex; align-items: center; justify-content: center; font-size: 16px; }
.pc3 .kw-row { display: flex; gap: 8px; flex-wrap: wrap; justify-content: center; max-width: 300px; }
.pc3 .kw { font-family: var(--f-mono); font-size: 11px; border: 1px solid var(--hair); border-radius: 99px; padding: 5px 12px; color: var(--ink-60); background: #fff; opacity: 0; transform: translateY(8px); }
.pc3 .pl-view.active .kw { animation: kwin .5s var(--ease) forwards; }
.pc3 .pl-view.active .kw:nth-child(1) { animation-delay: .3s; } .pc3 .pl-view.active .kw:nth-child(2) { animation-delay: .55s; }
.pc3 .pl-view.active .kw:nth-child(3) { animation-delay: .8s; } .pc3 .pl-view.active .kw:nth-child(4) { animation-delay: 1.05s; }
.pc3 .pl-view.active .kw:nth-child(5) { animation-delay: 1.3s; }
@keyframes kwin { to { opacity: 1; transform: none; border-color: rgba(111,140,255,.5); color: var(--accent); } }
.pc3 .board { width: 280px; display: flex; flex-direction: column; gap: 8px; }
.pc3 .brow { display: flex; align-items: center; justify-content: space-between; background: #fff; border: 1px solid var(--hair-soft); border-radius: 10px; padding: 11px 14px; font-size: 12.5px; font-weight: 500; opacity: 0; transform: translateX(-14px); }
.pc3 .pl-view.active .brow { animation: brin .5s var(--ease) forwards; }
.pc3 .pl-view.active .brow:nth-child(1) { animation-delay: .3s; } .pc3 .pl-view.active .brow:nth-child(2) { animation-delay: .6s; }
.pc3 .pl-view.active .brow:nth-child(3) { animation-delay: .9s; }
@keyframes brin { to { opacity: 1; transform: none; } }
.pc3 .pill { font-family: var(--f-mono); font-size: 9.5px; letter-spacing: .08em; border-radius: 99px; padding: 3px 9px; }
.pc3 .pill-b { background: #EDECFC; color: var(--accent); }
.pc3 .pill-g { background: #E4F5EC; color: #12805C; }
.pc3 .mini-cal { background: #fff; border: 1px solid var(--hair-soft); border-radius: 14px; padding: 22px 26px; text-align: center; }
.pc3 .pl-view.active .mini-cal { animation: pop .6s var(--ease) .3s backwards; }
.pc3 .mini-cal .ck { width: 44px; height: 44px; border-radius: 50%; background: linear-gradient(120deg, #6FA5FF, #BE9CFF); color: #fff; font-size: 20px; display: flex; align-items: center; justify-content: center; margin: 0 auto 12px; }
.pc3 .mini-cal b { font-family: var(--f-display); font-size: 16px; letter-spacing: -0.01em; }
.pc3 .mini-cal span { display: block; font-size: 12px; color: var(--ink-60); margin-top: 3px; }

/* GUIDE */
.pc3 .guide { display: grid; grid-template-columns: repeat(3, 1fr); gap: 44px; }
.pc3 .guide h3 { font-family: var(--f-display); font-weight: 600; font-size: 18px; letter-spacing: -0.01em; margin-bottom: 12px; }
.pc3 .guide p { font-size: 14px; color: var(--ink-60); line-height: 1.75; margin-bottom: 10px; }
.pc3 .guide a { color: var(--accent); text-decoration: none; font-weight: 500; }
.pc3 .guide a:hover { text-decoration: underline; }

/* FAQ */
.pc3 .faq { max-width: 840px; }
.pc3 .faq details { border-bottom: 1px solid var(--hair-soft); }
.pc3 .faq summary { cursor: pointer; list-style: none; display: flex; justify-content: space-between; align-items: center; gap: 20px; padding: 20px 0; font-family: var(--f-display); font-weight: 600; font-size: 17px; letter-spacing: -0.01em; }
.pc3 .faq summary::-webkit-details-marker { display: none; }
.pc3 .faq summary::after { content: '+'; font-family: var(--f-mono); color: var(--accent); font-size: 20px; flex-shrink: 0; transition: transform .3s var(--ease); }
.pc3 .faq details[open] summary::after { transform: rotate(45deg); }
.pc3 .faq details p { color: var(--ink-60); font-size: 14.5px; line-height: 1.7; padding-bottom: 20px; max-width: 740px; }

/* FOOTER columns */
.pc3 .foot-grid { display: grid; grid-template-columns: 2.2fr 1fr 1fr 1fr; gap: 36px; padding: 64px 0 48px; border-top: 1px solid var(--hair-soft); }
.pc3 .foot-about { font-size: 13.5px; color: var(--ink-60); line-height: 1.7; max-width: 300px; margin-top: 14px; }
.pc3 .foot-col h4 { font-family: var(--f-mono); font-size: 10.5px; font-weight: 500; letter-spacing: .16em; text-transform: uppercase; color: var(--ink-40); margin-bottom: 16px; }
.pc3 .foot-col a { display: block; width: fit-content; color: var(--ink-60); text-decoration: none; font-size: 13.5px; padding: 5px 0; position: relative; transition: color .2s; }
.pc3 .foot-col a::after { content: ''; position: absolute; left: 0; right: 100%; bottom: 3px; height: 1px; background: var(--accent); transition: right .3s var(--ease); }
.pc3 .foot-col a:hover { color: var(--accent); }
.pc3 .foot-col a:hover::after { right: 0; }

/* FINALE */
.pc3 .night { background: transparent; color: var(--ink); padding: 140px 0; text-align: center; position: relative; overflow: hidden; border-top: 1px solid var(--hair-soft); }
.pc3 .night .orbit { width: 900px; height: 900px; top: 118%; opacity: .8; animation-duration: 30s; animation-direction: reverse; }
.pc3 .night .halo { width: 780px; height: 780px; top: 100%; }
.pc3 .night .mono { color: var(--ink-40); display: block; margin-bottom: 28px; }
.pc3 .night h2 { font-size: clamp(40px, 5vw, 68px); line-height: 1.02; max-width: 860px; margin: 0 auto 42px; }

/* FOOTER */
.pc3 footer { display: block; }
.pc3 footer .mono { color: var(--ink-40); }
.pc3 .foot-langs { display: flex; gap: 6px; margin-top: 18px; }
.pc3 .foot-langs span { font-family: var(--f-mono); font-size: 10px; letter-spacing: .06em; border: 1px solid var(--hair-soft); border-radius: 5px; padding: 3px 7px; color: var(--ink-40); }
.pc3 .foot-bottom { display: flex; justify-content: space-between; align-items: center; gap: 16px; flex-wrap: wrap; padding: 22px 0 36px; border-top: 1px solid var(--hair-soft); }

@media (max-width: 900px) {
  .pc3 .shell { padding: 0 22px; }
  .pc3 .hero { padding: 56px 0 72px; }
  .pc3 .hero-row { grid-template-columns: 1fr; gap: 64px; margin-top: 48px; }
  .pc3 h1 .l2 { padding-left: 0; }
  .pc3 .steps { grid-template-columns: 1fr; gap: 36px; }
  .pc3 .step { padding: 0; border-left: none; }
  .pc3 .bento { grid-template-columns: 1fr; }
  .pc3 .cell-wide { grid-column: span 1; }
  .pc3 .nav-links { display: none; }
  .pc3 .orbit { width: 420px; height: 420px; }
  .pc3 .pl-body { grid-template-columns: 1fr; }
  .pc3 .pl-screen { margin: 0 16px 16px; min-height: 320px; }
  .pc3 .guide { grid-template-columns: 1fr; gap: 28px; }
  .pc3 .foot-grid { grid-template-columns: 1fr 1fr; }
}
@media (prefers-reduced-motion: reduce) {
  .pc3 .orbit, .pc3 .mq-track, .pc3 .chip, .pc3 .stamp, .pc3 .wl::after, .pc3 .ats-fill3, .pc3 .sheet-name, .pc3 .aurora i { animation: none !important; }
}
`;

function useReveal() {
  useEffect(() => {
    const els = document.querySelectorAll('.pc3 .rv');
    const io = new IntersectionObserver(
      entries => entries.forEach(e => { if (e.isIntersecting) e.target.classList.add('on'); }),
      { threshold: 0.15 },
    );
    els.forEach(el => io.observe(el));
    return () => io.disconnect();
  }, []);
}

function useAtsCounter() {
  const ref = useRef<HTMLSpanElement>(null);
  useEffect(() => {
    let raf = 0;
    const tick = () => {
      const t = (performance.now() % CYCLE) / CYCLE;
      let v = 0;
      if (t >= 0.52 && t < 0.78) v = Math.round(((t - 0.52) / 0.26) * 92);
      else if (t >= 0.78) v = 92;
      if (ref.current) ref.current.textContent = `${v}/100`;
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, []);
  return ref;
}

function useCountUp() {
  useEffect(() => {
    const els = document.querySelectorAll<HTMLElement>('.pc3 [data-count]');
    const io = new IntersectionObserver(entries => entries.forEach(en => {
      if (!en.isIntersecting) return;
      io.unobserve(en.target);
      const el = en.target as HTMLElement;
      const target = Number(el.dataset.count);
      const suffix = el.dataset.suffix ?? '';
      const t0 = performance.now();
      const dur = 1400;
      const step = (t: number) => {
        const p = Math.min(1, (t - t0) / dur);
        const e = 1 - Math.pow(1 - p, 3);
        el.textContent = Math.round(target * e).toLocaleString('it-IT') + suffix;
        if (p < 1) requestAnimationFrame(step);
      };
      requestAnimationFrame(step);
    }), { threshold: 0.5 });
    els.forEach(el => io.observe(el));
    return () => io.disconnect();
  }, []);
}

function useTilt() {
  const stageRef = useRef<HTMLDivElement>(null);
  const stackRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const stage = stageRef.current;
    const stack = stackRef.current;
    if (!stage || !stack) return;
    let tx = 0, ty = 0, cx = 0, cy = 0, raf = 0;
    const loop = () => {
      cx += (tx - cx) * 0.08;
      cy += (ty - cy) * 0.08;
      stack.style.transform = `rotateY(${cx.toFixed(2)}deg) rotateX(${cy.toFixed(2)}deg)`;
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    const onMove = (e: MouseEvent) => {
      const r = stage.getBoundingClientRect();
      const x = (e.clientX - r.left) / r.width - 0.5;
      const y = (e.clientY - r.top) / r.height - 0.5;
      tx = x * 14;
      ty = -y * 10;
    };
    const onLeave = () => { tx = 0; ty = 0; };
    stage.addEventListener('mousemove', onMove);
    stage.addEventListener('mouseleave', onLeave);
    return () => {
      cancelAnimationFrame(raf);
      stage.removeEventListener('mousemove', onMove);
      stage.removeEventListener('mouseleave', onLeave);
    };
  }, []);
  return { stageRef, stackRef };
}

const MARQUEE = ['Moderno', 'Minimal', 'Milano', 'Elegante', 'Classico', 'Nordico', 'Tecnico', 'Corporate', 'Europass'];

interface PlayerStep { title: string; desc: string; screen: ReactNode; }

function ExplainerPlayer({ title, steps, dur = 4600 }: { title: string; steps: PlayerStep[]; dur?: number }) {
  const [idx, setIdx] = useState(0);
  const [paused, setPaused] = useState(false);
  useEffect(() => {
    if (paused) return;
    const t = setTimeout(() => setIdx(i => (i + 1) % steps.length), dur);
    return () => clearTimeout(t);
  }, [idx, paused, dur, steps.length]);

  return (
    <div className="player" onMouseEnter={() => setPaused(true)} onMouseLeave={() => setPaused(false)}>
      <div className="pl-chrome">
        <span className="pl-dot" /><span className="pl-dot" /><span className="pl-dot" />
        <span className="pl-title">{title}</span>
        <span className="pl-live">Demo live</span>
      </div>
      <div className="pl-body">
        <div className="pl-side" role="tablist" aria-label={title}>
          {steps.map((s, i) => (
            <button
              key={s.title}
              role="tab"
              aria-selected={i === idx}
              className={`pl-step${i === idx ? ' active' : ''}`}
              onClick={() => setIdx(i)}
            >
              <span className="pl-step-label">Passo {i + 1} di {steps.length}</span>
              <div className="pl-step-title">{s.title}</div>
              <div className="pl-step-desc">{s.desc}</div>
              <span className="pl-prog">{i === idx && <i key={idx} style={{ '--dur': `${dur}ms` } as React.CSSProperties} />}</span>
            </button>
          ))}
        </div>
        <div className="pl-screen">
          {steps.map((s, i) => (
            <div key={s.title} className={`pl-view${i === idx ? ' active' : ''}`} aria-hidden={i !== idx}>
              {s.screen}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

const TOUR_STEPS: PlayerStep[] = [
  {
    title: 'Scegli il template',
    desc: 'Nove modelli professionali ottimizzati ATS: Moderno, Minimal, Milano, Europass e altri.',
    screen: (
      <>
        <div className="mini-cards">
          {[0, 1, 2].map(i => (
            <div className="mini-card" key={i}>
              <i className="hd" /><i /><i style={{ width: '80%' }} /><i style={{ width: '90%' }} /><i style={{ width: '65%' }} />
            </div>
          ))}
        </div>
        <span className="pl-cap">9 template · Anteprime reali</span>
      </>
    ),
  },
  {
    title: "Compila con l'AI",
    desc: "Rispondi alle domande guidate: l'AI riformula i testi con verbi d'azione e risultati misurabili.",
    screen: (
      <>
        <div className="mini-form"><div className="fl" /><div className="fl" /><div className="fl" /><div className="fl" /></div>
        <span className="spark-chip">✦ AI sta riscrivendo…</span>
      </>
    ),
  },
  {
    title: 'Controlla il punteggio ATS',
    desc: 'Parsing, keyword e metriche calcolati in tempo reale: sai sempre se il CV supererà i filtri.',
    screen: (
      <>
        <div className="mini-gauge">
          <div className="gnum">92<span style={{ fontSize: 18 }}>/100</span></div>
          <div className="gbar"><i /></div>
        </div>
        <span className="pl-cap">ATS Score · Aggiornato mentre scrivi</span>
      </>
    ),
  },
  {
    title: 'Scarica il PDF',
    desc: 'Impaginazione perfetta, formato italiano o europeo, pronto per la candidatura.',
    screen: (
      <>
        <div className="mini-pdf"><span className="dl">↓</span> giulia-ferraro-cv.pdf</div>
        <span className="pl-cap">Export PDF · Un click</span>
      </>
    ),
  },
];

const JOB_STEPS: PlayerStep[] = [
  {
    title: "Incolla l'annuncio",
    desc: "L'AI legge l'offerta di lavoro ed estrae le keyword che i recruiter e i filtri ATS cercano.",
    screen: (
      <>
        <div className="kw-row">
          {['Project management', 'SEO', 'Google Ads', 'CRM', 'Inglese C1'].map(k => <span className="kw" key={k}>{k}</span>)}
        </div>
        <span className="pl-cap">Keyword estratte dall'annuncio</span>
      </>
    ),
  },
  {
    title: 'CV su misura in un click',
    desc: 'Il tuo CV viene adattato a quella specifica offerta: esperienze riordinate, testi mirati.',
    screen: (
      <>
        <div className="mini-form"><div className="fl" /><div className="fl" /><div className="fl" /><div className="fl" /></div>
        <span className="spark-chip">✦ Adattamento all'offerta…</span>
      </>
    ),
  },
  {
    title: 'Traccia le candidature',
    desc: 'Ogni versione del CV resta legata alla sua candidatura: niente più file persi nelle cartelle.',
    screen: (
      <>
        <div className="board">
          <div className="brow">Marketing Manager — Lumina <span className="pill pill-b">Inviata</span></div>
          <div className="brow">Digital Lead — Adriatica <span className="pill pill-b">In review</span></div>
          <div className="brow">Brand Manager — Velvet <span className="pill pill-g">Colloquio</span></div>
        </div>
      </>
    ),
  },
  {
    title: 'Arriva al colloquio',
    desc: 'CV mirato + punteggio ATS alto = più risposte. Il resto lo fai tu.',
    screen: (
      <>
        <div className="mini-cal">
          <div className="ck">✓</div>
          <b>Colloquio fissato</b>
          <span>Giovedì · ore 15:00</span>
        </div>
      </>
    ),
  },
];

const FAQ_ITEMS: Array<[string, string]> = [
  ['Posso creare un curriculum gratis?', "Sì. Il piano gratuito include un CV completo, l'anteprima live, il punteggio ATS e il download in PDF con filigrana. Nessuna carta di credito richiesta."],
  ["Cos'è il punteggio ATS e perché conta?", "Gli ATS (Applicant Tracking System) sono i software che filtrano i CV prima che arrivino a un recruiter. ProntoCurriculum calcola in tempo reale parsing strutturale, keyword match e rigore metrico del tuo CV, così sai se supererà i filtri prima di inviarlo."],
  ['I template vanno bene per il mercato italiano ed europeo?', 'Sì. I nove template sono progettati per gli standard italiani ed europei, incluso il formato Europass, e sono tutti verificati per la compatibilità ATS.'],
  ['Posso tradurre il CV in altre lingue?', "Sì, in cinque lingue oltre l'italiano: inglese, francese, tedesco, spagnolo e portoghese. Puoi tradurre l'intero documento o i singoli campi."],
  ["L'AI inventa contenuti nel mio CV?", "No. L'AI riformula quello che scrivi tu — verbi d'azione, risultati misurabili, keyword — ma non aggiunge esperienze o competenze che non hai indicato. Ogni modifica la approvi tu."],
  ['Come funziona il CV su misura per una offerta?', "Incolli l'annuncio di lavoro: l'AI estrae le keyword rilevanti, adatta testi e ordine delle esperienze a quella posizione e salva la versione legata alla candidatura, così puoi tracciarla dalla dashboard."],
];

const FAQ_SCHEMA = {
  '@context': 'https://schema.org',
  '@type': 'FAQPage',
  mainEntity: FAQ_ITEMS.map(([q, a]) => ({
    '@type': 'Question',
    name: q,
    acceptedAnswer: { '@type': 'Answer', text: a },
  })),
};

function Ring({ id }: { id: string }) {
  return (
    <svg className="orbit" viewBox="0 0 100 100" aria-hidden="true">
      <defs>
        <linearGradient id={id} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#5B8DEF" stopOpacity="0" />
          <stop offset="0.45" stopColor="#5B8DEF" stopOpacity="0.9" />
          <stop offset="0.7" stopColor="#9B7BFF" stopOpacity="0.65" />
          <stop offset="1" stopColor="#BE9CFF" stopOpacity="0" />
        </linearGradient>
      </defs>
      <circle cx="50" cy="50" r="48.6" fill="none" stroke={`url(#${id})`} strokeWidth="2.4" strokeLinecap="round" opacity="0.25" />
      <circle cx="50" cy="50" r="48.6" fill="none" stroke={`url(#${id})`} strokeWidth="0.7" strokeLinecap="round" />
    </svg>
  );
}

export default function Home({ onNavigate, onModal }: HomeProps) {
  useReveal();
  useCountUp();
  const atsRef = useAtsCounter();
  const { stageRef, stackRef } = useTilt();
  const { isAuthenticated, isLoading } = useAuth();

  useEffect(() => {
    let link = document.querySelector<HTMLLinkElement>('link[rel="canonical"]');
    let created = false;
    if (!link) {
      link = document.createElement('link');
      link.rel = 'canonical';
      document.head.appendChild(link);
      created = true;
    }
    link.href = 'https://prontocurriculum.it/';
    return () => { if (created) link!.remove(); };
  }, []);

  return (
    <div className="pc3">
      <style>{CSS}</style>
      <div className="grain" aria-hidden="true" />
      <div className="aurora" aria-hidden="true"><i /><i /><i /><i /></div>

      <header className="topbar">
        <div className="shell">
          <nav aria-label="Navigazione principale">
            <div className="brand"><img src="/logo-icon.png" alt="" /><span>ProntoCurriculum</span></div>
            <div className="nav-links">
              <span onClick={() => { const el = document.getElementById('steps'); el?.scrollIntoView({ behavior: 'smooth' }); }} style={{ cursor: 'pointer' }}>Come funziona</span>
              <span onClick={() => { const el = document.getElementById('templates'); el?.scrollIntoView({ behavior: 'smooth' }); }} style={{ cursor: 'pointer' }}>Template</span>
              <span onClick={() => { const el = document.getElementById('pricing'); el?.scrollIntoView({ behavior: 'smooth' }); }} style={{ cursor: 'pointer' }}>Prezzi</span>
              <span onClick={() => onNavigate('blog')} style={{ cursor: 'pointer' }}>Blog & Guide</span>
              <span onClick={() => onNavigate('calcolo-stipendio')} style={{ cursor: 'pointer' }}>Calcolatore Stipendio</span>
            </div>
            <div style={{ display: 'flex', gap: 10 }}>
              {!isLoading && (isAuthenticated ? (
                <button className="btn btn-line btn-sm" onClick={() => onNavigate('dashboard')}>Dashboard</button>
              ) : (
                <button className="btn btn-line btn-sm" onClick={() => onModal('signup')}>Accedi</button>
              ))}
              <button className="btn btn-ink btn-sm" onClick={() => onNavigate('builder-step1')}>Crea il tuo CV</button>
            </div>
          </nav>
        </div>
      </header>

      <main>
      <div className="shell">
        {/* HERO */}
        <div className="hero">
          <div className="mono eyebrow rv on">CV Builder <b>·</b> ATS-ready <b>·</b> Made in Italy</div>
          <h1 className="rv on d1">Il curriculum che<span className="l2 grad">apre le porte.</span></h1>

          <div className="hero-row">
            <div>
              <p className="sub rv on d2">Rispondi a qualche domanda. L'AI scrive con te, il punteggio ATS sale, il PDF è pronto per l'invio.</p>
              <div className="cta-row rv on d2">
                <button className="btn btn-ink" onClick={() => onNavigate('builder-step1')}>Inizia gratis</button>
                <button className="btn btn-line" onClick={() => onNavigate('builder-step1')}>Guarda i template</button>
              </div>
              <div className="trust rv on d3"><b data-count="2400">0</b> CV creati questo mese — nessuna registrazione richiesta</div>
            </div>

            <div className="demo rv on d2" ref={stageRef}>
              <div className="halo" aria-hidden="true" />
              <Ring id="rg-hero" />
              <div className="stack" ref={stackRef}>
                <div className="ghost ghost-2" aria-hidden="true" />
                <div className="ghost ghost-1" aria-hidden="true" />
                <div className="sheet">
                  <div className="sheet-name">Giulia Ferraro</div>
                  <div className="sheet-role">Marketing Manager · Milano</div>
                  <hr className="rule" />
                  <div className="slabel">Esperienza</div>
                  <div className="wl" /><div className="wl" style={{ width: '82%' }} /><div className="wl" style={{ width: '90%' }} />
                  <div className="slabel" style={{ marginTop: 16 }}>Formazione</div>
                  <div className="wl" style={{ width: '70%' }} /><div className="wl" style={{ width: '55%' }} />
                  <div className="slabel" style={{ marginTop: 16 }}>Competenze</div>
                  <div className="wl" style={{ width: '64%' }} /><div className="wl" style={{ width: '48%' }} />
                  <div className="ats-line">
                    <span className="ats-label">ATS SCORE</span>
                    <div className="ats-bar"><div className="ats-fill3" /></div>
                    <span className="ats-num" ref={atsRef}>0/100</span>
                  </div>
                </div>
                <div className="chip chip-ats"><b>ATS 92/100</b> ✓</div>
                <div className="chip chip-pdf">giulia-ferraro.pdf</div>
                <div className="stamp">PRONTO ✓</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* MARQUEE */}
      <div className="mq">
        <div className="mq-track">
          {[0, 1].map(k => (
            <div className="mq-item" key={k}>
              {MARQUEE.map(name => <span key={name}><i>■</i>&nbsp;&nbsp;{name}</span>)}
            </div>
          ))}
        </div>
      </div>

      <div className="shell">
        {/* COME FUNZIONA */}
        <section className="sec">
          <div className="sec-head rv">
            <h2>Dalla pagina bianca <span className="ac">al colloquio.</span></h2>
            <span className="mono sec-num">01 — Come funziona</span>
          </div>
          <div className="steps">
            {[
              ['01', 'Scegli il template', 'Nove modelli professionali, tutti ottimizzati per i sistemi ATS italiani ed europei.'],
              ['02', "Scrivi con l'AI", 'Rispondi alle domande guidate: la riformulazione, le keyword e i suggerimenti sono inclusi.'],
              ['03', 'Scarica e invia', 'PDF impaginato alla perfezione, punteggio ATS verificato, pronto per la candidatura.'],
            ].map(([n, t, d], i) => (
              <div className={`step rv d${i}`} key={t}>
                <div className="step-num">{n}</div>
                <h3>{t}</h3>
                <p>{d}</p>
              </div>
            ))}
          </div>

          <div className="rv" style={{ marginTop: 64 }}>
            <ExplainerPlayer title="prontocurriculum.it — Tour del prodotto" steps={TOUR_STEPS} />
          </div>
        </section>

        {/* FEATURES BENTO */}
        <section className="sec" style={{ paddingTop: 0 }}>
          <div className="sec-head rv">
            <h2>Un ferro del mestiere, <span className="ac">non un giocattolo.</span></h2>
            <span className="mono sec-num">02 — Strumenti</span>
          </div>
          <div className="bento">
            <div className="cell cell-wide rv">
              <span className="mono">Analisi ATS</span>
              <h3>Il punteggio che i recruiter non ti dicono</h3>
              <p>Incolla l'annuncio di lavoro: keyword mancanti, parsing strutturale e rigore metrico, calcolati in tempo reale mentre scrivi.</p>
              <div className="score-demo"><span className="score-big" data-count="92">0</span><span className="score-sub">/100 · PRONTO PER L'INVIO</span></div>
            </div>
            <div className="cell rv d1">
              <span className="mono">AI Editor</span>
              <h3>Riscrive, non inventa</h3>
              <p>Ogni esperienza riformulata con verbi d'azione e risultati misurabili. Tu approvi, lei impagina.</p>
            </div>
            <div className="cell rv d1">
              <span className="mono">Sei lingue</span>
              <h3>Un CV, sei mercati</h3>
              <p>Traduzione professionale di tutto il documento o dei singoli campi.</p>
              <div className="langs">{['IT', 'EN', 'FR', 'DE', 'ES', 'PT'].map(l => <span className="lang" key={l}>{l}</span>)}</div>
            </div>
            <div className="cell cell-wide rv d2">
              <span className="mono">CV su misura</span>
              <h3>Ogni annuncio merita la sua versione</h3>
              <p>Importa da LinkedIn o dal tuo archivio, adatta il CV a una specifica offerta e tieni traccia di ogni candidatura dalla dashboard.</p>
            </div>
          </div>
        </section>

        {/* DAL CV AL LAVORO */}
        <section className="sec" style={{ paddingTop: 0 }} aria-label="Come ti aiutiamo a trovare lavoro">
          <div className="sec-head rv">
            <h2>Non ti aiutiamo a fare un CV.<br /><span className="ac">Ti aiutiamo a trovare lavoro.</span></h2>
            <span className="mono sec-num">03 — Il percorso</span>
          </div>
          <p className="sub rv" style={{ maxWidth: 620, marginBottom: 48 }}>
            Un curriculum bello non basta: deve superare i filtri automatici, parlare la lingua dell'annuncio
            e arrivare al recruiter giusto. Ecco come ti accompagniamo dalla candidatura al colloquio.
          </p>
          <div className="rv d1">
            <ExplainerPlayer title="prontocurriculum.it — Dal CV al colloquio" steps={JOB_STEPS} />
          </div>
        </section>

        {/* SOCIAL PROOF & TESTIMONIALS */}
        <section className="sec" style={{ paddingTop: 20 }} aria-label="Storie di successo e statistiche di affidabilità">
          <div className="sec-head rv">
            <h2>I risultati di chi ha scelto <span className="ac">ProntoCurriculum.</span></h2>
            <span className="mono sec-num">04 — Risultati</span>
          </div>

          {/* Metrics Bar */}
          <div className="rv d1" style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(230px, 1fr))',
            gap: 20,
            marginBottom: 56,
          }}>
            {([
              ['+14.850', "CV su Misura Generati dall'AI"],
              ['3,4x', 'Più Colloqui Ottenuti in 30 Giorni'],
              ['8 Minuti', 'Da Zero al Download PDF/Word'],
              ['4.9 ★', 'Valutazione Media in Italia'],
            ] as [string, string][]).map(([num, label]) => (
              <div key={label} style={{ background: 'var(--card)', border: '1px solid var(--hair-soft)', borderRadius: 16, padding: '24px 20px', textAlign: 'center' }}>
                <div style={{ fontSize: 32, fontWeight: 700, color: 'var(--ink)', fontFamily: 'var(--f-display)', letterSpacing: '-0.02em' }}>{num}</div>
                <div style={{ fontSize: 13.5, color: 'var(--ink-60)', marginTop: 4, fontWeight: 500 }}>{label}</div>
              </div>
            ))}
          </div>

          {/* Testimonials Grid */}
          <div className="rv d2" style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
            gap: 24,
            marginBottom: 36,
          }}>
            {[
              {
                initials: 'MR', name: 'Marco R.', role: 'Senior Software Engineer', hired: 'Assunto',
                quote: "Avevo il solito Europass di 4 pagine che nessuno leggeva. Con ProntoCurriculum ho importato il mio profilo LinkedIn con un click e usato l'editor AI. Risultato? 3 colloqui fissati nella prima settimana a Milano.",
              },
              {
                initials: 'EV', name: 'Elena V.', role: 'Marketing Specialist', hired: 'Assunta',
                quote: "La funzione CV su Misura è formidabile. Ho incollato la Job Description di un'agenzia internazionale e il sistema ha ricalibrato ogni singolo bullet point del mio percorso. Mi hanno assunta al primo colpo.",
              },
              {
                initials: 'DS', name: 'Davide S.', role: 'Junior Financial Analyst', hired: 'Assunto',
                quote: "Zero esperienza pregressa e il terrore di inviare candidature a vuoto. Il Coach AI integrato mi ha preparato le 5 domande esatte che la direttrice HR mi ha poi fatto al colloquio. Strumento pazzesco!",
              },
            ].map(tst => (
              <div key={tst.initials} style={{
                background: 'var(--card)',
                border: '1px solid var(--hair-soft)',
                borderRadius: 18,
                padding: 28,
                boxShadow: '0 4px 16px rgba(0,0,0,0.03)',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
              }}>
                <div>
                  <div style={{ display: 'flex', gap: 3, color: 'var(--accent)', fontSize: 15, marginBottom: 14 }}>★★★★★</div>
                  <p style={{ fontSize: 14.5, color: 'var(--ink-60)', lineHeight: 1.65, margin: '0 0 20px' }}>
                    “{tst.quote}”
                  </p>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, borderTop: '1px solid var(--hair-soft)', paddingTop: 16 }}>
                  <div style={{ width: 42, height: 42, borderRadius: '50%', background: 'linear-gradient(120deg, #6FA5FF, #BE9CFF)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: 14, fontFamily: 'var(--f-display)' }}>
                    {tst.initials}
                  </div>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: 14, color: 'var(--ink)' }}>{tst.name}</div>
                    <div style={{ fontSize: 12, color: 'var(--ink-40)' }}>{tst.role} · <span style={{ color: '#12805C', fontWeight: 600 }}>✓ {tst.hired}</span></div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* GUIDA EDITORIALE */}
        <section className="sec" style={{ paddingTop: 0 }} aria-label="Guida al curriculum perfetto">
          <div className="sec-head rv">
            <h2>La piccola guida al <span className="ac">curriculum perfetto.</span></h2>
            <span className="mono sec-num">05 — Guida</span>
          </div>
          <div className="guide">
            <article className="rv">
              <h3>Cosa cercano davvero i sistemi ATS</h3>
              <p>Oltre il 70% delle aziende medio-grandi filtra i curriculum con un software prima che un essere umano li legga. Un ATS cerca struttura pulita, date complete e le stesse keyword dell'annuncio di lavoro.</p>
              <p>Per questo ogni template di ProntoCurriculum è verificato per il parsing automatico, e il <a href="#">punteggio ATS</a> ti dice in tempo reale come sta andando.</p>
            </article>
            <article className="rv d1">
              <h3>Formato italiano o europeo?</h3>
              <p>Il formato Europass resta richiesto nei concorsi pubblici e in molte candidature UE, ma per le aziende private un CV moderno di una pagina, con risultati misurabili, funziona meglio.</p>
              <p>Con lo stesso contenuto puoi generare entrambi: scegli il template <a href="#">Europass</a> o uno dei modelli professionali e il documento si reimpagina da solo.</p>
            </article>
            <article className="rv d2">
              <h3>Quanto deve essere lungo un CV</h3>
              <p>Una pagina se hai meno di dieci anni di esperienza, due al massimo. I recruiter dedicano in media 7 secondi alla prima lettura: ogni riga deve guadagnarsi il suo posto.</p>
              <p>L'<a href="#">AI Editor</a> taglia le ridondanze e trasforma le mansioni in risultati: meno testo, più colloqui.</p>
            </article>
          </div>
        </section>

        {/* FAQ */}
        <section className="sec" style={{ paddingTop: 0 }} aria-label="Domande frequenti">
          <div className="sec-head rv">
            <h2>Domande <span className="ac">frequenti.</span></h2>
            <span className="mono sec-num">06 — FAQ</span>
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
      </div>

      {/* FINALE */}
      <div className="night">
        <div className="halo" aria-hidden="true" />
        <Ring id="rg-night" />
        <div className="shell">
          <span className="mono rv">Nessuna carta di credito · Gratis per sempre</span>
          <h2 className="rv d1">Il tuo prossimo lavoro<br />comincia da <span className="grad">una pagina.</span></h2>
          <button className="btn btn-ink rv d2" style={{ fontSize: 15, padding: '15px 32px' }} onClick={() => onNavigate('builder-step1')}>Crea il tuo CV — è gratis</button>
        </div>
      </div>
      </main>

      <div className="shell">
        <footer>
          <div>
            <div className="foot-grid">
              <div>
                <div className="brand" style={{ fontSize: 17 }}><img src="/logo-icon.png" alt="" style={{ width: 22, height: 22 }} /><span>ProntoCurriculum</span></div>
                <p className="foot-about">
                  Il CV builder italiano con AI integrata: template ottimizzati ATS,
                  punteggio in tempo reale, traduzione in sei lingue e candidature tracciate.
                </p>
                <div className="foot-langs" aria-label="Lingue disponibili">
                  {['IT', 'EN', 'FR', 'DE', 'ES', 'PT'].map(l => <span key={l}>{l}</span>)}
                </div>
              </div>
              <nav className="foot-col" aria-label="Prodotto">
                <h4>Prodotto</h4>
                <a href="#" onClick={(e) => { e.preventDefault(); onNavigate('builder-step1'); }}>Crea il tuo CV</a>
                <a href="#" onClick={(e) => { e.preventDefault(); onNavigate('builder-step1'); }}>Template ATS</a>
                <a href="#" onClick={(e) => { e.preventDefault(); onNavigate('tailor'); }}>CV su misura</a>
                <a href="#" onClick={(e) => { e.preventDefault(); onModal('pricing'); }}>Prezzi</a>
              </nav>
              <nav className="foot-col" aria-label="Risorse">
                <h4>Risorse</h4>
                <a href="#" onClick={(e) => { e.preventDefault(); onNavigate('blog'); }}>Tutto il blog →</a>
                <a href="#" onClick={(e) => { e.preventDefault(); onNavigate('guida-cv'); }}>Guida al CV perfetto</a>
                <a href="#" onClick={(e) => { e.preventDefault(); onNavigate('punteggio-ats'); }}>Cos'è il punteggio ATS</a>
                <a href="#" onClick={(e) => { e.preventDefault(); onNavigate('cv-europass'); }}>CV Europass</a>
                <a href="#" onClick={(e) => { e.preventDefault(); onNavigate('esempi-cv'); }}>Esempi di CV</a>
                <a href="#" onClick={(e) => { e.preventDefault(); onNavigate('calcolo-stipendio'); }}>Calcolo Stipendio Netto</a>
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
          </div>
        </footer>
      </div>

      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(FAQ_SCHEMA) }} />
    </div>
  );
}
