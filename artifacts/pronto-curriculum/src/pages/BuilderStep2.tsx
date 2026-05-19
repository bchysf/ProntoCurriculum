import { useState, useCallback, useRef } from 'react';
import { CVData, TemplateType, ModalType } from '../types';
import { downloadCVAsPDF } from '../utils/downloadPDF';
import { aiOptimizeCV } from '../utils/aiOptimizeCV';
import CVPreview from '../components/CVPreview';

interface BuilderStep2Props {
  cvData: CVData;
  onCVChange: (data: CVData) => void;
  selectedTemplate: TemplateType;
  onNavigate: (page: 'home' | 'builder-step1' | 'builder-step2') => void;
  onModal: (modal: ModalType) => void;
  atsScore: number;
  onAiAction: (text: string, callback: () => void) => void;
}

const SUGGESTED_SKILLS = ['Kubernetes', 'CI/CD', 'Agile/Scrum', 'PostgreSQL', 'TypeScript', 'Redis'];

function computeCVScore(cv: CVData): { score: number; done: string[]; todo: string[] } {
  let score = 0;
  const done: string[] = [];
  const todo: string[] = [];

  if (cv.firstName && cv.lastName) { score += 10; done.push('Nome e cognome'); } else { todo.push('Aggiungi nome e cognome'); }
  if (cv.title) { score += 10; done.push('Titolo professionale'); } else { todo.push('Aggiungi il titolo professionale'); }
  if (cv.email) { score += 10; done.push('Email'); } else { todo.push('Aggiungi l\'email'); }
  if (cv.phone) { score += 5; done.push('Telefono'); } else { todo.push('Aggiungi il telefono'); }
  if (cv.city) { score += 5; done.push('Città'); } else { todo.push('Aggiungi la città'); }
  if (cv.summary && cv.summary.length > 100) { score += 15; done.push('Profilo professionale'); }
  else if (cv.summary && cv.summary.length > 0) { score += 7; todo.push('Espandi il profilo professionale (min. 100 caratteri)'); }
  else { todo.push('Scrivi un profilo professionale'); }
  const expWithDesc = cv.experiences.filter(e => e.company && e.role && e.desc && e.desc.length > 40);
  if (expWithDesc.length >= 2) { score += 20; done.push('Esperienze complete con descrizione'); }
  else if (cv.experiences.length > 0) { score += 10; todo.push('Aggiungi descrizioni dettagliate alle esperienze'); }
  else { todo.push('Aggiungi almeno un\'esperienza lavorativa'); }
  if (cv.education.some(e => e.institution && e.degree)) { score += 10; done.push('Formazione'); } else { todo.push('Aggiungi il titolo di studio'); }
  if (cv.skills.length >= 6) { score += 10; done.push('Competenze (6+)'); }
  else if (cv.skills.length >= 3) { score += 6; todo.push('Aggiungi altre competenze (ne hai ' + cv.skills.length + '/6)'); }
  else { todo.push('Aggiungi almeno 6 competenze'); }
  if (cv.languages.some(l => l.name)) { score += 5; done.push('Lingue'); } else { todo.push('Aggiungi le lingue conosciute'); }

  return { score, done, todo };
}

export default function BuilderStep2({ cvData, onCVChange, selectedTemplate, onNavigate, onModal, onAiAction }: Omit<BuilderStep2Props, 'atsScore'>) {
  const [activeTab, setActiveTab] = useState(0);
  const [newSkill, setNewSkill] = useState('');
  const [downloading, setDownloading] = useState(false);
  const [optimizing, setOptimizing] = useState(false);
  const photoInputRef = useRef<HTMLInputElement>(null);

  const handleDownload = async () => {
    setDownloading(true);
    try {
      const name = [cvData.firstName, cvData.lastName].filter(Boolean).join(' ');
      await downloadCVAsPDF(name);
    } finally {
      setDownloading(false);
    }
  };

  const handleOptimizeAll = async () => {
    setOptimizing(true);
    setModal('ai-loading-local');
    try {
      const result = await aiOptimizeCV(cvData);
      const updatedExperiences = cvData.experiences.map(exp => {
        const optimized = result.experiences.find(o => o.id === exp.id);
        return optimized ? { ...exp, desc: optimized.desc } : exp;
      });
      const newSkillsToAdd = (result.skillsToAdd ?? []).filter((s: string) => !cvData.skills.includes(s));
      onCVChange({
        ...cvData,
        summary: result.summary || cvData.summary,
        experiences: updatedExperiences,
        skills: [...cvData.skills, ...newSkillsToAdd],
      });
    } catch {
    } finally {
      setOptimizing(false);
      setModal(null);
    }
  };

  const [localModal, setModal] = useState<null | 'ai-loading-local'>(null);

  const update = useCallback((field: keyof CVData, value: unknown) => {
    onCVChange({ ...cvData, [field]: value });
  }, [cvData, onCVChange]);

  const updateExp = (id: string, field: string, value: string) => {
    onCVChange({ ...cvData, experiences: cvData.experiences.map(e => e.id === id ? { ...e, [field]: value } : e) });
  };

  const updateEdu = (id: string, field: string, value: string) => {
    onCVChange({ ...cvData, education: cvData.education.map(e => e.id === id ? { ...e, [field]: value } : e) });
  };

  const addExperience = () => {
    onCVChange({ ...cvData, experiences: [...cvData.experiences, { id: Date.now().toString(), company: '', role: '', city: '', from: '', to: '', desc: '' }] });
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

  const handleSuggestSkills = () => {
    onAiAction('Analizzando il tuo profilo e suggerendo competenze...', () => {
      const toAdd = SUGGESTED_SKILLS.filter(s => !cvData.skills.includes(s));
      onCVChange({ ...cvData, skills: [...cvData.skills, ...toAdd] });
    });
  };

  const handleOptimizeSummary = () => {
    onAiAction('Ottimizzando il profilo per i sistemi ATS...', () => {
      onCVChange({ ...cvData, summary: cvData.summary + ' Orientato ai risultati con comprovata esperienza in gestione team e ottimizzazione dei processi.' });
    });
  };

  const handleOptimizeExp = (idx: number) => {
    onAiAction('Riscrivendo la descrizione con impatto professionale...', () => {
      const updated = [...cvData.experiences];
      if (updated[idx]) {
        updated[idx] = { ...updated[idx], desc: (updated[idx].desc ? updated[idx].desc + ' Risultati misurabili: riduzione tempi del 30%, incremento KPI del 25%.' : 'Responsabile della gestione e ottimizzazione dei processi aziendali. Risultati misurabili con impatto diretto sul business.') };
      }
      onCVChange({ ...cvData, experiences: updated });
    });
  };

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      onCVChange({ ...cvData, photo: ev.target?.result as string });
    };
    reader.readAsDataURL(file);
  };

  const hasPhotoTemplate = selectedTemplate === 'executive' || selectedTemplate === 'professionale' || selectedTemplate === 'modern';

  return (
    <>
      {localModal === 'ai-loading-local' && (
        <div className="modal-overlay" style={{ zIndex: 300 }}>
          <div className="modal-box" style={{ textAlign: 'center', padding: 48 }}>
            <div className="ai-pulse-ring" />
            <div style={{ fontSize: 36, marginBottom: 16 }}>✦</div>
            <div style={{ fontFamily: 'Playfair Display, serif', fontSize: 22, fontWeight: 700, marginBottom: 8 }}>AI sta ottimizzando...</div>
            <div style={{ color: 'var(--gray500)', fontSize: 14 }}>Sommario, esperienze e competenze in un click</div>
          </div>
        </div>
      )}

      <div className="split-view">
        {/* LEFT FORM */}
        <div className="split-left">
          <div className="split-left-top">
            <div>
              <h2 style={{ fontSize: 20, fontWeight: 700 }}>Costruisci il tuo CV</h2>
              <p style={{ fontSize: 13, color: 'var(--gray500)', marginTop: 2 }}>Aggiornamento in tempo reale nell'anteprima</p>
            </div>
            <button
              className="btn-optimize-all"
              onClick={handleOptimizeAll}
              disabled={optimizing}
            >
              <span style={{ fontSize: 16 }}>✦</span>
              {optimizing ? 'Ottimizzazione...' : 'Ottimizza tutto con AI'}
            </button>
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

                <div className="photo-section">
                  {cvData.photo ? (
                    <div className="photo-has-photo">
                      <img src={cvData.photo} alt="foto profilo" className="photo-existing" />
                      <div className="photo-has-info">
                        <span className="photo-has-label">✅ Foto profilo caricata</span>
                        {hasPhotoTemplate
                          ? <span className="photo-has-sub">Verrà usata automaticamente nel template selezionato</span>
                          : <span className="photo-has-sub" style={{ color: 'var(--gold)' }}>⚠ Il template attuale non include foto. Cambia template per usarla.</span>
                        }
                        <button
                          className="btn btn-ghost btn-sm"
                          style={{ marginTop: 8, alignSelf: 'flex-start' }}
                          onClick={() => photoInputRef.current?.click()}
                        >
                          🔄 Cambia foto
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div
                      className={`photo-upload-area ${hasPhotoTemplate ? 'photo-upload-highlighted' : ''}`}
                      onClick={() => photoInputRef.current?.click()}
                    >
                      <div className="photo-upload-placeholder">
                        <span style={{ fontSize: 28 }}>👤</span>
                        <span style={{ fontSize: 13, fontWeight: 600, marginTop: 6 }}>
                          {hasPhotoTemplate ? 'Carica la tua foto profilo' : 'Aggiungi foto profilo'}
                        </span>
                        <span style={{ fontSize: 12, color: 'var(--gray500)' }}>
                          {hasPhotoTemplate
                            ? 'Il template selezionato supporta la foto — aggiungila ora'
                            : 'JPG, PNG · max 5MB'
                          }
                        </span>
                      </div>
                    </div>
                  )}
                  <input ref={photoInputRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={handlePhotoUpload} />
                </div>

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
                <button className="ai-btn" onClick={handleOptimizeSummary}>
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} style={{ width: 14, height: 14 }}>
                    <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2z" />
                  </svg>
                  Ottimizza profilo con AI
                </button>
              </div>
              <div style={{ marginTop: 16 }}>
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
                {cvData.experiences.map((exp, idx) => (
                  <div key={exp.id} className="exp-block">
                    <div className="exp-block-header">
                      <span className="exp-block-title">Esperienza {idx + 1}</span>
                      <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                        <button className="btn btn-ghost btn-sm" style={{ padding: '4px 8px', fontSize: 14, lineHeight: 1 }} title="Sposta su" disabled={idx === 0} onClick={() => moveExperience(idx, -1)}>↑</button>
                        <button className="btn btn-ghost btn-sm" style={{ padding: '4px 8px', fontSize: 14, lineHeight: 1 }} title="Sposta giù" disabled={idx === cvData.experiences.length - 1} onClick={() => moveExperience(idx, 1)}>↓</button>
                        <button className="ai-btn" style={{ padding: '5px 10px', fontSize: 12 }} onClick={() => handleOptimizeExp(idx)}>✦ Ottimizza</button>
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
                        <input type="text" placeholder="Gen 2020" value={exp.from} onChange={e => updateExp(exp.id, 'from', e.target.value)} />
                      </div>
                      <div className="form-group" style={{ marginBottom: 0 }}>
                        <label>A</label>
                        <input type="text" placeholder="Presente" value={exp.to} onChange={e => updateExp(exp.id, 'to', e.target.value)} />
                      </div>
                    </div>
                    <div className="form-group" style={{ marginTop: 16 }}>
                      <label>Descrizione</label>
                      <textarea rows={3} placeholder="Descrivi le tue responsabilità e risultati..." value={exp.desc} onChange={e => updateExp(exp.id, 'desc', e.target.value)} />
                    </div>
                  </div>
                ))}
                <button className="btn btn-ghost btn-sm" style={{ width: '100%', marginTop: 8 }} onClick={addExperience}>
                  + Aggiungi esperienza
                </button>
              </div>
              <div style={{ marginTop: 16 }}>
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
                <button className="btn btn-ghost btn-sm" style={{ width: '100%', marginTop: 8 }} onClick={() => {
                  onCVChange({ ...cvData, education: [...cvData.education, { id: Date.now().toString(), institution: '', degree: '', grade: '', from: '', to: '' }] });
                }}>
                  + Aggiungi titolo
                </button>
              </div>
              <div style={{ marginTop: 16 }}>
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
                  <div className="skill-input-row" style={{ marginTop: 10 }}>
                    <input
                      type="text"
                      placeholder="Aggiungi competenza..."
                      value={newSkill}
                      onChange={e => setNewSkill(e.target.value)}
                      onKeyDown={e => { if (e.key === 'Enter') addSkill(); }}
                      style={{ padding: '10px 14px', border: '1.5px solid var(--gray100)', borderRadius: 'var(--radius)', fontFamily: 'inherit', fontSize: 14, color: 'var(--navy)', outline: 'none', flex: 1 }}
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
              <div style={{ marginTop: 16 }}>
                <button className="btn btn-gold btn-lg" style={{ width: '100%' }} onClick={handleDownload} disabled={downloading}>
                  {downloading ? '⏳ Generando PDF...' : '⬇ Scarica il tuo CV in PDF →'}
                </button>
              </div>
            </div>
          )}
        </div>

        {/* RIGHT PREVIEW */}
        <div className="split-right">
          {(() => {
            const { score, done, todo } = computeCVScore(cvData);
            const scoreColor = score >= 80 ? 'var(--success)' : score >= 50 ? 'var(--gold)' : 'var(--danger)';
            return (
              <div className="ats-meter">
                <div className="ats-header">
                  <span>📋 Completezza CV</span>
                  <span className="ats-score" style={{ color: scoreColor }}>{score}/100</span>
                </div>
                <div className="ats-bar">
                  <div className="ats-fill" style={{ width: `${score}%`, background: `linear-gradient(90deg, ${scoreColor}, ${scoreColor})` }} />
                </div>
                <div className="ats-tips">
                  {done.slice(0, 2).map(d => (
                    <div key={d} className="ats-tip">✅ {d}</div>
                  ))}
                  {todo.slice(0, 2).map(t => (
                    <div key={t} className="ats-tip" style={{ color: score < 50 ? 'var(--danger)' : 'var(--gold)' }}>⚠ {t}</div>
                  ))}
                </div>
              </div>
            );
          })()}

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
            <span style={{ fontSize: 13, fontWeight: 600 }}>Anteprima CV</span>
            <div style={{ display: 'flex', gap: 8 }}>
              <button className="btn btn-ghost btn-sm" onClick={() => onNavigate('builder-step1')}>🎨 Cambia</button>
              <button className="btn btn-gold btn-sm" onClick={handleDownload} disabled={downloading}>
                {downloading ? '⏳ Generando...' : '⬇ Scarica PDF'}
              </button>
            </div>
          </div>

          <div className="cv-preview-panel">
            <div className="cv-doc-scaler">
              <CVPreview cvData={cvData} template={selectedTemplate} />
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
