import { useState, useEffect, useCallback } from 'react';
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
];

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

/* search bar */
.jb-search { display: flex; gap: 8px; flex-wrap: wrap; margin-bottom: 16px; flex-shrink: 0; }
.jb-search input, .jb-search select { background: #F1F2F6; border: 1px solid transparent; border-radius: 10px; padding: 10px 13px; font-family: var(--f-body); font-size: 13.5px; color: var(--ink); outline: none; transition: all .15s; }
.jb-search input:focus, .jb-search select:focus { background: #fff; border-color: var(--accent); box-shadow: 0 0 0 3px rgba(47,42,229,.08); }
.jb-q { flex: 2 1 220px; }
.jb-loc { flex: 1 1 140px; }
.jb-cc { flex: 0 0 auto; cursor: pointer; }

/* split */
.jb-split { flex: 1; display: grid; grid-template-columns: minmax(300px, 380px) 1fr; gap: 16px; min-height: 0; }
@media (max-width: 900px) { .jb-split { grid-template-columns: 1fr; } .jb-detail { display: none; } }

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

  const [q, setQ] = useState('');
  const [loc, setLoc] = useState('');
  const [country, setCountry] = useState('it');
  const [jobs, setJobs] = useState<JobPosting[]>([]);
  const [providers, setProviders] = useState<string[]>([]);
  const [searching, setSearching] = useState(false);
  const [searched, setSearched] = useState(false);
  const [selected, setSelected] = useState<JobPosting | null>(null);

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
      </div>

      {/* SEARCH */}
      <form className="jb-search" onSubmit={e => { e.preventDefault(); void search(q, loc, country); }}>
        <input className="jb-q" placeholder="Ruolo, competenza o azienda… (es. project manager)" value={q} onChange={e => setQ(e.target.value)} />
        <input className="jb-loc" placeholder="Città (es. Milano)" value={loc} onChange={e => setLoc(e.target.value)} />
        <select className="jb-cc" value={country} onChange={e => setCountry(e.target.value)} title="Paese">
          {COUNTRIES.map(([code, label]) => <option key={code} value={code}>{label}</option>)}
        </select>
        <button type="submit" className="btn btn-ink" style={{ gap: 7 }} disabled={searching}>
          {searching ? 'Ricerca…' : <><Icon d={IC.spark} size={14} /> Cerca</>}
        </button>
      </form>

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
          {jobs.map(job => (
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
    </div>
  );
}
