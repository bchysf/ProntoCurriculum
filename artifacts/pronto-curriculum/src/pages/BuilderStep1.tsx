import CVPreview from '../components/CVPreview';
import { TemplateType, ModalType, CVData } from '../types';

interface BuilderStep1Props {
  selectedTemplate: TemplateType;
  onSelectTemplate: (t: TemplateType) => void;
  onModal: (modal: ModalType) => void;
}

// ── sample personas ──────────────────────────────────────────────────────────
const MARIO: CVData = {
  firstName: 'Mario', lastName: 'Rossi',
  title: 'Software Engineer Senior',
  email: 'mario.rossi@email.it',
  phone: '+39 333 1234567',
  city: 'Milano',
  linkedin: 'linkedin.com/in/mariorossi',
  summary: 'Ingegnere del software con 7 anni di esperienza in sviluppo web e architetture cloud. Appassionato di performance e clean code.',
  experiences: [
    { id: '1', company: 'TechCorp Srl', role: 'Lead Software Engineer', city: 'Milano', from: 'Gen 2021', to: 'Presente', desc: '• Guidato team di 5 sviluppatori\n• Ridotto bug in produzione del 40%\n• Migrazione a microservizi' },
    { id: '2', company: 'StartUp Innovation', role: 'Full Stack Developer', city: 'Roma', from: 'Mar 2018', to: 'Dic 2020', desc: '• Sviluppato piattaforma SaaS da 50.000 utenti\n• Performance +35%' },
  ],
  education: [{ id: '1', institution: 'Politecnico di Milano', degree: 'Laurea Magistrale in Ing. Informatica', grade: '110/110', from: '2014', to: '2016' }],
  skills: ['React', 'TypeScript', 'Node.js', 'AWS', 'Docker', 'PostgreSQL'],
  languages: [{ id: '1', name: 'Inglese', level: 'C1 Avanzato' }],
};

const GIULIA: CVData = {
  firstName: 'Giulia', lastName: 'Bianchi',
  title: 'Marketing Manager',
  email: 'giulia.bianchi@email.it',
  phone: '+39 347 9876543',
  city: 'Roma',
  linkedin: 'linkedin.com/in/giuliabianchi',
  summary: 'Responsabile marketing digitale con 8 anni di esperienza nel settore consumer goods e e-commerce. Specializzata in growth marketing.',
  experiences: [
    { id: '1', company: 'Brand Italia SpA', role: 'Marketing Manager', city: 'Roma', from: 'Apr 2020', to: 'Presente', desc: '• Crescita fatturato online +45%\n• Budget €3M gestito\n• Team di 8 persone' },
    { id: '2', company: 'Digital Agency', role: 'Sr. Marketing Specialist', city: 'Milano', from: 'Lug 2017', to: 'Mar 2020', desc: '• 15 clienti enterprise\n• Conversioni +28%' },
  ],
  education: [{ id: '1', institution: 'Università La Sapienza', degree: 'Laurea in Scienze della Comunicazione', grade: '108/110', from: '2012', to: '2015' }],
  skills: ['Digital Marketing', 'SEO/SEM', 'Google Analytics', 'Social Media', 'Content'],
  languages: [{ id: '1', name: 'Inglese', level: 'C1 Avanzato' }, { id: '2', name: 'Francese', level: 'B2 Intermedio' }],
};

// scale factor: card width ≈ 155px / 595px CV width ≈ 0.26
const SCALE = 0.26;
const CARD_W = Math.round(595 * SCALE);  // 155
const CARD_H = Math.round(842 * SCALE);  // 219

interface TplInfo {
  id: TemplateType;
  name: string;
  atsStars: number;
  badge: string;
  badgeBg: string;
  sample: CVData;
  warning?: string;
}

const TEMPLATES: TplInfo[] = [
  { id: 'modern',        name: 'Moderno',       atsStars: 5, badge: '⭐ Più scelto',      badgeBg: '#C9A84C',  sample: MARIO  },
  { id: 'minimal',       name: 'Minimal',       atsStars: 5, badge: '✓ Max ATS',          badgeBg: '#1A6B45',  sample: MARIO  },
  { id: 'classico',      name: 'Classico',      atsStars: 5, badge: '✓ Ultra ATS',        badgeBg: '#1A6B45',  sample: MARIO  },
  { id: 'tecnico',       name: 'Tecnico',       atsStars: 5, badge: '💻 Tech & IT',        badgeBg: '#2B6CB0',  sample: MARIO  },
  { id: 'compatto',      name: 'Compatto',      atsStars: 4, badge: '📄 Una pagina',       badgeBg: '#6B46C1',  sample: MARIO  },
  { id: 'professionale', name: 'Professionale', atsStars: 4, badge: '📸 Con foto',         badgeBg: '#9B2C2C',  sample: GIULIA },
  { id: 'executive',     name: 'Executive',     atsStars: 3, badge: '🎨 Premium',          badgeBg: '#744210',  sample: GIULIA, warning: 'Sidebar — verifica ATS' },
  { id: 'europass',      name: 'Europass',      atsStars: 4, badge: '🇪🇺 EU Standard',    badgeBg: '#003399',  sample: GIULIA },
];

function Stars({ n }: { n: number }) {
  return (
    <span style={{ color: '#C9A84C', fontSize: 11, letterSpacing: 0 }}>
      {'★'.repeat(n)}
      <span style={{ opacity: 0.25 }}>{'★'.repeat(5 - n)}</span>
    </span>
  );
}

export default function BuilderStep1({ selectedTemplate, onSelectTemplate, onModal }: BuilderStep1Props) {
  return (
    <div>
      <div className="builder-header">
        <div>
          <h2>Scegli il template</h2>
          <p style={{ fontSize: 13, color: 'var(--gray500)', marginTop: 2 }}>
            Anteprime reali con dati di esempio — tutti ottimizzati ATS per il mercato italiano
          </p>
        </div>
        <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
          <span className="ai-chip">✦ AI Inclusa</span>
          <button className="btn btn-ghost btn-sm" onClick={() => onModal('import')}>
            ⬆ Importa CV / LinkedIn
          </button>
        </div>
      </div>

      <div style={{ padding: '32px 48px 60px', maxWidth: 1200, margin: '0 auto' }}>
        <div className="step1-template-grid">
          {TEMPLATES.map(tpl => {
            const sel = selectedTemplate === tpl.id;
            return (
              <button
                key={tpl.id}
                className={`step1-tpl-card${sel ? ' step1-tpl-card--sel' : ''}`}
                onClick={() => onSelectTemplate(tpl.id)}
                title={`Seleziona template ${tpl.name}`}
              >
                {/* live mini CV preview */}
                <div className="step1-preview-wrap" style={{ width: CARD_W, height: CARD_H }}>
                  <div
                    className="step1-preview-inner"
                    style={{
                      transform: `scale(${SCALE})`,
                      transformOrigin: 'top left',
                      width: 595,
                      height: 842,
                      overflow: 'hidden',
                    }}
                  >
                    <CVPreview cvData={tpl.sample} template={tpl.id} />
                  </div>
                </div>

                {/* card footer */}
                <div className="step1-card-footer">
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span className="step1-card-name">{tpl.name}</span>
                    {sel && <span style={{ color: 'var(--navy)', fontWeight: 800, fontSize: 14 }}>✓</span>}
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 5, margin: '3px 0 5px' }}>
                    <Stars n={tpl.atsStars} />
                    <span style={{ fontSize: 9, color: 'var(--gray500)', fontWeight: 600 }}>ATS</span>
                  </div>
                  <span className="step1-badge" style={{ background: tpl.badgeBg }}>{tpl.badge}</span>
                  {tpl.warning && (
                    <div style={{ fontSize: 9, color: '#9B2C2C', marginTop: 4 }}>⚠ {tpl.warning}</div>
                  )}
                </div>
              </button>
            );
          })}
        </div>

        <p style={{ textAlign: 'center', fontSize: 12, color: 'var(--gray500)', marginTop: 28 }}>
          Clicca un template per selezionarlo e accedere all'editor — potrai cambiarlo in qualsiasi momento
        </p>
      </div>
    </div>
  );
}
