import { useState, useEffect, useCallback } from 'react';
import { Page, CVData, SavedCV, SavedTailoredCv } from '../types';
import { useAuth } from '@workspace/replit-auth-web';
import { useT } from '../i18n/LanguageContext';

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
  try { return new Date(iso).toLocaleDateString(undefined, { day: '2-digit', month: 'short', year: 'numeric' }); }
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

  if (isLoading || fetching) {
    return (
      <div style={{ maxWidth: 900, margin: '0 auto', padding: '80px 24px', textAlign: 'center', color: 'var(--gray500)' }}>
        <div className="ai-pulse-ring" style={{ margin: '0 auto 20px' }} />
        <div style={{ fontSize: 14 }}>{t('dash.loading')}</div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div style={{ maxWidth: 900, margin: '0 auto', padding: '80px 24px', textAlign: 'center' }}>
        <div style={{ fontSize: 40, marginBottom: 16 }}>🔐</div>
        <h2 style={{ fontFamily: 'Playfair Display, serif', fontSize: 24, color: 'var(--navy)', marginBottom: 12 }}>
          {t('dash.loginNeeded')}
        </h2>
        <button className="btn btn-gold" style={{ padding: '12px 32px', fontSize: 15 }} onClick={onLogin}>
          {t('nav.login')}
        </button>
      </div>
    );
  }

  const completion = profileCompletion(profile, user);
  const userName = [user?.firstName, user?.lastName].filter(Boolean).join(' ') || user?.email || '';

  return (
    <div style={{ maxWidth: 900, margin: '0 auto', padding: '32px 20px 80px' }}>

      {/* Top bar */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 28 }}>
        <button className="btn btn-ghost btn-sm" style={{ fontSize: 13 }} onClick={() => onNavigate('home')}>
          {t('dash.back')}
        </button>
        <div style={{ display: 'flex', gap: 8 }}>
          <button className="btn btn-gold btn-sm" onClick={() => onNavigate('builder-step1')}>
            + {t('dash.createNew')}
          </button>
          <button className="btn btn-ghost btn-sm" style={{ border: '1px solid var(--navy)', color: 'var(--navy)' }}
            onClick={() => onNavigate('tailor')}>
            {t('dash.tailorNew')}
          </button>
          <button className="btn btn-ghost btn-sm" onClick={() => onNavigate('archivio')}>
            💼 {t('dash.archive')}
          </button>
        </div>
      </div>

      {/* === PROFILE CARD === */}
      <div style={{
        background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 16,
        padding: '24px 28px', marginBottom: 28,
      }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 20, flexWrap: 'wrap' }}>
          {/* Avatar */}
          <div style={{
            width: 64, height: 64, borderRadius: '50%', flexShrink: 0,
            background: 'linear-gradient(135deg, var(--navy) 0%, #1a4a9b 100%)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 24, fontWeight: 700, color: '#fff', letterSpacing: 1,
          }}>
            {user?.profileImageUrl
              ? <img src={user.profileImageUrl} alt="" style={{ width: 64, height: 64, borderRadius: '50%', objectFit: 'cover' }} />
              : initials(user?.firstName, user?.lastName, user?.email)
            }
          </div>

          {/* Name + info */}
          <div style={{ flex: 1, minWidth: 180 }}>
            <div style={{ fontFamily: 'Playfair Display, serif', fontSize: 20, fontWeight: 700, color: 'var(--navy)', lineHeight: 1.2 }}>
              {userName}
            </div>
            {profile?.headline
              ? <div style={{ fontSize: 14, color: 'var(--gray500)', marginTop: 3, fontWeight: 500 }}>{profile.headline}</div>
              : <div style={{ fontSize: 13, color: 'var(--gray400)', marginTop: 3, fontStyle: 'italic' }}>{t('profile.headline')}…</div>
            }
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px 16px', marginTop: 8, fontSize: 12, color: 'var(--gray500)' }}>
              {user?.email && <span>✉ {user.email}</span>}
              {profile?.phone && <span>📞 {profile.phone}</span>}
              {profile?.city && <span>📍 {profile.city}</span>}
              {profile?.linkedin && (
                <span>
                  <a href={`https://linkedin.com/${profile.linkedin}`} target="_blank" rel="noopener noreferrer"
                    style={{ color: 'var(--navy)', textDecoration: 'none' }}>
                    🔗 LinkedIn
                  </a>
                </span>
              )}
            </div>
            {/* Completion bar */}
            <div style={{ marginTop: 12, display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{ flex: 1, height: 5, background: 'var(--border)', borderRadius: 99, overflow: 'hidden', maxWidth: 180 }}>
                <div style={{
                  height: '100%', borderRadius: 99, transition: 'width 0.6s ease',
                  width: `${completion}%`,
                  background: completion === 100
                    ? 'var(--gold)'
                    : 'linear-gradient(90deg, var(--navy), #4a90d9)',
                }} />
              </div>
              <span style={{ fontSize: 11, color: 'var(--gray500)', whiteSpace: 'nowrap' }}>
                {completion}% {t('profile.complete')}
              </span>
            </div>
          </div>

          {/* Actions */}
          <div style={{ display: 'flex', gap: 8, flexShrink: 0, alignItems: 'flex-start' }}>
            {profileSaved && (
              <span style={{ fontSize: 12, color: 'green', alignSelf: 'center' }}>{t('profile.saved')}</span>
            )}
            {savedCVs.length > 0 && !editingProfile && (
              <button className="btn btn-ghost btn-sm" style={{ fontSize: 12 }} onClick={handleSyncFromCV}
                title={t('profile.syncHint')}>
                {t('profile.syncFromCV')}
              </button>
            )}
            <button className="btn btn-ghost btn-sm" style={{ fontSize: 12 }}
              onClick={() => setEditingProfile(e => !e)}>
              {editingProfile ? t('profile.cancel') : t('profile.editBtn')}
            </button>
          </div>
        </div>

        {/* Skills chips */}
        {!editingProfile && profile?.skills && profile.skills.length > 0 && (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 16 }}>
            {profile.skills.map(s => (
              <span key={s} style={{
                background: 'rgba(11,29,58,0.07)', border: '1px solid rgba(11,29,58,0.12)',
                borderRadius: 99, padding: '2px 10px', fontSize: 12, color: 'var(--navy)', fontWeight: 500,
              }}>{s}</span>
            ))}
          </div>
        )}

        {/* Summary preview */}
        {!editingProfile && profile?.summary && (
          <p style={{ fontSize: 13, color: 'var(--gray500)', marginTop: 14, lineHeight: 1.6, borderTop: '1px solid var(--border)', paddingTop: 12 }}>
            {profile.summary}
          </p>
        )}

        {/* EDIT FORM */}
        {editingProfile && (
          <div style={{ marginTop: 20, borderTop: '1px solid var(--border)', paddingTop: 20 }}>
            {completion < 100 && (
              <div style={{
                background: 'rgba(212,168,0,0.08)', border: '1px solid rgba(212,168,0,0.25)',
                borderRadius: 8, padding: '8px 14px', fontSize: 12, color: '#7a6100', marginBottom: 16,
              }}>
                💡 {t('profile.fillHint')}
              </div>
            )}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 12 }}>
              {([
                ['headline', t('profile.headline')],
                ['phone', t('profile.phone')],
                ['city', t('profile.city')],
                ['linkedin', t('profile.linkedin')],
                ['website', t('profile.website')],
              ] as [keyof typeof profileForm, string][]).map(([key, label]) => (
                <div key={key}>
                  <label style={{ fontSize: 11, fontWeight: 600, color: 'var(--gray500)', display: 'block', marginBottom: 4, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                    {label}
                  </label>
                  <input
                    value={profileForm[key]}
                    onChange={e => setProfileForm(f => ({ ...f, [key]: e.target.value }))}
                    style={inputStyle}
                    placeholder=""
                  />
                </div>
              ))}
              <div style={{ gridColumn: '1 / -1' }}>
                <label style={labelStyle}>{t('profile.skills')}</label>
                <input
                  value={profileForm.skills}
                  onChange={e => setProfileForm(f => ({ ...f, skills: e.target.value }))}
                  style={inputStyle}
                  placeholder="React, TypeScript, Project Management…"
                />
              </div>
              <div style={{ gridColumn: '1 / -1' }}>
                <label style={labelStyle}>{t('profile.summary')}</label>
                <textarea
                  value={profileForm.summary}
                  onChange={e => setProfileForm(f => ({ ...f, summary: e.target.value }))}
                  rows={3}
                  style={{ ...inputStyle, resize: 'vertical' }}
                />
              </div>
            </div>
            <div style={{ display: 'flex', gap: 8, marginTop: 16 }}>
              <button className="btn btn-gold btn-sm" disabled={profileSaving} onClick={() => void handleSaveProfile()}>
                {profileSaving ? t('profile.saving') : t('profile.save')}
              </button>
              <button className="btn btn-ghost btn-sm" onClick={() => setEditingProfile(false)}>
                {t('profile.cancel')}
              </button>
            </div>
          </div>
        )}
      </div>

      {/* === STATS ROW === */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12, marginBottom: 32 }}>
        {[
          { icon: '📄', label: t('dash.myCVs'), count: savedCVs.length, page: 'builder-step1' as Page },
          { icon: '✦', label: t('dash.applications'), count: tailoredCVs.length, page: 'candidature' as Page },
          { icon: '💼', label: t('dash.experiences'), count: experiences.length, page: 'archivio' as Page },
        ].map(stat => (
          <button key={stat.label} onClick={() => onNavigate(stat.page)} style={{
            background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 14,
            padding: '18px 16px', display: 'flex', alignItems: 'center', gap: 12,
            cursor: 'pointer', textAlign: 'left', transition: 'border-color 0.15s',
          }}
            onMouseEnter={e => (e.currentTarget.style.borderColor = 'var(--navy)')}
            onMouseLeave={e => (e.currentTarget.style.borderColor = 'var(--border)')}
          >
            <span style={{ fontSize: 22 }}>{stat.icon}</span>
            <div>
              <div style={{ fontSize: 26, fontWeight: 800, color: 'var(--navy)', lineHeight: 1 }}>{stat.count}</div>
              <div style={{ fontSize: 11, color: 'var(--gray500)', marginTop: 3 }}>{stat.label}</div>
            </div>
          </button>
        ))}
      </div>

      {/* === I MIEI CV === */}
      <SectionHeader title={`📄 ${t('dash.myCVs')}`} subtitle={t('dash.myCVsDesc')}
        action={savedCVs.length > 0 ? undefined : undefined} />
      <div style={{ marginBottom: 36 }}>
        {savedCVs.length === 0 ? (
          <EmptyState text={t('dash.noCVs')} cta={`+ ${t('dash.createNew')}`} onClick={() => onNavigate('builder-step1')} />
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 12 }}>
            {savedCVs.map(cv => (
              <div key={cv.id} style={cvCardStyle}>
                {/* Template badge */}
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 8, marginBottom: 10 }}>
                  <div style={{
                    background: 'linear-gradient(135deg, var(--navy), #1a4a9b)',
                    borderRadius: 8, padding: '6px 10px',
                    fontSize: 20, color: '#fff', lineHeight: 1, flexShrink: 0,
                  }}>📄</div>
                  <span style={{
                    fontSize: 10, fontWeight: 600, color: 'var(--gray500)', textTransform: 'uppercase',
                    letterSpacing: '0.5px', marginTop: 4,
                    background: 'var(--border)', borderRadius: 4, padding: '2px 6px',
                  }}>{cv.template}</span>
                </div>

                {/* Name (rename inline) */}
                {renamingId === cv.id ? (
                  <div style={{ display: 'flex', gap: 5, marginBottom: 6 }}>
                    <input autoFocus value={renameValue}
                      onChange={e => setRenameValue(e.target.value)}
                      onKeyDown={e => { if (e.key === 'Enter') void handleRenameCV(cv.id); if (e.key === 'Escape') setRenamingId(null); }}
                      style={{ flex: 1, padding: '4px 8px', border: '1.5px solid var(--gold)', borderRadius: 6, fontFamily: 'inherit', fontSize: 13, color: 'var(--navy)', outline: 'none' }}
                    />
                    <button className="btn btn-sm" style={{ background: 'var(--gold)', color: 'var(--navy)', border: 'none', fontSize: 12 }} onClick={() => void handleRenameCV(cv.id)}>✓</button>
                    <button className="btn btn-ghost btn-sm" style={{ fontSize: 12 }} onClick={() => setRenamingId(null)}>×</button>
                  </div>
                ) : (
                  <div style={{ fontWeight: 700, fontSize: 14, color: 'var(--navy)', marginBottom: 4, cursor: 'pointer' }}
                    title="Clicca per rinominare"
                    onClick={() => { setRenamingId(cv.id); setRenameValue(cv.name); }}>
                    {cv.name}
                  </div>
                )}
                <div style={{ fontSize: 11, color: 'var(--gray400)', marginBottom: 14 }}>
                  {t('dash.savedOn')} {fmt(cv.updatedAt)}
                </div>

                <div style={{ display: 'flex', gap: 6, marginTop: 'auto' }}>
                  <button className="btn btn-gold btn-sm" style={{ flex: 1, fontSize: 12 }} onClick={() => handleEditCV(cv)}>
                    {t('dash.openCV')}
                  </button>
                  <button className="btn btn-ghost btn-sm"
                    style={{ fontSize: 12, color: 'var(--danger)', opacity: deletingId === cv.id ? 0.5 : 1 }}
                    disabled={deletingId === cv.id}
                    onClick={() => void handleDeleteCV(cv.id)}>
                    {deletingId === cv.id ? '…' : t('dash.delete')}
                  </button>
                </div>
              </div>
            ))}
            {/* Add new CV card */}
            <button onClick={() => onNavigate('builder-step1')} style={{
              background: 'transparent', border: '1.5px dashed var(--border)', borderRadius: 14,
              padding: '24px 16px', display: 'flex', flexDirection: 'column',
              alignItems: 'center', justifyContent: 'center', gap: 8,
              cursor: 'pointer', color: 'var(--gray400)', fontSize: 13, minHeight: 130,
              transition: 'all 0.15s',
            }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--navy)'; e.currentTarget.style.color = 'var(--navy)'; }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.color = 'var(--gray400)'; }}
            >
              <span style={{ fontSize: 24 }}>＋</span>
              <span>{t('dash.createNew')}</span>
            </button>
          </div>
        )}
      </div>

      {/* === LE MIE CANDIDATURE === */}
      <SectionHeader title={`✦ ${t('dash.applications')}`} subtitle={t('dash.appDesc')}
        action={tailoredCVs.length > 0 ? (
          <button className="btn btn-ghost btn-sm" style={{ fontSize: 12 }} onClick={() => onNavigate('candidature')}>
            {t('dash.viewAll')}
          </button>
        ) : undefined} />
      <div style={{ marginBottom: 36 }}>
        {tailoredCVs.length === 0 ? (
          <EmptyState text={t('dash.noApps')} cta={t('dash.tailorNew')} onClick={() => onNavigate('tailor')} />
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {tailoredCVs.slice(0, 5).map(cv => (
              <div key={cv.id} style={listRowStyle}>
                <div style={{
                  width: 36, height: 36, borderRadius: 9, background: 'linear-gradient(135deg, #1a3a6b, var(--gold))',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 16, color: '#fff', flexShrink: 0,
                }}>✦</div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontWeight: 700, fontSize: 14, color: 'var(--navy)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {cv.jobTitle || t('dash.tailorNew')}
                  </div>
                  <div style={{ fontSize: 11, color: 'var(--gray400)', marginTop: 2 }}>{t('dash.generatedOn')} {fmt(cv.createdAt)}</div>
                </div>
                <button className="btn btn-gold btn-sm" style={{ fontSize: 12, flexShrink: 0 }} onClick={() => handleEditTailored(cv)}>
                  {t('dash.openCV')}
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* === ARCHIVIO ESPERIENZE === */}
      <SectionHeader title={`💼 ${t('dash.archive')}`} subtitle={t('dash.archDesc')}
        action={
          <button className="btn btn-ghost btn-sm" style={{ fontSize: 12 }} onClick={() => onNavigate('archivio')}>
            {t('dash.goArchive')}
          </button>
        } />
      <div>
        {experiences.length === 0 ? (
          <EmptyState text={t('dash.noExps')} cta={`💼 ${t('dash.archive')}`} onClick={() => onNavigate('archivio')} />
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {experiences.slice(-5).reverse().map(exp => (
              <div key={exp.id} style={listRowStyle}>
                <div style={{
                  width: 36, height: 36, borderRadius: 9,
                  background: 'linear-gradient(135deg, var(--navy), #344c75)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 15, color: '#fff', flexShrink: 0,
                }}>💼</div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontWeight: 700, fontSize: 14, color: 'var(--navy)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {exp.role} <span style={{ fontWeight: 400, color: 'var(--gray500)' }}>@ {exp.company}</span>
                  </div>
                  <div style={{ fontSize: 11, color: 'var(--gray400)', marginTop: 2 }}>
                    {[exp.city, [exp.startDate, exp.isCurrent ? t('dash.present') : exp.endDate].filter(Boolean).join(' → ')].filter(Boolean).join(' · ')}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

    </div>
  );
}

function SectionHeader({ title, subtitle, action }: { title: string; subtitle?: string; action?: React.ReactNode }) {
  return (
    <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: 12, gap: 10 }}>
      <div>
        <h2 style={{ fontFamily: 'Playfair Display, serif', fontSize: 19, fontWeight: 700, color: 'var(--navy)', margin: 0 }}>{title}</h2>
        {subtitle && <p style={{ fontSize: 12, color: 'var(--gray500)', margin: '3px 0 0' }}>{subtitle}</p>}
      </div>
      {action}
    </div>
  );
}

function EmptyState({ text, cta, onClick }: { text: string; cta: string; onClick: () => void }) {
  return (
    <div style={{
      background: 'var(--surface)', border: '1.5px dashed var(--border)', borderRadius: 14,
      padding: '28px 24px', textAlign: 'center', marginBottom: 36,
    }}>
      <p style={{ color: 'var(--gray500)', fontSize: 13, marginBottom: 14 }}>{text}</p>
      <button className="btn btn-gold btn-sm" onClick={onClick}>{cta}</button>
    </div>
  );
}

const inputStyle: React.CSSProperties = {
  width: '100%', padding: '8px 10px', border: '1px solid var(--border)', borderRadius: 8,
  fontFamily: 'inherit', fontSize: 13, color: 'var(--navy)', outline: 'none',
  background: 'var(--bg)', boxSizing: 'border-box',
};

const labelStyle: React.CSSProperties = {
  fontSize: 11, fontWeight: 600, color: 'var(--gray500)', display: 'block',
  marginBottom: 4, textTransform: 'uppercase', letterSpacing: '0.5px',
};

const cvCardStyle: React.CSSProperties = {
  background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 14,
  padding: '16px', display: 'flex', flexDirection: 'column', minHeight: 140,
};

const listRowStyle: React.CSSProperties = {
  background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 12,
  padding: '12px 16px', display: 'flex', alignItems: 'center', gap: 12,
};
