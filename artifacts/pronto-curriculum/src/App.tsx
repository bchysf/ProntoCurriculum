import { useState, useCallback } from 'react';
import Home from './pages/Home';
import BuilderStep1 from './pages/BuilderStep1';
import BuilderStep2 from './pages/BuilderStep2';
import Archivio from './pages/Archivio';
import TailorCv from './pages/TailorCv';
import Modals from './components/Modals';
import { Page, ModalType, TemplateType, CVData } from './types';
import { useAuth } from '@workspace/replit-auth-web';

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

const BLANK_CV: CVData = {
  firstName: '', lastName: '', title: '', email: '', phone: '',
  city: '', linkedin: '', summary: '',
  experiences: [], education: [], skills: [], languages: [],
};

export default function App() {
  const { user, isLoading, isAuthenticated, login, logout } = useAuth();
  const [page, setPage] = useState<Page>('home');
  const [modal, setModal] = useState<ModalType>(null);
  const [aiLoadingText, setAiLoadingText] = useState('');
  const [selectedTemplate, setSelectedTemplate] = useState<TemplateType>('modern');
  const [cvData, setCvData] = useState<CVData>(DEFAULT_CV_DATA);

  const navigate = useCallback((p: Page) => {
    setPage(p);
    window.scrollTo(0, 0);
  }, []);

  const openModal = useCallback((m: ModalType) => {
    setModal(m);
  }, []);

  const closeModal = useCallback(() => {
    setModal(null);
  }, []);

  const handleSelectTemplate = (t: TemplateType) => {
    setSelectedTemplate(t);
    setTimeout(() => navigate('builder-step2'), 150);
  };

  const handleAiAction = (text: string, callback: () => void) => {
    setAiLoadingText(text);
    setModal('ai-loading');
    setTimeout(() => {
      setModal(null);
      callback();
    }, 2200);
  };

  const handleImportComplete = (extracted: Partial<CVData>) => {
    setCvData({ ...BLANK_CV, ...extracted });
    navigate('builder-step2');
  };

  const handleTailoredCV = (generated: CVData) => {
    setCvData(generated);
  };

  const handleSuccess = () => {
    setModal('success');
  };

  return (
    <>
      <nav>
        <div className="logo" onClick={() => navigate('home')}>
          <div className="logo-icon">P</div>
          <span className="logo-text">Pronto<span>Curriculum</span></span>
        </div>
        <div className="nav-actions">
          {isLoading ? (
            <div style={{ width: 80, height: 36 }} />
          ) : isAuthenticated && user ? (
            <>
              {user.profileImageUrl ? (
                <img
                  src={user.profileImageUrl}
                  alt="avatar"
                  style={{ width: 32, height: 32, borderRadius: '50%', objectFit: 'cover', border: '2px solid var(--gold)' }}
                />
              ) : (
                <div style={{ width: 32, height: 32, borderRadius: '50%', background: 'var(--gold)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: 14, color: 'var(--navy)' }}>
                  {(user.firstName?.[0] ?? user.email?.[0] ?? '?').toUpperCase()}
                </div>
              )}
              <span style={{ fontSize: 14, color: 'var(--gray300)', maxWidth: 140, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {user.firstName ?? user.email ?? 'Utente'}
              </span>
              <button
                className="btn btn-ghost btn-sm"
                style={{ fontSize: 13 }}
                onClick={() => navigate('tailor')}
              >
                ✦ CV su misura
              </button>
              <button
                className="btn btn-ghost btn-sm"
                style={{ fontSize: 13 }}
                onClick={() => navigate('archivio')}
              >
                💼 Le mie esperienze
              </button>
              <button className="btn btn-outline" style={{ fontSize: 13 }} onClick={logout}>Esci</button>
            </>
          ) : (
            <button className="btn btn-outline" onClick={login}>Accedi</button>
          )}
          <button className="btn btn-gold" onClick={() => navigate('builder-step1')}>Crea il tuo CV →</button>
        </div>
      </nav>

      <main style={{ minHeight: 'calc(100vh - 64px)' }}>
        {page === 'home' && (
          <Home onNavigate={navigate} onModal={openModal} />
        )}
        {page === 'builder-step1' && (
          <BuilderStep1
            selectedTemplate={selectedTemplate}
            onSelectTemplate={handleSelectTemplate}
            onModal={openModal}
          />
        )}
        {page === 'builder-step2' && (
          <BuilderStep2
            cvData={cvData}
            onCVChange={setCvData}
            selectedTemplate={selectedTemplate}
            onTemplateChange={setSelectedTemplate}
            onNavigate={navigate}
            onModal={openModal}
            onAiAction={handleAiAction}
            onGoToArchivio={() => navigate('archivio')}
          />
        )}
        {page === 'archivio' && (
          <Archivio onNavigate={navigate} />
        )}
        {page === 'tailor' && (
          <TailorCv
            onNavigate={navigate}
            onCVLoaded={handleTailoredCV}
            onLogin={login}
          />
        )}
      </main>

      <Modals
        modal={modal}
        aiLoadingText={aiLoadingText}
        onClose={closeModal}
        onSuccess={handleSuccess}
        onImportComplete={handleImportComplete}
        isAuthenticated={isAuthenticated}
        onLogin={login}
      />
    </>
  );
}
