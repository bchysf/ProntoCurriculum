import { useState, useCallback, useRef, useEffect, useMemo } from 'react';
import { CVData, TemplateType, ModalType, SavedCV } from '../types';
import { downloadCVAsPDF, previewCVAsPDF } from '../utils/downloadPDF';
import { aiOptimizeCV } from '../utils/aiOptimizeCV';
import { aiOptimizeSummary, aiOptimizeExp, aiRephraseExp, aiExpTips, aiApplyTip } from '../utils/aiOptimizeField';
import { aiTranslateCV, aiTranslateField, LANGUAGES, type SupportedLanguage } from '../utils/aiTranslate';
import { translateDateLabel } from '../utils/dateI18n';
import CVPreview from '../components/CVPreview';
import TemplateModal from '../components/TemplateModal';
import { Icon, IC } from '../components/StrokeIcon';
import { useAuth } from '../hooks/use-auth';
import { useT } from '../i18n/LanguageContext';
import { toast } from 'sonner';

interface StoredExp {
  id: string;
  company: string;
  role: string;
  city: string | null;
  startDate: string | null;
  endDate: string | null;
  isCurrent: boolean;
  description: string | null;
  skills: string[];
}

interface BuilderStep2Props {
  cvData: CVData;
  onCVChange: (data: CVData) => void;
  selectedTemplate: TemplateType;
  onTemplateChange: (t: TemplateType) => void;
  initialLanguage?: SupportedLanguage;
  onNavigate: (page: 'home' | 'builder-step1' | 'builder-step2' | 'archivio' | 'tailor') => void;
  onModal: (modal: ModalType) => void;
  onAiAction: (text: string, callback: () => void) => void;
  onGoToArchivio: () => void;
}

const SUGGESTED_SKILLS = ['Kubernetes', 'CI/CD', 'Agile/Scrum', 'PostgreSQL', 'TypeScript', 'Redis'];

const LANG_NAMES: Record<string, string> = {
  IT: 'italiano', EN: 'inglese', FR: 'francese', DE: 'tedesco', ES: 'spagnolo', PT: 'portoghese',
};

const MONTH_MAP: Record<string, number> = {
  gen:1, feb:2, mar:3, apr:4, mag:5, giu:6, lug:7, ago:8, set:9, ott:10, nov:11, dic:12,
  jan:1, may:5, jun:6, jul:7, aug:8, sep:9, oct:10, dec:12,
};

function parseYearMonth(s: string): number | null {
  if (!s) return null;
  const lower = s.toLowerCase().trim();
  if (['presente', 'present', 'heute', 'actuel', 'actual'].some(w => lower.includes(w))) return Date.now();
  const parts = lower.split(/[\s./-]+/).filter(Boolean);
  if (parts.length >= 2) {
    const monthKey = (parts[0] ?? '').slice(0, 3);
    const year = parseInt(parts[1] ?? '');
    const month = MONTH_MAP[monthKey];
    if (!isNaN(year) && year > 1900 && year < 2100) return new Date(year, (month ?? 1) - 1, 1).getTime();
  }
  if (parts.length >= 1) {
    const year = parseInt(parts[0] ?? '');
    if (!isNaN(year) && year > 1900 && year < 2100) return new Date(year, 0, 1).getTime();
  }
  return null;
}

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
    <div className="acc">
      <button className={`acc-trigger${open ? ' open' : ''}`} onClick={onToggle}>
        <span>{title}</span>
        <span className="acc-chevron">{open ? '▲' : '▼'}</span>
      </button>
      {open && <div className="acc-content fade-in">{children}</div>}
    </div>
  );
}

function AIAssistantPanel({
  experiences, expTips, analyzing, onAnalyzeAll, onApplyTip, applyingTipKey,
}: {
  experiences: { id: string; role: string; company: string }[];
  expTips: Record<string, string[]>;
  analyzing: boolean;
  onAnalyzeAll: () => void;
  onApplyTip: (expId: string, tipIndex: number) => void;
  applyingTipKey: string | null;
}) {
  const [open, setOpen] = useState(true);
  const [minimized, setMinimized] = useState(false);
  const [pos, setPos] = useState(() => ({
    x: Math.max(24, window.innerWidth - 344),
    y: 96,
  }));
  const dragOffset = useRef<{ dx: number; dy: number } | null>(null);

  const named = experiences.filter(e => e.role || e.company);
  const withTips = named.filter(e => expTips[e.id]?.length);
  const pendingCount = named.length - withTips.length;

  const onHeadPointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if ((e.target as HTMLElement).closest('button')) return; // let minimize/close buttons receive their click
    dragOffset.current = { dx: e.clientX - pos.x, dy: e.clientY - pos.y };
    e.currentTarget.setPointerCapture(e.pointerId);
  };
  const onHeadPointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!dragOffset.current) return;
    const maxX = window.innerWidth - 60;
    const maxY = window.innerHeight - 44;
    setPos({
      x: Math.min(Math.max(0, e.clientX - dragOffset.current.dx), maxX),
      y: Math.min(Math.max(0, e.clientY - dragOffset.current.dy), maxY),
    });
  };
  const onHeadPointerUp = () => { dragOffset.current = null; };

  if (!open) {
    return (
      <button className="ai-float-reopen" style={{ right: 28, bottom: 28 }} onClick={() => setOpen(true)}>
        <Icon d={IC.bulb} size={15} /> Assistente AI
      </button>
    );
  }

  return (
    <div className="ai-float" style={{ left: pos.x, top: pos.y }}>
      <div
        className="ai-float-head"
        onPointerDown={onHeadPointerDown}
        onPointerMove={onHeadPointerMove}
        onPointerUp={onHeadPointerUp}
      >
        <span className="ico"><Icon d={IC.bulb} size={13} /></span>
        <span className="title">Assistente AI</span>
        <div className="ai-float-actions">
          <button title={minimized ? 'Espandi' : 'Riduci'} onClick={() => setMinimized(v => !v)}>{minimized ? '▢' : '—'}</button>
          <button title="Chiudi" onClick={() => setOpen(false)}><Icon d={IC.x} size={13} /></button>
        </div>
      </div>

      {!minimized && (
        <div className="ai-float-body">
          <p className="ai-float-sub">Suggerimenti per rendere le tue esperienze più incisive e superare i filtri ATS.</p>

          {named.length === 0 ? (
            <div className="ai-panel-empty">Aggiungi un'esperienza lavorativa per ricevere suggerimenti.</div>
          ) : withTips.length === 0 ? (
            <button className="btn btn-ink btn-sm" style={{ width: '100%', justifyContent: 'center' }} onClick={onAnalyzeAll} disabled={analyzing}>
              {analyzing ? 'Analisi in corso…' : <><Icon d={IC.spark} size={13} /> Analizza esperienze</>}
            </button>
          ) : (
            <>
              {withTips.map(exp => (
                <div key={exp.id} style={{ marginBottom: 6 }}>
                  <div className="mono" style={{ marginBottom: 2 }}>{exp.role || exp.company}</div>
                  {expTips[exp.id]!.map((tip, i) => {
                    const key = `${exp.id}:${i}`;
                    const applying = applyingTipKey === key;
                    return (
                      <div key={i} className="ai-tip" style={{ flexDirection: 'column', alignItems: 'stretch', gap: 6 }}>
                        <div style={{ display: 'flex', gap: 9 }}>
                          <span className="dot" style={{ marginTop: 6 }} />
                          <span>{tip}</span>
                        </div>
                        <button
                          className="btn btn-line btn-sm"
                          style={{ alignSelf: 'flex-end', padding: '4px 10px', fontSize: 11 }}
                          onClick={() => onApplyTip(exp.id, i)}
                          disabled={applying || applyingTipKey !== null}
                        >
                          {applying ? 'Applico…' : <><Icon d={IC.check} size={11} /> Applica</>}
                        </button>
                      </div>
                    );
                  })}
                </div>
              ))}
              {pendingCount > 0 && (
                <button className="btn btn-line btn-sm" style={{ width: '100%', justifyContent: 'center', marginTop: 8 }} onClick={onAnalyzeAll} disabled={analyzing}>
                  {analyzing ? 'Analisi in corso…' : `Analizza altre ${pendingCount} esperienze`}
                </button>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
}

export default function BuilderStep2({ cvData, onCVChange, selectedTemplate, onTemplateChange, initialLanguage, onNavigate, onModal, onAiAction, onGoToArchivio }: BuilderStep2Props) {
  const { isAuthenticated } = useAuth();
  const t = useT();
  const [openSections, setOpenSections] = useState<Set<string>>(new Set(['personal']));
  const [newSkill, setNewSkill] = useState('');
  const [downloading, setDownloading] = useState(false);
  const [previewing, setPreviewing] = useState(false);
  const [optimizing, setOptimizing] = useState(false);
  const [localModal, setModal] = useState<null | 'ai-loading-local'>(null);
  const [showTemplateModal, setShowTemplateModal] = useState(false);
  const photoInputRef = useRef<HTMLInputElement>(null);

  const [showImportPanel, setShowImportPanel] = useState(false);
  const [savedExps, setSavedExps] = useState<StoredExp[]>([]);
  const [importLoading, setImportLoading] = useState(false);
  const [importedIds, setImportedIds] = useState<Set<string>>(new Set());

  const [selectedLanguage, setSelectedLanguage] = useState<SupportedLanguage>(initialLanguage ?? 'IT');
  const [translating, setTranslating] = useState(false);
  const [rephrasingExpId, setRephrasingExpId] = useState<string | null>(null);
  const [expTips, setExpTips] = useState<Record<string, string[]>>({});
  const [tipsLoadingId, setTipsLoadingId] = useState<string | null>(null);
  const [openTipsId, setOpenTipsId] = useState<string | null>(null);
  const [translateError, setTranslateError] = useState('');
  const [analyzingAll, setAnalyzingAll] = useState(false);
  const [applyingTipKey, setApplyingTipKey] = useState<string | null>(null);

  const overlapWarnings = useMemo(() => {
    const result: Array<{ label1: string; label2: string }> = [];
    const exps = cvData.experiences.filter(e => e.company || e.role);
    for (let i = 0; i < exps.length; i++) {
      for (let j = i + 1; j < exps.length; j++) {
        const a = exps[i]!;
        const b = exps[j]!;
        const aStart = parseYearMonth(a.from);
        const aEnd = parseYearMonth(a.to || 'Presente');
        const bStart = parseYearMonth(b.from);
        const bEnd = parseYearMonth(b.to || 'Presente');
        if (aStart && aEnd && bStart && bEnd && aStart < bEnd && bStart < aEnd) {
          result.push({
            label1: [a.role, a.company].filter(Boolean).join(' @ '),
            label2: [b.role, b.company].filter(Boolean).join(' @ '),
          });
        }
      }
    }
    return result;
  }, [cvData.experiences]);

  const [showSaveForm, setShowSaveForm] = useState(false);
  const [saveName, setSaveName] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [savedCVsForImport, setSavedCVsForImport] = useState<SavedCV[]>([]);
  const [savedCVsLoading, setSavedCVsLoading] = useState(false);
  const [showSavedCVsTab, setShowSavedCVsTab] = useState(false);
  const [expandedImportCVId, setExpandedImportCVId] = useState<string | null>(null);
  const [importedFromCVExpIds, setImportedFromCVExpIds] = useState<Set<string>>(new Set());

  const openImportPanel = async () => {
    setShowImportPanel(true);
    setImportLoading(true);
    try {
      const res = await fetch('/api/experiences', { credentials: 'include' });
      if (res.ok) {
        const data = await res.json() as { experiences: StoredExp[] };
        setSavedExps(data.experiences);
      }
    } finally {
      setImportLoading(false);
    }
  };

  const importExperience = (exp: StoredExp) => {
    const cvExp = {
      id: Date.now().toString() + exp.id.slice(-4),
      company: exp.company,
      role: exp.role,
      city: exp.city ?? '',
      from: exp.startDate ?? '',
      to: exp.isCurrent ? 'Presente' : (exp.endDate ?? ''),
      desc: exp.description ?? '',
    };
    onCVChange({ ...cvData, experiences: [...cvData.experiences, cvExp] });
    setImportedIds(prev => new Set([...prev, exp.id]));
  };

  const handleSaveCV = async () => {
    if (isSaving) return;
    setIsSaving(true);
    try {
      const name = saveName.trim() || `${cvData.firstName || ''} ${cvData.lastName || ''}`.trim() || 'Il mio CV';
      const res = await fetch('/api/cvs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ name, cvData, template: selectedTemplate }),
      });
      if (res.ok) {
        toast.success(t('builder.saved'));
        setShowSaveForm(false);
        setSaveName('');
      } else {
        const err = await res.json() as { error?: string };
        toast.error(err.error ?? 'Errore nel salvataggio');
      }
    } catch {
      toast.error('Errore di rete');
    } finally {
      setIsSaving(false);
    }
  };

  const loadSavedCVsForImport = async () => {
    setSavedCVsLoading(true);
    try {
      const res = await fetch('/api/cvs', { credentials: 'include' });
      if (res.ok) {
        const data = await res.json() as { cvs: SavedCV[] };
        setSavedCVsForImport(data.cvs ?? []);
      }
    } finally {
      setSavedCVsLoading(false);
    }
  };

  const importExpFromSavedCV = (exp: { id: string; role: string; company: string; city: string; from: string; to: string; desc: string }) => {
    const cvExp = { ...exp, id: Date.now().toString() + Math.random().toString(36).slice(-4) };
    onCVChange({ ...cvData, experiences: [...cvData.experiences, cvExp] });
    setImportedFromCVExpIds(prev => new Set([...prev, exp.id]));
  };

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
      const result = await aiOptimizeCV(cvData, selectedLanguage);
      const updatedExperiences = cvData.experiences.map(exp => {
        const optimized = result.experiences.find((o: { id: string }) => o.id === exp.id);
        return optimized ? { ...exp, desc: optimized.desc } : exp;
      });
      onCVChange({
        ...cvData,
        summary: result.summary || cvData.summary,
        experiences: updatedExperiences,
        skills: result.skillCategories?.flatMap(c => c.skills) ?? cvData.skills,
        skillCategories: result.skillCategories?.length ? result.skillCategories : cvData.skillCategories,
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

  const removeSkillFromCategory = (categoryName: string, skill: string) => {
    const newCategories = (cvData.skillCategories ?? [])
      .map(cat => cat.name === categoryName ? { ...cat, skills: cat.skills.filter(s => s !== skill) } : cat)
      .filter(cat => cat.skills.length > 0);
    onCVChange({ ...cvData, skillCategories: newCategories });
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
      const result = await aiOptimizeSummary(cvData, selectedLanguage);
      onCVChange({ ...cvData, summary: result });
    } catch {
    } finally {
      setOptimizing(false);
      setModal(null);
    }
  };

  const handleTranslateCV = async () => {
    if (selectedLanguage === 'IT') return;
    setTranslating(true);
    setTranslateError('');
    setModal('ai-loading-local');
    try {
      const translated = await aiTranslateCV(cvData, selectedLanguage);
      onCVChange({
        ...cvData,
        ...translated,
        photo: cvData.photo,
        experiences: translated.experiences.map(exp => ({
          ...exp,
          from: translateDateLabel(exp.from, selectedLanguage),
          to: translateDateLabel(exp.to, selectedLanguage),
        })),
        education: translated.education.map(edu => ({
          ...edu,
          from: translateDateLabel(edu.from, selectedLanguage),
          to: translateDateLabel(edu.to, selectedLanguage),
        })),
      });
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Errore traduzione';
      setTranslateError(msg);
      toast.error(`Traduzione fallita: ${msg}`);
    } finally {
      setTranslating(false);
      setModal(null);
    }
  };

  const handleTranslateSummary = async () => {
    if (!cvData.summary.trim()) return;
    setTranslating(true);
    setModal('ai-loading-local');
    try {
      const result = await aiTranslateField('summary', cvData.summary, selectedLanguage);
      onCVChange({ ...cvData, summary: result });
    } catch {
    } finally {
      setTranslating(false);
      setModal(null);
    }
  };

  const handleTranslateExp = async (idx: number) => {
    const exp = cvData.experiences[idx];
    if (!exp?.desc?.trim()) return;
    setTranslating(true);
    setModal('ai-loading-local');
    try {
      const result = await aiTranslateField('exp-desc', exp.desc, selectedLanguage, { role: exp.role, company: exp.company });
      const updated = [...cvData.experiences];
      updated[idx] = { ...updated[idx], desc: result };
      onCVChange({ ...cvData, experiences: updated });
    } catch {
    } finally {
      setTranslating(false);
      setModal(null);
    }
  };

  const handleOptimizeExp = async (idx: number) => {
    const exp = cvData.experiences[idx];
    if (!exp) return;
    setOptimizing(true);
    setModal('ai-loading-local');
    try {
      const result = await aiOptimizeExp({ id: exp.id, role: exp.role, company: exp.company, desc: exp.desc }, selectedLanguage);
      const updated = [...cvData.experiences];
      updated[idx] = { ...updated[idx], desc: result };
      onCVChange({ ...cvData, experiences: updated });
    } catch {
    } finally {
      setOptimizing(false);
      setModal(null);
    }
  };

  const handleRephraseExp = async (idx: number) => {
    const exp = cvData.experiences[idx];
    if (!exp?.desc?.trim()) return;
    setRephrasingExpId(exp.id);
    try {
      const result = await aiRephraseExp({ id: exp.id, role: exp.role, company: exp.company, desc: exp.desc }, selectedLanguage);
      const updated = [...cvData.experiences];
      updated[idx] = { ...updated[idx], desc: result };
      onCVChange({ ...cvData, experiences: updated });
    } catch {
      toast.error('Errore durante la rigenerazione');
    } finally {
      setRephrasingExpId(null);
    }
  };

  const handleExpTips = async (idx: number) => {
    const exp = cvData.experiences[idx];
    if (!exp) return;
    if (openTipsId === exp.id && expTips[exp.id]) {
      setOpenTipsId(null);
      return;
    }
    setOpenTipsId(exp.id);
    if (expTips[exp.id]) return;
    setTipsLoadingId(exp.id);
    try {
      const tips = await aiExpTips({ role: exp.role, company: exp.company, desc: exp.desc }, selectedLanguage);
      setExpTips(prev => ({ ...prev, [exp.id]: tips }));
    } catch {
      toast.error('Errore durante il caricamento dei suggerimenti');
      setOpenTipsId(null);
    } finally {
      setTipsLoadingId(null);
    }
  };

  const handleAnalyzeAll = async () => {
    const pending = cvData.experiences.filter(exp => (exp.role || exp.company) && !expTips[exp.id]);
    if (pending.length === 0) return;
    setAnalyzingAll(true);
    try {
      for (const exp of pending) {
        try {
          const tips = await aiExpTips({ role: exp.role, company: exp.company, desc: exp.desc }, selectedLanguage);
          setExpTips(prev => ({ ...prev, [exp.id]: tips }));
        } catch {
          // Skip this experience, keep going with the rest.
        }
      }
    } finally {
      setAnalyzingAll(false);
    }
  };

  const handleApplyTip = async (expId: string, tipIndex: number) => {
    const exp = cvData.experiences.find(e => e.id === expId);
    const tip = expTips[expId]?.[tipIndex];
    if (!exp || !tip) return;
    const key = `${expId}:${tipIndex}`;
    setApplyingTipKey(key);
    try {
      const rewritten = await aiApplyTip({ role: exp.role, company: exp.company, desc: exp.desc }, tip, selectedLanguage);
      onCVChange({
        ...cvData,
        experiences: cvData.experiences.map(e => e.id === expId ? { ...e, desc: rewritten } : e),
      });
      setExpTips(prev => ({ ...prev, [expId]: (prev[expId] ?? []).filter((_, i) => i !== tipIndex) }));
      toast.success('Suggerimento applicato al CV');
    } catch {
      toast.error('Errore durante l\'applicazione del suggerimento');
    } finally {
      setApplyingTipKey(null);
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
            <div style={{ color: '#2F2AE5', marginBottom: 16 }}><Icon d={IC.spark} size={32} /></div>
            <div style={{ fontFamily: 'Fraunces, Georgia, serif', fontSize: 22, fontWeight: 560, marginBottom: 8 }}>L'AI sta ottimizzando…</div>
            <div style={{ color: 'var(--gray500)', fontSize: 14 }}>Sommario, esperienze e competenze in un click</div>
          </div>
        </div>
      )}

      <div className="editor-layout">
        {/* ── SIDEBAR ── */}
        <aside className="editor-sidebar" style={{ width: sidebarWidth }}>
          <div className="sidebar-header">
            <div>
              <div style={{ fontFamily: 'Fraunces, Georgia, serif', fontSize: 16, fontWeight: 560, color: 'var(--navy)' }}>Costruisci il tuo CV</div>
              <div style={{ fontSize: 11, color: 'var(--gray500)', marginTop: 2 }}>Anteprima live in tempo reale</div>
            </div>
            <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
              {isAuthenticated && (
                <button
                  title={t('builder.saveCV')}
                  className="btn btn-ghost btn-sm"
                  style={{ padding: '7px 10px' }}
                  onClick={() => setShowSaveForm(v => !v)}
                >
                  <Icon d={IC.save} size={14} />
                </button>
              )}
              <button className="btn-optimize-all" onClick={handleOptimizeAll} disabled={optimizing}>
                <Icon d={IC.spark} size={14} />
                {optimizing ? 'Ottimizzazione...' : 'AI ottimizza'}
              </button>
            </div>
          </div>

          {/* Save CV form */}
          {showSaveForm && isAuthenticated && (
            <div style={{ padding: '10px 16px', borderBottom: '1px solid var(--border)', background: '#FBFAF7' }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--navy)', marginBottom: 7 }}>{t('builder.saveCV')}</div>
              <div style={{ display: 'flex', gap: 6 }}>
                <input
                  type="text"
                  value={saveName}
                  onChange={e => setSaveName(e.target.value)}
                  placeholder={`${cvData.firstName || 'Mario'} ${cvData.lastName || 'Rossi'} CV`}
                  onKeyDown={e => { if (e.key === 'Enter') void handleSaveCV(); if (e.key === 'Escape') setShowSaveForm(false); }}
                  style={{ flex: 1, padding: '6px 10px', border: '1px solid rgba(15,23,42,0.12)', borderRadius: 8, fontFamily: 'inherit', fontSize: 12, color: 'var(--navy)', outline: 'none', background: '#fff' }}
                />
                <button
                  className="btn btn-gold btn-sm"
                  style={{ fontSize: 12, whiteSpace: 'nowrap' }}
                  onClick={() => void handleSaveCV()}
                  disabled={isSaving}
                >
                  {isSaving ? '...' : 'Salva'}
                </button>
              </div>
            </div>
          )}

          <div className="sidebar-scroll">
            {/* CV SU MISURA BANNER */}
            {isAuthenticated && (
              <div
                style={{
                  margin: '0 0 8px 0',
                  padding: '12px 16px',
                  background: '#EEF0FD',
                  border: '1px solid rgba(47, 42, 229, 0.16)',
                  borderRadius: 12,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: 12,
                  cursor: 'pointer',
                }}
                onClick={() => onNavigate('tailor')}
              >
                <div>
                  <div style={{ fontSize: 12, fontWeight: 700, color: '#221FB4', marginBottom: 2, display: 'flex', alignItems: 'center', gap: 6 }}>
                    <Icon d={IC.spark} size={13} /> CV su misura
                  </div>
                  <div style={{ fontSize: 11, color: 'var(--gray500)' }}>L'AI adatta il CV a una specifica offerta</div>
                </div>
                <div style={{ color: '#2F2AE5', flexShrink: 0, display: 'flex' }}><Icon d={IC.arrowRight} size={16} /></div>
              </div>
            )}

            {/* LINGUA DEL CV */}
            <div style={{
              margin: '0 0 8px 0',
              padding: '12px 16px',
              background: 'var(--surface)',
              border: '1px solid var(--border)',
              borderRadius: 10,
            }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--navy)', display: 'flex', alignItems: 'center', gap: 6 }}>
                  <Icon d={IC.globe} size={13} style={{ color: '#2F2AE5' }} /> Lingua del CV
                </div>
                {selectedLanguage !== 'IT' && (
                  <button
                    className="ai-btn"
                    style={{ padding: '4px 10px', fontSize: 11 }}
                    onClick={() => void handleTranslateCV()}
                    disabled={translating || optimizing}
                  >
                    {translating ? 'Traduzione...' : `Traduci tutto in ${LANGUAGES.find(l => l.code === selectedLanguage)?.label ?? selectedLanguage}`}
                  </button>
                )}
              </div>
              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                {LANGUAGES.map(lang => (
                  <button
                    key={lang.code}
                    title={lang.label}
                    aria-label={lang.label}
                    onClick={() => { setSelectedLanguage(lang.code); setTranslateError(''); }}
                    style={{
                      width: 34,
                      height: 34,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: 17,
                      lineHeight: 1,
                      borderRadius: '50%',
                      border: `1.5px solid ${selectedLanguage === lang.code ? '#2F2AE5' : 'var(--border)'}`,
                      background: selectedLanguage === lang.code ? '#EEF0FD' : 'transparent',
                      cursor: 'pointer',
                      transition: 'all 0.15s',
                    }}
                  >
                    {lang.flag}
                  </button>
                ))}
              </div>
              {translateError && (
                <div style={{ marginTop: 8, fontSize: 11, color: 'var(--danger)' }}>{translateError}</div>
              )}
              {selectedLanguage === 'IT' && (
                <div style={{ marginTop: 8, fontSize: 11, color: 'var(--gray500)' }}>
                  Seleziona un'altra lingua per tradurre il CV o i singoli campi con AI.
                </div>
              )}
            </div>

            {/* DATI PERSONALI */}
            <AccordionSection title="Dati personali" open={openSections.has('personal')} onToggle={() => toggleSection('personal')}>
              <div className="photo-section">
                {cvData.photo ? (
                  <div className="photo-has-photo">
                    <img src={cvData.photo} alt="foto profilo" className="photo-existing" />
                    <div className="photo-has-info">
                      <span className="photo-has-label" style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                        <Icon d={IC.check} size={13} style={{ color: 'var(--success)' }} /> Foto profilo caricata
                      </span>
                      {hasPhotoTemplate
                        ? <span className="photo-has-sub">Verrà usata nel template selezionato</span>
                        : <span className="photo-has-sub" style={{ color: '#B45309' }}>Il template attuale non include foto</span>
                      }
                      <div style={{ display: 'flex', gap: 8, marginTop: 6 }}>
                        <button className="btn btn-ghost btn-sm" onClick={() => photoInputRef.current?.click()}>
                          Cambia foto
                        </button>
                        <button className="btn btn-ghost btn-sm" style={{ color: 'var(--danger)' }} onClick={() => update('photo', undefined)}>
                          Elimina
                        </button>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className={`photo-upload-area ${hasPhotoTemplate ? 'photo-upload-highlighted' : ''}`} onClick={() => photoInputRef.current?.click()}>
                    <div className="photo-upload-placeholder">
                      <span style={{ color: '#2F2AE5' }}><Icon d={IC.user} size={24} /></span>
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
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                <button className="ai-btn" onClick={handleOptimizeSummary} disabled={optimizing || translating}>
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} style={{ width: 13, height: 13 }}>
                    <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2z" />
                  </svg>
                  Ottimizza profilo con AI
                </button>
                {selectedLanguage !== 'IT' && (
                  <button
                    className="ai-btn"
                    onClick={() => void handleTranslateSummary()}
                    disabled={optimizing || translating || !cvData.summary.trim()}
                  >
                    <Icon d={IC.globe} size={13} /> Traduci in {LANGUAGES.find(l => l.code === selectedLanguage)?.label}
                  </button>
                )}
              </div>
            </AccordionSection>

            {/* ESPERIENZE */}
            <AccordionSection title="Esperienze lavorative" open={openSections.has('experiences')} onToggle={() => toggleSection('experiences')}>
              {overlapWarnings.length > 0 && (
                <div style={{ background: '#FBF7EE', border: '1px solid #EAD9B0', borderRadius: 10, padding: '10px 14px', marginBottom: 14, fontSize: 12 }}>
                  <div style={{ fontWeight: 700, color: '#8A6A1F', marginBottom: 5 }}>Sovrapposizione temporale rilevata</div>
                  {overlapWarnings.map((w, i) => (
                    <div key={i} style={{ color: 'var(--gray600)', marginBottom: 3, lineHeight: 1.5 }}>
                      <strong>{w.label1}</strong> e <strong>{w.label2}</strong> si sovrappongono — specifica se si trattava di consulenza, part-time o freelancing.
                    </div>
                  ))}
                </div>
              )}
              {cvData.experiences.map((exp, idx) => (
                <div key={exp.id} className="exp-block">
                  <div className="exp-block-header">
                    <span className="exp-block-title">Esperienza {idx + 1}</span>
                    <div style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
                      <button className="btn btn-ghost btn-sm" style={{ padding: '3px 7px', fontSize: 13 }} title="Sposta su" disabled={idx === 0} onClick={() => moveExperience(idx, -1)}>↑</button>
                      <button className="btn btn-ghost btn-sm" style={{ padding: '3px 7px', fontSize: 13 }} title="Sposta giù" disabled={idx === cvData.experiences.length - 1} onClick={() => moveExperience(idx, 1)}>↓</button>
                      <button className="ai-btn" style={{ padding: '4px 9px', fontSize: 11 }} disabled={optimizing || translating || rephrasingExpId === exp.id} onClick={() => handleOptimizeExp(idx)} title="Ottimizza con AI">
                        <Icon d={IC.spark} size={11} /> AI
                      </button>
                      {exp.desc?.trim() && (
                        <button
                          className="ai-btn"
                          style={{ padding: '4px 9px', fontSize: 11 }}
                          title="Rigenera variazione"
                          disabled={optimizing || translating || rephrasingExpId != null}
                          onClick={() => void handleRephraseExp(idx)}
                        >
                          {rephrasingExpId === exp.id ? '…' : <Icon d={IC.refresh} size={12} />}
                        </button>
                      )}
                      {selectedLanguage !== 'IT' && (
                        <button
                          className="ai-btn"
                          style={{ padding: '4px 9px', fontSize: 11 }}
                          title={`Traduci in ${LANGUAGES.find(l => l.code === selectedLanguage)?.label}`}
                          disabled={optimizing || translating || !exp.desc?.trim()}
                          onClick={() => void handleTranslateExp(idx)}
                        >
                          <Icon d={IC.globe} size={12} />
                        </button>
                      )}
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
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                      <label style={{ marginBottom: 0 }}>Descrizione</label>
                      <button
                        style={{
                          background: 'none', border: 'none', cursor: 'pointer',
                          fontSize: 11, color: '#2F2AE5', fontWeight: 700,
                          padding: '2px 6px', borderRadius: 5,
                          opacity: tipsLoadingId === exp.id ? 0.6 : 1,
                          display: 'flex', alignItems: 'center', gap: 4,
                        }}
                        onClick={() => void handleExpTips(idx)}
                        disabled={tipsLoadingId === exp.id}
                        title="Suggerimenti AI per migliorare questa esperienza"
                      >
                        {tipsLoadingId === exp.id ? '…' : <Icon d={IC.bulb} size={12} />}
                        {openTipsId === exp.id && expTips[exp.id] ? ' Nascondi' : ' Suggerimenti'}
                      </button>
                    </div>
                    <textarea rows={3} placeholder="Descrivi le tue responsabilità e risultati..." value={exp.desc} onChange={e => updateExp(exp.id, 'desc', e.target.value)} />
                    {openTipsId === exp.id && (
                      <div style={{
                        marginTop: 8, padding: '10px 12px',
                        background: '#EEF0FD',
                        border: '1px solid rgba(47, 42, 229, 0.18)',
                        borderRadius: 10,
                      }}>
                        {tipsLoadingId === exp.id ? (
                          <div style={{ fontSize: 12, color: 'var(--gray500)', textAlign: 'center', padding: '4px 0' }}>
                            Analisi in corso…
                          </div>
                        ) : expTips[exp.id] ? (
                          <>
                            <div style={{ fontSize: 10.5, fontWeight: 700, color: '#221FB4', marginBottom: 7, letterSpacing: 0.8, textTransform: 'uppercase' }}>
                              Come migliorare questa esperienza
                            </div>
                            {expTips[exp.id].map((tip, ti) => (
                              <div key={ti} style={{ display: 'flex', gap: 8, marginBottom: ti < (expTips[exp.id]?.length ?? 0) - 1 ? 6 : 0 }}>
                                <span style={{ color: '#2F2AE5', fontWeight: 700, fontSize: 12, flexShrink: 0, marginTop: 1 }}>→</span>
                                <span style={{ fontSize: 12, color: 'var(--navy)', lineHeight: 1.5 }}>{tip}</span>
                              </div>
                            ))}
                            <div style={{ marginTop: 8, borderTop: '1px solid rgba(47, 42, 229, 0.14)', paddingTop: 7 }}>
                              <button
                                style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 11, color: 'var(--gray500)', padding: 0 }}
                                onClick={() => {
                                  setExpTips(prev => { const n = { ...prev }; delete n[exp.id]; return n; });
                                }}
                              >
                                Rigenera suggerimenti
                              </button>
                            </div>
                          </>
                        ) : null}
                      </div>
                    )}
                  </div>
                </div>
              ))}
              <div style={{ display: 'flex', gap: 8, marginTop: 4 }}>
                <button className="btn btn-ghost btn-sm" style={{ flex: 1 }} onClick={addExperience}>
                  + Aggiungi esperienza
                </button>
                {isAuthenticated && (
                  <button
                    className="btn btn-ghost btn-sm"
                    style={{ flex: 1, color: '#2F2AE5', borderColor: 'rgba(47, 42, 229, 0.35)' }}
                    onClick={showImportPanel ? () => setShowImportPanel(false) : openImportPanel}
                  >
                    {showImportPanel ? 'Chiudi archivio' : 'Importa dal mio archivio'}
                  </button>
                )}
              </div>

              {showImportPanel && (
                <div style={{ marginTop: 12, background: 'var(--gray50)', border: '1.5px solid var(--gray100)', borderRadius: 10, overflow: 'hidden' }}>
                  {/* Tab bar */}
                  <div style={{ display: 'flex', borderBottom: '1px solid var(--gray100)' }}>
                    {[
                      { key: false, label: 'Archivio' },
                      { key: true, label: t('builder.fromSaved') },
                    ].map(tab => (
                      <button
                        key={String(tab.key)}
                        onClick={() => {
                          setShowSavedCVsTab(tab.key);
                          if (tab.key && savedCVsForImport.length === 0) void loadSavedCVsForImport();
                        }}
                        style={{
                          flex: 1, padding: '9px 4px', fontSize: 11, fontWeight: 700,
                          background: showSavedCVsTab === tab.key ? '#fff' : 'transparent',
                          border: 'none', borderBottom: showSavedCVsTab === tab.key ? '2px solid #2F2AE5' : '2px solid transparent',
                          color: showSavedCVsTab === tab.key ? 'var(--navy)' : 'var(--gray500)',
                          cursor: 'pointer', transition: 'all 0.15s',
                        }}
                      >
                        {tab.label}
                      </button>
                    ))}
                  </div>

                  <div style={{ padding: '12px 14px' }}>
                    {!showSavedCVsTab ? (
                      /* ── ARCHIVIO TAB ── */
                      <>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                          <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--navy)' }}>Le mie esperienze</span>
                          <button className="btn btn-ghost btn-sm" style={{ fontSize: 11 }} onClick={onGoToArchivio}>Gestisci →</button>
                        </div>
                        {importLoading ? (
                          <div style={{ color: 'var(--gray500)', fontSize: 12, textAlign: 'center', padding: 16 }}>Caricamento...</div>
                        ) : savedExps.length === 0 ? (
                          <div style={{ fontSize: 12, color: 'var(--gray500)', textAlign: 'center', padding: '12px 0' }}>
                            Nessuna esperienza salvata.{' '}
                            <button className="btn btn-ghost btn-sm" style={{ fontSize: 12, display: 'inline' }} onClick={onGoToArchivio}>Aggiungine una →</button>
                          </div>
                        ) : (
                          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                            {savedExps.map(exp => {
                              const alreadyImported = importedIds.has(exp.id);
                              return (
                                <div key={exp.id} style={{ display: 'flex', alignItems: 'center', gap: 10, background: '#fff', borderRadius: 8, padding: '10px 12px', border: '1px solid var(--gray100)' }}>
                                  <div style={{ flex: 1, minWidth: 0 }}>
                                    <div style={{ fontWeight: 600, fontSize: 13, color: 'var(--navy)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                      {exp.role} <span style={{ color: 'var(--gray500)', fontWeight: 400 }}>· {exp.company}</span>
                                    </div>
                                    {(exp.startDate || exp.endDate || exp.isCurrent) && (
                                      <div style={{ fontSize: 11, color: 'var(--gray500)', marginTop: 1 }}>
                                        {exp.startDate ?? ''}{exp.startDate ? ' → ' : ''}{exp.isCurrent ? 'Presente' : (exp.endDate ?? '')}
                                      </div>
                                    )}
                                  </div>
                                  <button
                                    className="btn btn-sm"
                                    style={{ fontSize: 11, background: alreadyImported ? 'var(--gray100)' : '#2F2AE5', color: alreadyImported ? 'var(--gray500)' : '#fff', border: 'none', flexShrink: 0 }}
                                    onClick={() => !alreadyImported && importExperience(exp)}
                                  >
                                    {alreadyImported ? '✓ Aggiunto' : '+ Aggiungi'}
                                  </button>
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </>
                    ) : (
                      /* ── DA CV SALVATI TAB ── */
                      <>
                        <div style={{ marginBottom: 10 }}>
                          <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--navy)' }}>I miei CV salvati</span>
                        </div>
                        {savedCVsLoading ? (
                          <div style={{ color: 'var(--gray500)', fontSize: 12, textAlign: 'center', padding: 16 }}>Caricamento...</div>
                        ) : savedCVsForImport.length === 0 ? (
                          <div style={{ fontSize: 12, color: 'var(--gray500)', textAlign: 'center', padding: '12px 0' }}>
                            Nessun CV salvato. Usa "Salva" per salvare questo CV.
                          </div>
                        ) : (
                          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                            {savedCVsForImport.map(cv => (
                              <div key={cv.id}>
                                <button
                                  onClick={() => setExpandedImportCVId(expandedImportCVId === cv.id ? null : cv.id)}
                                  style={{ width: '100%', textAlign: 'left', background: '#fff', border: '1px solid var(--gray100)', borderRadius: 8, padding: '9px 12px', cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
                                >
                                  <div>
                                    <div style={{ fontWeight: 600, fontSize: 12, color: 'var(--navy)' }}>{cv.name}</div>
                                    <div style={{ fontSize: 10, color: 'var(--gray500)', marginTop: 1 }}>{cv.cvData.experiences.length} esperienze</div>
                                  </div>
                                  <span style={{ color: 'var(--gray400)', fontSize: 12 }}>{expandedImportCVId === cv.id ? '▲' : '▼'}</span>
                                </button>
                                {expandedImportCVId === cv.id && cv.cvData.experiences.length > 0 && (
                                  <div style={{ marginTop: 4, paddingLeft: 8, display: 'flex', flexDirection: 'column', gap: 4 }}>
                                    {cv.cvData.experiences.map(exp => {
                                      const alreadyDone = importedFromCVExpIds.has(exp.id);
                                      return (
                                        <div key={exp.id} style={{ display: 'flex', alignItems: 'center', gap: 8, background: 'rgba(47, 42, 229, 0.04)', borderRadius: 8, padding: '8px 10px', border: '1px solid rgba(47, 42, 229, 0.14)' }}>
                                          <div style={{ flex: 1, minWidth: 0 }}>
                                            <div style={{ fontWeight: 600, fontSize: 12, color: 'var(--navy)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                              {exp.role} <span style={{ color: 'var(--gray500)', fontWeight: 400 }}>· {exp.company}</span>
                                            </div>
                                            {(exp.from || exp.to) && (
                                              <div style={{ fontSize: 10, color: 'var(--gray500)', marginTop: 1 }}>
                                                {exp.from}{exp.from && exp.to ? ' → ' : ''}{exp.to}
                                              </div>
                                            )}
                                          </div>
                                          <button
                                            className="btn btn-sm"
                                            style={{ fontSize: 10, background: alreadyDone ? 'var(--gray100)' : '#2F2AE5', color: alreadyDone ? 'var(--gray500)' : '#fff', border: 'none', flexShrink: 0 }}
                                            onClick={() => !alreadyDone && importExpFromSavedCV(exp)}
                                          >
                                            {alreadyDone ? '✓' : '+'}
                                          </button>
                                        </div>
                                      );
                                    })}
                                  </div>
                                )}
                                {expandedImportCVId === cv.id && cv.cvData.experiences.length === 0 && (
                                  <div style={{ fontSize: 11, color: 'var(--gray500)', padding: '6px 12px' }}>Nessuna esperienza in questo CV.</div>
                                )}
                              </div>
                            ))}
                          </div>
                        )}
                      </>
                    )}
                  </div>
                </div>
              )}
            </AccordionSection>

            {/* FORMAZIONE */}
            <AccordionSection title="Formazione" open={openSections.has('education')} onToggle={() => toggleSection('education')}>
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
            <AccordionSection title="Competenze" open={openSections.has('skills')} onToggle={() => toggleSection('skills')}>
              <div className="form-group">
                <label>Competenze tecniche e trasversali</label>
                {cvData.skillCategories?.length ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                    {cvData.skillCategories.map(cat => (
                      <div key={cat.name}>
                        <div style={{ fontSize: 10, fontWeight: 700, color: '#2F2AE5', textTransform: 'uppercase', letterSpacing: '0.8px', marginBottom: 5 }}>{cat.name}</div>
                        <div className="skills-container">
                          {cat.skills.map(skill => (
                            <div key={skill} className="skill-tag">
                              {skill}
                              <button onClick={() => removeSkillFromCategory(cat.name, skill)}>×</button>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                    {(() => {
                      const catSkillSet = new Set((cvData.skillCategories ?? []).flatMap(c => c.skills));
                      const uncategorized = cvData.skills.filter(s => !catSkillSet.has(s));
                      return uncategorized.length > 0 ? (
                        <div className="skills-container">
                          {uncategorized.map(skill => (
                            <div key={skill} className="skill-tag">
                              {skill}
                              <button onClick={() => removeSkill(skill)}>×</button>
                            </div>
                          ))}
                        </div>
                      ) : null;
                    })()}
                  </div>
                ) : (
                  <div className="skills-container">
                    {cvData.skills.map(skill => (
                      <div key={skill} className="skill-tag">
                        {skill}
                        <button onClick={() => removeSkill(skill)}>×</button>
                      </div>
                    ))}
                  </div>
                )}
                <div className="skill-input-row" style={{ marginTop: 10 }}>
                  <input
                    type="text"
                    placeholder="Aggiungi competenza..."
                    value={newSkill}
                    onChange={e => setNewSkill(e.target.value)}
                    onKeyDown={e => { if (e.key === 'Enter') addSkill(); }}
                    style={{ padding: '9px 12px', border: '1px solid rgba(15,23,42,0.12)', borderRadius: 10, fontFamily: 'inherit', fontSize: 13, color: 'var(--navy)', outline: 'none', flex: 1, background: '#FDFDFB' }}
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
            <AccordionSection title="Analisi ATS" open={openSections.has('ats')} onToggle={() => toggleSection('ats')}>
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
                  Senza job description il punteggio keyword è 0/50. Incolla l'annuncio per un'analisi completa.
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
            <AccordionSection title="Lingue" open={openSections.has('languages')} onToggle={() => toggleSection('languages')}>
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
            <button className="btn btn-gold btn-lg" style={{ width: '100%', gap: 8 }} onClick={handleDownload} disabled={downloading}>
              {downloading ? 'Generazione PDF…' : <><Icon d={IC.download} size={15} /> Scarica il tuo CV in PDF</>}
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
                <button className="btn btn-ghost btn-sm" style={{ gap: 6 }} onClick={handlePreview} disabled={previewing} title="Anteprima PDF in nuova scheda">
                  {previewing ? '…' : <Icon d={IC.eye} size={13} />} Anteprima
                </button>
                <button className="btn btn-gold btn-sm" style={{ gap: 6 }} onClick={handleDownload} disabled={downloading}>
                  {downloading ? 'Generando...' : <><Icon d={IC.download} size={13} /> PDF</>}
                </button>
              </div>
            </div>

            {/* Template selector button */}
            <div style={{ padding: '4px 16px 10px', display: 'flex', alignItems: 'center', gap: 10 }}>
              <button
                className="btn btn-ghost btn-sm"
                onClick={() => setShowTemplateModal(true)}
                style={{ display: 'flex', alignItems: 'center', gap: 7, fontWeight: 600 }}
              >
                <Icon d={IC.palette} size={14} /> Seleziona modello
              </button>
              <span style={{ fontSize: 12, color: 'var(--gray500)', fontWeight: 500 }}>
                Template attivo: <strong style={{ color: 'var(--navy)' }}>{selectedTemplate.charAt(0).toUpperCase() + selectedTemplate.slice(1)}</strong>
              </span>
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
                    ? <div className="ats-issue">Incolla la job description nella sezione "Analisi ATS" per calcolare il match</div>
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

          <AIAssistantPanel
            experiences={cvData.experiences}
            expTips={expTips}
            analyzing={analyzingAll}
            onAnalyzeAll={() => void handleAnalyzeAll()}
            onApplyTip={(expId, tipIndex) => void handleApplyTip(expId, tipIndex)}
            applyingTipKey={applyingTipKey}
          />

          <div className="preview-canvas" ref={previewRef}>
            <div className="cv-sheet" style={{ zoom: cvScale }}>
              <CVPreview cvData={cvData} template={selectedTemplate} lang={selectedLanguage} />
            </div>
          </div>
        </main>
      </div>

      {showTemplateModal && (
        <TemplateModal
          current={selectedTemplate}
          onSelect={onTemplateChange}
          onClose={() => setShowTemplateModal(false)}
        />
      )}
    </>
  );
}
