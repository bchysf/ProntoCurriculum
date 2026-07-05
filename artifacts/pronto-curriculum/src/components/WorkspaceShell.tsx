import { ReactNode } from 'react';
import { Page } from '../types';
import { useT } from '../i18n/LanguageContext';

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
};

interface WorkspaceShellProps {
  page: Page;
  isAuthenticated: boolean;
  onNavigate: (page: Page) => void;
  onLogin: () => void;
  children: ReactNode;
}

// Workspace chrome around the CV builder: a premium left rail listing every
// app feature. Anonymous users see everything, but only "Create CV" is
// unlocked — the rest shows a lock and routes to sign-in.
export default function WorkspaceShell({ page, isAuthenticated, onNavigate, onLogin, children }: WorkspaceShellProps) {
  const t = useT();

  const items: Array<{
    key: string;
    icon: string;
    label: string;
    page: Page;
    activeOn: Page[];
    locked: boolean;
  }> = [
    { key: 'create', icon: IC.doc, label: t('ws.create'), page: 'builder-step1', activeOn: ['builder-step1', 'builder-step2'], locked: false },
    { key: 'dashboard', icon: IC.grid, label: t('dash.title'), page: 'dashboard', activeOn: ['dashboard'], locked: !isAuthenticated },
    { key: 'tailor', icon: IC.spark, label: t('ws.tailor'), page: 'tailor', activeOn: ['tailor'], locked: !isAuthenticated },
    { key: 'apps', icon: IC.list, label: t('ws.applications'), page: 'candidature', activeOn: ['candidature'], locked: !isAuthenticated },
    { key: 'archive', icon: IC.briefcase, label: t('ws.archive'), page: 'archivio', activeOn: ['archivio'], locked: !isAuthenticated },
  ];

  return (
    <div className="ws">
      <aside className="ws-rail">
        <div className="ws-rail-label">{t('ws.workspace')}</div>
        {items.map(item => {
          const active = item.activeOn.includes(page);
          return (
            <button
              key={item.key}
              className={`ws-item${active ? ' ws-item--active' : ''}${item.locked ? ' ws-item--locked' : ''}`}
              title={item.locked ? t('ws.lockedHint') : undefined}
              onClick={() => item.locked ? onLogin() : onNavigate(item.page)}
            >
              <Icon d={item.icon} />
              <span>{item.label}</span>
              {item.locked && <Icon d={IC.lock} size={13} className="ws-lock" />}
            </button>
          );
        })}

        {!isAuthenticated && (
          <div className="ws-upsell">
            <div className="ws-upsell-title">{t('ws.unlockTitle')}</div>
            <p className="ws-upsell-sub">{t('ws.unlockSub')}</p>
            <button className="btn btn-solid btn-sm" style={{ width: '100%' }} onClick={onLogin}>
              {t('nav.login')}
            </button>
          </div>
        )}
      </aside>

      <div className="ws-main">
        {children}
      </div>
    </div>
  );
}
