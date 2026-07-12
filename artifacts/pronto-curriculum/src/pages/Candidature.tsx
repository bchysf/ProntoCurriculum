import { useState, useEffect, useCallback } from 'react';
import { Page, CVData, SavedTailoredCv } from '../types';
import { useAuth } from '../hooks/use-auth';
import { downloadCVAsDOCX } from '../utils/downloadDOCX';
import { toast } from 'sonner';

interface CandidatureProps {
  onNavigate: (page: Page) => void;
  onCVLoaded: (data: CVData) => void;
  onLogin: () => void;
}

type CrmStatus = 'da_inviare' | 'inviata' | 'colloquio' | 'offerta' | 'archiviata';

const STATUS_CONFIG: Record<CrmStatus, { label: string; bg: string; color: string; border: string; icon: string }> = {
  da_inviare: { label: 'Da Inviare', bg: '#F1F5F9', color: '#475569', border: '#CBD5E1', icon: '⏳' },
  inviata:    { label: 'Inviata',    bg: '#EFF6FF', color: '#2563EB', border: '#BFDBFE', icon: '🚀' },
  colloquio:  { label: 'Colloquio',  bg: '#FEF3C7', color: '#D97706', border: '#FDE68A', icon: '🎯' },
  offerta:    { label: 'Offerta 🎉', bg: '#DCFCE7', color: '#16A34A', border: '#BBF7D0', icon: '🏆' },
  archiviata: { label: 'Archiviata', bg: '#F8FAFC', color: '#94A3B8', border: '#E2E8F0', icon: '📦' },
};

interface InterviewPrepData {
  questions: Array<{ question: string; category: string; suggestedAnswer: string }>;
  strengths: Array<{ title: string; desc: string }>;
  objections: Array<{ objection: string; defense: string }>;
  questionsToAsk: string[];
}

export default function Candidature({ onNavigate, onCVLoaded, onLogin }: CandidatureProps) {
  const { isAuthenticated, isLoading } = useAuth();
  const [cvs, setCvs] = useState<SavedTailoredCv[]>([]);
  const [fetching, setFetching] = useState(false);
  const [fetchError, setFetchError] = useState('');
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [downloadingDocxId, setDownloadingDocxId] = useState<string | null>(null);

  // CRM State
  const [viewMode, setViewMode] = useState<'list' | 'kanban'>('list');
  const [statusMap, setStatusMap] = useState<Record<string, CrmStatus>>({});
  const [notesMap, setNotesMap] = useState<Record<string, string>>({});
  const [editingNoteId, setEditingNoteId] = useState<string | null>(null);
  const [tempNoteText, setTempNoteText] = useState('');

  // AI Interview Coach State
  const [prepCv, setPrepCv] = useState<SavedTailoredCv | null>(null);
  const [prepLoading, setPrepLoading] = useState(false);
  const [prepData, setPrepData] = useState<InterviewPrepData | null>(null);
  const [prepError, setPrepError] = useState('');
  const [activeTab, setActiveTab] = useState<'questions' | 'strengths' | 'objections' | 'ask'>('questions');

  // Load CRM state from localStorage
  useEffect(() => {
    try {
      const savedStatus = localStorage.getItem('pc_crm_statuses');
      if (savedStatus) setStatusMap(JSON.parse(savedStatus) as Record<string, CrmStatus>);
      const savedNotes = localStorage.getItem('pc_crm_notes');
      if (savedNotes) setNotesMap(JSON.parse(savedNotes) as Record<string, string>);
    } catch {
      // ignore
    }
  }, []);

  const updateStatus = (id: string, st: CrmStatus) => {
    const next = { ...statusMap, [id]: st };
    setStatusMap(next);
    localStorage.setItem('pc_crm_statuses', JSON.stringify(next));
    toast.success(`Stato aggiornato a: ${STATUS_CONFIG[st].label}`);
  };

  const saveNote = (id: string) => {
    const next = { ...notesMap, [id]: tempNoteText };
    setNotesMap(next);
    localStorage.setItem('pc_crm_notes', JSON.stringify(next));
    setEditingNoteId(null);
    toast.success('Nota salvata nel CRM');
  };

  const fetchCvs = useCallback(async () => {
    setFetching(true);
    setFetchError('');
    try {
      const res = await fetch('/api/tailored-cvs', { credentials: 'include' });
      const data = await res.json() as { tailoredCvs?: SavedTailoredCv[]; error?: string };
      if (!res.ok) {
        setFetchError(data.error ?? 'Errore nel caricamento delle candidature.');
        return;
      }
      setCvs(data.tailoredCvs ?? []);
    } catch {
      setFetchError('Errore di rete. Controlla la connessione e riprova.');
    } finally {
      setFetching(false);
    }
  }, []);

  useEffect(() => {
    if (isAuthenticated) {
      void fetchCvs();
    }
  }, [isAuthenticated, fetchCvs]);

  const handleEdit = (cv: SavedTailoredCv) => {
    onCVLoaded(cv.cvData);
    onNavigate('builder-step2');
  };

  const handleDelete = async (id: string) => {
    setDeletingId(id);
    try {
      const res = await fetch(`/api/tailored-cvs/${id}`, {
        method: 'DELETE',
        credentials: 'include',
      });
      if (res.ok) {
        setCvs(prev => prev.filter(c => c.id !== id));
        toast.success('Candidatura eliminata');
      } else {
        const data = await res.json() as { error?: string };
        alert(data.error ?? "Errore durante l'eliminazione.");
      }
    } catch {
      alert('Errore di rete.');
    } finally {
      setDeletingId(null);
    }
  };

  const handleQuickDownloadDOCX = async (cv: SavedTailoredCv) => {
    setDownloadingDocxId(cv.id);
    try {
      await downloadCVAsDOCX(cv.jobTitle || 'Candidatura', cv.cvData, cv.template || 'modern');
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : 'Errore durante il download del file Word (.docx)');
    } finally {
      setDownloadingDocxId(null);
    }
  };

  const openInterviewCoach = async (cv: SavedTailoredCv) => {
    setPrepCv(cv);
    setPrepLoading(true);
    setPrepData(null);
    setPrepError('');
    setActiveTab('questions');

    try {
      const res = await fetch('/api/tailored-cvs/interview-prep', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          jobTitle: cv.jobTitle,
          jobDescription: cv.jobDescription,
          cvData: cv.cvData,
        }),
      });

      const json = await res.json() as { success?: boolean; data?: InterviewPrepData; error?: string };
      if (!res.ok || !json.success || !json.data) {
        setPrepError(json.error || 'Errore durante la generazione dei consigli per il colloquio.');
        return;
      }
      setPrepData(json.data);
    } catch {
      setPrepError('Errore di rete. Controlla la tua connessione.');
    } finally {
      setPrepLoading(false);
    }
  };

  const formatDate = (iso: string) => {
    try {
      return new Date(iso).toLocaleDateString('it-IT', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
      });
    } catch {
      return iso;
    }
  };

  return (
    <div style={{ maxWidth: 1140, margin: '0 auto', padding: '8px 24px 80px' }}>
      {/* Header */}
      <div className="head">
        <div>
          <h1>Candidature</h1>
          <p>
            Traccia lo stato di ogni invio, prendi note e allenati con il Coach AI prima del colloquio.
          </p>
        </div>

        {isAuthenticated && cvs.length > 0 && (
          <div style={{ display: 'flex', gap: 4, background: '#F4F4F8', padding: 4, borderRadius: 10 }}>
            <button
              className={`btn btn-sm ${viewMode === 'list' ? 'btn-ink' : 'btn-ghost'}`}
              onClick={() => setViewMode('list')}
              style={{ borderRadius: 8 }}
            >
              Lista CRM
            </button>
            <button
              className={`btn btn-sm ${viewMode === 'kanban' ? 'btn-ink' : 'btn-ghost'}`}
              onClick={() => setViewMode('kanban')}
              style={{ borderRadius: 8 }}
            >
              Kanban
            </button>
          </div>
        )}
      </div>

      {/* Auth gate */}
      {!isLoading && !isAuthenticated ? (
        <div className="lock-state" style={{ minHeight: '40vh' }}>
          <h2>Accedi per gestire le tue candidature</h2>
          <p style={{ color: 'var(--ink-60)', fontSize: 14.5, maxWidth: 480, lineHeight: 1.6 }}>
            Conserva i CV su misura generati per ogni singola offerta di lavoro, monitora gli step delle selezioni e sblocca il Coach per i colloqui.
          </p>
          <button className="btn btn-ink" onClick={onLogin}>
            Accedi
          </button>
        </div>
      ) : fetching ? (
        <div className="loading-state" style={{ minHeight: '40vh' }}>
          <div className="spinner" />
          <span>Caricamento CRM e candidature…</span>
        </div>
      ) : fetchError ? (
        <div style={{ padding: '20px', background: '#FFF3F3', border: '1px solid #FFCECE', borderRadius: 12, color: 'var(--danger)', fontSize: 14, textAlign: 'center', maxWidth: 600, margin: '40px auto' }}>
          ⚠️ {fetchError}
          <button className="btn btn-ghost btn-sm" style={{ marginLeft: 16, fontSize: 13 }} onClick={() => void fetchCvs()}>
            Riprova
          </button>
        </div>
      ) : cvs.length === 0 ? (
        <div className="panel" style={{ padding: '56px 48px', textAlign: 'center', maxWidth: 640, margin: '40px auto' }}>
          <h2 style={{ fontFamily: 'var(--f-display)', fontSize: 22, fontWeight: 700, letterSpacing: '-0.02em', marginBottom: 10 }}>
            Il tuo CRM è ancora vuoto
          </h2>
          <p style={{ color: 'var(--gray500)', fontSize: 15, marginBottom: 32, lineHeight: 1.7 }}>
            Genera il tuo primo CV calibrato al 100% sull'annuncio di lavoro. Verrà salvato nel tuo pannello personale e potrai avviare la simulazione del colloquio con l'Intelligenza Artificiale.
          </p>
          <button className="btn btn-gold" style={{ fontSize: 16, padding: '14px 36px', fontWeight: 700 }} onClick={() => onNavigate('tailor')}>
            ✦ Genera Primo CV su Misura
          </button>
        </div>
      ) : viewMode === 'list' ? (
        /* LIST VIEW */
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {cvs.map((cv) => {
            const st = statusMap[cv.id] ?? 'da_inviare';
            const cfg = STATUS_CONFIG[st];
            const note = notesMap[cv.id];

            return (
              <div
                key={cv.id}
                style={{
                  background: '#FFFFFF',
                  border: '1px solid var(--border)',
                  borderRadius: 16,
                  padding: '24px',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.02)',
                  transition: 'all 0.2s',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 16, marginBottom: 16 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                    <div style={{ width: 48, height: 48, borderRadius: 12, background: 'linear-gradient(135deg, var(--navy), var(--gold))', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22, color: '#fff', flexShrink: 0 }}>
                      ✦
                    </div>
                    <div>
                      <h3 style={{ fontSize: 18, fontWeight: 700, color: 'var(--navy)', margin: 0 }}>
                        {cv.jobTitle || 'CV su misura per offerta'}
                      </h3>
                      <div style={{ fontSize: 12.5, color: 'var(--gray500)', marginTop: 4 }}>
                        Creata il {formatDate(cv.createdAt)} · Template: <span style={{ textTransform: 'capitalize', fontWeight: 600 }}>{cv.template || 'modern'}</span>
                      </div>
                    </div>
                  </div>

                  {/* Status Dropdown Badge */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ fontSize: 12, color: 'var(--gray500)', fontWeight: 600 }}>Stato:</span>
                    <select
                      value={st}
                      onChange={(e) => updateStatus(cv.id, e.target.value as CrmStatus)}
                      style={{
                        background: cfg.bg,
                        color: cfg.color,
                        border: `1px solid ${cfg.border}`,
                        padding: '6px 12px',
                        borderRadius: 20,
                        fontSize: 13,
                        fontWeight: 700,
                        cursor: 'pointer',
                        outline: 'none',
                      }}
                    >
                      {(Object.keys(STATUS_CONFIG) as CrmStatus[]).map((k) => (
                        <option key={k} value={k} style={{ background: '#fff', color: '#1E293B' }}>
                          {STATUS_CONFIG[k].icon} {STATUS_CONFIG[k].label}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Job description snippet / Notes */}
                <div style={{ background: 'var(--gray50)', padding: '12px 16px', borderRadius: 10, fontSize: 13, color: 'var(--gray700)', marginBottom: 20, lineHeight: 1.5, borderLeft: '3px solid var(--gold)' }}>
                  <div style={{ fontWeight: 700, fontSize: 11.5, color: 'var(--gray500)', textTransform: 'uppercase', marginBottom: 4 }}>
                    📝 Note CRM / Job Description
                  </div>
                  {editingNoteId === cv.id ? (
                    <div style={{ marginTop: 8 }}>
                      <textarea
                        rows={2}
                        className="input"
                        placeholder="Aggiungi una nota personale (es. Riferimento HR Marco, RAL richiesta 45k, colloquio giovedì ore 15)..."
                        value={tempNoteText}
                        onChange={(e) => setTempNoteText(e.target.value)}
                        style={{ width: '100%', fontSize: 13, padding: 8 }}
                      />
                      <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
                        <button className="btn btn-gold btn-sm" onClick={() => saveNote(cv.id)}>Salva Nota</button>
                        <button className="btn btn-ghost btn-sm" onClick={() => setEditingNoteId(null)}>Annulla</button>
                      </div>
                    </div>
                  ) : (
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontStyle: note ? 'normal' : 'italic', color: note ? 'var(--navy)' : 'var(--gray500)' }}>
                        {note || cv.jobDescription.slice(0, 140) + '...'}
                      </span>
                      <button
                        className="btn btn-ghost btn-sm"
                        style={{ fontSize: 12, color: 'var(--gold)', fontWeight: 700, flexShrink: 0 }}
                        onClick={() => { setEditingNoteId(cv.id); setTempNoteText(note || ''); }}
                      >
                        {note ? '✏️ Modifica Nota' : '+ Aggiungi Nota CRM'}
                      </button>
                    </div>
                  )}
                </div>

                {/* Action Buttons Toolbar */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12, paddingTop: 16, borderTop: '1px solid var(--hairline)' }}>
                  <div style={{ display: 'flex', gap: 10 }}>
                    <button
                      className="btn btn-sm"
                      style={{ background: 'linear-gradient(135deg, #14171F, #221FB4)', color: '#F8FAFC', fontWeight: 700, padding: '8px 18px', border: 'none', borderRadius: 8 }}
                      onClick={() => void openInterviewCoach(cv)}
                    >
                      🎯 Coach Colloquio AI
                    </button>
                    <button
                      className="btn btn-gold btn-sm"
                      style={{ fontSize: 13, padding: '8px 16px', fontWeight: 700 }}
                      onClick={() => handleEdit(cv)}
                    >
                      ✏️ Apri CV nell'Editor
                    </button>
                  </div>

                  <div style={{ display: 'flex', gap: 8 }}>
                    <button
                      className="btn btn-line btn-sm"
                      style={{ fontSize: 13, padding: '7px 14px' }}
                      disabled={downloadingDocxId === cv.id}
                      onClick={() => void handleQuickDownloadDOCX(cv)}
                      title="Scarica in formato Word (.docx)"
                    >
                      {downloadingDocxId === cv.id ? '…' : '📄 Scarica Word (.docx)'}
                    </button>
                    <button
                      className="btn btn-ghost btn-sm"
                      style={{ fontSize: 13, padding: '7px 14px', color: 'var(--danger)', opacity: deletingId === cv.id ? 0.5 : 1 }}
                      disabled={deletingId === cv.id}
                      onClick={() => void handleDelete(cv.id)}
                    >
                      {deletingId === cv.id ? '...' : '🗑️ Elimina'}
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* KANBAN BOARD VIEW */
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 16, overflowX: 'auto', paddingBottom: 20 }}>
          {(Object.keys(STATUS_CONFIG) as CrmStatus[]).map((stKey) => {
            const colCfg = STATUS_CONFIG[stKey];
            const colCvs = cvs.filter(c => (statusMap[c.id] ?? 'da_inviare') === stKey);

            return (
              <div key={stKey} style={{ background: '#F8FAFC', borderRadius: 14, border: '1px solid var(--border)', padding: '14px', minWidth: 220 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14, paddingBottom: 10, borderBottom: '2px solid var(--border)' }}>
                  <span style={{ fontWeight: 700, fontSize: 14, color: 'var(--navy)' }}>
                    {colCfg.icon} {colCfg.label}
                  </span>
                  <span style={{ background: colCfg.bg, color: colCfg.color, padding: '2px 8px', borderRadius: 12, fontSize: 12, fontWeight: 700 }}>
                    {colCvs.length}
                  </span>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  {colCvs.map((cv) => (
                    <div key={cv.id} style={{ background: '#FFFFFF', padding: '14px', borderRadius: 10, border: '1px solid var(--hairline)', boxShadow: '0 2px 4px rgba(0,0,0,0.02)' }}>
                      <div style={{ fontWeight: 700, fontSize: 14, color: 'var(--navy)', marginBottom: 6 }}>
                        {cv.jobTitle || 'CV su Misura'}
                      </div>
                      <div style={{ fontSize: 11.5, color: 'var(--gray500)', marginBottom: 12 }}>
                        {formatDate(cv.createdAt)}
                      </div>

                      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                        <button
                          className="btn btn-sm"
                          style={{ background: 'var(--navy)', color: '#fff', fontSize: 11.5, padding: '6px 10px', width: '100%' }}
                          onClick={() => void openInterviewCoach(cv)}
                        >
                          🎯 Coach AI
                        </button>
                        <div style={{ display: 'flex', gap: 6 }}>
                          <button className="btn btn-gold btn-sm" style={{ flex: 1, fontSize: 11.5, padding: '5px' }} onClick={() => handleEdit(cv)}>
                            ✏️ Modifica
                          </button>
                          <select
                            value={stKey}
                            onChange={(e) => updateStatus(cv.id, e.target.value as CrmStatus)}
                            style={{ fontSize: 11, padding: '4px', borderRadius: 6, border: '1px solid var(--border)', background: '#F1F5F9' }}
                          >
                            {(Object.keys(STATUS_CONFIG) as CrmStatus[]).map(k => (
                              <option key={k} value={k}>{STATUS_CONFIG[k].label}</option>
                            ))}
                          </select>
                        </div>
                      </div>
                    </div>
                  ))}
                  {colCvs.length === 0 && (
                    <div style={{ textAlign: 'center', padding: '24px 0', color: 'var(--gray400)', fontSize: 12, fontStyle: 'italic' }}>
                      Nessuna candidatura in questo stato
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* FOOTER ACTION BANNER */}
      {cvs.length > 0 && (
        <div style={{ marginTop: 32, padding: '20px 24px', background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 14, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 16 }}>
          <div>
            <h4 style={{ margin: 0, fontSize: 15, fontWeight: 700, color: 'var(--navy)' }}>Vuoi candidarti a una nuova offerta di lavoro?</h4>
            <p style={{ margin: '4px 0 0', fontSize: 13, color: 'var(--gray500)' }}>
              Incolla la Job Description e l'Intelligenza Artificiale ricalibrerà istantaneamente il tuo CV per quel ruolo.
            </p>
          </div>
          <button className="btn btn-gold" style={{ padding: '10px 24px', fontWeight: 700 }} onClick={() => onNavigate('tailor')}>
            + Nuova Candidatura su Misura
          </button>
        </div>
      )}

      {/* AI INTERVIEW COACH MODAL DRAWER */}
      {prepCv && (
        <div style={{
          position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh',
          background: 'rgba(15, 23, 42, 0.65)', backdropFilter: 'blur(6px)',
          zIndex: 9999, display: 'flex', justifyContent: 'center', alignItems: 'center', padding: 20
        }}>
          <div style={{
            background: '#FFFFFF', borderRadius: 20, width: '100%', maxWidth: 860, maxHeight: '90vh',
            display: 'flex', flexDirection: 'column', boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)', overflow: 'hidden', border: '1px solid var(--hairline)'
          }}>
            {/* Modal Header */}
            <div style={{ background: 'linear-gradient(135deg, #14171F, #221FB4)', padding: '24px 32px', color: '#fff', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <span className="mono" style={{ fontSize: 11, color: '#BE9CFF', letterSpacing: 1, fontWeight: 700 }}>AI INTERVIEW COACH & SIMULATOR</span>
                <h2 style={{ fontSize: 22, fontWeight: 800, margin: '6px 0 4px', color: '#FFFFFF' }}>
                  Preparazione al Colloquio: {prepCv.jobTitle || 'Ruolo Target'}
                </h2>
                <p style={{ fontSize: 13, color: '#CBD5E1', margin: 0 }}>
                  Domande e risposte modellate sull'incrocio esatto tra il tuo CV e le richieste del recruiter.
                </p>
              </div>
              <button
                onClick={() => setPrepCv(null)}
                style={{ background: 'rgba(255,255,255,0.15)', border: 'none', color: '#fff', width: 36, height: 36, borderRadius: '50%', fontSize: 18, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700 }}
              >
                ✕
              </button>
            </div>

            {/* Modal Body */}
            <div style={{ padding: '28px 32px', overflowY: 'auto', flex: 1 }}>
              {prepLoading ? (
                <div style={{ textAlign: 'center', padding: '60px 0' }}>
                  <div className="ai-pulse-ring" style={{ margin: '0 auto 24px' }} />
                  <h3 style={{ fontSize: 18, fontWeight: 700, color: 'var(--navy)', marginBottom: 8 }}>
                    L'AI sta simulando le domande del recruiter...
                  </h3>
                  <p style={{ fontSize: 14, color: 'var(--gray500)' }}>
                    Stiamo analizzando la Job Description per estrarre le 5 domande tecniche e comportamentali più probabili.
                  </p>
                </div>
              ) : prepError ? (
                <div style={{ padding: 24, background: '#FFF3F3', border: '1px solid #FFCECE', borderRadius: 12, color: 'var(--danger)', textAlign: 'center' }}>
                  ⚠️ {prepError}
                  <div style={{ marginTop: 16 }}>
                    <button className="btn btn-gold btn-sm" onClick={() => void openInterviewCoach(prepCv)}>Riprova Simulazione</button>
                  </div>
                </div>
              ) : prepData ? (
                <div>
                  {/* Tabs Bar */}
                  <div style={{ display: 'flex', gap: 8, borderBottom: '2px solid var(--border)', marginBottom: 24, paddingBottom: 8 }}>
                    <button
                      onClick={() => setActiveTab('questions')}
                      style={{ padding: '8px 16px', borderRadius: 8, border: 'none', background: activeTab === 'questions' ? 'var(--navy)' : 'transparent', color: activeTab === 'questions' ? '#fff' : 'var(--gray700)', fontWeight: 700, fontSize: 13.5, cursor: 'pointer' }}
                    >
                      🗣️ Domande Recruiter ({prepData.questions?.length || 0})
                    </button>
                    <button
                      onClick={() => setActiveTab('strengths')}
                      style={{ padding: '8px 16px', borderRadius: 8, border: 'none', background: activeTab === 'strengths' ? 'var(--navy)' : 'transparent', color: activeTab === 'strengths' ? '#fff' : 'var(--gray700)', fontWeight: 700, fontSize: 13.5, cursor: 'pointer' }}
                    >
                      💪 I Tuoi Punti di Forza ({prepData.strengths?.length || 0})
                    </button>
                    <button
                      onClick={() => setActiveTab('objections')}
                      style={{ padding: '8px 16px', borderRadius: 8, border: 'none', background: activeTab === 'objections' ? 'var(--navy)' : 'transparent', color: activeTab === 'objections' ? '#fff' : 'var(--gray700)', fontWeight: 700, fontSize: 13.5, cursor: 'pointer' }}
                    >
                      🛡️ Possibili Obiezioni ({prepData.objections?.length || 0})
                    </button>
                    <button
                      onClick={() => setActiveTab('ask')}
                      style={{ padding: '8px 16px', borderRadius: 8, border: 'none', background: activeTab === 'ask' ? 'var(--navy)' : 'transparent', color: activeTab === 'ask' ? '#fff' : 'var(--gray700)', fontWeight: 700, fontSize: 13.5, cursor: 'pointer' }}
                    >
                      ❓ Cosa Chiedere Tu ({prepData.questionsToAsk?.length || 0})
                    </button>
                  </div>

                  {/* Tab 1: Questions & STAR Answers */}
                  {activeTab === 'questions' && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
                      {prepData.questions?.map((q, idx) => (
                        <div key={idx} style={{ background: '#F8FAFC', border: '1px solid var(--border)', borderRadius: 14, padding: 20 }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                            <span style={{ fontSize: 11, fontWeight: 700, color: '#3B82F6', textTransform: 'uppercase', background: '#EFF6FF', padding: '3px 8px', borderRadius: 6 }}>
                              {q.category || 'Tecnica'}
                            </span>
                            <span style={{ fontSize: 12, color: 'var(--gray400)' }}>Domanda #{idx + 1} di 5</span>
                          </div>
                          <h4 style={{ fontSize: 16.5, fontWeight: 700, color: 'var(--navy)', margin: '0 0 12px', lineHeight: 1.4 }}>
                            "{q.question}"
                          </h4>
                          <div style={{ background: '#FFFFFF', padding: 14, borderRadius: 10, border: '1px solid var(--border-soft)', borderLeft: '4px solid #12805C' }}>
                            <div style={{ fontSize: 11.5, fontWeight: 700, color: '#12805C', textTransform: 'uppercase', marginBottom: 4 }}>
                              💡 Risposta Suggerita (Metodo STAR con i tuoi dati):
                            </div>
                            <p style={{ margin: 0, fontSize: 13.5, color: '#334155', lineHeight: 1.6 }}>
                              {q.suggestedAnswer}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Tab 2: Strengths */}
                  {activeTab === 'strengths' && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                      {prepData.strengths?.map((s, idx) => (
                        <div key={idx} style={{ background: '#F0FDF4', border: '1px solid #BBF7D0', borderRadius: 14, padding: 20 }}>
                          <h4 style={{ fontSize: 16, fontWeight: 700, color: '#15803D', margin: '0 0 8px' }}>
                            💪 {s.title}
                          </h4>
                          <p style={{ margin: 0, fontSize: 14, color: '#166534', lineHeight: 1.6 }}>
                            {s.desc}
                          </p>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Tab 3: Objections & Defense */}
                  {activeTab === 'objections' && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                      {prepData.objections?.map((o, idx) => (
                        <div key={idx} style={{ background: '#EEEDFC', border: '1px solid rgba(47, 42, 229, 0.18)', borderRadius: 14, padding: 20 }}>
                          <div style={{ fontSize: 14.5, fontWeight: 700, color: '#221FB4', marginBottom: 10 }}>
                            ⚠️ Obiezione / Dubbio: "{o.objection}"
                          </div>
                          <div style={{ background: '#FFFFFF', padding: 14, borderRadius: 10, border: '1px solid rgba(47, 42, 229, 0.12)', borderLeft: '4px solid #2F2AE5' }}>
                            <div style={{ fontSize: 11.5, fontWeight: 700, color: '#2F2AE5', textTransform: 'uppercase', marginBottom: 4 }}>
                              🛡️ Come Rispondere in Modo Assertivo:
                            </div>
                            <p style={{ margin: 0, fontSize: 13.5, color: 'var(--gray700)', lineHeight: 1.6 }}>
                              {o.defense}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Tab 4: Questions To Ask */}
                  {activeTab === 'ask' && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                      <div style={{ fontSize: 13.5, color: 'var(--gray500)', marginBottom: 6 }}>
                        Alla fine del colloquio, quando il recruiter ti chiede <i>"Ha domande per noi?"</i>, fai 2 o 3 di queste domande per mostrare visione strategica:
                      </div>
                      {prepData.questionsToAsk?.map((qa, idx) => (
                        <div key={idx} style={{ background: '#EFF6FF', border: '1px solid #BFDBFE', borderRadius: 12, padding: 16, display: 'flex', gap: 12, alignItems: 'center' }}>
                          <span style={{ fontSize: 18 }}>❓</span>
                          <span style={{ fontSize: 14.5, fontWeight: 600, color: '#1E40AF', lineHeight: 1.5 }}>
                            "{qa}"
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ) : null}
            </div>

            {/* Modal Footer */}
            <div style={{ padding: '16px 32px', background: 'var(--gray50)', borderTop: '1px solid var(--border)', display: 'flex', justifyContent: 'flex-end', gap: 12 }}>
              <button className="btn btn-ink" onClick={() => setPrepCv(null)} style={{ padding: '8px 24px', fontWeight: 700 }}>
                Chiudi Coach AI
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
