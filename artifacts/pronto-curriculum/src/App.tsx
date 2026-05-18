import { useState, useCallback } from 'react';
import Home from './pages/Home';
import BuilderStep1 from './pages/BuilderStep1';
import BuilderStep2 from './pages/BuilderStep2';
import Modals from './components/Modals';
import { Page, ModalType, TemplateType, CVData } from './types';

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

const IMPORT_DATA: Partial<CVData> = {
  firstName: 'Giulia',
  lastName: 'Bianchi',
  title: 'Marketing Manager',
  email: 'giulia.bianchi@email.com',
  city: 'Roma',
  summary: 'Marketing manager con 6 anni di esperienza in gestione di campagne digitali e brand strategy per aziende B2C e B2B. Expertise in SEO, SEM, social media e analisi dati.',
};

export default function App() {
  const [page, setPage] = useState<Page>('home');
  const [modal, setModal] = useState<ModalType>(null);
  const [aiLoadingText, setAiLoadingText] = useState('');
  const [selectedTemplate, setSelectedTemplate] = useState<TemplateType>('modern');
  const [cvData, setCvData] = useState<CVData>(DEFAULT_CV_DATA);
  const [atsScore, setAtsScore] = useState(87);

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
      setAtsScore(87 + Math.floor(Math.random() * 10));
    }, 2200);
  };

  const handleImportComplete = () => {
    setAiLoadingText('Estraendo le informazioni dal documento con AI...');
    setModal('ai-loading');
    setTimeout(() => {
      setModal(null);
      setCvData(prev => ({ ...prev, ...IMPORT_DATA }));
      navigate('builder-step2');
    }, 2500);
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
          <button className="btn btn-outline" onClick={() => openModal('signup')}>Accedi</button>
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
            onNavigate={navigate}
            onModal={openModal}
            atsScore={atsScore}
            onAiAction={handleAiAction}
          />
        )}
      </main>

      <Modals
        modal={modal}
        aiLoadingText={aiLoadingText}
        onClose={closeModal}
        onSuccess={handleSuccess}
        onImportComplete={handleImportComplete}
      />
    </>
  );
}
