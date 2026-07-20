import { useState, useEffect, useCallback, useMemo } from 'react';
import { Page, CVData } from '../types';
import { useAuth } from '../hooks/use-auth';
import { Icon, IC } from '../components/StrokeIcon';
import { toast } from 'sonner';
import { useSeoMeta } from '../components/EditorialChrome';
import { heuristicMatchScore } from '../lib/jobMatch';
import { CountrySelect, JOB_COUNTRIES } from '../components/CountrySelect';

// Offerte di lavoro — full-width card grid + modal detail popup.
// Top: "quest bar" (destination country + dream salary + AI search) and a
// toolbar (keyword search, sort, filters). Every job opens in a centered
// popup window with description, AI compatibility and salary estimate.

interface JobPosting {
  id: string;
  title: string;
  company: string;
  location: string;
  country: string;
  description: string;
  url: string;
  source: string;
  postedAt: string | null;
  salary: string | null;
  salaryMin: number | null;
  salaryMax: number | null;
  salaryCurrency: string | null;
  employmentType: 'full-time' | 'part-time' | 'contract' | null;
  languages: string[];
  remote: boolean;
}

interface StoredExp {
  id: string;
  role: string;
  company: string;
  description: string | null;
}

interface JobAnalysis {
  riassunto: string;
  requisiti: string[];
  compatibilita: number;
  puntiForti: string[];
  lacune: string[];
  modificheCv: string[];
  esperienzeConsigliate: string[];
}

interface JobsBoardProps {
  cvData: CVData;
  onNavigate: (page: Page) => void;
  onLogin: () => void;
}

const EMPLOYMENT_LABELS: Record<string, string> = {
  'full-time': 'Tempo pieno',
  'part-time': 'Part-time',
  contract: 'A contratto',
};

// Mirrors the backend CURRENCY map (jobs.ts) — just for the desired-salary input suffix.
const CURRENCY: Record<string, string> = {
  it: '€', de: '€', fr: '€', es: '€', nl: '€', at: '€', ie: '€', be: '€',
  gb: '£', us: '$', ch: 'CHF', pl: 'zł', ca: 'C$', au: 'A$', nz: 'NZ$',
  ae: 'AED', sa: 'SAR', qa: 'QAR', kw: 'KWD', bh: 'BHD', om: 'OMR', sg: 'S$',
};

// Providers often append the city to the title ("Agente di vendita - Taranto"):
// strip that suffix so the role dropdown groups them under one clean entry.
const cleanRole = (title: string) => title.split(/\s+[-–—|·]\s+/)[0].trim();
// Locations arrive as "Milano, Lombardia" or "Roma, Lazio, Italia": keep the city.
const cleanCity = (location: string) => location.split(',')[0].trim();

// Some providers (Jooble) return country-wide postings with the country name as
// location ("Italian Republic"): those aren't cities, keep them out of the dropdown.
const COUNTRY_LEVEL_LABELS = new Set([
  'italia', 'italy', 'italian republic', 'regno unito', 'united kingdom', 'great britain',
  'germania', 'germany', 'deutschland', 'francia', 'france', 'spagna', 'spain', 'españa',
  'paesi bassi', 'netherlands', 'nederland', 'stati uniti', 'united states', 'usa',
  'svizzera', 'switzerland', 'schweiz', 'suisse', 'canada', 'australia',
  'nuova zelanda', 'new zealand', 'emirati arabi uniti', 'united arab emirates',
  'arabia saudita', 'saudi arabia', 'qatar', 'kuwait', 'bahrein', 'bahrain', 'oman',
  'irlanda', 'ireland', 'svezia', 'sweden', 'sverige', 'norvegia', 'norway', 'norge',
  'danimarca', 'denmark', 'danmark', 'belgio', 'belgium', 'belgië', 'belgique',
  'austria', 'österreich', 'singapore', 'europe', 'europa', 'remote', 'worldwide',
]);
const isCountryLevel = (city: string) => COUNTRY_LEVEL_LABELS.has(city.toLowerCase());

// Benefits are not a structured API field: detect the common ones from the posting text.
const BENEFIT_PATTERNS: Array<[RegExp, string]> = [
  [/buoni\s+pasto|ticket\s+restaurant|meal\s+vouchers?/i, 'Buoni pasto'],
  [/smart\s*working|lavoro\s+da\s+remoto|remote\s+work|da\s+remoto|hybrid|ibrido/i, 'Smart working / ibrido'],
  [/welfare/i, 'Welfare aziendale'],
  [/assicurazione\s+sanitaria|health\s+insurance|polizza\s+sanitaria|copertura\s+sanitaria/i, 'Assicurazione sanitaria'],
  [/auto\s+aziendale|company\s+car/i, 'Auto aziendale'],
  [/bonus|incentiv|premi\s+di\s+(produzione|risultato)/i, 'Bonus / incentivi'],
  [/formazione|training|corsi\s+di/i, 'Formazione'],
  [/mensa\s+aziendale|mensa\b/i, 'Mensa'],
  [/stock\s+option|equity|azioni\s+aziendali/i, 'Stock options / equity'],
  [/tredicesima|quattordicesima/i, 'Tredicesima / quattordicesima'],
  [/orario\s+flessibile|flessibilit[àa]\s+orari/i, 'Orario flessibile'],
  [/ferie\s+aggiuntive|permessi\s+extra|unlimited\s+(pto|vacation)/i, 'Ferie extra'],
];
const detectBenefits = (desc: string) =>
  BENEFIT_PATTERNS.filter(([re]) => re.test(desc)).map(([, label]) => label);

interface SalaryStats {
  currency: string;
  p25: number;
  median: number;
  p75: number;
  samples: number;
  source: string;
}

const fmtSalary = (n: number, cur: string) => `${Math.round(n).toLocaleString('it-IT')} ${cur}`;

function timeAgo(iso: string | null): string {
  if (!iso) return '';
  const ms = Date.now() - Date.parse(iso);
  if (isNaN(ms) || ms < 0) return '';
  const d = Math.floor(ms / 86400000);
  if (d === 0) return 'oggi';
  if (d === 1) return 'ieri';
  if (d < 30) return `${d} giorni fa`;
  const m = Math.floor(d / 30);
  return m === 1 ? '1 mese fa' : `${m} mesi fa`;
}

// Adzuna/Jooble/Careerjet all cap their API description field well under this
// length by design (verified against the raw providers — Adzuna is always
// exactly 500 chars, Careerjet ~200, Jooble's field is literally called
// "snippet"): below this, what we show is a teaser, not the full ad. There is
// no legitimate way to fetch the rest — the full text lives behind each
// board's own page (often JS-gated) and scraping it to republish here would
// both fail unreliably and run against those sites' terms of service.
const PREVIEW_LENGTH_THRESHOLD = 550;

const scoreColor = (n: number) => n >= 70 ? 'var(--success)' : n >= 45 ? '#D99A2B' : 'var(--danger)';
const scoreBg = (n: number) => n >= 70 ? '#E7F5EE' : n >= 45 ? '#FBF3E4' : '#FDECEC';

const JX_CSS = `
.jx { max-width: 1240px; margin: 0 auto; padding: 4px 0 60px; }
.jx * { box-sizing: border-box; }

/* ── Hero ─────────────────────────────────────────────────────────── */
.jx-hero h1 { font-family: var(--f-display); font-size: clamp(26px, 3.4vw, 34px); font-weight: 700; letter-spacing: -0.025em; color: var(--ink); margin: 0 0 6px; }
.jx-hero .sub { font-size: 14px; color: var(--ink-60); line-height: 1.6; margin: 0 0 22px; max-width: 640px; }

/* command bar: destination + dream salary + AI CTA in one elevated pill */
.jx-quest { display: flex; align-items: stretch; gap: 4px; background: #fff; border: 1px solid var(--hair-soft); border-radius: 18px; padding: 8px; box-shadow: 0 24px 60px -34px rgba(20,23,31,.35); }
.jx-q-seg { flex: 1; min-width: 0; display: flex; flex-direction: column; gap: 3px; padding: 9px 16px; border-radius: 12px; transition: background .15s; position: relative; }
.jx-q-seg:hover { background: #F7F7FA; }
.jx-q-seg + .jx-q-seg::before { content: ''; position: absolute; left: -2px; top: 12px; bottom: 12px; width: 1px; background: var(--hair-soft); }
.jx-q-seg label { font-family: var(--f-mono); font-size: 9.5px; letter-spacing: .12em; text-transform: uppercase; color: var(--ink-40); white-space: nowrap; }
.jx-q-seg input { border: none; background: none; outline: none; width: 100%; font-family: var(--f-body); font-size: 14.5px; font-weight: 600; color: var(--ink); padding: 0; }
.jx-q-seg input::placeholder { color: var(--ink-40); font-weight: 500; }
.jx-q-salrow { display: flex; align-items: baseline; gap: 6px; }
.jx-q-salrow b { font-size: 13px; font-weight: 700; color: var(--ink-40); flex-shrink: 0; }
/* visual style comes from the site-wide .btn .btn-gold — here only layout */
.jx-q-cta { flex-shrink: 0; align-self: center; margin-left: 4px; }
.jx-q-cta:disabled { opacity: .6; cursor: default; transform: none; }

.jx-roles { display: flex; align-items: center; gap: 7px; flex-wrap: wrap; font-size: 12.5px; color: var(--ink-60); margin-top: 12px; }
.jx-roles .chip { background: var(--tint); color: var(--accent); font-size: 11.5px; font-weight: 700; border-radius: 99px; padding: 4px 12px; }

/* ── Toolbar ──────────────────────────────────────────────────────── */
.jx-bar { display: flex; align-items: center; gap: 10px; flex-wrap: wrap; margin: 26px 0 16px; }
.jx-count { display: flex; align-items: baseline; gap: 6px; font-size: 12.5px; color: var(--ink-60); white-space: nowrap; margin-right: auto; }
.jx-count b { font-family: var(--f-display); font-size: 17px; color: var(--ink); }
.jx-reset { border: none; background: none; color: var(--accent); font-weight: 700; font-size: 12px; cursor: pointer; font-family: var(--f-body); padding: 0 0 0 4px; }
.jx-reset:hover { text-decoration: underline; }
.jx-mini { font-size: 11px; color: var(--ink-40); display: inline-flex; align-items: center; gap: 6px; }
.jx-mini::before { content: ''; width: 10px; height: 10px; border: 2px solid var(--accent); border-top-color: transparent; border-radius: 50%; animation: jxspin .7s linear infinite; }
@keyframes jxspin { to { transform: rotate(360deg); } }

.jx-search { display: flex; align-items: center; gap: 8px; background: #fff; border: 1px solid var(--hair-soft); border-radius: 99px; padding: 8px 16px; min-width: 220px; transition: border-color .15s, box-shadow .15s; }
.jx-search:focus-within { border-color: var(--accent); box-shadow: 0 0 0 3px rgba(47,42,229,.08); }
.jx-search svg { color: var(--ink-40); flex-shrink: 0; }
.jx-search input { border: none; background: none; outline: none; font-family: var(--f-body); font-size: 13px; color: var(--ink); width: 100%; }
.jx-search input::placeholder { color: var(--ink-40); }

.jx-sel { appearance: none; -webkit-appearance: none; background: #fff url('data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="%239297A1" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M6 9l6 6 6-6"/></svg>') no-repeat right 12px center; border: 1px solid var(--hair-soft); border-radius: 99px; padding: 8px 32px 8px 16px; font-family: var(--f-body); font-size: 12.5px; font-weight: 700; color: var(--ink); cursor: pointer; outline: none; transition: border-color .15s; }
.jx-sel:hover { border-color: var(--accent); }

.jx-badge { background: var(--accent); color: #fff; font-size: 10px; font-weight: 800; border-radius: 99px; padding: 1px 7px; margin-left: 4px; }

/* filters popover */
.jx-popwrap { position: relative; }
.jx-pop { position: absolute; top: calc(100% + 10px); right: 0; z-index: 70; background: #fff; border: 1px solid var(--hair-soft); border-radius: 16px; box-shadow: 0 18px 44px rgba(20,23,31,.16); padding: 18px; width: 560px; max-width: calc(100vw - 40px); animation: jxin .18s var(--ease); }
@keyframes jxin { from { opacity: 0; transform: translateY(-6px); } }
.jx-pgrid { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
.jx-field { display: flex; flex-direction: column; gap: 5px; min-width: 0; }
.jx-field label { font-family: var(--f-mono); font-size: 9.5px; letter-spacing: .12em; text-transform: uppercase; color: var(--ink-40); padding-left: 2px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.jx-field select, .jx-field input { appearance: none; -webkit-appearance: none; width: 100%; background: #F7F7FA; border: 1px solid transparent; border-radius: 10px; padding: 10px 12px; font-family: var(--f-body); font-size: 13px; color: var(--ink); outline: none; transition: border-color .15s, background-color .15s, box-shadow .15s; }
.jx-field select { background-image: url('data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="%239297A1" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M6 9l6 6 6-6"/></svg>'); background-repeat: no-repeat; background-position: right 12px center; padding-right: 34px; cursor: pointer; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.jx-field select:hover, .jx-field input:hover { border-color: var(--hair); background-color: #fff; }
.jx-field select:focus, .jx-field input:focus { background-color: #fff; border-color: var(--accent); box-shadow: 0 0 0 3px rgba(47,42,229,.08); }
.jx-field select:disabled, .jx-field input:disabled { opacity: .55; cursor: default; }
.jx-check { display: flex; align-items: center; gap: 8px; font-size: 13px; color: var(--ink); cursor: pointer; padding: 4px 0; }
.jx-check input { accent-color: var(--accent); width: 15px; height: 15px; cursor: pointer; }
.jx-pfoot { display: flex; gap: 8px; margin-top: 14px; }

/* ── Grid ─────────────────────────────────────────────────────────── */
.jx-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(330px, 1fr)); gap: 14px; }
.jx-loadmore { display: flex; justify-content: center; margin-top: 22px; }
.jx-loadmore .btn { border-radius: 99px; padding: 11px 28px; }
.jx-card { display: flex; flex-direction: column; gap: 9px; background: #fff; border: 1px solid var(--hair-soft); border-radius: 16px; padding: 18px; cursor: pointer; text-align: left; font-family: var(--f-body); transition: transform .16s var(--ease), box-shadow .16s, border-color .16s; }
.jx-card:hover { transform: translateY(-2px); border-color: rgba(47,42,229,.35); box-shadow: 0 16px 36px -18px rgba(20,23,31,.28); }
.jx-c-top { display: flex; align-items: center; justify-content: space-between; gap: 10px; }
.jx-logo { width: 40px; height: 40px; border-radius: 11px; background: var(--tint); color: var(--accent-ink); font-family: var(--f-display); font-weight: 700; font-size: 15px; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
.jx-match { font-size: 10.5px; font-weight: 800; border-radius: 99px; padding: 3px 10px; white-space: nowrap; }
.jx-c-title { font-family: var(--f-display); font-size: 15.5px; font-weight: 700; color: var(--ink); line-height: 1.35; letter-spacing: -0.01em; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; margin: 0; }
.jx-c-sub { font-size: 12.5px; color: var(--ink-60); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.jx-c-sal { font-size: 12.5px; font-weight: 700; color: var(--accent); }
.jx-c-tags { display: flex; gap: 6px; align-items: center; flex-wrap: wrap; margin-top: auto; padding-top: 4px; }
.jx-tag { font-size: 10px; font-weight: 800; letter-spacing: .03em; background: #F4F4F8; color: var(--ink-40); border-radius: 99px; padding: 2.5px 9px; white-space: nowrap; }
.jx-tag.src { background: var(--tint); color: var(--accent); }
.jx-tag.rem { background: #E7F5EE; color: #12805C; }

/* skeletons */
.jx-sk { border: 1px solid var(--hair-soft); border-radius: 16px; padding: 18px; display: flex; flex-direction: column; gap: 10px; background: #fff; }
.jx-sk .b { background: linear-gradient(90deg, #F1F2F6 25%, #FAFAFC 50%, #F1F2F6 75%); background-size: 200% 100%; animation: jxsh 1.2s infinite; border-radius: 7px; }
@keyframes jxsh { from { background-position: 200% 0; } to { background-position: -200% 0; } }

.jx-empty { grid-column: 1 / -1; text-align: center; color: var(--ink-40); font-size: 13.5px; padding: 70px 16px; line-height: 1.7; }
.jx-empty b { color: var(--ink); font-family: var(--f-display); font-size: 16px; display: block; margin-bottom: 4px; }

/* ── Modal popup ──────────────────────────────────────────────────── */
.jx-ov { position: fixed; inset: 0; background: rgba(20,23,31,.48); backdrop-filter: blur(5px); -webkit-backdrop-filter: blur(5px); z-index: 200; display: flex; align-items: center; justify-content: center; padding: 28px; animation: jxfade .18s ease; }
@keyframes jxfade { from { opacity: 0; } }
.jx-modal { width: min(880px, 100%); max-height: min(88vh, 940px); background: #fff; border-radius: 20px; display: flex; flex-direction: column; overflow: hidden; box-shadow: 0 40px 110px -20px rgba(20,23,31,.55); animation: jxpop .22s var(--ease); }
@keyframes jxpop { from { opacity: 0; transform: translateY(14px) scale(.985); } }
.jx-m-head { padding: 24px 28px 18px; border-bottom: 1px solid var(--hair-soft); flex-shrink: 0; }
.jx-m-toprow { display: flex; align-items: flex-start; gap: 14px; }
.jx-m-toprow .jx-logo { width: 46px; height: 46px; font-size: 17px; border-radius: 13px; }
.jx-m-titles { flex: 1; min-width: 0; }
.jx-m-titles h2 { font-family: var(--f-display); font-size: 21px; font-weight: 700; letter-spacing: -0.02em; color: var(--ink); margin: 0 0 3px; line-height: 1.3; }
.jx-m-titles .sub { font-size: 13px; color: var(--ink-60); }
.jx-m-close { flex-shrink: 0; border: none; background: #F4F4F8; width: 34px; height: 34px; border-radius: 10px; cursor: pointer; color: var(--ink-60); font-size: 18px; line-height: 1; display: flex; align-items: center; justify-content: center; transition: background .15s, color .15s; }
.jx-m-close:hover { background: var(--ink); color: #fff; }
.jx-m-meta { display: flex; gap: 6px; align-items: center; flex-wrap: wrap; margin-top: 12px; }
.jx-m-acts { display: flex; gap: 8px; flex-wrap: wrap; margin-top: 14px; }
.jx-m-body { overflow-y: auto; padding: 22px 28px 34px; }
.jx-desc { font-size: 13.5px; color: var(--ink-60); line-height: 1.75; white-space: pre-line; }
.jx-preview-cta { display: flex; align-items: center; gap: 14px; flex-wrap: wrap; background: var(--tint); border: 1px solid rgba(47,42,229,.16); border-radius: 12px; padding: 14px 16px; margin-top: 16px; font-size: 12.5px; color: var(--ink-60); line-height: 1.5; }
.jx-preview-cta b { color: var(--ink); }
.jx-preview-cta .btn { margin-left: auto; }
.jx-sec-label { font-family: var(--f-mono); font-size: 9.5px; letter-spacing: .12em; text-transform: uppercase; color: var(--ink-40); margin: 18px 0 8px; }
.jx-sec-label:first-child { margin-top: 0; }

/* AI panel inside the modal */
.jx-ai { background: #FAFAFC; border: 1px solid var(--hair-soft); border-radius: 14px; padding: 18px 20px; margin-bottom: 22px; }
.jx-ai-head { display: flex; align-items: center; gap: 14px; }
.jx-ring { width: 64px; height: 64px; border-radius: 50%; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
.jx-ring > span { width: 48px; height: 48px; border-radius: 50%; background: #FAFAFC; display: flex; align-items: center; justify-content: center; font-family: var(--f-display); font-weight: 700; font-size: 17px; }
.jx-ai h3 { font-family: var(--f-display); font-size: 15px; font-weight: 700; margin: 0; color: var(--ink); }
.jx-ai .psub { font-size: 12.5px; color: var(--ink-60); margin: 3px 0 0; line-height: 1.55; }
.jx-kw { display: inline-flex; font-size: 11.5px; font-weight: 700; padding: 3.5px 10px; border-radius: 99px; margin: 0 5px 5px 0; background: #F1F2F6; color: var(--ink-60); }
.jx-li { display: flex; gap: 8px; font-size: 12.5px; color: var(--ink-60); line-height: 1.55; padding: 3px 0; }
.jx-li .dot { flex-shrink: 0; margin-top: 1px; font-weight: 800; }
.jx-exp { display: flex; align-items: center; gap: 10px; background: #fff; border: 1px solid rgba(47,42,229,.16); border-radius: 10px; padding: 9px 12px; margin-bottom: 6px; }
.jx-exp b { font-size: 12.5px; color: var(--ink); }
.jx-exp span { font-size: 11px; color: var(--ink-40); }

/* salary section inside the modal */
.jx-sal { background: #FAFAFC; border: 1px solid var(--hair-soft); border-radius: 14px; padding: 16px 20px; margin-bottom: 22px; }
.jx-sal-row { display: flex; justify-content: space-between; align-items: baseline; padding: 7px 0; border-bottom: 1px dashed var(--hair-soft); font-size: 12px; color: var(--ink-60); }
.jx-sal-row b { font-family: var(--f-display); font-size: 13.5px; color: var(--ink); }
.jx-sal-row.mid b { font-size: 20px; color: var(--accent); }
.jx-sal-src { font-size: 10.5px; color: var(--ink-40); margin-top: 10px; line-height: 1.55; }

/* ── Responsive ───────────────────────────────────────────────────── */
@media (max-width: 900px) {
  .jx-quest { flex-wrap: wrap; }
  .jx-q-seg { flex: 1 1 44%; }
  .jx-q-seg + .jx-q-seg::before { display: none; }
  .jx-q-cta { flex: 1 1 100%; justify-content: center; margin-left: 0; }
  .jx-pgrid { grid-template-columns: 1fr; }
  .jx-pop { position: fixed; top: 70px; left: 12px; right: 12px; width: auto; max-height: calc(100vh - 120px); overflow-y: auto; }
  .jx-search { min-width: 0; flex: 1 1 100%; order: 5; }
}
@media (max-width: 640px) {
  .jx-ov { padding: 0; }
  .jx-modal { width: 100%; height: 100%; max-height: none; border-radius: 0; }
}
`;

export default function JobsBoard({ cvData, onNavigate, onLogin }: JobsBoardProps) {
  useSeoMeta(
    'Offerte di Lavoro in Italia con Analisi AI di Compatibilità | ProntoCurriculum',
    'Cerca offerte di lavoro aggregate dai principali portali italiani ed europei e scopri con l\'AI quanto il tuo CV è compatibile con ogni annuncio, con suggerimenti per candidarti al meglio.',
    '/offerte-lavoro',
  );
  const { isAuthenticated } = useAuth();

  const [country, setCountry] = useState('it');
  const [query, setQuery] = useState('');
  const [jobs, setJobs] = useState<JobPosting[]>([]);
  const [providers, setProviders] = useState<string[]>([]);
  const [searching, setSearching] = useState(false);
  const [searched, setSearched] = useState(false);
  const [selected, setSelected] = useState<JobPosting | null>(null);

  const [filterCity, setFilterCity] = useState('');
  const [filterRoleOrCompany, setFilterRoleOrCompany] = useState('');
  const [filterRemote, setFilterRemote] = useState(false);
  const [filterMinSalary, setFilterMinSalary] = useState('');
  const [strictSalaryFilter, setStrictSalaryFilter] = useState(false);
  const [filterLanguage, setFilterLanguage] = useState('');
  const [filterEmploymentType, setFilterEmploymentType] = useState('');
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [sortBy, setSortBy] = useState<'recent' | 'match' | 'salary'>('recent');
  const [bulkMatching, setBulkMatching] = useState(false);

  // "Relocation search": dove voglio trasferirmi + quanto voglio guadagnare —
  // l'AI propone i titoli di ricerca giusti per il CV in quel mercato.
  const [desiredSalary, setDesiredSalary] = useState('');
  const [suggestedRoles, setSuggestedRoles] = useState<string[]>([]);
  const [suggesting, setSuggesting] = useState(false);

  const [salaryJob, setSalaryJob] = useState<JobPosting | null>(null);
  const [salaryStats, setSalaryStats] = useState<SalaryStats | null>(null);
  const [salaryLoading, setSalaryLoading] = useState(false);

  const [archive, setArchive] = useState<StoredExp[]>([]);
  const [analyses, setAnalyses] = useState<Record<string, JobAnalysis>>({});
  const [analyzing, setAnalyzing] = useState(false);

  const [translations, setTranslations] = useState<Record<string, { title: string; description: string }>>({});
  const [translating, setTranslating] = useState(false);
  const [showOriginal, setShowOriginal] = useState(false);

  // Pagination: each /search call already returns a much bigger single batch
  // (backend now asks every provider for its real per-call maximum), so
  // "Carica altri risultati" only needs to kick in once that batch runs out.
  const [page, setPage] = useState(1);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [lastQuery, setLastQuery] = useState<{ q: string; location: string; cc: string } | null>(null);

  const resetFilterState = () => {
    setFilterCity(''); setFilterRoleOrCompany(''); setFilterRemote(false);
    setFilterMinSalary(''); setFilterLanguage(''); setFilterEmploymentType(''); setStrictSalaryFilter(false);
  };

  const search = useCallback(async (q: string, location: string, cc: string, pageNum = 1) => {
    if (pageNum === 1) { setSearching(true); resetFilterState(); setSuggestedRoles([]); }
    else setLoadingMore(true);
    try {
      const params = new URLSearchParams({ q, location, country: cc, page: String(pageNum) });
      const res = await fetch(`/api/jobs/search?${params}`);
      if (!res.ok) throw new Error(`Il server ha risposto ${res.status}`);
      const data = await res.json() as { jobs: JobPosting[]; providers: string[] };
      setJobs(prev => {
        if (pageNum === 1) return data.jobs;
        const seen = new Set(prev.map(j => j.id));
        return [...prev, ...data.jobs.filter(j => !seen.has(j.id))];
      });
      setProviders(data.providers);
      setSearched(true);
      setPage(pageNum);
      setHasMore(data.jobs.length > 0 && pageNum < 10);
      setLastQuery({ q, location, cc });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Errore nella ricerca delle offerte');
    } finally {
      setSearching(false);
      setLoadingMore(false);
    }
  }, []);

  const loadMore = useCallback(() => {
    if (!lastQuery || loadingMore) return;
    void search(lastQuery.q, lastQuery.location, lastQuery.cc, page + 1);
  }, [lastQuery, loadingMore, page, search]);

  // Fan out one /search call per AI-suggested role, then merge round-robin
  // (same principle as the backend's per-provider merge) and de-dupe by id.
  // (This path always fetches a fresh, non-paginated batch — "Carica altri"
  // only applies to the plain single-query search above.)
  const searchMulti = useCallback(async (roles: string[], cc: string) => {
    setSearching(true);
    resetFilterState();
    setHasMore(false);
    try {
      const settled = await Promise.allSettled(
        roles.map(role =>
          fetch(`/api/jobs/search?${new URLSearchParams({ q: role, location: '', country: cc })}`)
            .then(r => r.json() as Promise<{ jobs: JobPosting[]; providers: string[] }>)
        )
      );
      const perRole: JobPosting[][] = [];
      const providerSet = new Set<string>();
      settled.forEach(s => {
        if (s.status === 'fulfilled') {
          perRole.push(s.value.jobs ?? []);
          (s.value.providers ?? []).forEach(p => providerSet.add(p));
        } else {
          perRole.push([]);
        }
      });
      const merged: JobPosting[] = [];
      const seen = new Set<string>();
      const maxLen = Math.max(0, ...perRole.map(p => p.length));
      for (let i = 0; i < maxLen; i++) {
        for (const list of perRole) {
          const job = list[i];
          if (job && !seen.has(job.id)) { seen.add(job.id); merged.push(job); }
        }
      }
      const trimmed = merged.slice(0, 150);
      if (trimmed.length === 0) toast.error('Nessuna offerta trovata per i ruoli suggeriti.');
      setJobs(trimmed);
      setProviders(Array.from(providerSet));
      setSearched(true);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Errore nella ricerca delle offerte');
    } finally {
      setSearching(false);
    }
  }, []);

  const runRelocationSearch = useCallback(async () => {
    setSuggesting(true);
    setSuggestedRoles([]);
    try {
      const res = await fetch('/api/jobs/suggest-roles', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          cvData,
          experiences: archive,
          country,
          desiredSalary: desiredSalary ? Number(desiredSalary) : undefined,
        }),
      });
      const body = await res.json() as { roles?: string[]; error?: string };
      if (!res.ok || !body.roles || body.roles.length === 0) throw new Error(body.error ?? 'Nessun ruolo suggerito dall\'AI');
      const roles = body.roles.slice(0, 3);
      setSuggestedRoles(roles);
      await searchMulti(roles, country);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Errore nel suggerimento dei ruoli');
    } finally {
      setSuggesting(false);
    }
  }, [cvData, archive, country, desiredSalary, searchMulti]);

  // First load: a broad search so the page is never empty.
  useEffect(() => {
    void search('', '', 'it');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);


  const countOptions = (values: string[]): Array<[string, number]> => {
    const m = new Map<string, number>();
    values.forEach(v => { if (v) m.set(v, (m.get(v) ?? 0) + 1); });
    return Array.from(m.entries()).sort((a, b) => a[0].localeCompare(b[0]));
  };

  const cityOptions = useMemo(
    () => countOptions(jobs.map(j => cleanCity(j.location)).filter(c => !isCountryLevel(c))),
    [jobs]
  );
  const roleOptions = useMemo(() => countOptions(jobs.map(j => cleanRole(j.title))), [jobs]);
  const companyOptions = useMemo(() => countOptions(jobs.map(j => j.company)), [jobs]);
  const languageOptions = useMemo(
    () => countOptions(jobs.flatMap(j => j.languages ?? [])),
    [jobs]
  );

  // Zero-cost proxy match score for every result, used for the "Match %" sort
  // and as a placeholder badge until the real AI analysis (paid, on-demand) lands.
  const heuristicScores = useMemo(() => {
    const m: Record<string, number> = {};
    jobs.forEach(j => { m[j.id] = heuristicMatchScore(j, cvData, archive); });
    return m;
  }, [jobs, cvData, archive]);
  const matchScoreFor = useCallback(
    (job: JobPosting) => analyses[job.id]?.compatibilita ?? heuristicScores[job.id] ?? 0,
    [analyses, heuristicScores]
  );

  const filteredJobs = useMemo(() => {
    const minSalary = filterMinSalary ? Number(filterMinSalary) : null;
    const list = jobs.filter(j =>
      (!filterCity || cleanCity(j.location) === filterCity) &&
      (!filterRoleOrCompany || cleanRole(j.title) === filterRoleOrCompany || j.company === filterRoleOrCompany) &&
      (!filterRemote || j.remote) &&
      (!filterLanguage || (j.languages ?? []).includes(filterLanguage)) &&
      (!filterEmploymentType || j.employmentType === filterEmploymentType) &&
      // Most postings don't expose a numeric salary at all (often 0% for a
      // given country/query), so by default jobs with no known salary stay
      // visible rather than vanishing along with the ones that are genuinely
      // below the threshold. `strictSalaryFilter` lets the user opt into
      // actually hiding the unknown ones, at the cost of a much shorter list.
      (minSalary === null || (strictSalaryFilter ? (j.salaryMax != null && j.salaryMax >= minSalary) : (j.salaryMax == null || j.salaryMax >= minSalary)))
    );
    if (sortBy === 'match') {
      return [...list].sort((a, b) => matchScoreFor(b) - matchScoreFor(a));
    }
    if (sortBy === 'salary') {
      return [...list].sort((a, b) => (b.salaryMax ?? b.salaryMin ?? -1) - (a.salaryMax ?? a.salaryMin ?? -1));
    }
    return list; // 'recent' — preserves the order already returned by the backend
  }, [jobs, filterCity, filterRoleOrCompany, filterRemote, filterLanguage, filterEmploymentType, filterMinSalary, strictSalaryFilter, sortBy, matchScoreFor]);
  const hasActiveFilters = !!(filterCity || filterRoleOrCompany || filterRemote || filterLanguage || filterEmploymentType || filterMinSalary);
  const activeFilterCount = [filterCity, filterRoleOrCompany, filterLanguage, filterEmploymentType, filterMinSalary].filter(Boolean).length + Number(filterRemote);
  const salaryBenefits = useMemo(() => salaryJob ? detectBenefits(salaryJob.description) : [], [salaryJob]);

  // When the user asks to sort by AI match %, background-analyze the top
  // heuristically-ranked results that haven't been AI-scored yet (bounded
  // concurrency so we don't hammer the LLM), then let them naturally re-sort
  // as real scores land in `analyses`.
  useEffect(() => {
    if (sortBy !== 'match' || jobs.length === 0) return;
    const CONCURRENCY = 3;
    const TOP_N = 12;
    const toAnalyze = [...jobs]
      .sort((a, b) => (heuristicScores[b.id] ?? 0) - (heuristicScores[a.id] ?? 0))
      .filter(j => !analyses[j.id])
      .slice(0, TOP_N);
    if (toAnalyze.length === 0) return;

    let cancelled = false;
    let cursor = 0;
    setBulkMatching(true);

    const worker = async () => {
      while (!cancelled && cursor < toAnalyze.length) {
        const job = toAnalyze[cursor++]!;
        try {
          const res = await fetch('/api/jobs/analyze', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            body: JSON.stringify({
              job: { title: job.title, company: job.company, description: job.description },
              cvData,
              experiences: archive,
            }),
          });
          const body = await res.json() as { success?: boolean; data?: JobAnalysis };
          if (!cancelled && res.ok && body.success && body.data) {
            setAnalyses(prev => (prev[job.id] ? prev : { ...prev, [job.id]: body.data! }));
          }
        } catch { /* best-effort background scoring — a single failure shouldn't stop the batch */ }
      }
    };

    void Promise.all(Array.from({ length: Math.min(CONCURRENCY, toAnalyze.length) }, worker))
      .finally(() => { if (!cancelled) setBulkMatching(false); });

    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sortBy, jobs]);

  // If the open job gets filtered out (or a new search lands), close the popup.
  useEffect(() => {
    if (selected && !filteredJobs.some(j => j.id === selected.id)) setSelected(null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filteredJobs]);

  useEffect(() => {
    if (!isAuthenticated) return;
    void (async () => {
      try {
        const res = await fetch('/api/experiences', { credentials: 'include' });
        if (res.ok) {
          const data = await res.json() as { experiences: StoredExp[] };
          setArchive(data.experiences ?? []);
        }
      } catch { /* archive is optional */ }
    })();
  }, [isAuthenticated]);

  // Reset the "show original" toggle whenever a different job is opened.
  useEffect(() => { setShowOriginal(false); }, [selected?.id]);

  // Popup open: lock page scroll + close on Escape.
  useEffect(() => {
    if (!selected) return;
    document.body.style.overflow = 'hidden';
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setSelected(null); };
    window.addEventListener('keydown', onKey);
    return () => {
      document.body.style.overflow = '';
      window.removeEventListener('keydown', onKey);
    };
  }, [selected]);

  const analysis = selected ? analyses[selected.id] : undefined;
  const translation = selected ? translations[selected.id] : undefined;
  const isPreview = !!selected && selected.description.trim().length < PREVIEW_LENGTH_THRESHOLD;

  const handleTranslate = async () => {
    if (!selected) return;
    setTranslating(true);
    try {
      const res = await fetch('/api/jobs/translate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: selected.title, description: selected.description }),
      });
      const body = await res.json() as { success?: boolean; title?: string; description?: string; error?: string };
      if (!res.ok || !body.success) throw new Error(body.error ?? 'Traduzione non riuscita');
      setTranslations(prev => ({ ...prev, [selected.id]: { title: body.title!, description: body.description! } }));
      setShowOriginal(false);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Errore durante la traduzione dell'annuncio");
    } finally {
      setTranslating(false);
    }
  };

  const handleAnalyze = async () => {
    if (!selected) return;
    setAnalyzing(true);
    try {
      const res = await fetch('/api/jobs/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          job: { title: selected.title, company: selected.company, description: selected.description },
          cvData,
          experiences: archive,
        }),
      });
      const body = await res.json() as { success?: boolean; data?: JobAnalysis; error?: string };
      if (!res.ok || !body.success || !body.data) throw new Error(body.error ?? 'Analisi non riuscita');
      setAnalyses(prev => ({ ...prev, [selected.id]: body.data! }));
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Errore durante l'analisi AI");
    } finally {
      setAnalyzing(false);
    }
  };

  const handleSalary = async (job: JobPosting) => {
    setSalaryJob(job);
    setSalaryStats(null);
    setSalaryLoading(true);
    try {
      const city = cleanCity(job.location);
      const params = new URLSearchParams({
        title: cleanRole(job.title),
        location: isCountryLevel(city) ? '' : city,
        country: (job.country || country).toLowerCase().slice(0, 2),
      });
      const res = await fetch(`/api/jobs/salary?${params}`);
      const body = await res.json() as { salary?: SalaryStats; error?: string };
      if (!res.ok || !body.salary) throw new Error(body.error ?? 'Dati retributivi non disponibili');
      setSalaryStats(body.salary);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Errore nella stima dello stipendio');
      setSalaryJob(null);
    } finally {
      setSalaryLoading(false);
    }
  };

  const handleTailor = (job: JobPosting) => {
    sessionStorage.setItem('pc_pending_job', JSON.stringify({
      title: job.title,
      company: job.company,
      description: job.description,
    }));
    if (!isAuthenticated) { onLogin(); return; }
    onNavigate('tailor');
  };

  const recommended = analysis
    ? archive.filter(e => analysis.esperienzeConsigliate.includes(e.id))
    : [];

  const showSalarySection = selected && salaryJob?.id === selected.id && (salaryLoading || salaryStats);

  return (
    <div className="jx">
      <style>{JX_CSS}</style>

      {/* ── HERO + COMMAND BAR ── */}
      <div className="jx-hero">
        <h1>Trova il lavoro giusto, ovunque</h1>
        <p className="sub">
          Annunci reali dalle principali job board{providers.length > 0 ? ` (${providers.join(', ')})` : ''}. Scegli dove vuoi vivere e quanto vuoi guadagnare: l'AI legge il tuo CV e ti propone le offerte più compatibili.
        </p>

        <div className="jx-quest">
          <div className="jx-q-seg">
            <label>Dove vuoi lavorare</label>
            <CountrySelect
              variant="bare"
              options={JOB_COUNTRIES}
              value={country}
              onChange={cc => { setCountry(cc); void search(query, '', cc); }}
              ariaLabel="Paese di destinazione"
            />
          </div>
          <div className="jx-q-seg">
            <label>Stipendio dei sogni (annuo lordo)</label>
            <div className="jx-q-salrow">
              <input
                type="number" min={0} step={1000} placeholder="es. 45.000"
                value={desiredSalary} onChange={e => setDesiredSalary(e.target.value)}
              />
              <b>{CURRENCY[country] ?? '€'}</b>
            </div>
          </div>
          <button className="btn btn-gold btn-lg jx-q-cta" disabled={suggesting || searching} onClick={() => void runRelocationSearch()}>
            <Icon d={IC.spark} size={15} />
            {suggesting ? 'L\'AI sta analizzando il tuo CV…' : 'Trova i lavori giusti per me'}
          </button>
        </div>

        {suggestedRoles.length > 0 && (
          <div className="jx-roles">
            Ricerca AI basata sul tuo CV: {suggestedRoles.map(r => <span key={r} className="chip">{r}</span>)}
          </div>
        )}
      </div>

      {/* ── TOOLBAR ── */}
      <div className="jx-bar">
        <div className="jx-count">
          {searched && !searching && jobs.length > 0 && (
            <>
              <b>{filteredJobs.length}</b>
              <span>{filteredJobs.length === 1 ? 'offerta' : 'offerte'}{hasActiveFilters ? ` su ${jobs.length}` : ''}</span>
              {hasActiveFilters && <button className="jx-reset" onClick={resetFilterState}>Azzera filtri</button>}
              {bulkMatching && <span className="jx-mini" style={{ marginLeft: 10 }}>analisi AI in corso</span>}
            </>
          )}
        </div>

        <div className="jx-search">
          <Icon d={IC.search} size={14} />
          <input
            placeholder="Cerca ruolo, azienda, parola chiave…"
            value={query}
            onChange={e => setQuery(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter') void search(query, '', country); }}
          />
        </div>

        <select className="jx-sel" value={sortBy} onChange={e => setSortBy(e.target.value as typeof sortBy)} aria-label="Ordina per">
          <option value="recent">Più recenti</option>
          <option value="match">Compatibilità</option>
          <option value="salary">Stipendio</option>
        </select>

        <div className="jx-popwrap">
          <button className="btn btn-line" style={{ gap: 7, borderRadius: 99 }} onClick={() => setFiltersOpen(v => !v)}>
            <Icon d={IC.sliders} size={14} /> Filtri
            {activeFilterCount > 0 && <span className="jx-badge">{activeFilterCount}</span>}
          </button>
          {filtersOpen && (
            <>
              <div style={{ position: 'fixed', inset: 0, zIndex: 65 }} onClick={() => setFiltersOpen(false)} />
              <div className="jx-pop">
                <div className="jx-pgrid">
                  <div className="jx-field">
                    <label>Ruolo o azienda</label>
                    <select value={filterRoleOrCompany} onChange={e => setFilterRoleOrCompany(e.target.value)} disabled={jobs.length === 0}>
                      <option value="">Tutti i ruoli e le aziende</option>
                      <optgroup label="Ruoli">
                        {roleOptions.map(([r, n]) => <option key={`r-${r}`} value={r}>{r} ({n})</option>)}
                      </optgroup>
                      <optgroup label="Aziende">
                        {companyOptions.map(([c, n]) => <option key={`c-${c}`} value={c}>{c} ({n})</option>)}
                      </optgroup>
                    </select>
                  </div>
                  <div className="jx-field">
                    <label>Città</label>
                    <select value={filterCity} onChange={e => setFilterCity(e.target.value)} disabled={jobs.length === 0}>
                      <option value="">Tutte le città</option>
                      {cityOptions.map(([c, n]) => <option key={c} value={c}>{c} ({n})</option>)}
                    </select>
                  </div>
                  <div className="jx-field">
                    <label>Stipendio minimo (annuo)</label>
                    <input
                      type="number" min={0} step={1000} placeholder="es. 30000"
                      value={filterMinSalary} onChange={e => setFilterMinSalary(e.target.value)}
                      disabled={jobs.length === 0}
                    />
                    {filterMinSalary && (
                      <label className="jx-check" style={{ padding: '2px 0 0', fontSize: 11.5 }}>
                        <input type="checkbox" checked={strictSalaryFilter} onChange={e => setStrictSalaryFilter(e.target.checked)} />
                        Escludi annunci senza stipendio indicato
                      </label>
                    )}
                  </div>
                  <div className="jx-field">
                    <label>Lingua richiesta</label>
                    <select value={filterLanguage} onChange={e => setFilterLanguage(e.target.value)} disabled={languageOptions.length === 0}>
                      <option value="">Qualsiasi lingua</option>
                      {languageOptions.map(([l, n]) => <option key={l} value={l}>{l} ({n})</option>)}
                    </select>
                  </div>
                  <div className="jx-field">
                    <label>Tipo di contratto</label>
                    <select value={filterEmploymentType} onChange={e => setFilterEmploymentType(e.target.value)} disabled={jobs.length === 0}>
                      <option value="">Qualsiasi</option>
                      <option value="full-time">Tempo pieno</option>
                      <option value="part-time">Part-time</option>
                      <option value="contract">A contratto</option>
                    </select>
                  </div>
                  <label className="jx-check" style={{ alignSelf: 'end' }}>
                    <input type="checkbox" checked={filterRemote} onChange={e => setFilterRemote(e.target.checked)} />
                    Solo lavoro da remoto
                  </label>
                </div>
                <div className="jx-pfoot">
                  <button className="btn btn-ink btn-sm" style={{ flex: 1, justifyContent: 'center', gap: 6 }} disabled={searching} onClick={() => void search(query, '', country)}>
                    {searching ? 'Ricerca…' : <><Icon d={IC.refresh} size={12} /> Aggiorna risultati</>}
                  </button>
                  <button className="btn btn-ghost btn-sm" onClick={() => setFiltersOpen(false)}>Chiudi</button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>

      {/* ── GRID ── */}
      <div className="jx-grid">
        {searching && Array.from({ length: 9 }, (_, i) => (
          <div key={i} className="jx-sk" aria-hidden>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <div className="b" style={{ width: 40, height: 40, borderRadius: 11 }} />
              <div className="b" style={{ width: 64, height: 20, borderRadius: 99 }} />
            </div>
            <div className="b" style={{ width: '85%', height: 16 }} />
            <div className="b" style={{ width: '60%', height: 12 }} />
            <div style={{ display: 'flex', gap: 6, marginTop: 6 }}>
              <div className="b" style={{ width: 58, height: 18, borderRadius: 99 }} />
              <div className="b" style={{ width: 48, height: 18, borderRadius: 99 }} />
            </div>
          </div>
        ))}

        {!searching && searched && jobs.length === 0 && (
          <div className="jx-empty">
            <b>Nessuna offerta trovata</b>
            Prova con parole più generiche o cambia paese.
          </div>
        )}
        {!searching && jobs.length > 0 && filteredJobs.length === 0 && (
          <div className="jx-empty">
            <b>Nessuna offerta corrisponde ai filtri</b>
            Prova a cambiare o azzerare i filtri.
          </div>
        )}

        {!searching && filteredJobs.map(job => {
          const score = matchScoreFor(job);
          const showMatch = !!analyses[job.id] || sortBy === 'match';
          return (
            <button key={job.id} className="jx-card" onClick={() => setSelected(job)}>
              <span className="jx-c-top">
                <span className="jx-logo">{(job.company[0] ?? '?').toUpperCase()}</span>
                {showMatch && (
                  <span className="jx-match" style={{ background: scoreBg(score), color: scoreColor(score) }}>
                    {score}%{!analyses[job.id] ? ' ~' : ''} match
                  </span>
                )}
              </span>
              <b className="jx-c-title">{job.title}</b>
              <span className="jx-c-sub">{job.company}{job.location ? ` · ${job.location}` : ''}</span>
              {job.salary && <span className="jx-c-sal">{job.salary}</span>}
              <span className="jx-c-tags">
                <span className="jx-tag src">{job.source}</span>
                {job.remote && <span className="jx-tag rem">Remote</span>}
                {job.employmentType && <span className="jx-tag">{EMPLOYMENT_LABELS[job.employmentType]}</span>}
                {job.postedAt && <span className="jx-tag">{timeAgo(job.postedAt)}</span>}
              </span>
            </button>
          );
        })}
      </div>

      {!searching && searched && jobs.length > 0 && hasMore && suggestedRoles.length === 0 && (
        <div className="jx-loadmore">
          <button className="btn btn-line" disabled={loadingMore} onClick={loadMore}>
            {loadingMore ? 'Caricamento…' : 'Carica altri risultati'}
          </button>
        </div>
      )}

      {/* ── DETAIL POPUP ── */}
      {selected && (
        <div className="jx-ov" onClick={() => setSelected(null)} role="dialog" aria-modal="true">
          <div className="jx-modal" onClick={e => e.stopPropagation()}>
            <div className="jx-m-head">
              <div className="jx-m-toprow">
                <span className="jx-logo">{(selected.company[0] ?? '?').toUpperCase()}</span>
                <div className="jx-m-titles">
                  <h2>{translation && !showOriginal ? translation.title : selected.title}</h2>
                  <div className="sub">
                    {selected.company}{selected.location ? ` · ${selected.location}` : ''}
                    {selected.postedAt ? ` · ${timeAgo(selected.postedAt)}` : ''}
                  </div>
                </div>
                <button className="jx-m-close" aria-label="Chiudi" title="Chiudi (Esc)" onClick={() => setSelected(null)}>×</button>
              </div>

              <div className="jx-m-meta">
                <span className="jx-tag src">{selected.source}</span>
                {selected.remote && <span className="jx-tag rem">Remote</span>}
                {selected.employmentType && <span className="jx-tag">{EMPLOYMENT_LABELS[selected.employmentType]}</span>}
                {(selected.languages ?? []).map(l => <span key={l} className="jx-tag">{l}</span>)}
                {selected.salary && <span className="jx-tag" style={{ background: 'var(--tint)', color: 'var(--accent)' }}>{selected.salary}</span>}
              </div>

              <div className="jx-m-acts">
                <button className="btn btn-ink btn-sm" style={{ gap: 6 }} onClick={() => handleTailor(selected)}>
                  <Icon d={IC.spark} size={13} /> Crea CV su misura
                </button>
                {!analysis && (
                  <button className="btn btn-line btn-sm" onClick={() => void handleAnalyze()} disabled={analyzing}>
                    {analyzing ? 'Analisi in corso…' : 'Analizza col mio CV'}
                  </button>
                )}
                <button className="btn btn-line btn-sm" style={{ gap: 6 }} onClick={() => void handleSalary(selected)} disabled={salaryLoading && salaryJob?.id === selected.id}>
                  <Icon d={IC.coins} size={13} />
                  {salaryLoading && salaryJob?.id === selected.id ? 'Stima in corso…' : 'Stima stipendio'}
                </button>
                {!translation && (
                  <button className="btn btn-line btn-sm" onClick={() => void handleTranslate()} disabled={translating}>
                    {translating ? 'Traduzione…' : 'Traduci in italiano'}
                  </button>
                )}
                {translation && (
                  <button className="btn btn-line btn-sm" onClick={() => setShowOriginal(v => !v)}>
                    {showOriginal ? 'Vedi traduzione' : 'Vedi originale'}
                  </button>
                )}
                {selected.url && !isPreview && (
                  <a className="btn btn-ghost btn-sm" href={selected.url} target="_blank" rel="noopener noreferrer" style={{ textDecoration: 'none' }}>
                    Annuncio originale ↗
                  </a>
                )}
              </div>
            </div>

            <div className="jx-m-body">
              {/* AI ANALYSIS */}
              {analysis && (
                <div className="jx-ai">
                  <div className="jx-ai-head">
                    <div className="jx-ring" style={{ background: `conic-gradient(${scoreColor(analysis.compatibilita)} 0 ${analysis.compatibilita}%, #EDEDF2 ${analysis.compatibilita}% 100%)` }}>
                      <span style={{ color: scoreColor(analysis.compatibilita) }}>{analysis.compatibilita}</span>
                    </div>
                    <div>
                      <h3>Compatibilità col tuo CV</h3>
                      <p className="psub">{analysis.riassunto}</p>
                    </div>
                  </div>

                  {analysis.requisiti.length > 0 && (
                    <>
                      <div className="jx-sec-label">Requisiti chiave dell'annuncio</div>
                      <div>{analysis.requisiti.map(r => <span key={r} className="jx-kw">{r}</span>)}</div>
                    </>
                  )}

                  {analysis.puntiForti.length > 0 && (
                    <>
                      <div className="jx-sec-label">I tuoi punti forti</div>
                      {analysis.puntiForti.map(p => (
                        <div key={p} className="jx-li"><span className="dot" style={{ color: '#12805C' }}>✓</span>{p}</div>
                      ))}
                    </>
                  )}

                  {analysis.lacune.length > 0 && (
                    <>
                      <div className="jx-sec-label">Dove il CV è debole</div>
                      {analysis.lacune.map(p => (
                        <div key={p} className="jx-li"><span className="dot" style={{ color: 'var(--danger)' }}>✗</span>{p}</div>
                      ))}
                    </>
                  )}

                  {analysis.modificheCv.length > 0 && (
                    <>
                      <div className="jx-sec-label">Come adattare il CV</div>
                      {analysis.modificheCv.map((p, i) => (
                        <div key={p} className="jx-li"><span className="dot" style={{ color: 'var(--accent)' }}>{i + 1}.</span>{p}</div>
                      ))}
                    </>
                  )}

                  {recommended.length > 0 && (
                    <>
                      <div className="jx-sec-label">Dal tuo archivio: esperienze da aggiungere</div>
                      {recommended.map(e => (
                        <div key={e.id} className="jx-exp">
                          <Icon d={IC.check} size={13} style={{ color: 'var(--accent)', flexShrink: 0 }} />
                          <div style={{ minWidth: 0 }}>
                            <b>{e.role}</b> <span>· {e.company}</span>
                          </div>
                        </div>
                      ))}
                    </>
                  )}

                  <div style={{ display: 'flex', gap: 8, marginTop: 16, flexWrap: 'wrap' }}>
                    <button className="btn btn-ink btn-sm" style={{ gap: 6 }} onClick={() => handleTailor(selected)}>
                      <Icon d={IC.spark} size={13} /> Applica con il CV su misura
                    </button>
                    {!isAuthenticated && (
                      <button className="btn btn-line btn-sm" onClick={onLogin}>
                        Accedi per usare il tuo archivio
                      </button>
                    )}
                  </div>
                </div>
              )}

              {/* SALARY ESTIMATE */}
              {showSalarySection && (
                <div className="jx-sal">
                  <div className="jx-sec-label" style={{ marginTop: 0 }}>Stima stipendio · {cleanRole(selected.title)}</div>
                  {salaryLoading && (
                    <div className="jx-empty" style={{ padding: '18px 0' }}>
                      <div className="spinner" style={{ margin: '0 auto 10px' }} />
                      Stima della retribuzione in corso…
                    </div>
                  )}
                  {!salaryLoading && salaryStats && (
                    <>
                      <div className="jx-sal-row"><span>25° percentile</span><b>{fmtSalary(salaryStats.p25, salaryStats.currency)}</b></div>
                      <div className="jx-sal-row mid"><span>Mediana · annuo lordo</span><b>{fmtSalary(salaryStats.median, salaryStats.currency)}</b></div>
                      <div className="jx-sal-row"><span>75° percentile</span><b>{fmtSalary(salaryStats.p75, salaryStats.currency)}</b></div>
                      {salaryBenefits.length > 0 && (
                        <>
                          <div className="jx-sec-label">Benefit citati nell'annuncio</div>
                          <div>{salaryBenefits.map(b => <span key={b} className="jx-kw">{b}</span>)}</div>
                        </>
                      )}
                      <div className="jx-sal-src">
                        {salaryStats.source}{salaryStats.samples ? ` · ${salaryStats.samples} campioni` : ''}. Stima indicativa basata su annunci e dati di mercato.
                      </div>
                      <button className="btn btn-line btn-sm" style={{ marginTop: 10 }} onClick={() => onNavigate('calcolo-stipendio')}>
                        Apri il calcolatore completo
                      </button>
                    </>
                  )}
                </div>
              )}

              {/* DESCRIPTION */}
              <div className="jx-sec-label">
                Descrizione dell'offerta{translation && !showOriginal ? ' (tradotta)' : ''}
              </div>
              <div className="jx-desc">
                {(translation && !showOriginal ? translation.description : selected.description) || 'Descrizione non disponibile: apri l\'annuncio originale.'}
              </div>

              {isPreview && selected.url && (
                <div className="jx-preview-cta">
                  <div>
                    <b>Questa è un'anteprima.</b> {selected.source.split(' ·')[0]} mostra solo un estratto: il testo integrale è disponibile sul sito dell'inserzionista.
                  </div>
                  <a className="btn btn-gold btn-sm" href={selected.url} target="_blank" rel="noopener noreferrer" style={{ textDecoration: 'none', gap: 6, flexShrink: 0 }}>
                    Leggi l'annuncio completo ↗
                  </a>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
