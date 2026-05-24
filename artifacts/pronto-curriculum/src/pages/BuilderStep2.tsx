import { useState, useCallback, useRef, useEffect } from 'react';
import { CVData, TemplateType, ModalType } from '../types';
import { downloadCVAsPDF, previewCVAsPDF } from '../utils/downloadPDF';
import { aiOptimizeCV } from '../utils/aiOptimizeCV';
import { aiOptimizeSummary, aiOptimizeExp } from '../utils/aiOptimizeField';
import CVPreview from '../components/CVPreview';

interface BuilderStep2Props {
  cvData: CVData;
  onCVChange: (data: CVData) => void;
  selectedTemplate: TemplateType;
  onTemplateChange: (t: TemplateType) => void;
  onNavigate: (page: 'home' | 'builder-step1' | 'builder-step2') => void;
  onModal: (modal: ModalType) => void;
  onAiAction: (text: string, callback: () => void) => void;
}

const TEMPLATE_OPTIONS: { id: TemplateType; label: string; icon: string }[] = [
  { id: 'modern',        label: 'Moderno',        icon: '🟦' },
  { id: 'minimal',       label: 'Minimal',        icon: '⬜' },
  { id: 'professionale', label: 'Professionale',  icon: '🟥' },
  { id: 'executive',     label: 'Executive',      icon: '🟫' },
  { id: 'europass',      label: 'Europass',       icon: '🇪🇺' },
];

const SUGGESTED_SKILLS = ['Kubernetes', 'CI/CD', 'Agile/Scrum', 'PostgreSQL', 'TypeScript', 'Redis'];

const STOPWORDS = new Set(['il','la','lo','i','gli','le','un','una','uno','e','è','a','di','in','con','su','per','tra','fra','che','non','si','da','del','della','dello','dei','degli','delle','al','alla','allo','ai','agli','alle','nel','nella','nello','nei','negli','nelle','sul','sulla','sullo','sui','sugli','sulle','dal','dalla','dallo','dai','dagli','dalle','come','questo','questa','questi','queste','quello','quella','quelli','quelle','ma','o','se','anche','più','sono','ha','ho','hai','abbiamo','avete','hanno','essere','avere','fare','sono','era','the','of','and','to','is','it','you','that','he','was','for','on','are','with','as','at','be','by','this','an','or','but','from','have','not','they','which','will','has','we','our','their','been','were','each','she','do','how','him','his','her','them','then','its','my','these','would','about','up','out','if','who','than','so','your','can','into','could','after','other','new','some','any','time','two','way','what','more','very','when','where','there','all','no','just','able','all','also','been','come','did','does','doing','done','down','find','first','get','give','got','had','here','just','know','let','like','look','made','make','may','most','much','now','only','other','over','own','part','put','see','should','since','some','still','such','take','than','them','then','there','these','they','this','those','through','too','under','use','used','using','very','want','way','well','were','what','when','where','whether','which','while','who','why','will','with','within','without','would','yet']);

interface ATSResult {
  total: number;
  parsing: { score: number; max: number; issues: string[] };
  keywords: { score: number; max: number; matched: string[]; missing: string[]; hasJD: boolean; top10: string[] };
  chronometric: { score: number; max: number; details: string[] };
}

function computeATSScore(cv: CVData, jd: string): ATSResult {
  const allText = [
    cv.firstName, cv.lastName, cv.title, cv.summary,
    ...cv.experiences.map(e => `${e.company} ${e.role} ${e.desc}`),
    ...cv.education.map(e => `${e.institution} ${e.degree}`),
    cv.skills.join(' '),
  ].filter(Boolean).join(' ');

  // 1. Parsing Strutturale (max 30)
  let parsingScore = 30;
  const parsingIssues: string[] = [];
  const mergedMatches = allText.match(/[a-zA-ZÀ-ÿ]{22,}/g);
  if (mergedMatches && mergedMatches.length > 0) {
    parsingScore = Math.max(0, parsingScore - 15);
    parsingIssues.push(`${mergedMatches.length} parole attaccate rilevate`);
  }
  if (/[□■●►▶◆★☆]/.test(allText)) {
    parsingScore = Math.max(0, parsingScore - 10);
    parsingIssues.push('Caratteri speciali che compromettono il parsing');
  }
  if (parsingIssues.length === 0) parsingIssues.push('Struttura lineare, testo pulito ✓');

  // 2. Keyword Match (max 50)
  let keywordScore = 0;
  let matchedKeywords: string[] = [];
  let missingKeywords: string[] = [];
  let top10: string[] = [];
  const hasJD = jd.trim().length > 30;
  if (hasJD) {
    const jdWords = jd.toLowerCase().replace(/[^a-zA-ZÀ-ÿ\s]/g, ' ').split(/\s+/).filter(w => w.length > 3 && !STOPWORDS.has(w));
    const freq: Record<string, number> = {};
    jdWords.forEach(w => { freq[w] = (freq[w] || 0) + 1; });
    top10 = Object.entries(freq).sort((a, b) => b[1] - a[1]).slice(0, 10).map(([w]) => w);
    const cvLower = allText.toLowerCase();
    matchedKeywords = top10.filter(kw => cvLower.includes(kw));
    missingKeywords = top10.filter(kw => !cvLower.includes(kw));
    keywordScore = Math.round((matchedKeywords.length / Math.max(top10.length, 1)) * 50);
  }

  // 3. Rigore Cronologico e Metrico (max 20)
  let chronoScore = 0;
  const chronoDetails: string[] = [];
  const monthRegex = /\b(gen|feb|mar|apr|mag|giu|lug|ago|set|ott|nov|dic|gennaio|febbraio|marzo|aprile|maggio|giugno|luglio|agosto|settembre|ottobre|novembre|dicembre|jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)\b/i;
  const expsWithDates = cv.experiences.filter(e => e.from || e.to);
  if (expsWithDates.length > 0) {
    const withMonths = expsWithDates.filter(e => monthRegex.test(e.from) || monthRegex.test(e.to));
    if (withMonths.length === expsWithDates.length) {
      chronoScore += 10;
      chronoDetails.push('Date complete con mese e anno ✓');
    } else {
      chronoDetails.push(`${withMonths.length}/${expsWithDates.length} esperienze con mese nelle date (es. "Gen 2020")`);
    }
  } else {
    chronoDetails.push('Aggiungi date alle esperienze lavorative');
  }
  const expsWithDesc = cv.experiences.filter(e => e.desc && e.desc.trim().length > 0);
  if (expsWithDesc.length > 0) {
    const withMetrics = expsWithDesc.filter(e => /\d|%/.test(e.desc));
    const pct = withMetrics.length / expsWithDesc.length;
    if (pct >= 0.7) {
      chronoScore += 10;
      chronoDetails.push(`${Math.round(pct * 100)}% delle descrizioni con metriche quantificabili ✓`);
    } else {
      chronoDetails.push(`Solo ${Math.round(pct * 100)}% ha dati numerici (obiettivo: 70%+)`);
    }
  } else {
    chronoDetails.push('Aggiungi descrizioni con risultati numerici alle esperienze');
  }

  return {
    total: Math.min(100, parsingScore + keywordScore + chronoScore),
    parsing: { score: parsingScore, max: 30, issues: parsingIssues },
    keywords: { score: keywordScore, max: 50, matched: matchedKeywords, missing: missingKeywords, hasJD, top10 },
    chronometric: { score: chronoScore, max: 20, details: chronoDetails },
  };
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

export default function BuilderStep2({ cvData, onCVChange, selectedTemplate, onTemplateChange, onNavigate, onModal, onAiAction }: BuilderStep2Props) {
  const [openSections, setOpenSections] = useState<Set<string>>(new Set(['personal']));
  const [newSkill, setNewSkill] = useState('');
  const [downloading, setDownloading] = useState(false);
  const [previewing, setPreviewing] = useState(false);
  const [optimizing, setOptimizing] = useState(false);
  const [localModal, setModal] = useState<null | 'ai-loading-local'>(null);
  const photoInputRef = useRef<HTMLInputElement>(null);

  const [jobDescription, setJobDescription] = useState('');
  const [showATSDetails, setShowATSDetails] = useState(false);

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
      await downloadCVAsPDF(name, cvData, selectedTemplate);
    } finally {
      setDownloading(false);
    }
  };

  const handlePreview = async () => {
    setPreviewing(true);
    try {
      const name = [cvData.firstName, cvData.lastName].filter(Boolean).join(' ');
      await previewCVAsPDF(name, cvData, selectedTemplate);
    } finally {
      setPreviewing(false);
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

  const ats = computeATSScore(cvData, jobDescription);
  const atsColor = ats.total >= 80 ? 'var(--success)' : ats.total >= 50 ? 'var(--gold)' : 'var(--danger)';

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

            {/* ATS */}
            <AccordionSection title="🎯 Analisi ATS" open={openSections.has('ats')} onToggle={() => toggleSection('ats')}>
              <div style={{ fontSize: 12, color: 'var(--gray500)', marginBottom: 12, lineHeight: 1.5 }}>
                Incolla l'annuncio di lavoro per calcolare la compatibilità con i sistemi ATS e scoprire le keyword mancanti.
              </div>
              <div className="form-group">
                <label>Descrizione offerta di lavoro (Job Description)</label>
                <textarea
                  rows={5}
                  placeholder="Incolla qui il testo dell'annuncio di lavoro..."
                  value={jobDescription}
                  onChange={e => setJobDescription(e.target.value)}
                  style={{ fontSize: 12 }}
                />
              </div>
              {!ats.keywords.hasJD && (
                <div style={{ fontSize: 12, color: 'var(--gray500)', background: 'var(--gray50)', borderRadius: 8, padding: '10px 12px' }}>
                  ⚠ Senza job description il punteggio keyword è 0/50. Incolla l'annuncio per un'analisi completa.
                </div>
              )}
              {ats.keywords.hasJD && ats.keywords.missing.length > 0 && (
                <div style={{ marginTop: 8 }}>
                  <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--navy)', marginBottom: 6 }}>Keyword mancanti nel CV:</div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                    {ats.keywords.missing.map(kw => (
                      <span key={kw} style={{ fontSize: 11, background: '#FFF3F3', color: 'var(--danger)', border: '1px solid #FFCECE', borderRadius: 6, padding: '3px 8px' }}>{kw}</span>
                    ))}
                  </div>
                </div>
              )}
              {ats.keywords.hasJD && ats.keywords.matched.length > 0 && (
                <div style={{ marginTop: 8 }}>
                  <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--navy)', marginBottom: 6 }}>Keyword presenti nel CV:</div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                    {ats.keywords.matched.map(kw => (
                      <span key={kw} style={{ fontSize: 11, background: '#F0FFF7', color: 'var(--success)', border: '1px solid #B3EECE', borderRadius: 6, padding: '3px 8px' }}>{kw}</span>
                    ))}
                  </div>
                </div>
              )}
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
          <div className="preview-toolbar" style={{ flexDirection: 'column', gap: 0, padding: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 16px' }}>
              <button
                className="ats-score-btn"
                onClick={() => setShowATSDetails(v => !v)}
                style={{ '--ats-color': atsColor } as React.CSSProperties}
              >
                <span className="ats-score-label">ATS Score</span>
                <div className="ats-score-bar-wrap">
                  <div className="ats-score-bar-fill" style={{ width: `${ats.total}%`, background: atsColor }} />
                </div>
                <span className="ats-score-num" style={{ color: atsColor }}>{ats.total}/100</span>
                <span className="ats-score-chevron">{showATSDetails ? '▲' : '▼'}</span>
              </button>
              <div style={{ display: 'flex', gap: 6, alignItems: 'center', marginLeft: 'auto' }}>
                <button className="btn btn-ghost btn-sm" onClick={handlePreview} disabled={previewing} title="Anteprima PDF in nuova scheda">
                  {previewing ? '⏳' : '👁'} Anteprima
                </button>
                <button className="btn btn-gold btn-sm" onClick={handleDownload} disabled={downloading}>
                  {downloading ? '⏳ Generando...' : '⬇ PDF'}
                </button>
              </div>
            </div>

            {/* Template strip */}
            <div className="template-strip">
              {TEMPLATE_OPTIONS.map(t => (
                <button
                  key={t.id}
                  className={`template-pill${selectedTemplate === t.id ? ' active' : ''}`}
                  onClick={() => onTemplateChange(t.id)}
                  title={t.label}
                >
                  {t.icon} {t.label}
                </button>
              ))}
            </div>

            {showATSDetails && (
              <div className="ats-details-panel">
                <div className="ats-indicator">
                  <div className="ats-indicator-header">
                    <span className="ats-indicator-title">Parsing Strutturale</span>
                    <span className="ats-indicator-score" style={{ color: ats.parsing.score >= 25 ? 'var(--success)' : ats.parsing.score >= 15 ? 'var(--gold)' : 'var(--danger)' }}>{ats.parsing.score}/{ats.parsing.max}</span>
                  </div>
                  <div className="ats-mini-bar"><div className="ats-mini-fill" style={{ width: `${(ats.parsing.score / ats.parsing.max) * 100}%`, background: ats.parsing.score >= 25 ? 'var(--success)' : ats.parsing.score >= 15 ? 'var(--gold)' : 'var(--danger)' }} /></div>
                  {ats.parsing.issues.map(i => <div key={i} className="ats-issue">{i}</div>)}
                </div>

                <div className="ats-indicator">
                  <div className="ats-indicator-header">
                    <span className="ats-indicator-title">Keyword Match</span>
                    <span className="ats-indicator-score" style={{ color: ats.keywords.score >= 40 ? 'var(--success)' : ats.keywords.score >= 20 ? 'var(--gold)' : 'var(--danger)' }}>{ats.keywords.score}/{ats.keywords.max}</span>
                  </div>
                  <div className="ats-mini-bar"><div className="ats-mini-fill" style={{ width: `${(ats.keywords.score / ats.keywords.max) * 100}%`, background: ats.keywords.score >= 40 ? 'var(--success)' : ats.keywords.score >= 20 ? 'var(--gold)' : 'var(--danger)' }} /></div>
                  {!ats.keywords.hasJD
                    ? <div className="ats-issue">⚠ Incolla la job description nella sezione "Analisi ATS" per calcolare il match</div>
                    : <>
                        {ats.keywords.matched.length > 0 && <div className="ats-issue" style={{ color: 'var(--success)' }}>✓ {ats.keywords.matched.length} keyword trovate: {ats.keywords.matched.join(', ')}</div>}
                        {ats.keywords.missing.length > 0 && <div className="ats-issue" style={{ color: 'var(--danger)' }}>✗ Mancanti: {ats.keywords.missing.join(', ')}</div>}
                      </>
                  }
                </div>

                <div className="ats-indicator" style={{ borderBottom: 'none' }}>
                  <div className="ats-indicator-header">
                    <span className="ats-indicator-title">Rigore Cronologico e Metrico</span>
                    <span className="ats-indicator-score" style={{ color: ats.chronometric.score >= 16 ? 'var(--success)' : ats.chronometric.score >= 8 ? 'var(--gold)' : 'var(--danger)' }}>{ats.chronometric.score}/{ats.chronometric.max}</span>
                  </div>
                  <div className="ats-mini-bar"><div className="ats-mini-fill" style={{ width: `${(ats.chronometric.score / ats.chronometric.max) * 100}%`, background: ats.chronometric.score >= 16 ? 'var(--success)' : ats.chronometric.score >= 8 ? 'var(--gold)' : 'var(--danger)' }} /></div>
                  {ats.chronometric.details.map(d => <div key={d} className="ats-issue">{d}</div>)}
                </div>
              </div>
            )}
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
