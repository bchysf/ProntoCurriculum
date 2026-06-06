import { useState, useEffect, useCallback } from 'react';
import { Page, CVData, SavedCV, SavedTailoredCv } from '../types';
import { useAuth } from '@workspace/replit-auth-web';
import { useT } from '../i18n/LanguageContext';

interface DashboardProps {
  onNavigate: (page: Page) => void;
  onCVLoaded: (data: CVData, template?: string) => void;
  onLogin: () => void;
}

const fmt = (iso: string) => {
  try { return new Date(iso).toLocaleDateString(undefined, { day: '2-digit', month: 'short', year: 'numeric' }); }
  catch { return iso; }
};

export default function Dashboard({ onNavigate, onCVLoaded, onLogin }: DashboardProps) {
  const t = useT();
  const { user, isAuthenticated, isLoading } = useAuth();

  const [savedCVs, setSavedCVs] = useState<SavedCV[]>([]);
  const [tailoredCVs, setTailoredCVs] = useState<SavedTailoredCv[]>([]);
  const [fetching, setFetching] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [renamingId, setRenamingId] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState('');

  const fetchAll = useCallback(async () => {
    setFetching(true);
    try {
      const [cvsRes, tailoredRes] = await Promise.all([
        fetch('/api/cvs', { credentials: 'include' }),
        fetch('/api/tailored-cvs', { credentials: 'include' }),
      ]);
      const cvsData = await cvsRes.json() as { cvs?: SavedCV[] };
      const tailoredData = await tailoredRes.json() as { tailoredCvs?: SavedTailoredCv[] };
      setSavedCVs(cvsData.cvs ?? []);
      setTailoredCVs(tailoredData.tailoredCvs ?? []);
    } catch {
    } finally {
      setFetching(false);
    }
  }, []);

  useEffect(() => {
    if (isAuthenticated) void fetchAll();
  }, [isAuthenticated, fetchAll]);

  const handleEditCV = (cv: SavedCV) => {
    onCVLoaded(cv.cvData, cv.template);
    onNavigate('builder-step2');
  };

  const handleEditTailored = (cv: SavedTailoredCv) => {
    onCVLoaded(cv.cvData);
    onNavigate('builder-step2');
  };

  const handleDeleteCV = async (id: string) => {
    setDeletingId(id);
    try {
      await fetch(`/api/cvs/${id}`, { method: 'DELETE', credentials: 'include' });
      setSavedCVs(prev => prev.filter(c => c.id !== id));
    } catch { }
    finally { setDeletingId(null); }
  };

  const handleRenameCV = async (id: string) => {
    if (!renameValue.trim()) { setRenamingId(null); return; }
    try {
      const res = await fetch(`/api/cvs/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ name: renameValue }),
      });
      if (res.ok) {
        const data = await res.json() as { cv: SavedCV };
        setSavedCVs(prev => prev.map(c => c.id === id ? data.cv : c));
      }
    } catch { }
    finally { setRenamingId(null); setRenameValue(''); }
  };

  if (isLoading || fetching) {
    return (
      <div style={{ maxWidth: 820, margin: '0 auto', padding: '80px 24px', textAlign: 'center', color: 'var(--gray500)' }}>
        <div className="ai-pulse-ring" style={{ margin: '0 auto 20px' }} />
        <div style={{ fontSize: 14 }}>{t('dash.loading')}</div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div style={{ maxWidth: 820, margin: '0 auto', padding: '80px 24px', textAlign: 'center' }}>
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

  const userName = user?.firstName ?? user?.email ?? 'Utente';

  return (
    <div style={{ maxWidth: 820, margin: '0 auto', padding: '40px 24px 80px' }}>

      {/* Back */}
      <button className="btn btn-ghost btn-sm" style={{ marginBottom: 28, fontSize: 13 }} onClick={() => onNavigate('home')}>
        {t('dash.back')}
      </button>

      {/* Header */}
      <div style={{ marginBottom: 36 }}>
        <h1 style={{ fontFamily: 'Playfair Display, serif', fontSize: 32, fontWeight: 700, color: 'var(--navy)', marginBottom: 6 }}>
          📊 {t('dash.title')}
        </h1>
        <p style={{ color: 'var(--gray500)', fontSize: 15 }}>
          {t('dash.welcome')}, <strong style={{ color: 'var(--navy)' }}>{userName}</strong>. {t('dash.subtitle')}
        </p>
      </div>

      {/* Stats row */}
      <div style={{ display: 'flex', gap: 12, marginBottom: 36, flexWrap: 'wrap' }}>
        {[
          { icon: '📄', label: t('dash.myCVs'), count: savedCVs.length },
          { icon: '✦', label: t('dash.applications'), count: tailoredCVs.length },
        ].map(stat => (
          <div key={stat.label} style={{
            flex: '1 1 140px',
            background: 'var(--surface)',
            border: '1px solid var(--border)',
            borderRadius: 12,
            padding: '16px 20px',
            display: 'flex',
            alignItems: 'center',
            gap: 14,
          }}>
            <span style={{ fontSize: 26 }}>{stat.icon}</span>
            <div>
              <div style={{ fontSize: 24, fontWeight: 800, color: 'var(--navy)', lineHeight: 1 }}>{stat.count}</div>
              <div style={{ fontSize: 12, color: 'var(--gray500)', marginTop: 3 }}>{stat.label}</div>
            </div>
          </div>
        ))}
        {/* Quick actions */}
        <div style={{
          flex: '2 1 280px',
          background: 'linear-gradient(135deg, var(--navy) 0%, #1a3a6b 100%)',
          borderRadius: 12,
          padding: '16px 20px',
          display: 'flex',
          alignItems: 'center',
          gap: 10,
          flexWrap: 'wrap',
        }}>
          <button className="btn btn-gold btn-sm" onClick={() => onNavigate('builder-step1')}>
            + {t('dash.createNew')}
          </button>
          <button
            className="btn btn-ghost btn-sm"
            style={{ color: '#fff', borderColor: 'rgba(255,255,255,0.3)' }}
            onClick={() => onNavigate('tailor')}
          >
            {t('dash.tailorNew')}
          </button>
          <button
            className="btn btn-ghost btn-sm"
            style={{ color: 'rgba(255,255,255,0.7)', borderColor: 'rgba(255,255,255,0.2)', fontSize: 12 }}
            onClick={() => onNavigate('archivio')}
          >
            💼 {t('dash.archive')}
          </button>
        </div>
      </div>

      {/* ── I MIEI CV ── */}
      <Section title={`📄 ${t('dash.myCVs')}`} subtitle={t('dash.myCVsDesc')}>
        {savedCVs.length === 0 ? (
          <Empty text={t('dash.noCVs')} cta={`+ ${t('dash.createNew')}`} onClick={() => onNavigate('builder-step1')} />
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {savedCVs.map(cv => (
              <div key={cv.id} style={cardStyle}>
                {/* Icon */}
                <div style={iconStyle('#0B1D3A', 'var(--gold)')}>📄</div>

                {/* Info */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  {renamingId === cv.id ? (
                    <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                      <input
                        autoFocus
                        value={renameValue}
                        onChange={e => setRenameValue(e.target.value)}
                        onKeyDown={e => { if (e.key === 'Enter') void handleRenameCV(cv.id); if (e.key === 'Escape') { setRenamingId(null); } }}
                        style={{ flex: 1, padding: '4px 8px', border: '1.5px solid var(--gold)', borderRadius: 6, fontFamily: 'inherit', fontSize: 13, color: 'var(--navy)', outline: 'none' }}
                      />
                      <button className="btn btn-sm" style={{ fontSize: 12, background: 'var(--gold)', color: 'var(--navy)', border: 'none' }} onClick={() => void handleRenameCV(cv.id)}>✓</button>
                      <button className="btn btn-ghost btn-sm" style={{ fontSize: 12 }} onClick={() => setRenamingId(null)}>×</button>
                    </div>
                  ) : (
                    <div
                      style={{ fontWeight: 700, fontSize: 14, color: 'var(--navy)', cursor: 'pointer', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}
                      title="Clicca per rinominare"
                      onClick={() => { setRenamingId(cv.id); setRenameValue(cv.name); }}
                    >
                      {cv.name}
                    </div>
                  )}
                  <div style={{ fontSize: 11, color: 'var(--gray500)', marginTop: 2 }}>
                    {t('dash.savedOn')} {fmt(cv.updatedAt)} · {cv.template}
                  </div>
                </div>

                {/* Actions */}
                <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
                  <button className="btn btn-gold btn-sm" style={{ fontSize: 12 }} onClick={() => handleEditCV(cv)}>
                    {t('dash.edit')}
                  </button>
                  <button
                    className="btn btn-ghost btn-sm"
                    style={{ fontSize: 12, color: 'var(--danger)', opacity: deletingId === cv.id ? 0.5 : 1 }}
                    disabled={deletingId === cv.id}
                    onClick={() => void handleDeleteCV(cv.id)}
                  >
                    {deletingId === cv.id ? '...' : t('dash.delete')}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </Section>

      {/* ── LE MIE CANDIDATURE ── */}
      <Section title={`✦ ${t('dash.applications')}`} subtitle={t('dash.appDesc')} headerAction={
        tailoredCVs.length > 0 ? (
          <button className="btn btn-ghost btn-sm" style={{ fontSize: 12 }} onClick={() => onNavigate('candidature')}>
            {t('dash.viewAll')}
          </button>
        ) : undefined
      }>
        {tailoredCVs.length === 0 ? (
          <Empty text={t('dash.noApps')} cta={t('dash.tailorNew')} onClick={() => onNavigate('tailor')} />
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {tailoredCVs.slice(0, 4).map(cv => (
              <div key={cv.id} style={cardStyle}>
                <div style={iconStyle('#1a3a6b', 'var(--gold)')}>✦</div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontWeight: 700, fontSize: 14, color: 'var(--navy)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {cv.jobTitle || t('dash.tailorNew')}
                  </div>
                  <div style={{ fontSize: 11, color: 'var(--gray500)', marginTop: 2 }}>{t('dash.generatedOn')} {fmt(cv.createdAt)}</div>
                </div>
                <button className="btn btn-gold btn-sm" style={{ fontSize: 12, flexShrink: 0 }} onClick={() => handleEditTailored(cv)}>
                  {t('dash.edit')}
                </button>
              </div>
            ))}
          </div>
        )}
      </Section>

      {/* ── ARCHIVIO ── */}
      <Section title={`💼 ${t('dash.archive')}`} subtitle={t('dash.archDesc')} headerAction={
        <button className="btn btn-ghost btn-sm" style={{ fontSize: 12 }} onClick={() => onNavigate('archivio')}>
          {t('dash.goArchive')}
        </button>
      }>
        <div style={{ padding: '12px 0', color: 'var(--gray500)', fontSize: 13 }}>
          {t('dash.archDesc')}
        </div>
      </Section>
    </div>
  );
}

function Section({ title, subtitle, children, headerAction }: {
  title: string; subtitle?: string; children: React.ReactNode; headerAction?: React.ReactNode;
}) {
  return (
    <div style={{ marginBottom: 40 }}>
      <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: 6, gap: 10 }}>
        <div>
          <h2 style={{ fontFamily: 'Playfair Display, serif', fontSize: 20, fontWeight: 700, color: 'var(--navy)', margin: 0 }}>{title}</h2>
          {subtitle && <p style={{ fontSize: 13, color: 'var(--gray500)', margin: '4px 0 0' }}>{subtitle}</p>}
        </div>
        {headerAction}
      </div>
      <div style={{ marginTop: 14 }}>{children}</div>
    </div>
  );
}

function Empty({ text, cta, onClick }: { text: string; cta: string; onClick: () => void }) {
  return (
    <div style={{
      background: 'var(--surface)',
      border: '1px dashed var(--border)',
      borderRadius: 12,
      padding: '32px 24px',
      textAlign: 'center',
    }}>
      <p style={{ color: 'var(--gray500)', fontSize: 13, marginBottom: 16 }}>{text}</p>
      <button className="btn btn-gold btn-sm" onClick={onClick}>{cta}</button>
    </div>
  );
}

const cardStyle: React.CSSProperties = {
  background: 'var(--surface)',
  border: '1px solid var(--border)',
  borderRadius: 12,
  padding: '14px 18px',
  display: 'flex',
  alignItems: 'center',
  gap: 14,
};

function iconStyle(bg: string, accent: string): React.CSSProperties {
  return {
    width: 40, height: 40, borderRadius: 10,
    background: `linear-gradient(135deg, ${bg}, ${accent})`,
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    fontSize: 18, flexShrink: 0, color: '#fff',
  };
}
