import { useState, useEffect, useCallback } from 'react';
import { Page, CVData, SavedCV, SavedTailoredCv } from '../types';
import { useAuth } from '../hooks/use-auth';
import { useT } from '../i18n/LanguageContext';
import { CARTA_INCHIOSTRO_CSS as CSS } from '../styles/carta-inchiostro';

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
