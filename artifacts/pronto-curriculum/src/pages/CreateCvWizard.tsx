import { useRef, useState } from 'react';
import { CVData, TemplateType } from '../types';
import { extractTextFromPDF, extractPhotoFromPDF } from '../utils/parseCV';
import { aiParseCV } from '../utils/aiParseCV';
import { LANGUAGES, type SupportedLanguage } from '../utils/aiTranslate';
import { Icon, IC } from '../components/StrokeIcon';
import CVPreview from '../components/CVPreview';

const BLANK_CV: CVData = {
  firstName: '', lastName: '', title: '', email: '', phone: '',
  city: '', linkedin: '', summary: '',
  experiences: [], education: [], skills: [], languages: [],
};

const MARIO: CVData = {
  firstName: 'Mario', lastName: 'Rossi',
  title: 'Software Engineer Senior',
  email: 'mario.rossi@email.it',
  phone: '+39 333 1234567',
  city: 'Milano',
  linkedin: 'linkedin.com/in/mariorossi',
  summary: 'Ingegnere del software con 7 anni di esperienza in sviluppo web e architetture cloud.',
  experiences: [
    { id: '1', company: 'TechCorp Srl', role: 'Lead Software Engineer', city: 'Milano', from: 'Gen 2021', to: 'Presente', desc: '• Guidato team di 5 sviluppatori\n• Ridotto bug in produzione del 40%' },
  ],
  education: [{ id: '1', institution: 'Politecnico di Milano', degree: 'Laurea Magistrale in Ing. Informatica', grade: '110/110', from: '2014', to: '2016' }],
  skills: ['React', 'TypeScript', 'Node.js', 'AWS'],
  languages: [{ id: '1', name: 'Inglese', level: 'C1 Avanzato' }],
};

const GIULIA: CVData = {
  firstName: 'Giulia', lastName: 'Bianchi',
  title: 'Marketing Manager',
  email: 'giulia.bianchi@email.it',
  phone: '+39 347 9876543',
  city: 'Roma',
  linkedin: 'linkedin.com/in/giuliabianchi',
  summary: 'Responsabile marketing digitale con 8 anni di esperienza nel settore consumer goods.',
  experiences: [
    { id: '1', company: 'Brand Italia SpA', role: 'Marketing Manager', city: 'Roma', from: 'Apr 2020', to: 'Presente', desc: '• Crescita fatturato online +45%\n• Team di 8 persone' },
  ],
  education: [{ id: '1', institution: 'Università La Sapienza', degree: 'Laurea in Scienze della Comunicazione', grade: '108/110', from: '2012', to: '2015' }],
  skills: ['Digital Marketing', 'SEO/SEM', 'Google Analytics'],
  languages: [{ id: '1', name: 'Inglese', level: 'C1 Avanzato' }],
};

interface TplInfo {
  id: TemplateType;
  name: string;
  badge: string;
  badgeBg: string;
  sample: CVData;
}

const TEMPLATES: TplInfo[] = [
  { id: 'modern',        name: 'Moderno',       badge: 'Più scelto',   badgeBg: '#2F2AE5', sample: MARIO },
  { id: 'minimal',       name: 'Minimal',       badge: 'Max ATS',      badgeBg: '#12805C', sample: MARIO },
  { id: 'milano',        name: 'Milano',        badge: 'Editorial',    badgeBg: '#0B1D3A', sample: MARIO },
  { id: 'elegante',      name: 'Elegante',      badge: 'Luxury',       badgeBg: '#8B6914', sample: GIULIA },
  { id: 'classico',      name: 'Classico',      badge: 'Ultra ATS',    badgeBg: '#12805C', sample: MARIO },
  { id: 'nordico',       name: 'Nordico',       badge: 'Scandinavo',   badgeBg: '#1E4E34', sample: MARIO },
  { id: 'tecnico',       name: 'Tecnico',       badge: 'Tech & IT',    badgeBg: '#2B6CB0', sample: MARIO },
  { id: 'corporate',     name: 'Corporate',     badge: 'Business',     badgeBg: '#2D3748', sample: GIULIA },
  { id: 'europass',      name: 'Europass',      badge: 'EU Standard',  badgeBg: '#003399', sample: GIULIA },
];

const SCALE = 0.34;

type Source = 'cv' | 'linkedin' | 'blank';
type Step = 'source' | 'language' | 'template';

interface CreateCvWizardProps {
  onComplete: (cvData: CVData, template: TemplateType, language: SupportedLanguage) => void;
}

export default function CreateCvWizard({ onComplete }: CreateCvWizardProps) {
  const [step, setStep] = useState<Step>('source');
  const [source, setSource] = useState<Source | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [extracting, setExtracting] = useState(false);
  const [error, setError] = useState('');
  const [dragOver, setDragOver] = useState(false);
  const [language, setLanguage] = useState<SupportedLanguage>('IT');
  const [cvData, setCvData] = useState<CVData>(BLANK_CV);
  const fileRef = useRef<HTMLInputElement>(null);

  const steps: Step[] = ['source', 'language', 'template'];
  const stepIndex = steps.indexOf(step);

  const goBack = () => {
    if (stepIndex > 0) setStep(steps[stepIndex - 1]!);
  };

  const chooseBlank = () => {
    setSource('blank');
    setCvData(BLANK_CV);
    setStep('language');
  };

  const chooseUploadSource = (s: 'cv' | 'linkedin') => {
    setSource(s);
    setError('');
  };

  const handleFile = (f: File) => {
    setFile(f);
    setError('');
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const f = e.dataTransfer.files?.[0];
    if (f) handleFile(f);
  };

  const extractAndContinue = async () => {
    if (!file) return;
    setExtracting(true);
    setError('');

    let text = '';
    let photo: string | null = null;
    try {
      const isPdf = file.name.toLowerCase().endsWith('.pdf');
      if (isPdf) {
        [text, photo] = await Promise.all([extractTextFromPDF(file), extractPhotoFromPDF(file)]);
      } else {
        text = await file.text();
      }
    } catch {
      setError('Impossibile leggere il file. Prova con un altro formato o parti da zero.');
      setExtracting(false);
      return;
    }

    try {
      const data = await aiParseCV(text);
      if (photo) data.photo = photo;
      setCvData({ ...BLANK_CV, ...data });
      setStep('language');
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Errore sconosciuto';
      setError(`Il file è stato letto correttamente, ma l'AI non è riuscita ad analizzarlo (${msg}). Controlla la connessione e riprova tra qualche secondo.`);
    } finally {
      setExtracting(false);
    }
  };

  const chooseTemplate = (tmpl: TemplateType) => {
    onComplete(cvData, tmpl, language);
  };

  return (
    <div className="wiz-shell">
      <div className="wiz-steps">
        {steps.map((s, i) => (
          <div key={s} style={{ display: 'flex', alignItems: 'center', gap: 8, flex: i < steps.length - 1 ? 1 : undefined }}>
            <div className={`wiz-step-dot${i === stepIndex ? ' active' : i < stepIndex ? ' done' : ''}`} />
            {i < steps.length - 1 && <div className="wiz-step-line" />}
          </div>
        ))}
      </div>

      {step === 'source' && (
        <>
          <div className="wiz-head">
            <span className="mono">PASSO 1 DI 3</span>
            <h1>Come vuoi iniziare?</h1>
            <p>Importa un CV esistente e lascia che l'AI lo compili per te, oppure parti da un foglio bianco.</p>
          </div>

          {!source && (
            <div className="wiz-options">
              <button className="wiz-option" onClick={() => chooseUploadSource('cv')}>
                <div className="wiz-option-icon"><Icon d={IC.upload} size={18} /></div>
                <h3>Carica il tuo CV</h3>
                <p>PDF o Word — l'AI estrae automaticamente dati, esperienze e formazione.</p>
              </button>
              <button className="wiz-option" onClick={() => chooseUploadSource('linkedin')}>
                <div className="wiz-option-icon"><Icon d={IC.globe} size={18} /></div>
                <h3>Esportazione LinkedIn</h3>
                <p>Da LinkedIn: Il tuo profilo → Altro → Salva come PDF, poi caricalo qui.</p>
              </button>
              <button className="wiz-option" onClick={chooseBlank}>
                <div className="wiz-option-icon"><Icon d={IC.doc} size={18} /></div>
                <h3>Parti da zero</h3>
                <p>Compila il CV manualmente, un campo alla volta, con l'aiuto dell'AI.</p>
              </button>
            </div>
          )}

          {(source === 'cv' || source === 'linkedin') && (
            <div>
              <input
                ref={fileRef}
                type="file"
                accept=".pdf,.doc,.docx"
                style={{ display: 'none' }}
                onChange={e => { const f = e.target.files?.[0]; if (f) handleFile(f); }}
              />
              <div
                className={`wiz-dropzone${dragOver ? ' drag' : ''}`}
                onClick={() => fileRef.current?.click()}
                onDrop={handleDrop}
                onDragOver={e => { e.preventDefault(); setDragOver(true); }}
                onDragLeave={() => setDragOver(false)}
              >
                <div className="wiz-dropzone-icon"><Icon d={IC.upload} size={20} /></div>
                {file ? (
                  <>
                    <h3 style={{ fontFamily: 'var(--f-display)', fontWeight: 600, fontSize: 14.5, marginBottom: 4 }}>{file.name}</h3>
                    <p style={{ fontSize: 12, color: 'var(--ink-40)' }}>File caricato · clicca per cambiarlo</p>
                  </>
                ) : (
                  <>
                    <h3 style={{ fontFamily: 'var(--f-display)', fontWeight: 600, fontSize: 14.5, marginBottom: 4 }}>Trascina il file qui</h3>
                    <p style={{ fontSize: 12, color: 'var(--ink-40)' }}>o clicca per selezionarlo — PDF o Word</p>
                  </>
                )}
              </div>
              {error && <div className="wiz-error">{error}</div>}
              <div className="wiz-footer">
                <button className="btn btn-ghost" onClick={() => { setSource(null); setFile(null); setError(''); }}>← Indietro</button>
                <button className="btn btn-ink" disabled={!file || extracting} onClick={() => void extractAndContinue()}>
                  {extracting ? 'Estrazione con AI…' : 'Continua'} <Icon d={IC.arrowRight} size={15} />
                </button>
              </div>
            </div>
          )}
        </>
      )}

      {step === 'language' && (
        <>
          <div className="wiz-head">
            <span className="mono">PASSO 2 DI 3</span>
            <h1>In che lingua vuoi il tuo CV?</h1>
            <p>Potrai comunque tradurlo o modificarlo in qualsiasi momento dall'editor.</p>
          </div>
          <div className="wiz-langs">
            {LANGUAGES.map(l => (
              <button
                key={l.code}
                className={`wiz-lang${language === l.code ? ' selected' : ''}`}
                onClick={() => setLanguage(l.code)}
              >
                <span>{l.flag}</span> {l.label}
              </button>
            ))}
          </div>
          <div className="wiz-footer">
            <button className="btn btn-ghost" onClick={goBack}>← Indietro</button>
            <button className="btn btn-ink" onClick={() => setStep('template')}>
              Continua <Icon d={IC.arrowRight} size={15} />
            </button>
          </div>
        </>
      )}

      {step === 'template' && (
        <>
          <div className="wiz-head">
            <span className="mono">PASSO 3 DI 3</span>
            <h1>Scegli il template</h1>
            <p>Anteprime reali — tutti ottimizzati ATS per il mercato italiano ed europeo.</p>
          </div>
          <div className="tpl-grid">
            {TEMPLATES.map(tpl => (
              <button key={tpl.id} className="tpl-card" onClick={() => chooseTemplate(tpl.id)}>
                <div className="tpl-preview" style={{ height: 150, overflow: 'hidden' }}>
                  <div style={{ transform: `scale(${SCALE})`, transformOrigin: 'top left', width: 595, height: 842 }}>
                    <CVPreview cvData={tpl.sample} template={tpl.id} />
                  </div>
                </div>
                <div className="tpl-name">{tpl.name}</div>
                <span className="tpl-badge" style={{ background: tpl.badgeBg }}>{tpl.badge}</span>
              </button>
            ))}
          </div>
          <div className="wiz-footer">
            <button className="btn btn-ghost" onClick={goBack}>← Indietro</button>
            <div />
          </div>
        </>
      )}
    </div>
  );
}
