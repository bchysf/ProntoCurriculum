import { useState, useEffect, useCallback, useMemo } from 'react';
import { Page, CVData } from '../types';
import { useAuth } from '../hooks/use-auth';
import { Icon, IC } from '../components/StrokeIcon';
import { toast } from 'sonner';
import { useSeoMeta } from '../components/EditorialChrome';

// Offerte di lavoro — resume.io "Tailor" structure, Carta & Inchiostro skin.
// Left: searchable feed aggregated from free job boards (server-side).
// Right: job detail + AI compatibility analysis against the current CV,
// with recommended archive experiences and a handoff to the tailor flow.

interface JobPosting {
  id: string;
  title: string;
  company: string;
  location: string;
  country: string;
  description: string;
  url: string;
  source: string;
  postedAt: string | null;
  salary: string | null;
  remote: boolean;
}

interface StoredExp {
  id: string;
  role: string;
  company: string;
  description: string | null;
}

interface JobAnalysis {
  riassunto: string;
  requisiti: string[];
  compatibilita: number;
  puntiForti: string[];
  lacune: string[];
  modificheCv: string[];
  esperienzeConsigliate: string[];
}

interface JobsBoardProps {
  cvData: CVData;
  onNavigate: (page: Page) => void;
  onLogin: () => void;
}

const COUNTRIES: Array<[string, string]> = [
  ['it', '🇮🇹 Italia'],
  ['gb', '🇬🇧 Regno Unito'],
  ['de', '🇩🇪 Germania'],
  ['fr', '🇫🇷 Francia'],
  ['es', '🇪🇸 Spagna'],
  ['nl', '🇳🇱 Paesi Bassi'],
  ['us', '🇺🇸 Stati Uniti'],
  ['ch', '🇨🇭 Svizzera'],
  ['ca', '🇨🇦 Canada'],
  ['au', '🇦🇺 Australia'],
  ['nz', '🇳🇿 Nuova Zelanda'],
  ['ae', '🇦🇪 Emirati Arabi Uniti'],
  ['sa', '🇸🇦 Arabia Saudita'],
  ['qa', '🇶🇦 Qatar'],
  ['kw', '🇰🇼 Kuwait'],
  ['bh', '🇧🇭 Bahrein'],
  ['om', '🇴🇲 Oman'],
  ['ie', '🇮🇪 Irlanda'],
  ['se', '🇸🇪 Svezia'],
  ['no', '🇳🇴 Norvegia'],
  ['dk', '🇩🇰 Danimarca'],
  ['be', '🇧🇪 Belgio'],
  ['at', '🇦🇹 Austria'],
  ['sg', '🇸🇬 Singapore'],
];

// Providers often append the city to the title ("Agente di vendita - Taranto"):
// strip that suffix so the role dropdown groups them under one clean entry.
const cleanRole = (title: string) => title.split(/\s+[-–—|·]\s+/)[0].trim();
// Locations arrive as "Milano, Lombardia" or "Roma, Lazio, Italia": keep the city.
const cleanCity = (location: string) => location.split(',')[0].trim();

// Some providers (Jooble) return country-wide postings with the country name as
// location ("Italian Republic"): those aren't cities, keep them out of the dropdown.
const COUNTRY_LEVEL_LABELS = new Set([
  'italia', 'italy', 'italian republic', 'regno unito', 'united kingdom', 'great britain',
  'germania', 'germany', 'deutschland', 'francia', 'france', 'spagna', 'spain', 'españa',
  'paesi bassi', 'netherlands', 'nederland', 'stati uniti', 'united states', 'usa',
  'svizzera', 'switzerland', 'schweiz', 'suisse', 'canada', 'australia',
  'nuova zelanda', 'new zealand', 'emirati arabi uniti', 'united arab emirates',
  'arabia saudita', 'saudi arabia', 'qatar', 'kuwait', 'bahrein', 'bahrain', 'oman',
  'irlanda', 'ireland', 'svezia', 'sweden', 'sverige', 'norvegia', 'norway', 'norge',
  'danimarca', 'denmark', 'danmark', 'belgio', 'belgium', 'belgië', 'belgique',
  'austria', 'österreich', 'singapore', 'europe', 'europa', 'remote', 'worldwide',
]);
const isCountryLevel = (city: string) => COUNTRY_LEVEL_LABELS.has(city.toLowerCase());

// Benefits are not a structured API field: detect the common ones from the posting text.
const BENEFIT_PATTERNS: Array<[RegExp, string]> = [
  [/buoni\s+pasto|ticket\s+restaurant|meal\s+vouchers?/i, 'Buoni pasto'],
  [/smart\s*working|lavoro\s+da\s+remoto|remote\s+work|da\s+remoto|hybrid|ibrido/i, 'Smart working / ibrido'],
  [/welfare/i, 'Welfare aziendale'],
  [/assicurazione\s+sanitaria|health\s+insurance|polizza\s+sanitaria|copertura\s+sanitaria/i, 'Assicurazione sanitaria'],
  [/auto\s+aziendale|company\s+car/i, 'Auto aziendale'],
  [/bonus|incentiv|premi\s+di\s+(produzione|risultato)/i, 'Bonus / incentivi'],
  [/formazione|training|corsi\s+di/i, 'Formazione'],
  [/mensa\s+aziendale|mensa\b/i, 'Mensa'],
  [/stock\s+option|equity|azioni\s+aziendali/i, 'Stock options / equity'],
  [/tredicesima|quattordicesima/i, 'Tredicesima / quattordicesima'],
  [/orario\s+flessibile|flessibilit[àa]\s+orari/i, 'Orario flessibile'],
  [/ferie\s+aggiuntive|permessi\s+extra|unlimited\s+(pto|vacation)/i, 'Ferie extra'],
];
const detectBenefits = (desc: string) =>
  BENEFIT_PATTERNS.filter(([re]) => re.test(desc)).map(([, label]) => label);

interface SalaryStats {
  currency: string;
  p25: number;
  median: number;
  p75: number;
  samples: number;
  source: string;
}

const fmtSalary = (n: number, cur: string) => `${Math.round(n).toLocaleString('it-IT')} ${cur}`;

function timeAgo(iso: string | null): string {
  if (!iso) return '';
  const ms = Date.now() - Date.parse(iso);
  if (isNaN(ms) || ms < 0) return '';
  const d = Math.floor(ms / 86400000);
  if (d === 0) return 'oggi';
  if (d === 1) return 'ieri';
  if (d < 30) return `${d} giorni fa`;
  const m = Math.floor(d / 30);
  return m === 1 ? '1 mese fa' : `${m} mesi fa`;
}

const JB_CSS = `
.jb { max-width: 1180px; margin: 0 auto; display: flex; flex-direction: column; height: calc(100vh - 28px); padding-bottom: 16px; }
.jb * { box-sizing: border-box; }

.jb .head { flex-shrink: 0; }

/* header tools: result count + "Filtri" button opening a floating panel */
.jb-headtools { display: flex; align-items: center; gap: 14px; flex-wrap: wrap; }
.jb-count { display: flex; align-items: baseline; gap: 6px; font-size: 12.5px; color: var(--ink-60); white-space: nowrap; }
.jb-count b { font-family: var(--f-display); font-size: 15px; color: var(--ink); }
.jb-badge { background: var(--accent); color: #fff; font-size: 10px; font-weight: 800; border-radius: 99px; padding: 1px 7px; margin-left: 4px; }
.jb-pop { position: absolute; top: calc(100% + 8px); right: 0; z-index: 60; background: #fff; border: 1px solid var(--hair-soft); border-radius: 16px; box-shadow: 0 18px 44px rgba(20,23,31,.16); padding: 16px; width: 330px; max-width: calc(100vw - 40px); display: flex; flex-direction: column; gap: 12px; animation: jbIn .18s var(--ease); }
@keyframes jbIn { from { opacity: 0; transform: translateY(-6px); } }
.jb-field { display: flex; flex-direction: column; gap: 5px; }
.jb-field label { font-family: var(--f-mono); font-size: 9.5px; letter-spacing: .12em; text-transform: uppercase; color: var(--ink-40); padding-left: 2px; }
.jb-field select { appearance: none; -webkit-appearance: none; width: 100%; background: #F7F7FA url('data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="%239297A1" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M6 9l6 6 6-6"/></svg>') no-repeat right 12px center; border: 1px solid transparent; border-radius: 10px; padding: 10px 34px 10px 12px; font-family: var(--f-body); font-size: 13px; color: var(--ink); cursor: pointer; outline: none; transition: border-color .15s, background-color .15s, box-shadow .15s; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.jb-field select:hover { border-color: var(--hair); background-color: #fff; }
.jb-field select:focus { background-color: #fff; border-color: var(--accent); box-shadow: 0 0 0 3px rgba(47,42,229,.08); }
.jb-field select:disabled { opacity: .55; cursor: default; }
.jb-reset { border: none; background: none; color: var(--accent); font-weight: 700; font-size: 12px; cursor: pointer; font-family: var(--f-body); padding: 0; }
.jb-reset:hover { text-decoration: underline; }

/* floating salary window (minimizable / closable, recall pill top-right) */
.jb-sal-win { position: fixed; top: 72px; right: 26px; width: 330px; max-height: calc(100vh - 100px); overflow-y: auto; background: #fff; border: 1px solid var(--hair-soft); border-radius: 16px; box-shadow: 0 24px 60px -12px rgba(20,23,31,.35); z-index: 120; animation: jbIn .2s var(--ease); }
.jb-sal-head { display: flex; align-items: center; gap: 6px; padding: 13px 14px; border-bottom: 1px solid var(--hair-soft); position: sticky; top: 0; background: #fff; z-index: 2; }
.jb-sal-head h4 { font-family: var(--f-display); font-size: 14px; font-weight: 700; margin: 0; flex: 1; display: flex; align-items: center; gap: 7px; color: var(--ink); }
.jb-sal-head h4 svg { color: var(--accent); }
.jb-sal-ctl { border: none; background: transparent; width: 24px; height: 24px; border-radius: 6px; cursor: pointer; color: var(--ink-40); display: flex; align-items: center; justify-content: center; font-size: 15px; line-height: 1; padding: 0; }
.jb-sal-ctl:hover { background: #F4F4F8; color: var(--ink); }
.jb-sal-body { padding: 13px 16px 16px; }
.jb-sal-job { font-size: 12.5px; color: var(--ink-60); margin-bottom: 8px; line-height: 1.45; }
.jb-sal-job b { color: var(--ink); }
.jb-sal-row { display: flex; justify-content: space-between; align-items: baseline; padding: 7px 0; border-bottom: 1px dashed var(--hair-soft); font-size: 12px; color: var(--ink-60); }
.jb-sal-row b { font-family: var(--f-display); font-size: 13.5px; color: var(--ink); }
.jb-sal-row.mid b { font-size: 19px; color: var(--accent); }
.jb-sal-src { font-size: 10.5px; color: var(--ink-40); margin-top: 9px; line-height: 1.5; }
.jb-sal-pill { position: fixed; top: 72px; right: 26px; z-index: 120; display: flex; align-items: center; gap: 7px; background: #fff; border: 1.5px solid var(--accent); color: var(--accent); font-family: var(--f-body); font-weight: 800; font-size: 12.5px; border-radius: 99px; padding: 9px 16px; cursor: pointer; box-shadow: 0 10px 26px rgba(47,42,229,.22); animation: jbIn .2s var(--ease); }
.jb-sal-pill:hover { background: var(--tint); }

/* split */
.jb-split { flex: 1; display: grid; grid-template-columns: minmax(300px, 380px) 1fr; gap: 16px; min-height: 0; }
@media (max-width: 900px) { .jb-split { grid-template-columns: 1fr; } .jb-detail { display: none; } }
@media (max-width: 860px) {
  .jb { height: calc(100vh - 88px); }
  .jb-pop { position: fixed; top: 64px; left: 12px; right: 12px; width: auto; max-height: calc(100vh - 130px); overflow-y: auto; }
  .jb-sal-win { top: auto; bottom: 12px; right: 12px; left: 12px; width: auto; max-height: 60vh; }
  .jb-sal-pill { top: auto; bottom: 16px; right: 16px; }
}

/* list */
.jb-list { overflow-y: auto; display: flex; flex-direction: column; gap: 8px; padding-right: 2px; }
.jb-card { background: #fff; border: 1px solid var(--hair-soft); border-radius: 13px; padding: 13px 15px; cursor: pointer; text-align: left; font-family: var(--f-body); transition: all .15s; display: flex; gap: 11px; align-items: flex-start; }
.jb-card:hover { border-color: rgba(111,140,255,.4); }
.jb-card.on { border-color: var(--accent); box-shadow: 0 0 0 3px rgba(47,42,229,.08); }
.jb-logo { width: 36px; height: 36px; border-radius: 9px; background: var(--tint); color: var(--accent-ink); font-family: var(--f-display); font-weight: 700; font-size: 14px; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
.jb-card b { font-size: 13.5px; color: var(--ink); display: block; line-height: 1.35; }
.jb-card .sub { font-size: 12px; color: var(--ink-60); margin-top: 2px; }
.jb-card .meta { display: flex; gap: 6px; align-items: center; margin-top: 7px; flex-wrap: wrap; }
.jb-tag { font-size: 10px; font-weight: 800; letter-spacing: .03em; background: #F4F4F8; color: var(--ink-40); border-radius: 99px; padding: 2.5px 8px; }
.jb-tag.src { background: var(--tint); color: var(--accent); }
.jb-tag.rem { background: #E7F5EE; color: #12805C; }
.jb-empty { text-align: center; color: var(--ink-40); font-size: 13px; padding: 40px 16px; line-height: 1.6; }

/* detail */
.jb-detail { background: #fff; border: 1px solid var(--hair-soft); border-radius: 16px; overflow-y: auto; min-height: 0; }
.jb-d-head { padding: 22px 26px 16px; border-bottom: 1px solid var(--hair-soft); position: sticky; top: 0; background: #fff; z-index: 5; }
.jb-d-head h2 { font-family: var(--f-display); font-size: 20px; font-weight: 700; letter-spacing: -0.02em; margin: 0 0 4px; }
.jb-d-head .sub { font-size: 13px; color: var(--ink-60); }
.jb-d-acts { display: flex; gap: 8px; margin-top: 14px; flex-wrap: wrap; }
.jb-d-body { padding: 18px 26px 30px; }
.jb-desc { font-size: 13.5px; color: var(--ink-60); line-height: 1.7; white-space: pre-line; }

/* AI panel */
.jb-ai { background: #FAFAFC; border: 1px solid var(--hair-soft); border-radius: 14px; padding: 18px 20px; margin-bottom: 20px; }
.jb-ai-head { display: flex; align-items: center; gap: 12px; }
.jb-ring { width: 62px; height: 62px; border-radius: 50%; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
.jb-ring > span { width: 46px; height: 46px; border-radius: 50%; background: #FAFAFC; display: flex; align-items: center; justify-content: center; font-family: var(--f-display); font-weight: 700; font-size: 16px; }
.jb-ai h3 { font-family: var(--f-display); font-size: 15px; font-weight: 700; margin: 0; }
.jb-ai .psub { font-size: 12.5px; color: var(--ink-60); margin: 2px 0 0; }
.jb-sec-label { font-family: var(--f-mono); font-size: 9.5px; letter-spacing: .12em; text-transform: uppercase; color: var(--ink-40); margin: 16px 0 7px; }
.jb-kw { display: inline-flex; font-size: 11.5px; font-weight: 700; padding: 3.5px 10px; border-radius: 99px; margin: 0 5px 5px 0; background: #F1F2F6; color: var(--ink-60); }
.jb-li { display: flex; gap: 8px; font-size: 12.5px; color: var(--ink-60); line-height: 1.55; padding: 3px 0; }
.jb-li .dot { flex-shrink: 0; margin-top: 1px; font-weight: 800; }
.jb-exp { display: flex; align-items: center; gap: 10px; background: #fff; border: 1px solid rgba(47,42,229,.16); border-radius: 10px; padding: 9px 12px; margin-bottom: 6px; }
.jb-exp b { font-size: 12.5px; }
.jb-exp span { font-size: 11px; color: var(--ink-40); }
`;

export default function JobsBoard({ cvData, onNavigate, onLogin }: JobsBoardProps) {
  useSeoMeta(
    'Offerte di Lavoro in Italia con Analisi AI di Compatibilità | ProntoCurriculum',
    'Cerca offerte di lavoro aggregate dai principali portali italiani ed europei e scopri con l\'AI quanto il tuo CV è compatibile con ogni annuncio, con suggerimenti per candidarti al meglio.',
    '/offerte-lavoro',
  );
  const { isAuthenticated } = useAuth();

  const [country, setCountry] = useState('it');
  const [jobs, setJobs] = useState<JobPosting[]>([]);
  const [providers, setProviders] = useState<string[]>([]);
  const [searching, setSearching] = useState(false);
  const [searched, setSearched] = useState(false);
  const [selected, setSelected] = useState<JobPosting | null>(null);
  const [filterCity, setFilterCity] = useState('');
  const [filterRoleOrCompany, setFilterRoleOrCompany] = useState('');
  const [filtersOpen, setFiltersOpen] = useState(false);

  const [salaryWin, setSalaryWin] = useState<'closed' | 'open' | 'min'>('closed');
  const [salaryJob, setSalaryJob] = useState<JobPosting | null>(null);
  const [salaryStats, setSalaryStats] = useState<SalaryStats | null>(null);
  const [salaryLoading, setSalaryLoading] = useState(false);

  const [archive, setArchive] = useState<StoredExp[]>([]);
  const [analyses, setAnalyses] = useState<Record<string, JobAnalysis>>({});
  const [analyzing, setAnalyzing] = useState(false);

  const [translations, setTranslations] = useState<Record<string, { title: string; description: string }>>({});
  const [translating, setTranslating] = useState(false);
  const [showOriginal, setShowOriginal] = useState(false);

  const search = useCallback(async (query: string, location: string, cc: string) => {
    setSearching(true);
    try {
      const params = new URLSearchParams({ q: query, location, country: cc });
      const res = await fetch(`/api/jobs/search?${params}`);
      if (!res.ok) throw new Error(`Il server ha risposto ${res.status}`);
      const data = await res.json() as { jobs: JobPosting[]; providers: string[] };
      setJobs(data.jobs);
      setProviders(data.providers);
      setSelected(data.jobs[0] ?? null);
      setSearched(true);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Errore nella ricerca delle offerte');
    } finally {
      setSearching(false);
    }
  }, []);

  // First load: a broad search so the page is never empty.
  useEffect(() => {
    void search('', '', 'it');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // A fresh set of results invalidates any previously chosen dropdown filter.
  useEffect(() => { setFilterCity(''); setFilterRoleOrCompany(''); }, [jobs]);

  const countOptions = (values: string[]): Array<[string, number]> => {
    const m = new Map<string, number>();
    values.forEach(v => { if (v) m.set(v, (m.get(v) ?? 0) + 1); });
    return Array.from(m.entries()).sort((a, b) => a[0].localeCompare(b[0]));
  };

  const cityOptions = useMemo(
    () => countOptions(jobs.map(j => cleanCity(j.location)).filter(c => !isCountryLevel(c))),
    [jobs]
  );
  const roleOptions = useMemo(() => countOptions(jobs.map(j => cleanRole(j.title))), [jobs]);
  const companyOptions = useMemo(() => countOptions(jobs.map(j => j.company)), [jobs]);

  const filteredJobs = useMemo(
    () => jobs.filter(j =>
      (!filterCity || cleanCity(j.location) === filterCity) &&
      (!filterRoleOrCompany || cleanRole(j.title) === filterRoleOrCompany || j.company === filterRoleOrCompany)
    ),
    [jobs, filterCity, filterRoleOrCompany]
  );
  const hasActiveFilters = !!(filterCity || filterRoleOrCompany);
  const salaryBenefits = useMemo(() => salaryJob ? detectBenefits(salaryJob.description) : [], [salaryJob]);

  // Keep the selected job in sync with the filtered list.
  useEffect(() => {
    if (selected && !filteredJobs.some(j => j.id === selected.id)) {
      setSelected(filteredJobs[0] ?? null);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filteredJobs]);

  useEffect(() => {
    if (!isAuthenticated) return;
    void (async () => {
      try {
        const res = await fetch('/api/experiences', { credentials: 'include' });
        if (res.ok) {
          const data = await res.json() as { experiences: StoredExp[] };
          setArchive(data.experiences ?? []);
        }
      } catch { /* archive is optional */ }
    })();
  }, [isAuthenticated]);

  // Reset the "show original" toggle whenever a different job is selected.
  useEffect(() => { setShowOriginal(false); }, [selected?.id]);

  const analysis = selected ? analyses[selected.id] : undefined;
  const translation = selected ? translations[selected.id] : undefined;

  const handleTranslate = async () => {
    if (!selected) return;
    setTranslating(true);
    try {
      const res = await fetch('/api/jobs/translate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: selected.title, description: selected.description }),
      });
      const body = await res.json() as { success?: boolean; title?: string; description?: string; error?: string };
      if (!res.ok || !body.success) throw new Error(body.error ?? 'Traduzione non riuscita');
      setTranslations(prev => ({ ...prev, [selected.id]: { title: body.title!, description: body.description! } }));
      setShowOriginal(false);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Errore durante la traduzione dell'annuncio");
    } finally {
      setTranslating(false);
    }
  };

  const handleAnalyze = async () => {
    if (!selected) return;
    setAnalyzing(true);
    try {
      const res = await fetch('/api/jobs/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          job: { title: selected.title, company: selected.company, description: selected.description },
          cvData,
          experiences: archive,
        }),
      });
      const body = await res.json() as { success?: boolean; data?: JobAnalysis; error?: string };
      if (!res.ok || !body.success || !body.data) throw new Error(body.error ?? 'Analisi non riuscita');
      setAnalyses(prev => ({ ...prev, [selected.id]: body.data! }));
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Errore durante l'analisi AI");
    } finally {
      setAnalyzing(false);
    }
  };

  const handleSalary = async (job: JobPosting) => {
    setSalaryJob(job);
    setSalaryWin('open');
    setSalaryStats(null);
    setSalaryLoading(true);
    try {
      const city = cleanCity(job.location);
      const params = new URLSearchParams({
        title: cleanRole(job.title),
        location: isCountryLevel(city) ? '' : city,
        country: (job.country || country).toLowerCase().slice(0, 2),
      });
      const res = await fetch(`/api/jobs/salary?${params}`);
      const body = await res.json() as { salary?: SalaryStats; error?: string };
      if (!res.ok || !body.salary) throw new Error(body.error ?? 'Dati retributivi non disponibili');
      setSalaryStats(body.salary);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Errore nella stima dello stipendio');
      setSalaryWin('closed');
    } finally {
      setSalaryLoading(false);
    }
  };

  const handleTailor = (job: JobPosting) => {
    sessionStorage.setItem('pc_pending_job', JSON.stringify({
      title: job.title,
      company: job.company,
      description: job.description,
    }));
    if (!isAuthenticated) { onLogin(); return; }
    onNavigate('tailor');
  };

  const scoreColor = (n: number) => n >= 70 ? 'var(--success)' : n >= 45 ? '#D99A2B' : 'var(--danger)';

  const recommended = analysis
    ? archive.filter(e => analysis.esperienzeConsigliate.includes(e.id))
    : [];

  return (
    <div className="jb">
      <style>{JB_CSS}</style>

      <div className="head" style={{ marginBottom: 14 }}>
        <div>
          <h1>Offerte di lavoro</h1>
          <p>
            Annunci reali dalle principali job board{providers.length > 0 ? ` (${providers.join(', ')})` : ''}. L'AI misura la compatibilità col tuo CV e ti dice cosa cambiare.
          </p>
        </div>
        <div className="jb-headtools">
          {searched && !searching && jobs.length > 0 && (
            <div className="jb-count">
              <b>{filteredJobs.length}</b>
              <span>{filteredJobs.length === 1 ? 'offerta' : 'offerte'}{hasActiveFilters ? ` su ${jobs.length}` : ''}</span>
              {hasActiveFilters && (
                <button className="jb-reset" onClick={() => { setFilterCity(''); setFilterRoleOrCompany(''); }}>
                  Azzera
                </button>
              )}
            </div>
          )}
          <div style={{ position: 'relative' }}>
            <button className="btn btn-line" style={{ gap: 7 }} onClick={() => setFiltersOpen(v => !v)}>
              <Icon d={IC.sliders} size={14} /> Filtri
              {(Number(!!filterCity) + Number(!!filterRoleOrCompany)) > 0 && (
                <span className="jb-badge">{Number(!!filterCity) + Number(!!filterRoleOrCompany)}</span>
              )}
            </button>
            {filtersOpen && (
              <>
                <div style={{ position: 'fixed', inset: 0, zIndex: 55 }} onClick={() => setFiltersOpen(false)} />
                <div className="jb-pop">
                  <div className="jb-field">
                    <label>Ruolo o azienda</label>
                    <select value={filterRoleOrCompany} onChange={e => setFilterRoleOrCompany(e.target.value)} disabled={jobs.length === 0}>
                      <option value="">Tutti i ruoli e le aziende</option>
                      <optgroup label="Ruoli">
                        {roleOptions.map(([r, n]) => <option key={`r-${r}`} value={r}>{r} ({n})</option>)}
                      </optgroup>
                      <optgroup label="Aziende">
                        {companyOptions.map(([c, n]) => <option key={`c-${c}`} value={c}>{c} ({n})</option>)}
                      </optgroup>
                    </select>
                  </div>
                  <div className="jb-field">
                    <label>Città</label>
                    <select value={filterCity} onChange={e => setFilterCity(e.target.value)} disabled={jobs.length === 0}>
                      <option value="">Tutte le città</option>
                      {cityOptions.map(([c, n]) => <option key={c} value={c}>{c} ({n})</option>)}
                    </select>
                  </div>
                  <div className="jb-field">
                    <label>Paese</label>
                    <select value={country} onChange={e => { const cc = e.target.value; setCountry(cc); void search('', '', cc); }}>
                      {COUNTRIES.map(([code, label]) => <option key={code} value={code}>{label}</option>)}
                    </select>
                  </div>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <button className="btn btn-ink btn-sm" style={{ flex: 1, justifyContent: 'center', gap: 6 }} disabled={searching} onClick={() => void search('', '', country)}>
                      {searching ? 'Ricerca…' : <><Icon d={IC.refresh} size={12} /> Aggiorna</>}
                    </button>
                    <button className="btn btn-ghost btn-sm" onClick={() => setFiltersOpen(false)}>Chiudi</button>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      <div className="jb-split">
        {/* LIST */}
        <div className="jb-list">
          {searching && jobs.length === 0 && (
            <div className="jb-empty"><div className="spinner" style={{ margin: '0 auto 12px' }} />Ricerca sulle job board in corso…</div>
          )}
          {!searching && searched && jobs.length === 0 && (
            <div className="jb-empty">
              Nessuna offerta trovata per questa ricerca.<br />
              Prova con parole più generiche o cambia paese.
            </div>
          )}
          {!searching && jobs.length > 0 && filteredJobs.length === 0 && (
            <div className="jb-empty">
              Nessuna offerta corrisponde ai filtri selezionati.<br />
              Prova a cambiare o azzerare i filtri.
            </div>
          )}
          {filteredJobs.map(job => (
            <button key={job.id} className={`jb-card${selected?.id === job.id ? ' on' : ''}`} onClick={() => setSelected(job)}>
              <span className="jb-logo">{(job.company[0] ?? '?').toUpperCase()}</span>
              <span style={{ minWidth: 0 }}>
                <b>{job.title}</b>
                <span className="sub">{job.company}{job.location ? ` · ${job.location}` : ''}</span>
                <span className="meta">
                  <span className="jb-tag src">{job.source}</span>
                  {job.remote && <span className="jb-tag rem">Remote</span>}
                  {job.postedAt && <span className="jb-tag">{timeAgo(job.postedAt)}</span>}
                  {analyses[job.id] && (
                    <span className="jb-tag" style={{ background: '#E7F5EE', color: scoreColor(analyses[job.id]!.compatibilita) }}>
                      {analyses[job.id]!.compatibilita}% match
                    </span>
                  )}
                </span>
              </span>
            </button>
          ))}
        </div>

        {/* DETAIL */}
        <div className="jb-detail">
          {!selected ? (
            <div className="jb-empty" style={{ paddingTop: 80 }}>Seleziona un'offerta per vedere i dettagli.</div>
          ) : (
            <>
              <div className="jb-d-head">
                <h2>{translation && !showOriginal ? translation.title : selected.title}</h2>
                <div className="sub">
                  {selected.company}{selected.location ? ` · ${selected.location}` : ''}
                  {selected.salary ? ` · ${selected.salary}` : ''}
                  {selected.postedAt ? ` · ${timeAgo(selected.postedAt)}` : ''}
                </div>
                <div className="jb-d-acts">
                  <button className="btn btn-ink btn-sm" style={{ gap: 6 }} onClick={() => handleTailor(selected)}>
                    <Icon d={IC.spark} size={13} /> Crea CV su misura per questa offerta
                  </button>
                  {!analysis && (
                    <button className="btn btn-line btn-sm" onClick={() => void handleAnalyze()} disabled={analyzing}>
                      {analyzing ? 'Analisi in corso…' : 'Analizza col mio CV'}
                    </button>
                  )}
                  <button className="btn btn-line btn-sm" style={{ gap: 6 }} onClick={() => void handleSalary(selected)} disabled={salaryLoading && salaryJob?.id === selected.id}>
                    <Icon d={IC.coins} size={13} />
                    {salaryLoading && salaryJob?.id === selected.id ? 'Stima in corso…' : 'Stima stipendio'}
                  </button>
                  {!translation && (
                    <button className="btn btn-line btn-sm" onClick={() => void handleTranslate()} disabled={translating}>
                      {translating ? 'Traduzione…' : 'Traduci in italiano'}
                    </button>
                  )}
                  {translation && (
                    <button className="btn btn-line btn-sm" onClick={() => setShowOriginal(v => !v)}>
                      {showOriginal ? 'Vedi traduzione' : 'Vedi originale'}
                    </button>
                  )}
                  {selected.url && (
                    <a className="btn btn-ghost btn-sm" href={selected.url} target="_blank" rel="noopener noreferrer" style={{ textDecoration: 'none' }}>
                      Annuncio originale ↗
                    </a>
                  )}
                </div>
              </div>

              <div className="jb-d-body">
                {/* AI ANALYSIS */}
                {analysis && (
                  <div className="jb-ai">
                    <div className="jb-ai-head">
                      <div className="jb-ring" style={{ background: `conic-gradient(${scoreColor(analysis.compatibilita)} 0 ${analysis.compatibilita}%, #EDEDF2 ${analysis.compatibilita}% 100%)` }}>
                        <span style={{ color: scoreColor(analysis.compatibilita) }}>{analysis.compatibilita}</span>
                      </div>
                      <div>
                        <h3>Compatibilità col tuo CV</h3>
                        <p className="psub">{analysis.riassunto}</p>
                      </div>
                    </div>

                    {analysis.requisiti.length > 0 && (
                      <>
                        <div className="jb-sec-label">Requisiti chiave dell'annuncio</div>
                        <div>{analysis.requisiti.map(r => <span key={r} className="jb-kw">{r}</span>)}</div>
                      </>
                    )}

                    {analysis.puntiForti.length > 0 && (
                      <>
                        <div className="jb-sec-label">I tuoi punti forti</div>
                        {analysis.puntiForti.map(p => (
                          <div key={p} className="jb-li"><span className="dot" style={{ color: '#12805C' }}>✓</span>{p}</div>
                        ))}
                      </>
                    )}

                    {analysis.lacune.length > 0 && (
                      <>
                        <div className="jb-sec-label">Dove il CV è debole</div>
                        {analysis.lacune.map(p => (
                          <div key={p} className="jb-li"><span className="dot" style={{ color: 'var(--danger)' }}>✗</span>{p}</div>
                        ))}
                      </>
                    )}

                    {analysis.modificheCv.length > 0 && (
                      <>
                        <div className="jb-sec-label">Come adattare il CV</div>
                        {analysis.modificheCv.map((p, i) => (
                          <div key={p} className="jb-li"><span className="dot" style={{ color: 'var(--accent)' }}>{i + 1}.</span>{p}</div>
                        ))}
                      </>
                    )}

                    {recommended.length > 0 && (
                      <>
                        <div className="jb-sec-label">Dal tuo archivio: esperienze da aggiungere</div>
                        {recommended.map(e => (
                          <div key={e.id} className="jb-exp">
                            <Icon d={IC.check} size={13} style={{ color: 'var(--accent)', flexShrink: 0 }} />
                            <div style={{ minWidth: 0 }}>
                              <b>{e.role}</b> <span>· {e.company}</span>
                            </div>
                          </div>
                        ))}
                      </>
                    )}

                    <div style={{ display: 'flex', gap: 8, marginTop: 16, flexWrap: 'wrap' }}>
                      <button className="btn btn-ink btn-sm" style={{ gap: 6 }} onClick={() => handleTailor(selected)}>
                        <Icon d={IC.spark} size={13} /> Applica con il CV su misura
                      </button>
                      {!isAuthenticated && (
                        <button className="btn btn-line btn-sm" onClick={onLogin}>
                          Accedi per usare il tuo archivio
                        </button>
                      )}
                    </div>
                  </div>
                )}

                <div className="jb-sec-label" style={{ marginTop: 0 }}>
                  Descrizione dell'offerta{translation && !showOriginal ? ' (tradotta)' : ''}
                </div>
                <div className="jb-desc">
                  {(translation && !showOriginal ? translation.description : selected.description) || 'Descrizione non disponibile: apri l\'annuncio originale.'}
                </div>
              </div>
            </>
          )}
        </div>
      </div>

      {/* FLOATING SALARY WINDOW */}
      {salaryWin === 'open' && salaryJob && (
        <div className="jb-sal-win">
          <div className="jb-sal-head">
            <h4><Icon d={IC.coins} size={14} /> Stima stipendio</h4>
            <button className="jb-sal-ctl" title="Riduci" aria-label="Riduci" onClick={() => setSalaryWin('min')}>–</button>
            <button className="jb-sal-ctl" title="Chiudi" aria-label="Chiudi" onClick={() => setSalaryWin('closed')}>×</button>
          </div>
          <div className="jb-sal-body">
            <div className="jb-sal-job">
              <b>{cleanRole(salaryJob.title)}</b> · {salaryJob.company}
              {!isCountryLevel(cleanCity(salaryJob.location)) && cleanCity(salaryJob.location) ? ` · ${cleanCity(salaryJob.location)}` : ''}
            </div>
            {salaryLoading && (
              <div className="jb-empty" style={{ padding: '20px 0' }}>
                <div className="spinner" style={{ margin: '0 auto 10px' }} />
                Stima della retribuzione in corso…
              </div>
            )}
            {!salaryLoading && salaryStats && (
              <>
                <div className="jb-sal-row"><span>25° percentile</span><b>{fmtSalary(salaryStats.p25, salaryStats.currency)}</b></div>
                <div className="jb-sal-row mid"><span>Mediana · annuo lordo</span><b>{fmtSalary(salaryStats.median, salaryStats.currency)}</b></div>
                <div className="jb-sal-row"><span>75° percentile</span><b>{fmtSalary(salaryStats.p75, salaryStats.currency)}</b></div>
                {salaryBenefits.length > 0 && (
                  <>
                    <div className="jb-sec-label">Benefit citati nell'annuncio</div>
                    <div>{salaryBenefits.map(b => <span key={b} className="jb-kw">{b}</span>)}</div>
                  </>
                )}
                <div className="jb-sal-src">
                  {salaryStats.source}{salaryStats.samples ? ` · ${salaryStats.samples} campioni` : ''}. Stima indicativa basata su annunci e dati di mercato.
                </div>
                <button className="btn btn-ink btn-sm" style={{ width: '100%', justifyContent: 'center', marginTop: 12 }} onClick={() => onNavigate('calcolo-stipendio')}>
                  Apri il calcolatore completo
                </button>
              </>
            )}
          </div>
        </div>
      )}
      {salaryWin === 'min' && salaryJob && (
        <button className="jb-sal-pill" onClick={() => setSalaryWin('open')} title="Riapri la stima stipendio">
          <Icon d={IC.coins} size={14} />
          {salaryStats ? fmtSalary(salaryStats.median, salaryStats.currency) : 'Stipendio'}
        </button>
      )}
    </div>
  );
}
