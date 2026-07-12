import { ReactNode } from 'react';
import { Page } from '../types';
import { useT, useLanguage } from '../i18n/LanguageContext';
import { LANG_OPTIONS } from '../i18n/translations';
import { CARTA_INCHIOSTRO_CSS } from '../styles/carta-inchiostro';
import BrandLogo from './BrandLogo';

// Minimal stroke icon set (lucide-style paths, pipe-separated)
function Icon({ d, size = 17, className }: { d: string; size?: number; className?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor"
      strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" className={className}>
      {d.split('|').map((p, i) => <path key={i} d={p} />)}
    </svg>
  );
}

const IC = {
  doc: 'M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z|M14 2v6h6|M16 13H8|M16 17H8',
  grid: 'M3 3h7v7H3z|M14 3h7v7h-7z|M3 14h7v7H3z|M14 14h7v7h-7z',
  spark: 'M12 3l1.9 5.6 5.6 1.9-5.6 1.9L12 18l-1.9-5.6L4.5 10.5l5.6-1.9z|M19 16l.8 2.2L22 19l-2.2.8L19 22l-.8-2.2L16 19l2.2-.8z',
  list: 'M8 6h13|M8 12h13|M8 18h13|M3 6h.01|M3 12h.01|M3 18h.01',
  briefcase: 'M3 9a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z|M9 7V5a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v2',
  lock: 'M5 11h14a1 1 0 0 1 1 1v8a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1v-8a1 1 0 0 1 1-1z|M8 11V7a4 4 0 0 1 8 0v4',
  building: 'M6 22V4a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v18Z|M6 12H4a2 2 0 0 0-2 2v6a2 2 0 0 0 2 2h2|M18 9h2a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2h-2|M10 6h4|M10 10h4|M10 14h4|M10 18h4',
  gift: 'M20 12v10H4V12|M2 7h20v5H2z|M12 22V7|M12 7H7.5a2.5 2.5 0 0 1 0-5C11 2 12 7 12 7z|M12 7h4.5a2.5 2.5 0 0 0 0-5C13 2 12 7 12 7z',
  shield: 'M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z',
  mail: 'M4 4h16a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2z|M22 6l-10 7L2 6',
  logout: 'M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4|M16 17l5-5-5-5|M21 12H9',
};

interface WorkspaceShellProps {
  page: Page;
  isAuthenticated: boolean;
  onNavigate: (page: Page) => void;
  onLogin: () => void;
  user?: { firstName?: string | null; lastName?: string | null; email?: string | null; profileImageUrl?: string | null } | null;
  onLogout?: () => void;
  children: ReactNode;
}

// Only this account sees the admin panel entry (server enforces it too).
export const ADMIN_EMAIL = 'jelspexar10@gmail.com';

// Workspace chrome around the CV builder: a premium left rail listing every
// app feature. Anonymous users see everything, but only "Create CV" is
// unlocked — the rest shows a lock and routes to sign-in.
export default function WorkspaceShell({ page, isAuthenticated, onNavigate, onLogin, user, onLogout, children }: WorkspaceShellProps) {
  const t = useT();
  const { lang, setLang } = useLanguage();

  const items: Array<{
    key: string;
    icon: string;
    label: string;
    page: Page;
    activeOn: Page[];
    locked: boolean;
  }> = [
    { key: 'dashboard', icon: IC.grid, label: t('dash.title'), page: 'dashboard', activeOn: ['dashboard'], locked: !isAuthenticated },
    { key: 'create', icon: IC.doc, label: t('ws.create'), page: 'builder-step1', activeOn: ['builder-step1', 'builder-step2'], locked: false },
    { key: 'tailor', icon: IC.spark, label: t('ws.tailor'), page: 'tailor', activeOn: ['tailor'], locked: !isAuthenticated },
    { key: 'apps', icon: IC.list, label: t('ws.applications'), page: 'candidature', activeOn: ['candidature'], locked: !isAuthenticated },
    { key: 'letter', icon: IC.mail, label: 'Lettera AI', page: 'cover-letter', activeOn: ['cover-letter'], locked: !isAuthenticated },
    { key: 'archive', icon: IC.briefcase, label: t('ws.archive'), page: 'archivio', activeOn: ['archivio'], locked: !isAuthenticated },
    { key: 'concorsi', icon: IC.building, label: 'Concorsi PA', page: 'concorsi', activeOn: ['concorsi'], locked: false },
    { key: 'referral', icon: IC.gift, label: 'Invita & Guadagna', page: 'referral', activeOn: ['referral'], locked: !isAuthenticated },
    ...(user?.email?.toLowerCase() === ADMIN_EMAIL
      ? [{ key: 'admin', icon: IC.shield, label: 'Pannello Admin', page: 'admin' as Page, activeOn: ['admin' as Page], locked: false }]
      : []),
  ];

  return (
    <div className="dv3">
      <style>{CARTA_INCHIOSTRO_CSS}</style>
      <aside className="side">
        <BrandLogo onClick={() => onNavigate('home')} iconSize={24} fontSize={17} style={{ padding: '0 10px 22px' }} />
        <div className="mono">{t('ws.workspace')}</div>
        {items.map(item => {
          const active = item.activeOn.includes(page);
          return (
            <button
              key={item.key}
              className={`nav-item${active ? ' active' : ''}${item.locked ? ' locked' : ''}`}
              title={item.locked ? t('ws.lockedHint') : undefined}
              onClick={() => item.locked ? onLogin() : onNavigate(item.page)}
            >
              <Icon d={item.icon} size={16} />
              <span>{item.label}</span>
              {item.locked && <Icon d={IC.lock} size={13} className="nav-badge" />}
            </button>
          );
        })}

        <div className="side-foot" style={{ marginTop: 'auto' }}>
          <select
            value={lang}
            onChange={e => setLang(e.target.value as typeof lang)}
            title="App language"
            style={{
              width: '100%',
              margin: '10px 0 8px',
              padding: '5px 9px',
              borderRadius: 8,
              border: '1px solid var(--hair)',
              background: '#FFFFFF',
              fontFamily: 'var(--f-body)',
              fontSize: 12,
              color: 'var(--ink-60)',
              cursor: 'pointer',
              outline: 'none',
            }}
          >
            {LANG_OPTIONS.map(l => (
              <option key={l.code} value={l.code}>{l.flag} {l.code}</option>
            ))}
          </select>

          {isAuthenticated && user ? (
            <div className="side-user">
              <div className="avatar">
                {user.profileImageUrl
                  ? <img src={user.profileImageUrl} alt="avatar" />
                  : (user.firstName?.[0] ?? user.email?.[0] ?? '?').toUpperCase()}
              </div>
              <div style={{ minWidth: 0, flex: 1 }}>
                <b style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {[user.firstName, user.lastName].filter(Boolean).join(' ') || user.email || 'Utente'}
                </b>
                {user.email && (
                  <span style={{ display: 'block', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {user.email}
                  </span>
                )}
              </div>
              {onLogout && (
                <button
                  title={t('nav.logout')}
                  aria-label={t('nav.logout')}
                  onClick={onLogout}
                  style={{ border: 'none', background: 'transparent', color: 'var(--ink-40)', cursor: 'pointer', padding: 6, borderRadius: 8, display: 'flex', flexShrink: 0 }}
                >
                  <Icon d={IC.logout} size={15} />
                </button>
              )}
            </div>
          ) : (
            <div className="panel panel-cta">
              <h3 style={{ fontSize: 13.5 }}>{t('ws.unlockTitle')}</h3>
              <p className="psub" style={{ marginBottom: 12 }}>{t('ws.unlockSub')}</p>
              <button className="btn btn-ink btn-sm" style={{ width: '100%', justifyContent: 'center' }} onClick={onLogin}>
                {t('nav.login')}
              </button>
            </div>
          )}
        </div>
      </aside>

      {/* builder-step2 and cover-letter manage their own full-height layouts. */}
      <div
        className="main"
        style={
          page === 'builder-step2' ? { padding: 0 }
          : page === 'cover-letter' ? { padding: '20px 28px 16px' }
          : { paddingTop: 28 }
        }
      >
        {children}
      </div>
    </div>
  );
}
