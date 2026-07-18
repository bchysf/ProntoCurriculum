import { useState, useEffect, useCallback } from 'react';
import { Page, CVData, SavedCV, SavedTailoredCv } from '../types';
import { useAuth } from '../hooks/use-auth';
import { useT } from '../i18n/LanguageContext';
import { downloadCVAsDOCX } from '../utils/downloadDOCX';
import { Icon, IC } from '../components/StrokeIcon';

// Dashboard — resume.io-inspired structure, Carta & Inchiostro skin.
// Rendered inside WorkspaceShell (shared rail + dv3 tokens):
// centered greeting + goal, feature cards with real counts, hero banner,
// documents grid, applications, profile panel. No decorative noise.

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

const DH_CSS = `
.dh { max-width: 1060px; margin: 0 auto; padding-bottom: 90px; position: relative; }
.dh * { box-sizing: border-box; }

/* hero */
.dh-hero { text-align: center; padding: 34px 0 10px; }
.dh-hero h1 { font-family: var(--f-display); font-size: 34px; font-weight: 700; letter-spacing: -0.03em; margin: 0; }
.dh-hero p { font-size: 15px; color: var(--ink-60); margin: 8px 0 22px; }
.dh-goal { position: relative; display: inline-block; }
.dh-goal-btn { display: inline-flex; align-items: center; gap: 12px; background: #fff; border: 1px solid var(--hair); border-radius: 99px; padding: 13px 22px; font-family: var(--f-display); font-size: 15.5px; font-weight: 700; letter-spacing: -0.01em; color: var(--ink); cursor: pointer; box-shadow: 0 2px 10px rgba(20,23,31,.05); transition: all .15s; }
.dh-goal-btn:hover { border-color: var(--accent); }
.dh-goal-menu { position: absolute; top: calc(100% + 8px); left: 50%; transform: translateX(-50%); background: #fff; border: 1px solid var(--hair-soft); border-radius: 14px; box-shadow: 0 18px 44px rgba(20,23,31,.16); padding: 6px; min-width: 300px; z-index: 40; text-align: left; }
.dh-goal-item { display: flex; align-items: center; gap: 12px; width: 100%; border: none; background: none; font-family: var(--f-body); font-size: 14px; font-weight: 600; color: var(--ink); padding: 12px 14px; border-radius: 10px; cursor: pointer; text-align: left; }
.dh-goal-item:hover { background: #F4F4F8; }
.dh-goal-item svg { color: var(--accent); flex-shrink: 0; }
.dh-goal-item small { display: block; font-size: 11.5px; color: var(--ink-40); font-weight: 500; margin-top: 1px; }

/* feature cards row */
.dh-feats { display: grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap: 14px; margin: 26px 0 18px; }
.dh-feat { background: #fff; border: 1px solid var(--hair-soft); border-radius: 14px; padding: 16px 18px; cursor: pointer; text-align: left; font-family: var(--f-body); transition: all .18s var(--ease); display: flex; flex-direction: column; gap: 10px; }
.dh-feat:hover { transform: translateY(-2px); box-shadow: 0 14px 30px -18px rgba(60,70,180,.28); border-color: rgba(111,140,255,.35); }
.dh-feat-top { display: flex; align-items: center; gap: 10px; }
.dh-feat-ico { width: 34px; height: 34px; border-radius: 10px; background: var(--tint); color: var(--accent); display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
.dh-feat-top b { font-size: 13.5px; color: var(--ink); }
.dh-feat-top .n { margin-left: auto; font-family: var(--f-display); font-size: 19px; font-weight: 700; letter-spacing: -0.02em; }
.dh-feat-bar { height: 5px; background: #EDEDF2; border-radius: 99px; overflow: hidden; }
.dh-feat-bar i { display: block; height: 100%; border-radius: 99px; background: var(--accent); }

/* hero banner */
.dh-banner { display: flex; gap: 26px; align-items: center; background: linear-gradient(120deg, #EEF1FD 0%, #F3F0FD 55%, #FDF2F6 100%); border: 1px solid rgba(47,42,229,.1); border-radius: 18px; padding: 28px 30px; margin-bottom: 34px; overflow: hidden; }
.dh-banner-tag { display: inline-block; background: rgba(47,42,229,.1); color: var(--accent-ink); font-size: 11px; font-weight: 800; border-radius: 99px; padding: 4px 11px; margin-bottom: 10px; }
.dh-banner h2 { font-family: var(--f-display); font-size: 23px; font-weight: 700; letter-spacing: -0.02em; margin: 0 0 8px; line-height: 1.25; }
.dh-banner p { font-size: 13.5px; color: var(--ink-60); line-height: 1.6; margin: 0 0 16px; max-width: 460px; }
.dh-banner-side { margin-left: auto; flex-shrink: 0; position: relative; display: none; }
@media (min-width: 900px) { .dh-banner-side { display: block; } }
.dh-minicv { width: 128px; height: 168px; background: #fff; border-radius: 8px; box-shadow: 0 12px 30px rgba(20,23,31,.14); padding: 14px 13px; }
.dh-minicv .nm { font-family: var(--f-display); font-weight: 700; font-size: 10px; color: var(--ink); }
.dh-minicv .ln { height: 4px; border-radius: 2px; background: #E9E9EF; margin-top: 6px; }
.dh-minicv .sec { height: 5px; width: 45%; border-radius: 2px; background: var(--accent); opacity: .75; margin-top: 11px; }
.dh-score { position: absolute; right: -14px; bottom: -10px; background: #fff; border-radius: 99px; box-shadow: 0 8px 22px rgba(20,23,31,.16); padding: 8px 13px; text-align: center; }
.dh-score b { font-family: var(--f-display); font-size: 16px; color: #12805C; display: block; line-height: 1; }
.dh-score small { font-size: 8.5px; font-weight: 700; letter-spacing: .06em; color: var(--ink-40); }

/* sections */
.dh-sec { margin-bottom: 30px; }
.dh-sec-head { display: flex; align-items: baseline; justify-content: space-between; margin-bottom: 13px; }
.dh-sec-head h3 { font-family: var(--f-display); font-size: 17px; font-weight: 700; letter-spacing: -0.015em; margin: 0; }
.dh-sec-head a { font-size: 12.5px; font-weight: 700; color: var(--accent); cursor: pointer; }
.dh-sec-head a:hover { text-decoration: underline; }

/* documents grid */
.dh-docs { display: grid; grid-template-columns: repeat(auto-fill, minmax(210px, 1fr)); gap: 14px; }
.dh-doc { background: #fff; border: 1px solid var(--hair-soft); border-radius: 14px; padding: 14px; transition: all .18s var(--ease); }
.dh-doc:hover { box-shadow: 0 14px 30px -18px rgba(60,70,180,.25); border-color: rgba(111,140,255,.35); }
.dh-doc-thumb { height: 92px; background: #F5F5F9; border-radius: 9px; padding: 12px 14px; margin-bottom: 11px; overflow: hidden; }
.dh-doc-thumb .hd { height: 6px; width: 55%; border-radius: 3px; background: var(--ink); opacity: .8; }
.dh-doc-thumb i { display: block; height: 4px; border-radius: 2px; background: #E2E2EA; margin-top: 7px; }
.dh-doc-name { font-size: 13.5px; font-weight: 700; color: var(--ink); cursor: pointer; border-radius: 6px; padding: 2px 4px; margin: 0 -4px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.dh-doc-name:hover { background: #F4F4F8; }
.dh-doc-date { font-size: 11px; color: var(--ink-40); margin: 3px 0 10px; padding: 0 4px 0 0; display: flex; justify-content: space-between; }
.dh-doc-date em { font-style: normal; text-transform: capitalize; }
.dh-doc-acts { display: flex; gap: 6px; }
.dh-new { border: 1.5px dashed var(--hair); border-radius: 14px; background: none; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 8px; font-family: var(--f-body); font-size: 13px; font-weight: 700; color: var(--ink-60); cursor: pointer; min-height: 180px; transition: all .15s; }
.dh-new:hover { border-color: var(--accent); color: var(--accent); background: rgba(47,42,229,.03); }
.dh-rename { display: flex; gap: 6px; }
.dh-rename input { flex: 1; min-width: 0; background: #F1F2F6; border: 1px solid var(--accent); border-radius: 8px; padding: 5px 9px; font-family: var(--f-body); font-size: 12.5px; outline: none; }

/* rows (applications) */
.dh-rows { display: flex; flex-direction: column; gap: 8px; }
.dh-row { display: flex; align-items: center; gap: 14px; background: #fff; border: 1px solid var(--hair-soft); border-radius: 12px; padding: 12px 16px; }
.dh-row b { font-size: 13.5px; display: block; }
.dh-row .sub { font-size: 11.5px; color: var(--ink-40); margin-top: 1px; }
.dh-row .grow { flex: 1; min-width: 0; }
.dh-pill { font-size: 10.5px; font-weight: 800; background: var(--tint); color: var(--accent); border-radius: 99px; padding: 4px 10px; white-space: nowrap; }

/* profile panel */
.dh-profile { background: #fff; border: 1px solid var(--hair-soft); border-radius: 16px; padding: 24px; }
.dh-prog { height: 6px; background: #EDEDF2; border-radius: 99px; overflow: hidden; margin: 12px 0 6px; }
.dh-prog i { display: block; height: 100%; border-radius: 99px; background: var(--accent); transition: width .6s var(--ease); }
.dh-checks { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 6px 18px; margin-top: 14px; }
.dh-check { display: flex; align-items: center; gap: 8px; font-size: 13px; color: var(--ink-60); padding: 4px 0; }
.dh-check .ok { width: 17px; height: 17px; border-radius: 50%; background: #E7F5EE; color: #12805C; font-size: 10px; display: inline-flex; align-items: center; justify-content: center; flex-shrink: 0; font-weight: 800; }
.dh-check .todo { width: 17px; height: 17px; border-radius: 50%; border: 1.5px dashed var(--hair); flex-shrink: 0; }
.dh-form-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin-top: 16px; }
.dh-form-grid label { font-size: 12px; font-weight: 600; color: var(--ink-60); display: block; margin-bottom: 5px; }
.dh-form-grid input, .dh-form-grid textarea { width: 100%; background: #F1F2F6; border: 1px solid transparent; border-radius: 10px; padding: 10px 12px; font-family: var(--f-body); font-size: 13px; color: var(--ink); outline: none; }
.dh-form-grid input:focus, .dh-form-grid textarea:focus { background: #fff; border-color: var(--accent); box-shadow: 0 0 0 3px rgba(47,42,229,.08); }
.dh-chip { display: inline-flex; font-size: 12px; font-weight: 600; background: #F4F4F8; color: var(--ink-60); border-radius: 99px; padding: 4px 11px; margin: 0 6px 6px 0; }

/* floating AI pill */
.dh-ai-wrap { position: fixed; bottom: 22px; left: 50%; transform: translateX(-50%); z-index: 50; }
.dh-ai-pill { display: flex; align-items: center; gap: 9px; background: #fff; border: 1.5px solid var(--accent); color: var(--accent); font-family: var(--f-body); font-size: 13.5px; font-weight: 800; border-radius: 99px; padding: 12px 22px; cursor: pointer; box-shadow: 0 12px 30px rgba(47,42,229,.2); }
.dh-ai-pill:hover { background: var(--tint); }
.dh-ai-menu { position: absolute; bottom: calc(100% + 8px); left: 50%; transform: translateX(-50%); background: #fff; border: 1px solid var(--hair-soft); border-radius: 14px; box-shadow: 0 18px 44px rgba(20,23,31,.18); padding: 6px; min-width: 280px; }
`;

export default function Dashboard({ onNavigate, onCVLoaded, onLogin }: DashboardProps) {
  const t = useT();
  const { user, isAuthenticated, isLoading } = useAuth();

  const [savedCVs, setSavedCVs] = useState<SavedCV[]>([]);
  const [tailoredCVs, setTailoredCVs] = useState<SavedTailoredCv[]>([]);
  const [experiences, setExperiences] = useState<ExperienceRow[]>([]);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [fetching, setFetching] = useState(false);

  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [downloadingDocxId, setDownloadingDocxId] = useState<string | null>(null);
  const [renamingId, setRenamingId] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState('');

  const [editingProfile, setEditingProfile] = useState(false);
  const [profileSaving, setProfileSaving] = useState(false);
  const [profileSaved, setProfileSaved] = useState(false);
  const [profileForm, setProfileForm] = useState({
    headline: '', phone: '', city: '', linkedin: '', website: '', summary: '', skills: '',
  });

  const [progress, setProgress] = useState(0);
  const [goalOpen, setGoalOpen] = useState(false);
  const [aiOpen, setAiOpen] = useState(false);

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

  const handleQuickDownloadDOCX = async (cv: SavedCV) => {
    setDownloadingDocxId(cv.id);
    try {
      await downloadCVAsDOCX(cv.name || 'CV', cv.cvData, cv.template || 'modern');
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : 'Errore durante il download del file Word (.docx)');
    } finally {
      setDownloadingDocxId(null);
    }
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
      <div className="loading-state">
        <div className="spinner" />
        <span>{t('dash.loading')}</span>
      </div>
    );
  }

  // ── Not authenticated ────────────────────────────────────────
  if (!isAuthenticated) {
    return (
      <div className="lock-state">
        <h2>{t('dash.loginNeeded')}</h2>
        <button className="btn btn-ink" onClick={onLogin}>{t('nav.login')}</button>
      </div>
    );
  }

  const completion = profileCompletion(profile, user);
  const firstName = user?.firstName || user?.email?.split('@')[0] || 'utente';
  const bestScore = Math.min(98, 40 + completion * 0.5 + Math.min(savedCVs.length, 3) * 6);

  const GOALS: Array<{ label: string; sub: string; icon: string; page: Page }> = [
    { label: 'Creare un nuovo CV', sub: 'Parti da zero, da un PDF o da LinkedIn', icon: IC.doc, page: 'builder-step1' },
    { label: 'Trovare offerte di lavoro', sub: 'Annunci reali con analisi di compatibilità AI', icon: IC.eye, page: 'jobs' },
    { label: 'Adattare il CV a un annuncio', sub: "L'AI riscrive il CV per una specifica offerta", icon: IC.spark, page: 'tailor' },
    { label: 'Scrivere la lettera di presentazione', sub: 'Struttura in 4 parti, generata dal tuo CV', icon: IC.doc, page: 'cover-letter' },
    { label: 'Prepararmi a un colloquio', sub: 'Coach AI sulle tue candidature', icon: IC.bulb, page: 'candidature' },
  ];

  // ── Main dashboard ───────────────────────────────────────────
  return (
    <div className="dh">
      <style>{DH_CSS}</style>

      {/* HERO */}
      <div className="dh-hero">
        <h1>Ciao, {firstName}!</h1>
        <p>Qual è il tuo obiettivo oggi?</p>
        <div className="dh-goal">
          <button className="dh-goal-btn" onClick={() => setGoalOpen(v => !v)}>
            <Icon d={IC.doc} size={16} style={{ color: 'var(--accent)' }} />
            Creazione CV
            <span style={{ fontSize: 10, color: 'var(--ink-40)' }}>▼</span>
          </button>
          {goalOpen && (
            <>
              <div style={{ position: 'fixed', inset: 0, zIndex: 30 }} onClick={() => setGoalOpen(false)} />
              <div className="dh-goal-menu">
                {GOALS.map(g => (
                  <button key={g.label} className="dh-goal-item" onClick={() => { setGoalOpen(false); onNavigate(g.page); }}>
                    <Icon d={g.icon} size={17} />
                    <span>{g.label}<small>{g.sub}</small></span>
                  </button>
                ))}
              </div>
            </>
          )}
        </div>
      </div>

      {/* FEATURE CARDS */}
      <div className="dh-feats">
        <button className="dh-feat" onClick={() => onNavigate('builder-step1')}>
          <div className="dh-feat-top">
            <span className="dh-feat-ico"><Icon d={IC.doc} size={16} /></span>
            <b>{t('dash.myCVs')}</b>
            <span className="n">{savedCVs.length}</span>
          </div>
          <div className="dh-feat-bar"><i style={{ width: `${Math.min(100, savedCVs.length * 25)}%` }} /></div>
        </button>
        <button className="dh-feat" onClick={() => onNavigate('candidature')}>
          <div className="dh-feat-top">
            <span className="dh-feat-ico"><Icon d={IC.spark} size={16} /></span>
            <b>{t('dash.applications')}</b>
            <span className="n">{tailoredCVs.length}</span>
          </div>
          <div className="dh-feat-bar"><i style={{ width: `${Math.min(100, tailoredCVs.length * 20)}%` }} /></div>
        </button>
        <button className="dh-feat" onClick={() => onNavigate('archivio')}>
          <div className="dh-feat-top">
            <span className="dh-feat-ico"><Icon d={IC.save} size={16} /></span>
            <b>{t('dash.experiences')}</b>
            <span className="n">{experiences.length}</span>
          </div>
          <div className="dh-feat-bar"><i style={{ width: `${Math.min(100, experiences.length * 15)}%` }} /></div>
        </button>
        <button className="dh-feat" onClick={() => document.getElementById('dh-profile')?.scrollIntoView({ behavior: 'smooth' })}>
          <div className="dh-feat-top">
            <span className="dh-feat-ico"><Icon d={IC.user} size={16} /></span>
            <b>Profilo</b>
            <span className="n" style={{ color: completion >= 80 ? '#12805C' : 'var(--ink)' }}>{completion}%</span>
          </div>
          <div className="dh-feat-bar"><i style={{ width: `${completion}%`, background: completion >= 80 ? '#12805C' : 'var(--accent)' }} /></div>
        </button>
      </div>

      {/* BANNER */}
      <div className="dh-banner">
        <div>
          <span className="dh-banner-tag">Creazione CV</span>
          <h2>{savedCVs.length > 0 ? 'Sei sulla strada giusta.' : 'Il tuo primo CV è a 8 minuti da qui.'}</h2>
          <p>
            {savedCVs.length > 0
              ? `Hai ${savedCVs.length === 1 ? 'un CV salvato' : `${savedCVs.length} CV salvati`} e il profilo al ${completion}%. Adatta il CV a un annuncio specifico per moltiplicare le risposte dei recruiter.`
              : 'Rispondi a qualche domanda, l\'AI scrive con te e il punteggio ATS sale in tempo reale. Nessuna carta di credito richiesta.'}
          </p>
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
            {savedCVs.length > 0 ? (
              <>
                <button className="btn btn-ink btn-sm" onClick={() => onNavigate('tailor')}><Icon d={IC.spark} size={13} /> CV su misura</button>
                <button className="btn btn-line btn-sm" onClick={() => savedCVs[0] && handleEditCV(savedCVs[0]!)}>Continua l'ultimo CV</button>
              </>
            ) : (
              <button className="btn btn-ink btn-sm" onClick={() => onNavigate('builder-step1')}><Icon d={IC.doc} size={13} /> Crea il tuo CV</button>
            )}
          </div>
        </div>
        <div className="dh-banner-side">
          <div className="dh-minicv">
            <div className="nm">{[user?.firstName, user?.lastName].filter(Boolean).join(' ') || 'Il tuo nome'}</div>
            <div className="ln" style={{ width: '48%' }} />
            <div className="sec" />
            <div className="ln" /><div className="ln" style={{ width: '86%' }} /><div className="ln" style={{ width: '70%' }} />
            <div className="sec" />
            <div className="ln" style={{ width: '80%' }} /><div className="ln" style={{ width: '58%' }} />
          </div>
          <div className="dh-score"><b>{Math.round(bestScore)}%</b><small>PUNTEGGIO</small></div>
        </div>
      </div>

      {/* DOCUMENTS */}
      <div className="dh-sec">
        <div className="dh-sec-head">
          <h3>I miei documenti</h3>
          <a onClick={() => onNavigate('builder-step1')}>+ Nuovo CV</a>
        </div>
        <div className="dh-docs">
          {savedCVs.map(cv => (
            <div className="dh-doc" key={cv.id}>
              <div className="dh-doc-thumb">
                <div className="hd" /><i /><i style={{ width: '84%' }} /><i style={{ width: '92%' }} /><i style={{ width: '68%' }} />
              </div>
              {renamingId === cv.id ? (
                <div className="dh-rename">
                  <input
                    autoFocus
                    value={renameValue}
                    onChange={e => setRenameValue(e.target.value)}
                    onKeyDown={e => { if (e.key === 'Enter') void handleRenameCV(cv.id); if (e.key === 'Escape') setRenamingId(null); }}
                  />
                  <button className="btn btn-ink btn-sm" onClick={() => void handleRenameCV(cv.id)}><Icon d={IC.check} size={12} /></button>
                </div>
              ) : (
                <div className="dh-doc-name" title="Clicca per rinominare" onClick={() => { setRenamingId(cv.id); setRenameValue(cv.name); }}>
                  {cv.name}
                </div>
              )}
              <div className="dh-doc-date">
                <span>{fmt(cv.updatedAt)}</span>
                <em>{cv.template}</em>
              </div>
              <div className="dh-doc-acts">
                <button className="btn btn-ink btn-sm" style={{ flex: 1, justifyContent: 'center' }} onClick={() => handleEditCV(cv)}>{t('dash.openCV')}</button>
                <button className="btn btn-line btn-sm" disabled={downloadingDocxId === cv.id} onClick={() => void handleQuickDownloadDOCX(cv)} title="Scarica in Word (.docx)">
                  {downloadingDocxId === cv.id ? '…' : <Icon d={IC.doc} size={13} />}
                </button>
                <button className="btn btn-line btn-sm btn-danger" disabled={deletingId === cv.id} onClick={() => void handleDeleteCV(cv.id)} aria-label={t('dash.delete')}>
                  {deletingId === cv.id ? '…' : <Icon d={IC.trash} size={13} />}
                </button>
              </div>
            </div>
          ))}
          <button className="dh-new" onClick={() => onNavigate('builder-step1')}>
            <Icon d={IC.doc} size={20} /> {t('dash.createNew')}
          </button>
        </div>
      </div>

      {/* APPLICATIONS */}
      <div className="dh-sec">
        <div className="dh-sec-head">
          <h3>{t('dash.applications')}</h3>
          {tailoredCVs.length > 0 && <a onClick={() => onNavigate('candidature')}>Vedi tutte</a>}
        </div>
        {tailoredCVs.length === 0 ? (
          <div className="dh-row" style={{ justifyContent: 'space-between' }}>
            <div className="grow">
              <b>{t('dash.noApps')}</b>
              <div className="sub">Incolla un annuncio e l'AI adatta il CV a quella posizione.</div>
            </div>
            <button className="btn btn-line btn-sm" onClick={() => onNavigate('tailor')}>{t('dash.tailorNew')}</button>
          </div>
        ) : (
          <div className="dh-rows">
            {tailoredCVs.slice(0, 4).map(cv => (
              <div className="dh-row" key={cv.id}>
                <div className="grow">
                  <b>{cv.jobTitle || t('dash.tailorNew')}</b>
                  <div className="sub">{t('dash.generatedOn')} {fmt(cv.createdAt)}</div>
                </div>
                <span className="dh-pill">CV su misura</span>
                <button className="btn btn-line btn-sm" onClick={() => handleEditTailored(cv)}>{t('dash.openCV')}</button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* PROFILE */}
      <div className="dh-sec" id="dh-profile">
        <div className="dh-sec-head">
          <h3>Il tuo profilo</h3>
          {savedCVs.length > 0 && (
            <a onClick={handleSyncFromCV}>Sincronizza dall'ultimo CV</a>
          )}
        </div>
        <div className="dh-profile">
          <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
            <span style={{ fontSize: 13.5, color: 'var(--ink-60)' }}>
              Un profilo completo genera CV su misura più precisi.
            </span>
            <span style={{ fontFamily: 'var(--f-display)', fontWeight: 700, fontSize: 16, color: completion >= 80 ? '#12805C' : 'var(--ink)' }}>{completion}%</span>
          </div>
          <div className="dh-prog"><i style={{ width: `${progress}%` }} /></div>

          <div className="dh-checks">
            {([
              [!!user?.firstName, 'Dati personali'],
              [!!profile?.headline, 'Titolo professionale'],
              [!!profile?.phone, 'Telefono'],
              [!!profile?.summary, 'Sommario professionale'],
              [!!profile?.skills?.length, 'Competenze'],
              [!!profile?.linkedin, 'LinkedIn'],
            ] as Array<[boolean, string]>).map(([ok, label]) => (
              <div className="dh-check" key={label}>
                {ok ? <span className="ok">✓</span> : <span className="todo" />}
                {label}
              </div>
            ))}
          </div>

          {!editingProfile && (
            <>
              {profile?.skills && profile.skills.length > 0 && (
                <div style={{ marginTop: 16 }}>
                  {profile.skills.slice(0, 8).map(s => <span key={s} className="dh-chip">{s}</span>)}
                </div>
              )}
              <div style={{ display: 'flex', gap: 8, marginTop: 16, alignItems: 'center', flexWrap: 'wrap' }}>
                {profileSaved && <span style={{ fontSize: 12.5, color: '#12805C', fontWeight: 700 }}>✓ {t('profile.saved')}</span>}
                <button className="btn btn-ink btn-sm" onClick={() => setEditingProfile(true)}>
                  {t('profile.editBtn')}
                </button>
              </div>
            </>
          )}

          {editingProfile && (
            <>
              <div className="dh-form-grid">
                {([
                  ['headline', t('profile.headline')],
                  ['phone', t('profile.phone')],
                  ['city', t('profile.city')],
                  ['linkedin', t('profile.linkedin')],
                  ['website', t('profile.website')],
                ] as [keyof typeof profileForm, string][]).map(([key, label]) => (
                  <div key={key}>
                    <label>{label}</label>
                    <input
                      value={profileForm[key]}
                      onChange={e => setProfileForm(f => ({ ...f, [key]: e.target.value }))}
                    />
                  </div>
                ))}
                <div>
                  <label>{t('profile.skills')}</label>
                  <input
                    value={profileForm.skills}
                    onChange={e => setProfileForm(f => ({ ...f, skills: e.target.value }))}
                    placeholder="React, TypeScript, Project Management…"
                  />
                </div>
                <div style={{ gridColumn: '1 / -1' }}>
                  <label>{t('profile.summary')}</label>
                  <textarea
                    value={profileForm.summary}
                    onChange={e => setProfileForm(f => ({ ...f, summary: e.target.value }))}
                    rows={3}
                    style={{ resize: 'vertical' }}
                  />
                </div>
              </div>
              <div style={{ display: 'flex', gap: 8, marginTop: 14 }}>
                <button className="btn btn-ink btn-sm" disabled={profileSaving} onClick={() => void handleSaveProfile()}>
                  {profileSaving ? t('profile.saving') : t('profile.save')}
                </button>
                <button className="btn btn-ghost btn-sm" onClick={() => setEditingProfile(false)}>{t('profile.cancel')}</button>
              </div>
            </>
          )}
        </div>
      </div>

      {/* FLOATING AI PILL */}
      <div className="dh-ai-wrap">
        {aiOpen && (
          <>
            <div style={{ position: 'fixed', inset: 0 }} onClick={() => setAiOpen(false)} />
            <div className="dh-ai-menu">
              {GOALS.map(g => (
                <button key={g.label} className="dh-goal-item" onClick={() => { setAiOpen(false); onNavigate(g.page); }}>
                  <Icon d={g.icon} size={17} />
                  <span>{g.label}<small>{g.sub}</small></span>
                </button>
              ))}
            </div>
          </>
        )}
        <button className="dh-ai-pill" onClick={() => setAiOpen(v => !v)}>
          <Icon d={IC.spark} size={15} /> Chiedi all'AI — crea, adatta o traduci
        </button>
      </div>
    </div>
  );
}
