import { useState, useCallback, useEffect } from 'react';
import Home from './pages/Home';
import CreateCvWizard from './pages/CreateCvWizard';
import BuilderStep2 from './pages/BuilderStep2';
import Archivio from './pages/Archivio';
import ProfilePageEditor from './pages/ProfilePageEditor';
import TailorCv from './pages/TailorCv';
import Candidature from './pages/Candidature';
import Dashboard from './pages/Dashboard';
import Modals from './components/Modals';
import WorkspaceShell from './components/WorkspaceShell';
import CookieConsent from './components/CookieConsent';
import Legal from './pages/Legal';
import BlogHub from './pages/BlogHub';
import BlogArticle from './pages/BlogArticle';
import CoverLetterBuilder from './pages/CoverLetterBuilder';
import ConcorsiPubblici from './pages/ConcorsiPubblici';
import ReferralPage from './pages/ReferralPage';
import AdminPanel from './pages/AdminPanel';
import JobsBoard from './pages/JobsBoard';
import SalaryCalculator from './pages/SalaryCalculator';
import Prezzi from './pages/Prezzi';
import ComeFunziona from './pages/ComeFunziona';
import { initGA4, trackPageView } from './utils/analytics';
import { Toaster } from './components/ui/sonner';
import { Page, ModalType, TemplateType, CVData } from './types';
import { AuthProvider, useAuth } from './hooks/use-auth';
import { LanguageProvider } from './i18n/LanguageContext';
import type { SupportedLanguage } from './utils/aiTranslate';
import { pathToPage, pageToPath } from './utils/routes';
import { DEFAULT_CV_DATA, isDefaultCvData } from './utils/defaultCvData';

// Local draft of the CV in progress — survives a reload of the builder,
// which previously reset straight back to the Mario Rossi sample data.
const CV_DRAFT_KEY = 'pc_cv_draft';
interface CvDraft { cvData: CVData; template: TemplateType; lang: SupportedLanguage }
function loadCvDraft(): CvDraft | null {
  try {
    const raw = localStorage.getItem(CV_DRAFT_KEY);
    return raw ? (JSON.parse(raw) as CvDraft) : null;
  } catch {
    return null;
  }
}

function AppInner() {
  const { user, isAuthenticated, login, loginWithEmail, signUpWithEmail, logout } = useAuth();
  const initialRoute = pathToPage(window.location.pathname);
  const [page, setPage] = useState<Page>(initialRoute.page);
  const [activeBlogSlug, setActiveBlogSlug] = useState<string | undefined>(initialRoute.slug ?? 'guida-cv');
  const [modal, setModal] = useState<ModalType>(null);
  const [aiLoadingText, setAiLoadingText] = useState('');
  const [selectedTemplate, setSelectedTemplate] = useState<TemplateType>(() => loadCvDraft()?.template ?? 'modern');
  const [cvData, setCvData] = useState<CVData>(() => loadCvDraft()?.cvData ?? DEFAULT_CV_DATA);
  const [initialLanguage, setInitialLanguage] = useState<SupportedLanguage>(() => loadCvDraft()?.lang ?? 'IT');
  // Only relevant right after choosing "start a new CV" while a draft already
  // existed — lets the wizard render instead of the resume-or-restart choice.
  const [freshWizardStart, setFreshWizardStart] = useState(false);

  useEffect(() => {
    if (isDefaultCvData(cvData)) {
      localStorage.removeItem(CV_DRAFT_KEY);
      return;
    }
    const draft: CvDraft = { cvData, template: selectedTemplate, lang: initialLanguage };
    localStorage.setItem(CV_DRAFT_KEY, JSON.stringify(draft));
  }, [cvData, selectedTemplate, initialLanguage]);

  // Re-arm the resume-or-restart choice every time the wizard is re-entered
  // from elsewhere — "start fresh" should only skip it for this one visit.
  useEffect(() => {
    if (page !== 'builder-step1') setFreshWizardStart(false);
  }, [page]);

  useEffect(() => {
    if (localStorage.getItem('pc_cookie_consent') === 'all') {
      initGA4(); // Dynamically uses VITE_GA_MEASUREMENT_ID or default
    }
  }, []);

  // Keep the URL in sync with in-app navigation so every page has a real,
  // shareable, crawlable address, and handle browser back/forward.
  useEffect(() => {
    const onPopState = () => {
      const route = pathToPage(window.location.pathname);
      setPage(route.page);
      if (route.slug) setActiveBlogSlug(route.slug);
      window.scrollTo(0, 0);
    };
    window.addEventListener('popstate', onPopState);
    return () => window.removeEventListener('popstate', onPopState);
  }, []);

  const navigate = useCallback((p: Page, slug?: string) => {
    let resolvedSlug = slug;
    if (slug) {
      setActiveBlogSlug(slug);
    } else if (p === 'guida-cv' || p === 'punteggio-ats' || p === 'cv-europass' || p === 'esempi-cv') {
      resolvedSlug = p;
      setActiveBlogSlug(p);
      p = 'blog-article';
    }
    setPage(p);
    window.scrollTo(0, 0);
    trackPageView(p);

    const nextPath = pageToPath(p, p === 'blog-article' ? resolvedSlug : undefined);
    if (nextPath !== window.location.pathname) {
      window.history.pushState({}, '', nextPath);
    }
  }, []);

  const openModal = useCallback((m: ModalType) => setModal(m), []);
  const closeModal = useCallback(() => setModal(null), []);

  const handleWizardComplete = async (data: CVData, template: TemplateType, language: SupportedLanguage) => {
    setSelectedTemplate(template);
    setInitialLanguage(language);

    // Backfill whatever the wizard left blank (name, contact, bio, education…)
    // from the account's saved profile, so a returning user never has to
    // retype their own information into a new CV.
    let merged = data;
    try {
      const res = await fetch('/api/profile', { credentials: 'include' });
      if (res.ok) {
        const saved = await res.json() as {
          firstName?: string | null; lastName?: string | null; email?: string | null;
          profile?: {
            headline?: string | null; phone?: string | null; city?: string | null;
            linkedin?: string | null; summary?: string | null; skills?: string[] | null;
            education?: CVData['education'] | null; languages?: CVData['languages'] | null;
          } | null;
        };
        const p = saved.profile;
        merged = {
          ...data,
          firstName: data.firstName || saved.firstName || data.firstName,
          lastName: data.lastName || saved.lastName || data.lastName,
          email: data.email || saved.email || data.email,
          title: data.title || p?.headline || data.title,
          phone: data.phone || p?.phone || data.phone,
          city: data.city || p?.city || data.city,
          linkedin: data.linkedin || p?.linkedin || data.linkedin,
          summary: data.summary || p?.summary || data.summary,
          skills: data.skills.length ? data.skills : (p?.skills ?? data.skills),
          education: data.education.length ? data.education : (p?.education ?? data.education),
          languages: data.languages.length ? data.languages : (p?.languages ?? data.languages),
        };
      }
    } catch {
      // No saved profile (or not signed in) — the wizard's own data is fine as-is.
    }

    setCvData(merged);
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

  // Every page carries its own chrome: Home (RedesignV3) has a sticky topbar,
  // Dashboard (DashboardV3) has its own sidebar, blog/legal pages have their own
  // headers, and all other workspace pages are wrapped in WorkspaceShell below.
  const shellProps = {
    isAuthenticated,
    onNavigate: navigate,
    onLogin: () => openModal('signup'),
    user,
    onLogout: logout,
  };

  return (
    <>
      <main>
        {page === 'home' && (
          <Home onNavigate={navigate} onModal={openModal} />
        )}
        {page === 'builder-step1' && (
          <WorkspaceShell page={page} {...shellProps}>
            {!isDefaultCvData(cvData) && !freshWizardStart ? (
              <div style={{ maxWidth: 480, margin: '80px auto', textAlign: 'center', padding: '0 20px' }}>
                <h2 style={{ fontSize: 22, fontWeight: 700, marginBottom: 10 }}>Hai un CV non completato</h2>
                <p style={{ color: 'var(--gray500)', marginBottom: 28, lineHeight: 1.5 }}>
                  Abbiamo trovato una bozza di "{[cvData.firstName, cvData.lastName].filter(Boolean).join(' ') || 'CV'}" salvata sul tuo browser. Vuoi continuare da dove avevi lasciato, o iniziarne uno nuovo?
                </p>
                <div style={{ display: 'flex', gap: 12, justifyContent: 'center' }}>
                  <button className="btn btn-gold" onClick={() => navigate('builder-step2')}>Continua la bozza</button>
                  <button
                    className="btn btn-ghost"
                    onClick={() => {
                      localStorage.removeItem(CV_DRAFT_KEY);
                      setCvData(DEFAULT_CV_DATA);
                      setSelectedTemplate('modern');
                      setInitialLanguage('IT');
                      setFreshWizardStart(true);
                    }}
                  >
                    Inizia da zero
                  </button>
                </div>
              </div>
            ) : (
              <CreateCvWizard onComplete={handleWizardComplete} />
            )}
          </WorkspaceShell>
        )}
        {page === 'builder-step2' && (
          <WorkspaceShell page={page} {...shellProps}>
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
          <WorkspaceShell page={page} {...shellProps}>
            <Archivio onNavigate={navigate} />
          </WorkspaceShell>
        )}
        {page === 'profile-page' && (
          <WorkspaceShell page={page} {...shellProps}>
            <ProfilePageEditor onNavigate={navigate} />
          </WorkspaceShell>
        )}
        {page === 'tailor' && (
          <WorkspaceShell page={page} {...shellProps}>
            <TailorCv
              onNavigate={navigate}
              onCVLoaded={handleCVLoaded}
              onLogin={() => openModal('signup')}
            />
          </WorkspaceShell>
        )}
        {page === 'candidature' && (
          <WorkspaceShell page={page} {...shellProps}>
            <Candidature
              onNavigate={navigate}
              onCVLoaded={handleCVLoaded}
              onLogin={() => openModal('signup')}
              onModal={openModal}
            />
          </WorkspaceShell>
        )}
        {page === 'jobs' && (
          <WorkspaceShell page={page} {...shellProps}>
            <JobsBoard
              cvData={cvData}
              onNavigate={navigate}
              onLogin={() => openModal('signup')}
            />
          </WorkspaceShell>
        )}
        {page === 'dashboard' && (
          <WorkspaceShell page={page} {...shellProps}>
            <Dashboard
              onNavigate={navigate}
              onCVLoaded={handleCVLoaded}
              onLogin={() => openModal('signup')}
            />
          </WorkspaceShell>
        )}
        {(page === 'privacy' || page === 'terms' || page === 'cookie') && (
          <Legal section={page} onNavigate={navigate} />
        )}
        {page === 'blog' && (
          <BlogHub onNavigate={navigate} />
        )}
        {page === 'blog-article' && (
          <BlogArticle slug={activeBlogSlug} onNavigate={navigate} />
        )}
        {page === 'cover-letter' && (
          <WorkspaceShell page={page} {...shellProps}>
            <CoverLetterBuilder cvData={cvData} template={selectedTemplate} onNavigate={navigate} />
          </WorkspaceShell>
        )}
        {page === 'concorsi' && (
          <WorkspaceShell page={page} {...shellProps}>
            <ConcorsiPubblici
              onNavigate={navigate}
              cvData={cvData}
              onCVChange={setCvData}
              onTemplateChange={setSelectedTemplate}
            />
          </WorkspaceShell>
        )}
        {page === 'referral' && (
          <WorkspaceShell page={page} {...shellProps}>
            <ReferralPage onNavigate={navigate} />
          </WorkspaceShell>
        )}
        {page === 'admin' && (
          <WorkspaceShell page={page} {...shellProps}>
            <AdminPanel onNavigate={navigate} />
          </WorkspaceShell>
        )}
        {page === 'calcolo-stipendio' && (
          <SalaryCalculator onNavigate={navigate} />
        )}
        {page === 'prezzi' && (
          <Prezzi onNavigate={navigate} onModal={openModal} />
        )}
        {page === 'come-funziona' && (
          <ComeFunziona onNavigate={navigate} />
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
        onRequireAuth={() => openModal('signup')}
      />
      <Toaster position="bottom-center" richColors />
      <CookieConsent onNavigate={navigate} />
    </>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <LanguageProvider>
        <AppInner />
      </LanguageProvider>
    </AuthProvider>
  );
}
