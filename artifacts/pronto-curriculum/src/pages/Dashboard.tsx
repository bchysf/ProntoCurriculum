import { useState, useEffect, useCallback } from 'react';
import { Page, CVData, SavedCV, SavedTailoredCv } from '../types';
import { useAuth } from '../hooks/use-firebase-auth';
import { useT } from '../i18n/LanguageContext';

// Dashboard "Carta & Inchiostro" v3 — DashboardV3 shell with real data.
// Same design as the landing: Switzer + Satoshi + IBM Plex Mono,
// white surfaces, hairlines, one ink accent, blue-to-violet gradient.

interface UserProfile {
  userId: string;
  headline: string | null;
  phone: string | null;
  city: string | null;
  linkedin: string | null;
  website: string | null;
  summary: string | null;
  skills: string[] | null;
  education: Array<{ id: string; institution: string; degree: string; grade: string; from: string; to: string }> | null;
  languages: Array<{ id: string; name: string; level: string }> | null;
}

interface ExperienceRow {
  id: string;
  company: string;
  role: string;
  city: string | null;
  startDate: string | null;
  endDate: string | null;
  isCurrent: boolean | null;
}

interface DashboardProps {
  onNavigate: (page: Page) => void;
  onCVLoaded: (data: CVData, template?: string) => void;
  onLogin: () => void;
}

const fmt = (iso: string) => {
  try { return new Date(iso).toLocaleDateString('it-IT', { day: '2-digit', month: 'short', year: 'numeric' }); }
  catch { return iso; }
};

function initials(first?: string | null, last?: string | null, email?: string | null): string {
  if (first && last) return `${first[0]}${last[0]}`.toUpperCase();
  if (first) return first[0].toUpperCase();
  if (email) return email[0].toUpperCase();
  return '?';
}

function profileCompletion(profile: UserProfile | null, user: { firstName?: string | null; lastName?: string | null; email?: string | null } | null): number {
  const checks = [
    !!(user?.firstName),
    !!(user?.lastName),
    !!(profile?.headline),
    !!(profile?.phone),
    !!(profile?.city),
    !!(profile?.linkedin),
    !!(profile?.summary),
    !!(profile?.skills?.length),
  ];
  return Math.round((checks.filter(Boolean).length / checks.length) * 100);
}

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
  trash: 'M3 6h18|M8 6V4a1 1 0 0 1 1-1h6a1 1 0 0 1 1 1v2|M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6',
  check: 'M20 6L9 17l-5-5',
  x: 'M18 6L6 18|M6 6l12 12',
  sync: 'M21 12a9 9 0 1 1-2.64-6.36|M21 3v6h-6',
  lock: 'M5 11h14a1 1 0 0 1 1 1v8a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1v-8a1 1 0 0 1 1-1z|M8 11V7a4 4 0 0 1 8 0v4',
  chevron: 'M9 18l6-6-6-6',
  mail: 'M4 4h16a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2z|M22 6l-10 7L2 6',
  phone: 'M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z',
  pin: 'M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0z|M15 10a3 3 0 1 1-6 0 3 3 0 0 1 6 0z',
  link: 'M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71|M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71',
};

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
.dv3 .brand { font-family: var(--f-display); font-weight: 700; font-size: 17px; letter-spacing: -0.03em; padding: 0 10px 22px; cursor: pointer; }
.dv3 .brand i { font-style: normal; color: var(--accent); }
.dv3 .side .mono { padding: 0 10px 10px; display: block; }
.dv3 .nav-item { display: flex; align-items: center; gap: 11px; width: 100%; padding: 10px 12px; border: none; background: transparent; border-radius: 10px; font-family: var(--f-body); font-size: 13.5px; font-weight: 500; color: var(--ink-60); cursor: pointer; text-align: left; transition: background .15s, color .15s; margin-bottom: 2px; }
.dv3 .nav-item:hover { background: #F4F4F8; color: var(--ink); }
.dv3 .nav-item.active { background: var(--tint); color: var(--accent); font-weight: 700; }
.dv3 .nav-item svg { flex-shrink: 0; }
.dv3 .nav-badge { margin-left: auto; font-family: var(--f-mono); font-size: 10px; background: #F4F4F8; border-radius: 99px; padding: 2px 8px; color: var(--ink-40); }
.dv3 .nav-item.active .nav-badge { background: rgba(47,42,229,.12); color: var(--accent); }
.dv3 .side-user { margin-top: auto; display: flex; align-items: center; gap: 10px; padding: 12px 10px; border-top: 1px solid var(--hair-soft); }
.dv3 .avatar { width: 34px; height: 34px; border-radius: 50%; background: linear-gradient(120deg, #6FA5FF, #BE9CFF); color: #fff; font-family: var(--f-display); font-weight: 700; font-size: 13px; display: flex; align-items: center; justify-content: center; flex-shrink: 0; overflow: hidden; }
.dv3 .avatar img { width: 100%; height: 100%; object-fit: cover; }
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

@media (max-width: 1080px) { .dv3 .cols { grid-template-columns: 1fr; } .dv3 .stats { grid-template-columns: repeat(2, 1fr); } }
@media (max-width: 860px) {
  .dv3 { grid-template-columns: 1fr; }
  .dv3 .side { position: static; height: auto; flex-direction: row; align-items: center; overflow-x: auto; padding: 12px 16px; flex-wrap: nowrap; }
  .dv3 .side .mono, .dv3 .side-user { display: none; }
  .dv3 .brand { padding: 0 14px 0 0; white-space: nowrap; }
  .dv3 .nav-item { width: auto; white-space: nowrap; }
  .dv3 .main { padding: 0 20px 40px; }
  .dv3 .stats { grid-template-columns: repeat(2, 1fr); }
  .dv3 .head { flex-direction: column; align-items: flex-start; }
  .dv3 .form-grid { grid-template-columns: 1fr; }
}
`;

// Count-up for stat numbers (fires on mount)
function useCountUp(deps: unknown[]) {
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);
}

export default function Dashboard({ onNavigate, onCVLoaded, onLogin }: DashboardProps) {
  const t = useT();
  const { user, isAuthenticated, isLoading } = useAuth();

  const [savedCVs, setSavedCVs] = useState<SavedCV[]>([]);
  const [tailoredCVs, setTailoredCVs] = useState<SavedTailoredCv[]>([]);
  const [experiences, setExperiences] = useState<ExperienceRow[]>([]);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [fetching, setFetching] = useState(false);

  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [renamingId, setRenamingId] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState('');

  const [editingProfile, setEditingProfile] = useState(false);
  const [profileSaving, setProfileSaving] = useState(false);
  const [profileSaved, setProfileSaved] = useState(false);
  const [profileForm, setProfileForm] = useState({
    headline: '', phone: '', city: '', linkedin: '', website: '', summary: '', skills: '',
  });

  const [progress, setProgress] = useState(0);

  const fetchAll = useCallback(async () => {
    setFetching(true);
    try {
      const [cvsRes, tailoredRes, expsRes, profileRes] = await Promise.all([
        fetch('/api/cvs', { credentials: 'include' }),
        fetch('/api/tailored-cvs', { credentials: 'include' }),
        fetch('/api/experiences', { credentials: 'include' }),
        fetch('/api/profile', { credentials: 'include' }),
      ]);
      const cvsData = await cvsRes.json() as { cvs?: SavedCV[] };
      const tailoredData = await tailoredRes.json() as { tailoredCvs?: SavedTailoredCv[] };
      const expsData = await expsRes.json() as { experiences?: ExperienceRow[] };
      const profileData = await profileRes.json() as { profile?: UserProfile | null };

      setSavedCVs(cvsData.cvs ?? []);
      setTailoredCVs(tailoredData.tailoredCvs ?? []);
      setExperiences(expsData.experiences ?? []);
      const p = profileData.profile ?? null;
      setProfile(p);
      setProfileForm({
        headline: p?.headline ?? '',
        phone: p?.phone ?? '',
        city: p?.city ?? '',
        linkedin: p?.linkedin ?? '',
        website: p?.website ?? '',
        summary: p?.summary ?? '',
        skills: p?.skills?.join(', ') ?? '',
      });
    } catch {
    } finally {
      setFetching(false);
    }
  }, []);

  useEffect(() => {
    if (isAuthenticated) void fetchAll();
  }, [isAuthenticated, fetchAll]);

  useEffect(() => {
    const timer = setTimeout(() => setProgress(profileCompletion(profile, user)), 400);
    return () => clearTimeout(timer);
  }, [profile, user]);

  useCountUp([fetching]);

  const handleEditCV = (cv: SavedCV) => { onCVLoaded(cv.cvData, cv.template); onNavigate('builder-step2'); };
  const handleEditTailored = (cv: SavedTailoredCv) => { onCVLoaded(cv.cvData); onNavigate('builder-step2'); };

  const handleDeleteCV = async (id: string) => {
    setDeletingId(id);
    try {
      await fetch(`/api/cvs/${id}`, { method: 'DELETE', credentials: 'include' });
      setSavedCVs(prev => prev.filter(c => c.id !== id));
    } catch { } finally { setDeletingId(null); }
  };

  const handleRenameCV = async (id: string) => {
    if (!renameValue.trim()) { setRenamingId(null); return; }
    try {
      const res = await fetch(`/api/cvs/${id}`, {
        method: 'PUT', headers: { 'Content-Type': 'application/json' }, credentials: 'include',
        body: JSON.stringify({ name: renameValue }),
      });
      if (res.ok) {
        const data = await res.json() as { cv: SavedCV };
        setSavedCVs(prev => prev.map(c => c.id === id ? data.cv : c));
      }
    } catch { } finally { setRenamingId(null); setRenameValue(''); }
  };

  const handleSaveProfile = async () => {
    setProfileSaving(true);
    try {
      const body = {
        headline: profileForm.headline.trim() || null,
        phone: profileForm.phone.trim() || null,
        city: profileForm.city.trim() || null,
        linkedin: profileForm.linkedin.trim() || null,
        website: profileForm.website.trim() || null,
        summary: profileForm.summary.trim() || null,
        skills: profileForm.skills ? profileForm.skills.split(',').map(s => s.trim()).filter(Boolean) : [],
        education: profile?.education ?? [],
        languages: profile?.languages ?? [],
      };
      const res = await fetch('/api/profile', {
        method: 'PUT', headers: { 'Content-Type': 'application/json' }, credentials: 'include',
        body: JSON.stringify(body),
      });
      if (res.ok) {
        const data = await res.json() as { profile: UserProfile };
        setProfile(data.profile);
        setEditingProfile(false);
        setProfileSaved(true);
        setTimeout(() => setProfileSaved(false), 2500);
      }
    } catch { } finally { setProfileSaving(false); }
  };

  const handleSyncFromCV = () => {
    const latestCV = savedCVs[0];
    if (!latestCV) return;
    const d = latestCV.cvData;
    setProfileForm(prev => ({
      headline: prev.headline || d.title || '',
      phone: prev.phone || d.phone || '',
      city: prev.city || d.city || '',
      linkedin: prev.linkedin || d.linkedin || '',
      website: prev.website || '',
      summary: prev.summary || d.summary || '',
      skills: prev.skills || (d.skills ?? []).join(', '),
    }));
    if (!editingProfile) setEditingProfile(true);
  };

  // ── Loading ──────────────────────────────────────────────────
  if (isLoading || fetching) {
    return (
      <div className="dv3">
        <style>{CSS}</style>
        <div style={{ gridColumn: '1 / -1' }} className="loading-state">
          <div className="spinner" />
          <span>{t('dash.loading')}</span>
        </div>
      </div>
    );
  }

  // ── Not authenticated ────────────────────────────────────────
  if (!isAuthenticated) {
    return (
      <div className="dv3">
        <style>{CSS}</style>
        <div style={{ gridColumn: '1 / -1' }} className="lock-state">
          <div className="lock-icon"><Icon d={IC.lock} size={22} /></div>
          <h2>{t('dash.loginNeeded')}</h2>
          <button className="btn btn-ink" onClick={onLogin}>{t('nav.login')}</button>
        </div>
      </div>
    );
  }

  const completion = profileCompletion(profile, user);
  const firstName = user?.firstName || user?.email?.split('@')[0] || 'utente';
  const userName = [user?.firstName, user?.lastName].filter(Boolean).join(' ') || user?.email || '';
  const userInitials = initials(user?.firstName, user?.lastName, user?.email);

  const NAV = [
    { icon: IC.grid, label: 'Dashboard', page: 'dashboard' as Page, active: true },
    { icon: IC.doc, label: t('dash.myCVs'), page: 'builder-step1' as Page, badge: savedCVs.length > 0 ? String(savedCVs.length) : undefined },
    { icon: IC.spark, label: t('dash.tailorNew'), page: 'tailor' as Page },
    { icon: IC.list, label: t('dash.applications'), page: 'candidature' as Page, badge: tailoredCVs.length > 0 ? String(tailoredCVs.length) : undefined },
    { icon: IC.briefcase, label: t('dash.archive'), page: 'archivio' as Page },
  ];

  // ── Main dashboard ───────────────────────────────────────────
  return (
    <div className="dv3">
      <style>{CSS}</style>

      {/* SIDEBAR */}
      <aside className="side">
        <div className="brand" onClick={() => onNavigate('home')}>ProntoCurriculum<i>.</i></div>
        <span className="mono">Menu</span>
        {NAV.map(item => (
          <button key={item.label} className={`nav-item${item.active ? ' active' : ''}`} onClick={() => onNavigate(item.page)}>
            <Icon d={item.icon} />
            {item.label}
            {item.badge && <span className="nav-badge">{item.badge}</span>}
          </button>
        ))}
        <div className="side-user">
          <div className="avatar">
            {user?.profileImageUrl ? <img src={user.profileImageUrl} alt="avatar" /> : userInitials}
          </div>
          <div>
            <b>{userName || firstName}</b>
            <span>{t('home.planFree') || 'Piano gratuito'}</span>
          </div>
        </div>
      </aside>

      {/* MAIN */}
      <main className="main">
        <div className="topbar">
          <label className="search">
            <Icon d={IC.search} size={14} />
            <input placeholder={`${t('dash.myCVs')}, ${t('dash.applications')}…`} />
            <kbd>⌘K</kbd>
          </label>
          <div className="top-right">
            <button className="icon-btn" aria-label="Notifiche"><Icon d={IC.bell} size={15} /></button>
            <div className="avatar" style={{ width: 36, height: 36 }}>
              {user?.profileImageUrl ? <img src={user.profileImageUrl} alt="avatar" /> : userInitials}
            </div>
          </div>
        </div>

        {/* HEAD */}
        <div className="head">
          <div>
            <h1>{t('dash.welcome')}, {firstName}.</h1>
            <p>{t('dash.subtitle')}</p>
          </div>
          <div style={{ display: 'flex', gap: 10 }}>
            <button className="btn btn-line" onClick={() => onNavigate('tailor')}>
              <Icon d={IC.spark} size={14} /> {t('dash.tailorNew')}
            </button>
            <button className="btn btn-ink" onClick={() => onNavigate('builder-step1')}>
              <Icon d={IC.plus} size={14} /> {t('dash.createNew')}
            </button>
          </div>
        </div>

        {/* STATS */}
        <div className="stats">
          <div className="stat" onClick={() => onNavigate('builder-step1')}>
            <span className="mono">{t('dash.myCVs')}</span>
            <div className="stat-num" data-count={savedCVs.length}>{savedCVs.length}</div>
            <div className="stat-sub">{savedCVs.length === 1 ? '1 attivo' : `${savedCVs.length} attivi`}</div>
          </div>
          <div className="stat" onClick={() => onNavigate('candidature')}>
            <span className="mono">{t('dash.applications')}</span>
            <div className="stat-num" data-count={tailoredCVs.length}>{tailoredCVs.length}</div>
            <div className="stat-sub up">{tailoredCVs.length > 0 ? `+${Math.min(tailoredCVs.length, 2)} questa settimana` : '—'}</div>
          </div>
          <div className="stat" onClick={() => onNavigate('archivio')}>
            <span className="mono">{t('dash.experiences')}</span>
            <div className="stat-num grad" data-count={experiences.length}>{experiences.length}</div>
            <div className="stat-sub">{experiences.length > 0 ? `${experiences.length} in archivio` : 'Nessuna ancora'}</div>
          </div>
          <div className="stat">
            <span className="mono">Profilo</span>
            <div className="stat-num" data-count={completion}>{completion}</div>
            <div className="stat-sub">% completato</div>
          </div>
        </div>

        <div className="cols">
          {/* LEFT */}
          <div>
            {/* CV GRID */}
            <div className="sec-label">
              <span className="mono">{t('dash.myCVs')}</span>
              {savedCVs.length > 0 && <a onClick={() => onNavigate('builder-step1')}>Vedi tutti</a>}
            </div>
            <div className="cv-grid">
              {savedCVs.map(cv => (
                <div className="cv-card" key={cv.id}>
                  <div className="thumb" aria-hidden="true">
                    <i className="hd" /><i /><i style={{ width: '82%' }} /><i style={{ width: '90%' }} /><i style={{ width: '68%' }} /><i style={{ width: '76%' }} />
                  </div>
                  {renamingId === cv.id ? (
                    <div className="rename-row">
                      <input
                        autoFocus
                        className="rename-input"
                        value={renameValue}
                        onChange={e => setRenameValue(e.target.value)}
                        onKeyDown={e => { if (e.key === 'Enter') void handleRenameCV(cv.id); if (e.key === 'Escape') setRenamingId(null); }}
                      />
                      <button className="btn btn-ink btn-sm" onClick={() => void handleRenameCV(cv.id)}><Icon d={IC.check} size={13} /></button>
                      <button className="btn btn-line btn-sm" onClick={() => setRenamingId(null)}><Icon d={IC.x} size={13} /></button>
                    </div>
                  ) : (
                    <div className="cv-name" title="Clicca per rinominare" onClick={() => { setRenamingId(cv.id); setRenameValue(cv.name); }}>
                      {cv.name}
                    </div>
                  )}
                  <div className="cv-meta">
                    <span className="cv-date">{fmt(cv.updatedAt)}</span>
                    <span className="cv-ats">{cv.template}</span>
                  </div>
                  <div className="cv-actions">
                    <button className="btn btn-ink btn-sm" style={{ flex: 1 }} onClick={() => handleEditCV(cv)}>{t('dash.openCV')}</button>
                    <button
                      className="btn btn-line btn-sm btn-danger"
                      disabled={deletingId === cv.id}
                      onClick={() => void handleDeleteCV(cv.id)}
                      aria-label={t('dash.delete')}
                    >
                      {deletingId === cv.id ? '…' : <Icon d={IC.trash} size={13} />}
                    </button>
                  </div>
                </div>
              ))}
              <button className="cv-new" onClick={() => onNavigate('builder-step1')}>
                <Icon d={IC.plus} size={18} /> {t('dash.createNew')}
              </button>
            </div>

            {/* APPLICATIONS */}
            <div className="sec-label">
              <span className="mono">{t('dash.applications')}</span>
              {tailoredCVs.length > 0 && <a onClick={() => onNavigate('candidature')}>Vedi tutte</a>}
            </div>
            {tailoredCVs.length === 0 ? (
              <div className="empty">
                <p>{t('dash.noApps')}</p>
                <button className="btn btn-ink btn-sm" onClick={() => onNavigate('tailor')}>{t('dash.tailorNew')}</button>
              </div>
            ) : (
              <div className="rows">
                {tailoredCVs.slice(0, 5).map(cv => (
                  <div className="row" key={cv.id}>
                    <div className="row-body">
                      <div className="row-title">{cv.jobTitle || t('dash.tailorNew')}</div>
                      <div className="row-sub">{t('dash.generatedOn')} {fmt(cv.createdAt)}</div>
                    </div>
                    <span className="pill pill-b">CV su misura</span>
                    <button className="btn btn-line btn-sm" onClick={() => handleEditTailored(cv)}>{t('dash.openCV')}</button>
                  </div>
                ))}
              </div>
            )}

            {/* EXPERIENCE ARCHIVE */}
            <div className="sec-label">
              <span className="mono">{t('dash.archive')}</span>
              <a onClick={() => onNavigate('archivio')}>{t('dash.goArchive')}</a>
            </div>
            {experiences.length === 0 ? (
              <div className="empty">
                <p>{t('dash.noExps')}</p>
                <button className="btn btn-ink btn-sm" onClick={() => onNavigate('archivio')}>{t('dash.archive')}</button>
              </div>
            ) : (
              <div className="rows">
                {experiences.slice(-5).reverse().map(exp => (
                  <div className="row" key={exp.id}>
                    <span style={{ color: 'var(--ink-40)' }}><Icon d={IC.briefcase} size={16} /></span>
                    <div className="row-body">
                      <div className="row-title">{exp.role} <span style={{ fontWeight: 400, color: 'var(--ink-60)' }}>· {exp.company}</span></div>
                      <div className="row-sub">
                        {[exp.city, [exp.startDate, exp.isCurrent ? t('dash.present') : exp.endDate].filter(Boolean).join(' → ')].filter(Boolean).join(' · ')}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* RIGHT */}
          <div>
            {/* Profile completion */}
            <div className="panel">
              <h3>Completa il profilo</h3>
              <p className="psub">Un profilo completo genera CV su misura più precisi.</p>
              <div className="prog"><i style={{ width: `${progress}%` }} /></div>
              <div className="prog-meta">
                <span className="mono">{completion}% completo</span>
                <span className="mono">{100 - completion > 0 ? `${Math.round((100 - completion) / 12.5)} passi rimasti` : 'Completo!'}</span>
              </div>
              <div className="check-list">
                <div className={`check-item${user?.firstName ? '' : ' pending'}`}><span className={user?.firstName ? 'ok' : 'todo'}>{user?.firstName ? '✓' : ''}</span> Dati personali</div>
                <div className={`check-item${profile?.headline ? '' : ' pending'}`}><span className={profile?.headline ? 'ok' : 'todo'}>{profile?.headline ? '✓' : ''}</span> Titolo professionale</div>
                <div className={`check-item${profile?.phone ? '' : ' pending'}`}><span className={profile?.phone ? 'ok' : 'todo'}>{profile?.phone ? '✓' : ''}</span> Telefono</div>
                <div className={`check-item${profile?.summary ? '' : ' pending'}`}><span className={profile?.summary ? 'ok' : 'todo'}>{profile?.summary ? '✓' : ''}</span> Sommario professionale</div>
                <div className={`check-item${profile?.skills?.length ? '' : ' pending'}`}><span className={profile?.skills?.length ? 'ok' : 'todo'}>{profile?.skills?.length ? '✓' : ''}</span> Competenze</div>
              </div>

              {/* Profile info / edit */}
              {!editingProfile && (
                <>
                  {profile?.skills && profile.skills.length > 0 && (
                    <div className="skill-chips" style={{ marginTop: 14 }}>
                      {profile.skills.slice(0, 6).map(s => <span key={s} className="skill-chip">{s}</span>)}
                    </div>
                  )}
                  {profile?.headline && <p style={{ fontSize: 12.5, color: 'var(--ink-60)', marginTop: 10 }}>{profile.headline}</p>}
                  <div style={{ display: 'flex', gap: 8, marginTop: 14, flexWrap: 'wrap' }}>
                    {profileSaved && <span style={{ fontSize: 12, color: '#12805C', display: 'flex', alignItems: 'center', gap: 4 }}><Icon d={IC.check} size={12} /> {t('profile.saved')}</span>}
                    {savedCVs.length > 0 && (
                      <button className="btn btn-line btn-sm" onClick={handleSyncFromCV}>
                        <Icon d={IC.sync} size={12} /> {t('profile.syncFromCV')}
                      </button>
                    )}
                    <button className="btn btn-ink btn-sm" onClick={() => setEditingProfile(true)}>
                      {t('profile.editBtn')}
                    </button>
                  </div>
                </>
              )}

              {editingProfile && (
                <div className="profile-form">
                  <div className="form-grid">
                    {([
                      ['headline', t('profile.headline')],
                      ['phone', t('profile.phone')],
                      ['city', t('profile.city')],
                      ['linkedin', t('profile.linkedin')],
                      ['website', t('profile.website')],
                    ] as [keyof typeof profileForm, string][]).map(([key, label]) => (
                      <div key={key}>
                        <label className="form-label">{label}</label>
                        <input
                          className="form-input"
                          value={profileForm[key]}
                          onChange={e => setProfileForm(f => ({ ...f, [key]: e.target.value }))}
                        />
                      </div>
                    ))}
                    <div style={{ gridColumn: '1 / -1' }}>
                      <label className="form-label">{t('profile.skills')}</label>
                      <input
                        className="form-input"
                        value={profileForm.skills}
                        onChange={e => setProfileForm(f => ({ ...f, skills: e.target.value }))}
                        placeholder="React, TypeScript, Project Management…"
                      />
                    </div>
                    <div style={{ gridColumn: '1 / -1' }}>
                      <label className="form-label">{t('profile.summary')}</label>
                      <textarea
                        className="form-input"
                        value={profileForm.summary}
                        onChange={e => setProfileForm(f => ({ ...f, summary: e.target.value }))}
                        rows={3}
                        style={{ resize: 'vertical' }}
                      />
                    </div>
                  </div>
                  <div className="form-actions">
                    <button className="btn btn-ink btn-sm" disabled={profileSaving} onClick={() => void handleSaveProfile()}>
                      {profileSaving ? t('profile.saving') : t('profile.save')}
                    </button>
                    <button className="btn btn-ghost btn-sm" onClick={() => setEditingProfile(false)}>{t('profile.cancel')}</button>
                  </div>
                </div>
              )}
            </div>

            {/* Upgrade CTA */}
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
