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
import { useAuth } from './hooks/use-auth';
import { LanguageProvider } from './i18n/LanguageContext';
import type { SupportedLanguage } from './utils/aiTranslate';
import { pathToPage, pageToPath } from './utils/routes';

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

function AppInner() {
  const { user, isAuthenticated, login, loginWithEmail, signUpWithEmail, logout } = useAuth();
  const initialRoute = pathToPage(window.location.pathname);
  const [page, setPage] = useState<Page>(initialRoute.page);
  const [activeBlogSlug, setActiveBlogSlug] = useState<string | undefined>(initialRoute.slug ?? 'guida-cv');
  const [modal, setModal] = useState<ModalType>(null);
  const [aiLoadingText, setAiLoadingText] = useState('');
  const [selectedTemplate, setSelectedTemplate] = useState<TemplateType>('modern');
  const [cvData, setCvData] = useState<CVData>(DEFAULT_CV_DATA);
  const [initialLanguage, setInitialLanguage] = useState<SupportedLanguage>('IT');

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
            <CreateCvWizard onComplete={handleWizardComplete} />
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
      />
      <Toaster position="bottom-center" richColors />
      <CookieConsent onNavigate={navigate} />
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
