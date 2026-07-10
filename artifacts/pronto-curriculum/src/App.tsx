import { useState, useCallback, useEffect } from 'react';
import Home from './pages/Home';
import CreateCvWizard from './pages/CreateCvWizard';
import BuilderStep2 from './pages/BuilderStep2';
import Archivio from './pages/Archivio';
import TailorCv from './pages/TailorCv';
import Candidature from './pages/Candidature';
import Dashboard from './pages/Dashboard';
import Modals from './components/Modals';
import WorkspaceShell from './components/WorkspaceShell';
import { Toaster } from './components/ui/sonner';
import { Page, ModalType, TemplateType, CVData } from './types';
import { useAuth } from './hooks/use-auth';
import { LanguageProvider, useLanguage, useT } from './i18n/LanguageContext';
import { LANG_OPTIONS } from './i18n/translations';
import type { SupportedLanguage } from './utils/aiTranslate';

const DEFAULT_CV_DATA: CVData = {
  firstName: 'Mario',
  lastName: 'Rossi',
  title: 'Senior Software Engineer',
  email: 'mario.rossi@email.com',
  phone: '+39 333 1234567',
  city: 'Milano',
  linkedin: '',
  summary: 'Ingegnere del software con 8 anni di esperienza nello sviluppo di applicazioni web scalabili. Specializzato in architetture cloud e metodologie Agile. Appassionato di tecnologie emergenti e risoluzione di problemi complessi.',
  experiences: [{
    id: '1',
    company: 'Tech Solutions Srl',
    role: 'Lead Developer',
    city: 'Milano',
    from: 'Mar 2020',
    to: 'Presente',
    desc: 'Ho guidato un team di 5 sviluppatori nella progettazione e implementazione di microservizi cloud-native. Ho ridotto i tempi di deployment del 40% attraverso l\'automazione CI/CD e migliorato le performance del sistema del 60%.',
  }],
  education: [{
    id: '1',
    institution: 'Università degli Studi di Milano',
    degree: 'Laurea Magistrale in Ingegneria Informatica',
    grade: '110/110 con lode',
    from: '2014',
    to: '2016',
  }],
  skills: ['JavaScript', 'Python', 'React', 'Node.js', 'AWS', 'Docker'],
  languages: [{ id: '1', name: 'Inglese', level: 'C1 - Avanzato' }],
};

const NAV_ITEMS: { page: Page; icon: string; labelKey: string }[] = [
  { page: 'dashboard',   icon: '📊', labelKey: 'nav.dashboard' },
  { page: 'tailor',      icon: '✦',  labelKey: 'nav.tailorCV' },
  { page: 'candidature', icon: '📋', labelKey: 'nav.applications' },
  { page: 'archivio',    icon: '💼', labelKey: 'nav.experiences' },
];

function AppSidebar({
  open,
  onClose,
  currentPage,
  onNavigate,
  onLogout,
  user,
}: {
  open: boolean;
  onClose: () => void;
  currentPage: Page;
  onNavigate: (p: Page) => void;
  onLogout: () => void;
  user: { firstName?: string | null; email?: string | null; profileImageUrl?: string | null } | null;
}) {
  const t = useT();

  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [open, onClose]);

  const handleNav = (p: Page) => { onNavigate(p); onClose(); };

  return (
    <>
      {/* Overlay */}
      <div
        className={`sidebar-overlay${open ? ' sidebar-overlay--visible' : ''}`}
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Drawer */}
      <aside className={`app-sidebar${open ? ' app-sidebar--open' : ''}`}>
        {/* Header */}
        <div className="app-sidebar__header">
          <div className="app-sidebar__logo">
            <img src="/logo-icon.png" alt="" width={30} height={30} />
            <span className="logo-text" style={{ fontSize: 16 }}>Pronto<span>Curriculum</span></span>
          </div>
          <button className="app-sidebar__close" onClick={onClose} title="Chiudi">✕</button>
        </div>

        {/* User info */}
        {user && (
          <div className="app-sidebar__user">
            {user.profileImageUrl ? (
              <img
                src={user.profileImageUrl}
                alt="avatar"
                style={{ width: 38, height: 38, borderRadius: '50%', objectFit: 'cover', border: '2px solid var(--gold)', flexShrink: 0 }}
              />
            ) : (
              <div style={{ width: 38, height: 38, borderRadius: '50%', background: 'var(--gold)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: 15, color: 'var(--navy)', flexShrink: 0 }}>
                {(user.firstName?.[0] ?? user.email?.[0] ?? '?').toUpperCase()}
              </div>
            )}
            <div style={{ minWidth: 0 }}>
              <div style={{ fontWeight: 600, fontSize: 14, color: 'var(--white)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {user.firstName ?? 'Utente'}
              </div>
              {user.email && (
                <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.45)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {user.email}
                </div>
              )}
            </div>
          </div>
        )}

        <div className="app-sidebar__divider" />

        {/* Nav links */}
        <nav className="app-sidebar__nav">
          {NAV_ITEMS.map(item => {
            const label = t(item.labelKey);
            const active = currentPage === item.page;
            return (
              <button
                key={item.page}
                className={`app-sidebar__item${active ? ' app-sidebar__item--active' : ''}`}
                onClick={() => handleNav(item.page)}
              >
                <span className="app-sidebar__item-icon">{item.icon}</span>
                <span className="app-sidebar__item-label">{label}</span>
              </button>
            );
          })}
        </nav>

        {/* Footer */}
        <div style={{ marginTop: 'auto' }}>
          <div className="app-sidebar__divider" />
          <button className="app-sidebar__item app-sidebar__item--logout" onClick={() => { onLogout(); onClose(); }}>
            <span className="app-sidebar__item-icon">↩</span>
            <span className="app-sidebar__item-label">{t('nav.logout')}</span>
          </button>
        </div>
      </aside>
    </>
  );
}

function AppInner() {
  const t = useT();
  const { lang, setLang } = useLanguage();
  const { user, isLoading, isAuthenticated, login, loginWithEmail, signUpWithEmail, logout } = useAuth();
  const [page, setPage] = useState<Page>('home');
  const [modal, setModal] = useState<ModalType>(null);
  const [aiLoadingText, setAiLoadingText] = useState('');
  const [selectedTemplate, setSelectedTemplate] = useState<TemplateType>('modern');
  const [cvData, setCvData] = useState<CVData>(DEFAULT_CV_DATA);
  const [initialLanguage, setInitialLanguage] = useState<SupportedLanguage>('IT');
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const navigate = useCallback((p: Page) => {
    setPage(p);
    window.scrollTo(0, 0);
  }, []);

  const openModal = useCallback((m: ModalType) => setModal(m), []);
  const closeModal = useCallback(() => setModal(null), []);

  const handleWizardComplete = (data: CVData, template: TemplateType, language: SupportedLanguage) => {
    setCvData(data);
    setSelectedTemplate(template);
    setInitialLanguage(language);
    navigate('builder-step2');
  };

  const handleAiAction = (text: string, callback: () => void) => {
    setAiLoadingText(text);
    setModal('ai-loading');
    setTimeout(() => { setModal(null); callback(); }, 2200);
  };

  const handleCVLoaded = useCallback((data: CVData, template?: string) => {
    setCvData(data);
    if (template) setSelectedTemplate(template as TemplateType);
  }, []);

  const handleSuccess = () => setModal('success');

  // The Home page (RedesignV3) has its own sticky topbar.
  // Dashboard (DashboardV3) has its own sidebar.
  // For inner workspace pages, we keep the drawer sidebar + a minimal header.
  const showInnerNav = page !== 'home' && page !== 'dashboard' && page !== 'builder-step1' && page !== 'builder-step2';

  return (
    <>
      {/* Drawer sidebar — only for inner pages when authenticated */}
      {isAuthenticated && user && showInnerNav && (
        <AppSidebar
          open={sidebarOpen}
          onClose={() => setSidebarOpen(false)}
          currentPage={page}
          onNavigate={navigate}
          onLogout={logout}
          user={user}
        />
      )}

      {/* Minimal top bar — only for inner workspace pages */}
      {showInnerNav && (
        <nav className="app-nav">
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            {isAuthenticated && !isLoading && (
              <button
                className="sidebar-toggle"
                onClick={() => setSidebarOpen(v => !v)}
                title="Menu"
                aria-label="Apri menu"
              >
                <span /><span /><span />
              </button>
            )}
            <div className="logo" onClick={() => navigate('home')}>
              <img src="/logo-icon.png" alt="" className="logo-icon" />
              <span className="logo-text">Pronto<span>Curriculum</span></span>
            </div>
          </div>

          <div className="nav-actions">
            <select
              value={lang}
              onChange={e => setLang(e.target.value as typeof lang)}
              title="App language"
              style={{
                background: 'transparent',
                border: '1px solid rgba(255,255,255,0.15)',
                borderRadius: 7,
                padding: '5px 8px',
                fontSize: 13,
                color: 'var(--gray300)',
                cursor: 'pointer',
                outline: 'none',
              }}
            >
              {LANG_OPTIONS.map(l => (
                <option key={l.code} value={l.code}>{l.flag} {l.code}</option>
              ))}
            </select>
            {isLoading ? (
              <div style={{ width: 80, height: 36 }} />
            ) : isAuthenticated && user ? (
              <>
                {user.profileImageUrl ? (
                  <img
                    src={user.profileImageUrl}
                    alt="avatar"
                    style={{ width: 32, height: 32, borderRadius: '50%', objectFit: 'cover', border: '2px solid var(--gold)', cursor: 'pointer' }}
                    onClick={() => setSidebarOpen(v => !v)}
                    title="Menu"
                  />
                ) : (
                  <div
                    style={{ width: 32, height: 32, borderRadius: '50%', background: 'var(--gold)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: 14, color: 'var(--navy)', cursor: 'pointer' }}
                    onClick={() => setSidebarOpen(v => !v)}
                    title="Menu"
                  >
                    {(user.firstName?.[0] ?? user.email?.[0] ?? '?').toUpperCase()}
                  </div>
                )}
              </>
            ) : (
              <button className="btn btn-outline" onClick={() => openModal('signup')}>{t('nav.login')}</button>
            )}
            <button className="btn btn-gold" onClick={() => navigate('builder-step1')}>{t('nav.createCV')}</button>
          </div>
        </nav>
      )}

      <main style={{ minHeight: showInnerNav ? 'calc(100vh - 64px)' : undefined }}>
        {page === 'home' && (
          <Home onNavigate={navigate} onModal={openModal} />
        )}
        {page === 'builder-step1' && (
          <WorkspaceShell page={page} isAuthenticated={isAuthenticated} onNavigate={navigate} onLogin={() => openModal('signup')}>
            <CreateCvWizard onComplete={handleWizardComplete} />
          </WorkspaceShell>
        )}
        {page === 'builder-step2' && (
          <WorkspaceShell page={page} isAuthenticated={isAuthenticated} onNavigate={navigate} onLogin={() => openModal('signup')}>
            <BuilderStep2
              cvData={cvData}
              onCVChange={setCvData}
              selectedTemplate={selectedTemplate}
              onTemplateChange={setSelectedTemplate}
              initialLanguage={initialLanguage}
              onNavigate={navigate}
              onModal={openModal}
              onAiAction={handleAiAction}
              onGoToArchivio={() => navigate('archivio')}
            />
          </WorkspaceShell>
        )}
        {page === 'archivio' && (
          <Archivio onNavigate={navigate} />
        )}
        {page === 'tailor' && (
          <TailorCv
            onNavigate={navigate}
            onCVLoaded={handleCVLoaded}
            onLogin={() => openModal('signup')}
          />
        )}
        {page === 'candidature' && (
          <Candidature
            onNavigate={navigate}
            onCVLoaded={handleCVLoaded}
            onLogin={() => openModal('signup')}
          />
        )}
        {page === 'dashboard' && (
          <Dashboard
            onNavigate={navigate}
            onCVLoaded={handleCVLoaded}
            onLogin={() => openModal('signup')}
          />
        )}
      </main>

      <Modals
        modal={modal}
        aiLoadingText={aiLoadingText}
        onClose={closeModal}
        onSuccess={handleSuccess}
        isAuthenticated={isAuthenticated}
        onLogin={login}
        onLoginWithEmail={loginWithEmail}
        onSignUpWithEmail={signUpWithEmail}
      />
      <Toaster position="bottom-center" richColors />
    </>
  );
}

export default function App() {
  return (
    <LanguageProvider>
      <AppInner />
    </LanguageProvider>
  );
}
