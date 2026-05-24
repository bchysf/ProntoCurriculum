import { useEffect } from 'react';
import { CVData, TemplateType } from '../types';
import CVPreview from './CVPreview';

// ── sample personas ─────────────────────────────────────────────────────────
const MARIO: CVData = {
  firstName: 'Mario', lastName: 'Rossi',
  title: 'Software Engineer Senior',
  email: 'mario.rossi@email.it',
  phone: '+39 333 1234567',
  city: 'Milano',
  linkedin: 'linkedin.com/in/mariorossi',
  summary: 'Ingegnere del software con 7 anni di esperienza in sviluppo web e architetture cloud. Appassionato di performance e clean code.',
  experiences: [
    { id: '1', company: 'TechCorp Srl', role: 'Lead Software Engineer', city: 'Milano', from: 'Gen 2021', to: 'Presente', desc: '• Guidato team di 5 sviluppatori riducendo i bug del 40%\n• Implementato architettura microservizi' },
    { id: '2', company: 'StartUp Innovation', role: 'Full Stack Developer', city: 'Roma', from: 'Mar 2018', to: 'Dic 2020', desc: '• Sviluppato piattaforma SaaS usata da 50.000 utenti\n• Performance migliorate del 35%' },
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
  summary: 'Responsabile marketing digitale con 8 anni di esperienza nel settore consumer goods e e-commerce.',
  experiences: [
    { id: '1', company: 'Brand Italia SpA', role: 'Marketing Manager', city: 'Roma', from: 'Apr 2020', to: 'Presente', desc: '• Crescita fatturato online +45% in 2 anni\n• Budget gestito: €3M\n• Team di 8 persone' },
    { id: '2', company: 'Digital Agency', role: 'Senior Marketing Specialist', city: 'Milano', from: 'Lug 2017', to: 'Mar 2020', desc: '• 15 clienti enterprise gestiti\n• Conversioni aumentate del 28%' },
  ],
  education: [{ id: '1', institution: 'Università La Sapienza', degree: 'Laurea in Scienze della Comunicazione', grade: '108/110', from: '2012', to: '2015' }],
  skills: ['Digital Marketing', 'SEO/SEM', 'Google Analytics', 'Social Media', 'Content'],
  languages: [{ id: '1', name: 'Inglese', level: 'C1 Avanzato' }, { id: '2', name: 'Francese', level: 'B2 Intermedio' }],
};

interface TemplateInfo {
  id: TemplateType;
  name: string;
  atsStars: number;
  badge: string;
  badgeBg: string;
  sample: CVData;
  warning?: string;
}

const TEMPLATES: TemplateInfo[] = [
  { id: 'modern',        name: 'Moderno',       atsStars: 5, badge: '⭐ Più scelto',      badgeBg: '#C9A84C', sample: MARIO  },
  { id: 'minimal',       name: 'Minimal',       atsStars: 5, badge: '✓ Max ATS',         badgeBg: '#1A6B45', sample: MARIO  },
  { id: 'classico',      name: 'Classico',       atsStars: 5, badge: '✓ Ultra ATS',       badgeBg: '#1A6B45', sample: MARIO  },
  { id: 'tecnico',       name: 'Tecnico',       atsStars: 5, badge: '💻 Tech & IT',       badgeBg: '#2B6CB0', sample: MARIO  },
  { id: 'compatto',      name: 'Compatto',      atsStars: 4, badge: '📄 Una pagina',      badgeBg: '#6B46C1', sample: MARIO  },
  { id: 'professionale', name: 'Professionale', atsStars: 4, badge: '📸 Con foto',        badgeBg: '#9B2C2C', sample: GIULIA },
  { id: 'executive',     name: 'Executive',     atsStars: 3, badge: '🎨 Premium',         badgeBg: '#744210', sample: GIULIA, warning: 'Sidebar a 2 colonne — verifica compatibilità ATS' },
  { id: 'europass',      name: 'Europass',      atsStars: 4, badge: '🇪🇺 EU Standard',   badgeBg: '#003399', sample: GIULIA },
];

interface TemplateModalProps {
  current: TemplateType;
  onSelect: (t: TemplateType) => void;
  onClose: () => void;
}

function Stars({ n }: { n: number }) {
  return (
    <span style={{ color: '#C9A84C', fontSize: 11 }}>
      {'★'.repeat(n)}{'☆'.repeat(5 - n)}
    </span>
  );
}

// scale factor: preview card shows CVPreview at 22% size
const SCALE = 0.22;
const CARD_W = Math.round(595 * SCALE);   // ≈ 131
const CARD_H = Math.round(842 * SCALE);   // ≈ 185

export default function TemplateModal({ current, onSelect, onClose }: TemplateModalProps) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = '';
    };
  }, [onClose]);

  return (
    <div className="tpl-overlay" onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="tpl-modal">
        <div className="tpl-modal-header">
          <span className="tpl-modal-title">Scegli il tuo template CV</span>
          <button className="tpl-modal-close" onClick={onClose} aria-label="Chiudi">✕</button>
        </div>
        <p className="tpl-modal-subtitle">Le anteprime mostrano un CV di esempio. Il tuo contenuto si adatterà automaticamente.</p>

        <div className="tpl-grid">
          {TEMPLATES.map(tpl => {
            const selected = tpl.id === current;
            return (
              <button
                key={tpl.id}
                className={`tpl-card${selected ? ' tpl-card--selected' : ''}`}
                onClick={() => { onSelect(tpl.id); onClose(); }}
                title={tpl.name}
              >
                {/* mini live preview */}
                <div className="tpl-preview-wrap" style={{ width: CARD_W, height: CARD_H }}>
                  <div className="tpl-preview-inner" style={{ transform: `scale(${SCALE})`, transformOrigin: 'top left', width: 595, height: 842, overflow: 'hidden' }}>
                    <CVPreview cvData={tpl.sample} template={tpl.id} />
                  </div>
                </div>

                {/* card footer */}
                <div className="tpl-card-footer">
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <span className="tpl-card-name">{tpl.name}</span>
                    {selected && <span className="tpl-card-check">✓</span>}
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 3 }}>
                    <Stars n={tpl.atsStars} />
                    <span style={{ fontSize: 9, color: '#7A756A' }}>ATS</span>
                  </div>
                  <span className="tpl-badge" style={{ background: tpl.badgeBg }}>{tpl.badge}</span>
                  {tpl.warning && <div className="tpl-warning">⚠ {tpl.warning}</div>}
                </div>
              </button>
            );
          })}
        </div>

        <div className="tpl-modal-footer">
          <button className="btn btn-ghost btn-sm" onClick={onClose}>Annulla</button>
          <span style={{ fontSize: 12, color: '#7A756A' }}>★★★★★ = Massima compatibilità ATS</span>
        </div>
      </div>
    </div>
  );
}
