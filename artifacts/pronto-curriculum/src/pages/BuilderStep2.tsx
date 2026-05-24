import { useState, useCallback, useRef, useEffect } from 'react';
import { CVData, TemplateType, ModalType } from '../types';
import { downloadCVAsPDF } from '../utils/downloadPDF';
import { aiOptimizeCV } from '../utils/aiOptimizeCV';
import { aiOptimizeSummary, aiOptimizeExp } from '../utils/aiOptimizeField';
import CVPreview from '../components/CVPreview';

interface BuilderStep2Props {
  cvData: CVData;
  onCVChange: (data: CVData) => void;
  selectedTemplate: TemplateType;
  onNavigate: (page: 'home' | 'builder-step1' | 'builder-step2') => void;
  onModal: (modal: ModalType) => void;
  onAiAction: (text: string, callback: () => void) => void;
}

const SUGGESTED_SKILLS = ['Kubernetes', 'CI/CD', 'Agile/Scrum', 'PostgreSQL', 'TypeScript', 'Redis'];

function computeCVScore(cv: CVData): { score: number; done: string[]; todo: string[] } {
  let score = 0;
  const done: string[] = [];
  const todo: string[] = [];

  if (cv.firstName && cv.lastName) { score += 10; done.push('Nome e cognome'); } else { todo.push('Aggiungi nome e cognome'); }
  if (cv.title) { score += 10; done.push('Titolo professionale'); } else { todo.push('Aggiungi il titolo professionale'); }
  if (cv.email) { score += 10; done.push('Email'); } else { todo.push("Aggiungi l'email"); }
  if (cv.phone) { score += 5; done.push('Telefono'); } else { todo.push('Aggiungi il telefono'); }
  if (cv.city) { score += 5; done.push('Città'); } else { todo.push('Aggiungi la città'); }
  if (cv.summary && cv.summary.length > 100) { score += 15; done.push('Profilo professionale'); }
  else if (cv.summary && cv.summary.length > 0) { score += 7; todo.push('Espandi il profilo professionale (min. 100 caratteri)'); }
  else { todo.push('Scrivi un profilo professionale'); }
  const expWithDesc = cv.experiences.filter(e => e.company && e.role && e.desc && e.desc.length > 40);
  if (expWithDesc.length >= 2) { score += 20; done.push('Esperienze complete con descrizione'); }
  else if (cv.experiences.length > 0) { score += 10; todo.push('Aggiungi descrizioni dettagliate alle esperienze'); }
  else { todo.push("Aggiungi almeno un'esperienza lavorativa"); }
  if (cv.education.some(e => e.institution && e.degree)) { score += 10; done.push('Formazione'); } else { todo.push('Aggiungi il titolo di studio'); }
  if (cv.skills.length >= 6) { score += 10; done.push('Competenze (6+)'); }
  else if (cv.skills.length >= 3) { score += 6; todo.push('Aggiungi altre competenze (ne hai ' + cv.skills.length + '/6)'); }
  else { todo.push('Aggiungi almeno 6 competenze'); }
  if (cv.languages.some(l => l.name)) { score += 5; done.push('Lingue'); } else { todo.push('Aggiungi le lingue conosciute'); }

  return { score, done, todo };
}

function AccordionSection({
  title, open, onToggle, children,
}: {
  title: string; open: boolean; onToggle: () => void; children: React.ReactNode;
}) {
  return (
    <div className="accordion-section">
      <button className={`accordion-trigger${open ? ' open' : ''}`} onClick={onToggle}>
        <span>{title}</span>
        <span className="accordion-chevron">{open ? '▲' : '▼'}</span>
      </button>
      {open && <div className="accordion-content fade-in">{children}</div>}
    </div>
  );
}

export default function BuilderStep2({ cvData, onCVChange, selectedTemplate, onNavigate, onAiAction }: Omit<BuilderStep2Props, 'atsScore'>) {
  const [openSections, setOpenSections] = useState<Set<string>>(new Set(['personal']));
  const [newSkill, setNewSkill] = useState('');
  const [downloading, setDownloading] = useState(false);
  const [optimizing, setOptimizing] = useState(false);
  const [localModal, setModal] = useState<null | 'ai-loading-local'>(null);
  const photoInputRef = useRef<HTMLInputElement>(null);

  const [sidebarWidth, setSidebarWidth] = useState(420);
  const isResizing = useRef(false);
  const startX = useRef(0);
  const startW = useRef(0);

  const previewRef = useRef<HTMLDivElement>(null);
  const [cvScale, setCvScale] = useState(0.9);

  const toggleSection = (key: string) => {
    setOpenSections(prev => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key); else next.add(key);
      return next;
    });
  };

  const handleResizeStart = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    isResizing.current = true;
    startX.current = e.clientX;
    startW.current = sidebarWidth;
  }, [sidebarWidth]);

  useEffect(() => {
    const onMove = (e: MouseEvent) => {
      if (!isResizing.current) return;
      const delta = e.clientX - startX.current;
      setSidebarWidth(Math.min(600, Math.max(320, startW.current + delta)));
    };
    const onUp = () => { isResizing.current = false; };
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
    return () => {
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup', onUp);
    };
  }, []);

  useEffect(() => {
    const el = previewRef.current;
    if (!el) return;
    const update = () => {
      const w = el.clientWidth;
      const margin = 80;
      const scale = Math.max(0.3, (w - margin) / 595);
      setCvScale(scale);
    };
    const obs = new ResizeObserver(update);
    obs.observe(el);
    update();
    return () => obs.disconnect();
  }, []);

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
        const optimized = result.experiences.find((o: { id: string }) => o.id === exp.id);
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

  const handleOptimizeSummary = async () => {
    setOptimizing(true);
    setModal('ai-loading-local');
    try {
      const result = await aiOptimizeSummary(cvData);
      onCVChange({ ...cvData, summary: result });
    } catch {
    } finally {
      setOptimizing(false);
      setModal(null);
    }
  };

  const handleOptimizeExp = async (idx: number) => {
    const exp = cvData.experiences[idx];
    if (!exp) return;
    setOptimizing(true);
    setModal('ai-loading-local');
    try {
      const result = await aiOptimizeExp({ id: exp.id, role: exp.role, company: exp.company, desc: exp.desc });
      const updated = [...cvData.experiences];
      updated[idx] = { ...updated[idx], desc: result };
      onCVChange({ ...cvData, experiences: updated });
    } catch {
    } finally {
      setOptimizing(false);
      setModal(null);
    }
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

  const { score, done, todo } = computeCVScore(cvData);
  const scoreColor = score >= 80 ? 'var(--success)' : score >= 50 ? 'var(--gold)' : 'var(--danger)';

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

      <div className="editor-layout">
        {/* ── SIDEBAR ── */}
        <aside className="editor-sidebar" style={{ width: sidebarWidth }}>
          <div className="sidebar-header">
            <div>
              <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--navy)' }}>Costruisci il tuo CV</div>
              <div style={{ fontSize: 11, color: 'var(--gray500)', marginTop: 2 }}>Anteprima live in tempo reale</div>
            </div>
            <button className="btn-optimize-all" onClick={handleOptimizeAll} disabled={optimizing}>
              <span>✦</span>
              {optimizing ? 'Ottimizzazione...' : 'AI ottimizza'}
            </button>
          </div>

          <div className="sidebar-scroll">
            {/* DATI PERSONALI */}
            <AccordionSection title="📋 Dati personali" open={openSections.has('personal')} onToggle={() => toggleSection('personal')}>
              <div className="photo-section">
                {cvData.photo ? (
                  <div className="photo-has-photo">
                    <img src={cvData.photo} alt="foto profilo" className="photo-existing" />
                    <div className="photo-has-info">
                      <span className="photo-has-label">✅ Foto profilo caricata</span>
                      {hasPhotoTemplate
                        ? <span className="photo-has-sub">Verrà usata nel template selezionato</span>
                        : <span className="photo-has-sub" style={{ color: 'var(--gold)' }}>⚠ Il template attuale non include foto</span>
                      }
                      <div style={{ display: 'flex', gap: 8, marginTop: 6 }}>
                        <button className="btn btn-ghost btn-sm" onClick={() => photoInputRef.current?.click()}>
                          🔄 Cambia foto
                        </button>
                        <button className="btn btn-ghost btn-sm" style={{ color: 'var(--danger)' }} onClick={() => update('photo', undefined)}>
                          🗑 Elimina
                        </button>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className={`photo-upload-area ${hasPhotoTemplate ? 'photo-upload-highlighted' : ''}`} onClick={() => photoInputRef.current?.click()}>
                    <div className="photo-upload-placeholder">
                      <span style={{ fontSize: 24 }}>👤</span>
                      <span style={{ fontSize: 13, fontWeight: 600, marginTop: 4 }}>
                        {hasPhotoTemplate ? 'Carica foto profilo' : 'Aggiungi foto profilo'}
                      </span>
                      <span style={{ fontSize: 11, color: 'var(--gray500)' }}>JPG, PNG · max 5MB</span>
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
                <textarea rows={4} placeholder="Breve descrizione professionale..." value={cvData.summary} onChange={e => update('summary', e.target.value)} />
                <div className="form-hint">L'AI ottimizzerà questo testo per i sistemi ATS</div>
              </div>
              <button className="ai-btn" onClick={handleOptimizeSummary}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} style={{ width: 13, height: 13 }}>
                  <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2z" />
                </svg>
                Ottimizza profilo con AI
              </button>
            </AccordionSection>

            {/* ESPERIENZE */}
            <AccordionSection title="💼 Esperienze lavorative" open={openSections.has('experiences')} onToggle={() => toggleSection('experiences')}>
              {cvData.experiences.map((exp, idx) => (
                <div key={exp.id} className="exp-block">
                  <div className="exp-block-header">
                    <span className="exp-block-title">Esperienza {idx + 1}</span>
                    <div style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
                      <button className="btn btn-ghost btn-sm" style={{ padding: '3px 7px', fontSize: 13 }} title="Sposta su" disabled={idx === 0} onClick={() => moveExperience(idx, -1)}>↑</button>
                      <button className="btn btn-ghost btn-sm" style={{ padding: '3px 7px', fontSize: 13 }} title="Sposta giù" disabled={idx === cvData.experiences.length - 1} onClick={() => moveExperience(idx, 1)}>↓</button>
                      <button className="ai-btn" style={{ padding: '4px 9px', fontSize: 11 }} onClick={() => handleOptimizeExp(idx)}>✦ AI</button>
                      <button className="btn btn-danger btn-sm" onClick={() => removeExperience(exp.id)}>×</button>
                    </div>
                  </div>
                  <div className="form-group">
                    <label>Azienda *</label>
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
                  <div className="form-row" style={{ marginTop: 12 }}>
                    <div className="form-group" style={{ marginBottom: 0 }}>
                      <label>Da</label>
                      <input type="text" placeholder="Gen 2020" value={exp.from} onChange={e => updateExp(exp.id, 'from', e.target.value)} />
                    </div>
                    <div className="form-group" style={{ marginBottom: 0 }}>
                      <label>A</label>
                      <input type="text" placeholder="Presente" value={exp.to} onChange={e => updateExp(exp.id, 'to', e.target.value)} />
                    </div>
                  </div>
                  <div className="form-group" style={{ marginTop: 12 }}>
                    <label>Descrizione</label>
                    <textarea rows={3} placeholder="Descrivi le tue responsabilità e risultati..." value={exp.desc} onChange={e => updateExp(exp.id, 'desc', e.target.value)} />
                  </div>
                </div>
              ))}
              <button className="btn btn-ghost btn-sm" style={{ width: '100%', marginTop: 4 }} onClick={addExperience}>
                + Aggiungi esperienza
              </button>
            </AccordionSection>

            {/* FORMAZIONE */}
            <AccordionSection title="🎓 Formazione" open={openSections.has('education')} onToggle={() => toggleSection('education')}>
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
              <button className="btn btn-ghost btn-sm" style={{ width: '100%', marginTop: 4 }} onClick={() => {
                onCVChange({ ...cvData, education: [...cvData.education, { id: Date.now().toString(), institution: '', degree: '', grade: '', from: '', to: '' }] });
              }}>
                + Aggiungi titolo
              </button>
            </AccordionSection>

            {/* COMPETENZE */}
            <AccordionSection title="⚡ Competenze" open={openSections.has('skills')} onToggle={() => toggleSection('skills')}>
              <div className="form-group">
                <label>Competenze tecniche e trasversali</label>
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
                    style={{ padding: '9px 12px', border: '1.5px solid var(--gray100)', borderRadius: 'var(--radius)', fontFamily: 'inherit', fontSize: 13, color: 'var(--navy)', outline: 'none', flex: 1 }}
                  />
                  <button className="btn btn-ghost btn-sm" onClick={addSkill}>Aggiungi</button>
                </div>
              </div>
              <button className="ai-btn" style={{ marginTop: 4 }} onClick={handleSuggestSkills}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} style={{ width: 13, height: 13 }}>
                  <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2z" />
                </svg>
                Suggerisci competenze con AI
              </button>
            </AccordionSection>

            {/* LINGUE */}
            <AccordionSection title="🌐 Lingue" open={openSections.has('languages')} onToggle={() => toggleSection('languages')}>
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
              <button className="btn btn-ghost btn-sm" style={{ marginTop: 4 }} onClick={() => {
                onCVChange({ ...cvData, languages: [...cvData.languages, { id: Date.now().toString(), name: '', level: 'B1 - Intermedio' }] });
              }}>
                + Aggiungi lingua
              </button>
            </AccordionSection>
          </div>

          <div className="sidebar-footer">
            <button className="btn btn-gold btn-lg" style={{ width: '100%' }} onClick={handleDownload} disabled={downloading}>
              {downloading ? '⏳ Generando PDF...' : '⬇ Scarica il tuo CV in PDF →'}
            </button>
          </div>
        </aside>

        {/* ── RESIZE HANDLE ── */}
        <div className="resize-handle" onMouseDown={handleResizeStart} />

        {/* ── PREVIEW ── */}
        <main className="editor-preview">
          <div className="preview-toolbar">
            <div className="preview-ats">
              <span style={{ fontSize: 11, color: 'var(--gray500)', fontWeight: 500 }}>Completezza CV</span>
              <div className="preview-ats-bar">
                <div className="preview-ats-fill" style={{ width: `${score}%`, background: scoreColor }} />
              </div>
              <span style={{ fontSize: 13, fontWeight: 700, color: scoreColor, minWidth: 44 }}>{score}/100</span>
              <div className="preview-ats-tips">
                {todo.slice(0, 1).map(t => (
                  <span key={t} style={{ fontSize: 11, color: 'var(--gray500)' }}>⚠ {t}</span>
                ))}
              </div>
            </div>
            <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
              <button className="btn btn-ghost btn-sm" onClick={() => onNavigate('builder-step1')}>
                🎨 Cambia template
              </button>
              <button className="btn btn-gold btn-sm" onClick={handleDownload} disabled={downloading}>
                {downloading ? '⏳ Generando...' : '⬇ Scarica PDF'}
              </button>
            </div>
          </div>

          <div className="preview-canvas" ref={previewRef}>
            <div className="cv-sheet" style={{ zoom: cvScale }}>
              <CVPreview cvData={cvData} template={selectedTemplate} />
            </div>
          </div>
        </main>
      </div>
    </>
  );
}
