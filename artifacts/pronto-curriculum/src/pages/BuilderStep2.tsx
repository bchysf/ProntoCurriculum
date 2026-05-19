import { useState, useCallback } from 'react';
import { CVData, TemplateType, ModalType } from '../types';
import { downloadCVAsPDF } from '../utils/downloadPDF';

interface BuilderStep2Props {
  cvData: CVData;
  onCVChange: (data: CVData) => void;
  selectedTemplate: TemplateType;
  onNavigate: (page: 'home' | 'builder-step1' | 'builder-step2') => void;
  onModal: (modal: ModalType) => void;
  atsScore: number;
  onAiAction: (text: string, callback: () => void) => void;
}

const AI_SUMMARIES = [
  'Ingegnere del software senior con oltre 8 anni di esperienza comprovata nello sviluppo di applicazioni enterprise ad alta scalabilità. Expertise in architetture cloud-native, DevOps e leadership di team tecnici. Track record di miglioramenti misurabili: riduzione dei tempi di deployment del 40%, incremento delle performance del 60%. Metodologie Agile e orientamento ai risultati.',
  'Professionista IT con 8+ anni di esperienza nella progettazione e implementazione di soluzioni software complesse. Specializzato in sviluppo full-stack, integrazione di sistemi cloud e gestione di team cross-funzionali. Capacità dimostrata di trasformare requisiti di business in architetture tecniche robuste ed efficienti.',
];

const AI_EXP_DESCS = [
  'Guidato con successo un team di 5 sviluppatori senior nella progettazione di architetture microservizi cloud-native su AWS. Implementato pipeline CI/CD automatizzate riducendo i tempi di rilascio del 40%. Ottimizzato le performance del sistema con risultati misurabili: latenza ridotta del 60%, disponibilità al 99.9%. Introdotto metodologie Agile e pratiche DevOps, migliorando la produttività del team del 35%.',
  'Responsabile dell\'architettura e sviluppo di soluzioni software enterprise per clienti Fortune 500. Coordinato sprint agili con 5 sviluppatori, garantendo delivery puntuale nel 95% dei casi. Ridotto il debito tecnico del 50% attraverso refactoring sistematico.',
];

const SUGGESTED_SKILLS = ['Kubernetes', 'CI/CD', 'Agile/Scrum', 'PostgreSQL', 'TypeScript', 'Redis'];

export default function BuilderStep2({ cvData, onCVChange, selectedTemplate, onNavigate, onModal, atsScore, onAiAction }: BuilderStep2Props) {
  const [activeTab, setActiveTab] = useState(0);
  const [newSkill, setNewSkill] = useState('');
  const [aiSummaryLoading, setAiSummaryLoading] = useState(false);
  const [downloading, setDownloading] = useState(false);

  const handleDownload = async () => {
    setDownloading(true);
    try {
      const name = [cvData.firstName, cvData.lastName].filter(Boolean).join(' ');
      await downloadCVAsPDF(name);
    } finally {
      setDownloading(false);
    }
  };

  const update = useCallback((field: keyof CVData, value: unknown) => {
    onCVChange({ ...cvData, [field]: value });
  }, [cvData, onCVChange]);

  const updateExp = (id: string, field: string, value: string) => {
    onCVChange({
      ...cvData,
      experiences: cvData.experiences.map(e => e.id === id ? { ...e, [field]: value } : e)
    });
  };

  const updateEdu = (id: string, field: string, value: string) => {
    onCVChange({
      ...cvData,
      education: cvData.education.map(e => e.id === id ? { ...e, [field]: value } : e)
    });
  };

  const addExperience = () => {
    onCVChange({
      ...cvData,
      experiences: [...cvData.experiences, {
        id: Date.now().toString(),
        company: '', role: '', city: '', from: '', to: '', desc: ''
      }]
    });
  };

  const removeExperience = (id: string) => {
    onCVChange({ ...cvData, experiences: cvData.experiences.filter(e => e.id !== id) });
  };

  const moveExperience = (idx: number, dir: -1 | 1) => {
    const next = idx + dir;
    if (next < 0 || next >= cvData.experiences.length) return;
    const arr = [...cvData.experiences];
    [arr[idx], arr[next]] = [arr[next], arr[idx]];
    onCVChange({ ...cvData, experiences: arr });
  };

  const addSkill = () => {
    const s = newSkill.trim();
    if (!s || cvData.skills.includes(s)) return;
    onCVChange({ ...cvData, skills: [...cvData.skills, s] });
    setNewSkill('');
  };

  const removeSkill = (skill: string) => {
    onCVChange({ ...cvData, skills: cvData.skills.filter(s => s !== skill) });
  };

  const handleRegenerateSummary = () => {
    setAiSummaryLoading(true);
    onAiAction('Ottimizzando il profilo per i sistemi ATS...', () => {
      const sample = AI_SUMMARIES[Math.floor(Math.random() * AI_SUMMARIES.length)];
      onCVChange({ ...cvData, summary: sample });
      setAiSummaryLoading(false);
    });
  };

  const handleRegenerateExp = (idx: number) => {
    onAiAction('Riscrivendo la descrizione con impatto professionale...', () => {
      const sample = AI_EXP_DESCS[Math.floor(Math.random() * AI_EXP_DESCS.length)];
      const updated = [...cvData.experiences];
      if (updated[idx]) updated[idx] = { ...updated[idx], desc: sample };
      onCVChange({ ...cvData, experiences: updated });
    });
  };

  const handleSuggestSkills = () => {
    onAiAction('Analizzando il tuo profilo e suggerendo competenze...', () => {
      const toAdd = SUGGESTED_SKILLS.filter(s => !cvData.skills.includes(s));
      onCVChange({ ...cvData, skills: [...cvData.skills, ...toAdd] });
    });
  };

  const templateClass = selectedTemplate === 'minimal' ? 'cv-doc template-minimal' : 'cv-doc template-modern';
  const name = [cvData.firstName, cvData.lastName].filter(Boolean).join(' ') || 'Il tuo nome';
  const skillsText = cvData.skills.join(' · ');
  const exp0 = cvData.experiences[0];
  const edu0 = cvData.education[0];
  const lang0 = cvData.languages[0];

  return (
    <div className="split-view">
      {/* LEFT: FORM */}
      <div className="split-left">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
          <div>
            <h2 style={{ fontSize: 20, fontWeight: 700 }}>Costruisci il tuo CV</h2>
            <p style={{ fontSize: 13, color: 'var(--gray500)', marginTop: 2 }}>I dati vengono aggiornati in tempo reale nell'anteprima</p>
          </div>
          <span className="ai-chip">✦ AI Attiva</span>
        </div>

        <div className="tabs">
          {['Personali', 'Esperienze', 'Formazione', 'Competenze'].map((label, i) => (
            <button key={i} className={`tab ${activeTab === i ? 'active' : ''}`} onClick={() => setActiveTab(i)}>
              {label}
            </button>
          ))}
        </div>

        {/* TAB 0: DATI PERSONALI */}
        {activeTab === 0 && (
          <div className="fade-in">
            <div className="form-section">
              <h3>📋 Dati personali</h3>
              <div className="subtitle">Informazioni di contatto e profilo professionale</div>
              <div className="form-row">
                <div className="form-group">
                  <label>Nome *</label>
                  <input type="text" placeholder="Mario" value={cvData.firstName} onChange={e => update('firstName', e.target.value)} />
                </div>
                <div className="form-group">
                  <label>Cognome *</label>
                  <input type="text" placeholder="Rossi" value={cvData.lastName} onChange={e => update('lastName', e.target.value)} />
                </div>
              </div>
              <div className="form-group">
                <label>Titolo professionale</label>
                <input type="text" placeholder="es. Senior Software Engineer" value={cvData.title} onChange={e => update('title', e.target.value)} />
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>Email *</label>
                  <input type="email" placeholder="mario.rossi@email.com" value={cvData.email} onChange={e => update('email', e.target.value)} />
                </div>
                <div className="form-group">
                  <label>Telefono</label>
                  <input type="tel" placeholder="+39 333 1234567" value={cvData.phone} onChange={e => update('phone', e.target.value)} />
                </div>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>Città</label>
                  <input type="text" placeholder="Milano" value={cvData.city} onChange={e => update('city', e.target.value)} />
                </div>
                <div className="form-group">
                  <label>LinkedIn</label>
                  <input type="text" placeholder="linkedin.com/in/mariorossi" value={cvData.linkedin} onChange={e => update('linkedin', e.target.value)} />
                </div>
              </div>
              <div className="form-group">
                <label>Profilo / Sommario professionale</label>
                <textarea
                  rows={4}
                  placeholder="Breve descrizione professionale..."
                  value={cvData.summary}
                  onChange={e => update('summary', e.target.value)}
                />
                <div className="form-hint">L'AI ottimizzerà questo testo per i sistemi ATS</div>
              </div>
              <button className="ai-btn" onClick={handleRegenerateSummary} disabled={aiSummaryLoading}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} style={{ width: 14, height: 14 }}>
                  <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2z" />
                </svg>
                {aiSummaryLoading ? 'Ottimizzazione in corso...' : 'Ottimizza con AI per ATS'}
              </button>
            </div>
            <div style={{ marginTop: 24 }}>
              <button className="btn btn-gold btn-lg" style={{ width: '100%' }} onClick={() => setActiveTab(1)}>
                Continua → Esperienze
              </button>
            </div>
          </div>
        )}

        {/* TAB 1: ESPERIENZE */}
        {activeTab === 1 && (
          <div className="fade-in">
            <div className="form-section">
              <h3>💼 Esperienze lavorative</h3>
              <div className="subtitle">Inserisci le tue esperienze in ordine cronologico inverso</div>

              <div id="experiences-container">
                {cvData.experiences.map((exp, idx) => (
                  <div key={exp.id} className="exp-block">
                    <div className="exp-block-header">
                      <span className="exp-block-title">Esperienza {idx + 1}</span>
                      <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                        <button
                          className="btn btn-ghost btn-sm"
                          style={{ padding: '4px 8px', fontSize: 14, lineHeight: 1 }}
                          title="Sposta su"
                          disabled={idx === 0}
                          onClick={() => moveExperience(idx, -1)}
                        >↑</button>
                        <button
                          className="btn btn-ghost btn-sm"
                          style={{ padding: '4px 8px', fontSize: 14, lineHeight: 1 }}
                          title="Sposta giù"
                          disabled={idx === cvData.experiences.length - 1}
                          onClick={() => moveExperience(idx, 1)}
                        >↓</button>
                        <button className="ai-btn" style={{ padding: '5px 10px', fontSize: 12 }} onClick={() => handleRegenerateExp(idx)}>✦ Ottimizza</button>
                        <button className="btn btn-danger btn-sm" onClick={() => removeExperience(exp.id)}>Rimuovi</button>
                      </div>
                    </div>
                    <div className="form-group">
                      <label>Nome azienda *</label>
                      <input type="text" placeholder="es. Accenture" value={exp.company} onChange={e => updateExp(exp.id, 'company', e.target.value)} />
                    </div>
                    <div className="form-row">
                      <div className="form-group" style={{ marginBottom: 0 }}>
                        <label>Ruolo *</label>
                        <input type="text" placeholder="es. Project Manager" value={exp.role} onChange={e => updateExp(exp.id, 'role', e.target.value)} />
                      </div>
                      <div className="form-group" style={{ marginBottom: 0 }}>
                        <label>Città</label>
                        <input type="text" placeholder="es. Roma" value={exp.city} onChange={e => updateExp(exp.id, 'city', e.target.value)} />
                      </div>
                    </div>
                    <div className="form-row" style={{ marginTop: 16 }}>
                      <div className="form-group" style={{ marginBottom: 0 }}>
                        <label>Da</label>
                        <input type="text" placeholder="Gen 2018" value={exp.from} onChange={e => updateExp(exp.id, 'from', e.target.value)} />
                      </div>
                      <div className="form-group" style={{ marginBottom: 0 }}>
                        <label>A</label>
                        <input type="text" placeholder="Presente" value={exp.to} onChange={e => updateExp(exp.id, 'to', e.target.value)} />
                      </div>
                    </div>
                    <div className="form-group" style={{ marginTop: 16 }}>
                      <label>Descrizione</label>
                      <textarea rows={4} placeholder="Descrivi le tue responsabilità e risultati..." value={exp.desc} onChange={e => updateExp(exp.id, 'desc', e.target.value)} />
                    </div>
                  </div>
                ))}
              </div>

              <button className="btn btn-ghost btn-sm" style={{ width: '100%', marginTop: 8 }} onClick={addExperience}>
                + Aggiungi esperienza
              </button>
            </div>
            <div style={{ marginTop: 24 }}>
              <button className="btn btn-gold btn-lg" style={{ width: '100%' }} onClick={() => setActiveTab(2)}>
                Continua → Formazione
              </button>
            </div>
          </div>
        )}

        {/* TAB 2: FORMAZIONE */}
        {activeTab === 2 && (
          <div className="fade-in">
            <div className="form-section">
              <h3>🎓 Formazione</h3>
              <div className="subtitle">Titoli di studio e certificazioni</div>
              {cvData.education.map(edu => (
                <div key={edu.id} className="exp-block">
                  <div className="exp-block-header">
                    <span className="exp-block-title">Titolo di studio</span>
                  </div>
                  <div className="form-group">
                    <label>Istituto / Università *</label>
                    <input type="text" placeholder="es. Politecnico di Milano" value={edu.institution} onChange={e => updateEdu(edu.id, 'institution', e.target.value)} />
                  </div>
                  <div className="form-row">
                    <div className="form-group">
                      <label>Titolo conseguito *</label>
                      <input type="text" placeholder="es. Laurea Magistrale in Informatica" value={edu.degree} onChange={e => updateEdu(edu.id, 'degree', e.target.value)} />
                    </div>
                    <div className="form-group">
                      <label>Voto / Lode</label>
                      <input type="text" placeholder="es. 110/110 con lode" value={edu.grade} onChange={e => updateEdu(edu.id, 'grade', e.target.value)} />
                    </div>
                  </div>
                  <div className="form-row">
                    <div className="form-group" style={{ marginBottom: 0 }}>
                      <label>Anno inizio</label>
                      <input type="text" placeholder="2014" value={edu.from} onChange={e => updateEdu(edu.id, 'from', e.target.value)} />
                    </div>
                    <div className="form-group" style={{ marginBottom: 0 }}>
                      <label>Anno fine</label>
                      <input type="text" placeholder="2016" value={edu.to} onChange={e => updateEdu(edu.id, 'to', e.target.value)} />
                    </div>
                  </div>
                </div>
              ))}
              <button className="btn btn-ghost btn-sm" style={{ width: '100%', marginTop: 8 }}>
                + Aggiungi titolo
              </button>
            </div>
            <div style={{ marginTop: 24 }}>
              <button className="btn btn-gold btn-lg" style={{ width: '100%' }} onClick={() => setActiveTab(3)}>
                Continua → Competenze
              </button>
            </div>
          </div>
        )}

        {/* TAB 3: COMPETENZE */}
        {activeTab === 3 && (
          <div className="fade-in">
            <div className="form-section">
              <h3>⚡ Competenze</h3>
              <div className="subtitle">Aggiungi le tue competenze tecniche e trasversali</div>
              <div className="form-group">
                <label>Competenze tecniche</label>
                <div className="skills-container">
                  {cvData.skills.map(skill => (
                    <div key={skill} className="skill-tag">
                      {skill}
                      <button onClick={() => removeSkill(skill)}>×</button>
                    </div>
                  ))}
                </div>
                <div className="skill-input-row">
                  <input
                    type="text"
                    placeholder="Aggiungi competenza..."
                    value={newSkill}
                    onChange={e => setNewSkill(e.target.value)}
                    onKeyDown={e => { if (e.key === 'Enter') addSkill(); }}
                    style={{ padding: '10px 14px', border: '1.5px solid var(--gray100)', borderRadius: 'var(--radius)', fontFamily: 'inherit', fontSize: 14, color: 'var(--navy)', outline: 'none' }}
                  />
                  <button className="btn btn-ghost btn-sm" onClick={addSkill}>Aggiungi</button>
                </div>
              </div>

              <div className="form-group" style={{ marginTop: 16 }}>
                <label>Lingue</label>
                {cvData.languages.map(lang => (
                  <div key={lang.id} className="exp-block">
                    <div className="form-row">
                      <div className="form-group" style={{ marginBottom: 0 }}>
                        <label>Lingua</label>
                        <input type="text" placeholder="es. Inglese" value={lang.name} onChange={e => {
                          onCVChange({ ...cvData, languages: cvData.languages.map(l => l.id === lang.id ? { ...l, name: e.target.value } : l) });
                        }} />
                      </div>
                      <div className="form-group" style={{ marginBottom: 0 }}>
                        <label>Livello</label>
                        <select value={lang.level} onChange={e => {
                          onCVChange({ ...cvData, languages: cvData.languages.map(l => l.id === lang.id ? { ...l, level: e.target.value } : l) });
                        }}>
                          <option>C2 - Madrelingua</option>
                          <option>C1 - Avanzato</option>
                          <option>B2 - Intermedio superiore</option>
                          <option>B1 - Intermedio</option>
                          <option>A2 - Base</option>
                        </select>
                      </div>
                    </div>
                  </div>
                ))}
                <button className="btn btn-ghost btn-sm" style={{ marginTop: 8 }} onClick={() => {
                  onCVChange({ ...cvData, languages: [...cvData.languages, { id: Date.now().toString(), name: '', level: 'B1 - Intermedio' }] });
                }}>
                  + Aggiungi lingua
                </button>
              </div>

              <div style={{ marginTop: 20 }}>
                <button className="ai-btn" onClick={handleSuggestSkills}>
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} style={{ width: 14, height: 14 }}>
                    <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2z" />
                  </svg>
                  Suggerisci competenze per il mio ruolo
                </button>
              </div>
            </div>
            <div style={{ marginTop: 24 }}>
              <button className="btn btn-gold btn-lg" style={{ width: '100%' }} onClick={handleDownload} disabled={downloading}>
                {downloading ? '⏳ Generando PDF...' : '⬇ Scarica il tuo CV in PDF →'}
              </button>
            </div>
          </div>
        )}
      </div>

      {/* RIGHT: PREVIEW */}
      <div className="split-right">
        <div className="ats-meter">
          <div className="ats-header">
            <span>🎯 ATS Score</span>
            <span className="ats-score">{atsScore}/100</span>
          </div>
          <div className="ats-bar">
            <div className="ats-fill" style={{ width: `${atsScore}%` }} />
          </div>
          <div className="ats-tips">
            <div className="ats-tip">✅ Formato leggibile dai sistemi ATS</div>
            <div className="ats-tip">✅ Parole chiave rilevanti presenti</div>
            <div className="ats-tip" style={{ color: 'var(--gold)' }}>⚠️ Aggiungi più risultati quantitativi</div>
          </div>
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <span style={{ fontSize: 13, fontWeight: 600 }}>Anteprima CV</span>
          <div style={{ display: 'flex', gap: 8 }}>
            <button className="btn btn-ghost btn-sm" onClick={() => onNavigate('builder-step1')}>🎨 Cambia</button>
            <button className="btn btn-gold btn-sm" onClick={handleDownload} disabled={downloading}>{downloading ? '⏳ Generando...' : '⬇ Scarica PDF'}</button>
          </div>
        </div>

        <div className="cv-preview-panel">
          <div className={templateClass}>
            <div className="cv-header">
              <div className="cv-name">{name}</div>
              <div className="cv-title">{cvData.title || 'Titolo professionale'}</div>
              <div className="cv-contact">
                {cvData.email && <span>{cvData.email}</span>}
                {cvData.phone && <span>{cvData.phone}</span>}
                {cvData.city && <span>{cvData.city}</span>}
                {cvData.linkedin && <span>{cvData.linkedin}</span>}
              </div>
            </div>

            {cvData.summary && (
              <>
                <div className="cv-section-title">Profilo professionale</div>
                <div className="cv-exp-desc">{cvData.summary}</div>
              </>
            )}

            {cvData.experiences.some(e => e.company || e.role) && (
              <>
                <div className="cv-section-title">Esperienze lavorative</div>
                {cvData.experiences.filter(e => e.company || e.role).map(exp => (
                  <div key={exp.id} className="cv-exp-item">
                    <div className="cv-exp-title">{exp.role}</div>
                    <div className="cv-exp-meta">
                      {[exp.company, exp.city, exp.from && exp.to ? `${exp.from} – ${exp.to}` : exp.from || exp.to].filter(Boolean).join(' · ')}
                    </div>
                    {exp.desc && <div className="cv-exp-desc">{exp.desc}</div>}
                  </div>
                ))}
              </>
            )}

            {cvData.education.some(e => e.institution || e.degree) && (
              <>
                <div className="cv-section-title">Formazione</div>
                {cvData.education.filter(e => e.institution || e.degree).map(edu => (
                  <div key={edu.id} className="cv-exp-item">
                    <div className="cv-exp-title">{edu.degree}</div>
                    <div className="cv-exp-meta">
                      {[edu.institution, edu.from && edu.to ? `${edu.from} – ${edu.to}` : edu.from || edu.to, edu.grade].filter(Boolean).join(' · ')}
                    </div>
                  </div>
                ))}
              </>
            )}

            {cvData.skills.length > 0 && (
              <>
                <div className="cv-section-title">Competenze</div>
                <div className="cv-exp-desc">{skillsText}</div>
              </>
            )}

            {cvData.languages.some(l => l.name) && (
              <>
                <div className="cv-section-title">Lingue</div>
                <div className="cv-exp-desc">
                  {cvData.languages.filter(l => l.name).map(l => `${l.name} (${l.level})`).join(' · ')}
                </div>
              </>
            )}

            <div className="cv-watermark">
              <div className="cv-watermark-logo">P</div>
              ProntoCurriculum.it
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
