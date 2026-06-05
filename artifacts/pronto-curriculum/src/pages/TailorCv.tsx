import { useState } from 'react';
import { CVData, Page } from '../types';
import { useAuth } from '@workspace/replit-auth-web';

interface TailorCvProps {
  onNavigate: (page: Page) => void;
  onCVLoaded: (data: CVData) => void;
  onLogin: () => void;
}

type InputMode = 'url' | 'text';
type ViewState = 'form' | 'preview';

interface PreviewData {
  cvData: CVData;
  savedCvId?: string;
}

export default function TailorCv({ onNavigate, onCVLoaded, onLogin }: TailorCvProps) {
  const { isAuthenticated, isLoading } = useAuth();
  const [mode, setMode] = useState<InputMode>('text');
  const [urlInput, setUrlInput] = useState('');
  const [jobText, setJobText] = useState('');
  const [fetchingUrl, setFetchingUrl] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [urlError, setUrlError] = useState('');
  const [genError, setGenError] = useState('');
  const [urlLoaded, setUrlLoaded] = useState(false);

  const [viewState, setViewState] = useState<ViewState>('form');
  const [previewData, setPreviewData] = useState<PreviewData | null>(null);
  const [selectedExpIds, setSelectedExpIds] = useState<Set<string>>(new Set());
  const [editingExpId, setEditingExpId] = useState<string | null>(null);
  const [editedDescs, setEditedDescs] = useState<Record<string, string>>({});

  const handleFetchUrl = async () => {
    const url = urlInput.trim();
    if (!url) return;
    setFetchingUrl(true);
    setUrlError('');
    setUrlLoaded(false);
    try {
      const res = await fetch('/api/fetch-job', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url }),
        credentials: 'include',
      });
      const data = await res.json() as { text?: string; error?: string };
      if (!res.ok || !data.text) {
        setUrlError(data.error ?? 'Impossibile estrarre il testo. Prova a incollarlo manualmente.');
        setMode('text');
        return;
      }
      setJobText(data.text);
      setUrlLoaded(true);
      setMode('text');
    } catch {
      setUrlError("Errore di rete. Incolla il testo dell'offerta manualmente.");
      setMode('text');
    } finally {
      setFetchingUrl(false);
    }
  };

  const handleGenerate = async (excludeExperienceIds?: string[]) => {
    const description = jobText.trim();
    if (description.length < 50) {
      setGenError("L'offerta di lavoro è troppo corta. Aggiungi più dettagli (minimo 50 caratteri).");
      return;
    }
    setGenerating(true);
    setGenError('');
    setViewState('form');
    try {
      const body: Record<string, unknown> = { jobDescription: description };
      if (excludeExperienceIds && excludeExperienceIds.length > 0) {
        body.excludeExperienceIds = excludeExperienceIds;
      }
      const res = await fetch('/api/tailor-cv', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
        credentials: 'include',
      });
      const data = await res.json() as { cvData?: CVData; savedCvId?: string; error?: string };
      if (!res.ok || !data.cvData) {
        setGenError(data.error ?? 'Errore nella generazione del CV. Riprova tra qualche secondo.');
        return;
      }
      setPreviewData({ cvData: data.cvData, savedCvId: data.savedCvId });
      setSelectedExpIds(new Set(data.cvData.experiences.map(e => e.id)));
      setViewState('preview');
    } catch {
      setGenError('Errore di rete. Controlla la connessione e riprova.');
    } finally {
      setGenerating(false);
    }
  };

  const handleConfirm = () => {
    if (!previewData) return;
    const filtered = {
      ...previewData.cvData,
      experiences: previewData.cvData.experiences
        .filter(e => selectedExpIds.has(e.id))
        .map(e => editedDescs[e.id] !== undefined ? { ...e, desc: editedDescs[e.id] } : e),
    };
    onCVLoaded(filtered);
    onNavigate('builder-step2');
  };

  const handleRegenerate = () => {
    // Capture deselected experience IDs (real DB IDs) before resetting state
    const excludedIds = previewData
      ? previewData.cvData.experiences
          .filter(e => !selectedExpIds.has(e.id))
          .map(e => e.id)
      : [];
    setViewState('form');
    setPreviewData(null);
    setSelectedExpIds(new Set());
    void handleGenerate(excludedIds.length > 0 ? excludedIds : undefined);
  };

  const toggleExp = (id: string) => {
    setSelectedExpIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const charCount = jobText.trim().length;
  const isReady = charCount >= 50;

  if (viewState === 'preview' && previewData) {
    const { cvData } = previewData;
    const confirmedCount = selectedExpIds.size;

    return (
      <div style={{ maxWidth: 760, margin: '0 auto', padding: '48px 24px' }}>
        {/* Header */}
        <div style={{ marginBottom: 40, textAlign: 'center' }}>
          <button
            className="btn btn-ghost btn-sm"
            style={{ marginBottom: 24, fontSize: 13 }}
            onClick={() => setViewState('form')}
          >
            ← Torna all'offerta
          </button>
          <div style={{ fontSize: 40, marginBottom: 12 }}>✦</div>
          <h1 style={{ fontFamily: 'Playfair Display, serif', fontSize: 28, fontWeight: 700, color: 'var(--navy)', marginBottom: 10 }}>
            Anteprima selezione AI
          </h1>
          <p style={{ color: 'var(--gray500)', fontSize: 15, maxWidth: 520, margin: '0 auto', lineHeight: 1.6 }}>
            L'AI ha selezionato {cvData.experiences.length} esperienze dal tuo archivio e le ha riscritte per questa offerta.
            Deseleziona quelle che non vuoi includere, poi conferma.
          </p>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

          {/* AI-generated title + summary */}
          <div style={{
            background: 'linear-gradient(135deg, rgba(var(--navy-rgb),0.04) 0%, rgba(var(--gold-rgb),0.07) 100%)',
            border: '1px solid var(--border)',
            borderRadius: 16,
            padding: '24px 28px',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
              <div style={{ fontSize: 18 }}>🎯</div>
              <div style={{ fontWeight: 700, fontSize: 15, color: 'var(--navy)' }}>Titolo e profilo generati dall'AI</div>
            </div>
            <div style={{ fontWeight: 700, fontSize: 18, color: 'var(--navy)', marginBottom: 10 }}>
              {cvData.title}
            </div>
            <div style={{ fontSize: 14, color: 'var(--gray500)', lineHeight: 1.7 }}>
              {cvData.summary}
            </div>
          </div>

          {/* Experiences */}
          <div>
            <div style={{ fontWeight: 700, fontSize: 15, color: 'var(--navy)', marginBottom: 12, display: 'flex', alignItems: 'center', gap: 8 }}>
              <span>💼</span>
              <span>Esperienze selezionate</span>
              <span style={{
                padding: '2px 10px',
                background: confirmedCount > 0 ? 'rgba(var(--gold-rgb),0.15)' : 'rgba(220,53,69,0.1)',
                color: confirmedCount > 0 ? 'var(--navy)' : 'var(--danger)',
                borderRadius: 20,
                fontSize: 12,
                fontWeight: 600,
              }}>
                {confirmedCount} / {cvData.experiences.length} selezionate
              </span>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {cvData.experiences.map(exp => {
                const isSelected = selectedExpIds.has(exp.id);
                const isEditing = editingExpId === exp.id;
                const displayDesc = editedDescs[exp.id] !== undefined ? editedDescs[exp.id] : exp.desc;
                const wasEdited = editedDescs[exp.id] !== undefined && editedDescs[exp.id] !== exp.desc;
                return (
                  <div
                    key={exp.id}
                    style={{
                      background: isSelected ? 'var(--surface)' : 'rgba(0,0,0,0.02)',
                      border: `2px solid ${isSelected ? 'var(--gold)' : 'var(--border)'}`,
                      borderRadius: 12,
                      padding: '20px 22px',
                      transition: 'all 0.15s',
                      opacity: isSelected ? 1 : 0.5,
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'flex-start', gap: 14 }}>
                      {/* Checkbox */}
                      <div
                        onClick={() => toggleExp(exp.id)}
                        style={{
                          width: 22,
                          height: 22,
                          borderRadius: 6,
                          border: `2px solid ${isSelected ? 'var(--gold)' : 'var(--border)'}`,
                          background: isSelected ? 'var(--gold)' : 'transparent',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          flexShrink: 0,
                          marginTop: 2,
                          transition: 'all 0.15s',
                          cursor: 'pointer',
                        }}
                      >
                        {isSelected && (
                          <svg width="12" height="10" viewBox="0 0 12 10" fill="none">
                            <path d="M1 5L4.5 8.5L11 1" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                          </svg>
                        )}
                      </div>

                      <div style={{ flex: 1, minWidth: 0 }}>
                        {/* Role + company + dates + Modifica button */}
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, alignItems: 'baseline', marginBottom: 6 }}>
                          <span
                            onClick={() => toggleExp(exp.id)}
                            style={{ fontWeight: 700, fontSize: 15, color: 'var(--navy)', cursor: 'pointer' }}
                          >{exp.role}</span>
                          <span
                            onClick={() => toggleExp(exp.id)}
                            style={{ color: 'var(--gray500)', fontSize: 14, cursor: 'pointer' }}
                          >@ {exp.company}</span>
                          {exp.city && (
                            <span
                              onClick={() => toggleExp(exp.id)}
                              style={{ color: 'var(--gray500)', fontSize: 13, cursor: 'pointer' }}
                            >• {exp.city}</span>
                          )}
                          {(exp.from || exp.to) && (
                            <span
                              onClick={() => toggleExp(exp.id)}
                              style={{
                                marginLeft: 'auto',
                                fontSize: 12,
                                color: 'var(--gray500)',
                                whiteSpace: 'nowrap',
                                background: 'var(--surface)',
                                padding: '2px 8px',
                                borderRadius: 6,
                                border: '1px solid var(--border)',
                                cursor: 'pointer',
                              }}
                            >
                              {exp.from}{exp.from && exp.to ? ' → ' : ''}{exp.to}
                            </span>
                          )}
                          <button
                            onClick={e => {
                              e.stopPropagation();
                              if (isEditing) {
                                setEditingExpId(null);
                              } else {
                                if (editedDescs[exp.id] === undefined) {
                                  setEditedDescs(prev => ({ ...prev, [exp.id]: exp.desc }));
                                }
                                setEditingExpId(exp.id);
                              }
                            }}
                            style={{
                              marginLeft: 'auto',
                              padding: '2px 10px',
                              fontSize: 12,
                              fontWeight: 600,
                              border: `1px solid ${isEditing ? 'var(--navy)' : 'var(--border)'}`,
                              borderRadius: 6,
                              background: isEditing ? 'var(--navy)' : 'transparent',
                              color: isEditing ? '#fff' : 'var(--gray500)',
                              cursor: 'pointer',
                              transition: 'all 0.15s',
                              whiteSpace: 'nowrap',
                            }}
                          >
                            {isEditing ? '✓ Chiudi' : wasEdited ? '✏️ Modificato' : '✏️ Modifica'}
                          </button>
                        </div>

                        {/* Rewritten description — textarea when editing, text when not */}
                        {isEditing ? (
                          <textarea
                            value={editedDescs[exp.id] ?? exp.desc}
                            onChange={e => setEditedDescs(prev => ({ ...prev, [exp.id]: e.target.value }))}
                            onClick={e => e.stopPropagation()}
                            rows={6}
                            style={{
                              width: '100%',
                              padding: '10px 12px',
                              borderRadius: 8,
                              border: '1.5px solid var(--gold)',
                              fontSize: 13,
                              fontFamily: 'inherit',
                              lineHeight: 1.65,
                              resize: 'vertical',
                              boxSizing: 'border-box',
                              color: 'var(--navy)',
                              background: 'rgba(var(--gold-rgb),0.04)',
                              outline: 'none',
                            }}
                          />
                        ) : (
                          <div
                            onClick={() => toggleExp(exp.id)}
                            style={{
                              fontSize: 13,
                              color: 'var(--gray500)',
                              lineHeight: 1.65,
                              whiteSpace: 'pre-line',
                              cursor: 'pointer',
                            }}
                          >
                            {displayDesc}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Skills preview */}
          {cvData.skills.length > 0 && (
            <div style={{
              background: 'var(--surface)',
              border: '1px solid var(--border)',
              borderRadius: 12,
              padding: '18px 22px',
            }}>
              <div style={{ fontWeight: 700, fontSize: 14, color: 'var(--navy)', marginBottom: 12, display: 'flex', alignItems: 'center', gap: 8 }}>
                <span>🔧</span>
                <span>Skill selezionate per questa offerta</span>
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                {cvData.skills.map(skill => (
                  <span
                    key={skill}
                    style={{
                      padding: '4px 12px',
                      background: 'rgba(var(--gold-rgb),0.12)',
                      color: 'var(--navy)',
                      borderRadius: 20,
                      fontSize: 13,
                      fontWeight: 500,
                      border: '1px solid rgba(var(--gold-rgb),0.25)',
                    }}
                  >
                    {skill}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Action buttons */}
          {confirmedCount === 0 && (
            <div style={{
              padding: '12px 16px',
              background: 'rgba(220,53,69,0.07)',
              border: '1px solid rgba(220,53,69,0.2)',
              borderRadius: 10,
              color: 'var(--danger)',
              fontSize: 13,
            }}>
              ⚠️ Seleziona almeno un'esperienza per continuare.
            </div>
          )}

          <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end', paddingTop: 4 }}>
            <button
              className="btn btn-ghost"
              style={{ fontSize: 14 }}
              onClick={handleRegenerate}
              disabled={generating}
            >
              {generating ? (
                <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span className="ai-pulse-ring" style={{ width: 16, height: 16, margin: 0 }} />
                  Rigenerazione...
                </span>
              ) : (
                '🔄 Rigenera'
              )}
            </button>
            <button
              className="btn btn-gold"
              style={{
                fontSize: 15,
                padding: '13px 32px',
                opacity: confirmedCount === 0 ? 0.5 : 1,
                cursor: confirmedCount === 0 ? 'not-allowed' : 'pointer',
              }}
              onClick={confirmedCount > 0 ? handleConfirm : undefined}
              disabled={confirmedCount === 0}
            >
              Conferma e apri nel builder →
            </button>
          </div>
        </div>

        {/* Re-generating overlay */}
        {generating && (
          <div className="modal-overlay" style={{ zIndex: 300 }}>
            <div className="modal-box" style={{ textAlign: 'center', padding: 56, maxWidth: 420 }}>
              <div className="ai-pulse-ring" style={{ margin: '0 auto 24px' }} />
              <div style={{ fontSize: 40, marginBottom: 16 }}>✦</div>
              <div style={{ fontFamily: 'Playfair Display, serif', fontSize: 24, fontWeight: 700, color: 'var(--navy)', marginBottom: 12 }}>
                AI sta rigenerando il CV...
              </div>
              <div style={{ color: 'var(--gray500)', fontSize: 14, lineHeight: 1.7 }}>
                Nuova selezione delle esperienze in corso.<br />
                <span style={{ color: 'var(--gold)', fontWeight: 600 }}>Ci vogliono 15-30 secondi.</span>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div style={{ maxWidth: 760, margin: '0 auto', padding: '48px 24px' }}>

      {/* Header */}
      <div style={{ marginBottom: 40, textAlign: 'center' }}>
        <button
          className="btn btn-ghost btn-sm"
          style={{ marginBottom: 24, fontSize: 13 }}
          onClick={() => onNavigate('home')}
        >
          ← Torna alla home
        </button>
        <div style={{ fontSize: 40, marginBottom: 12 }}>✦</div>
        <h1 style={{ fontFamily: 'Playfair Display, serif', fontSize: 32, fontWeight: 700, color: 'var(--navy)', marginBottom: 12 }}>
          CV su misura per l'offerta
        </h1>
        <p style={{ color: 'var(--gray500)', fontSize: 16, maxWidth: 520, margin: '0 auto', lineHeight: 1.6 }}>
          Incolla il testo o l'URL dell'offerta di lavoro. L'AI selezionerà le tue esperienze più rilevanti, le riscriverà con le keyword richieste e genererà un CV ottimizzato.
        </p>
      </div>

      {/* Auth gate */}
      {!isLoading && !isAuthenticated ? (
        <div style={{
          background: 'var(--surface)',
          border: '1px solid var(--border)',
          borderRadius: 16,
          padding: 40,
          textAlign: 'center',
        }}>
          <div style={{ fontSize: 32, marginBottom: 16 }}>🔐</div>
          <h2 style={{ fontFamily: 'Playfair Display, serif', fontSize: 22, fontWeight: 700, color: 'var(--navy)', marginBottom: 8 }}>
            Accedi per creare il tuo CV su misura
          </h2>
          <p style={{ color: 'var(--gray500)', fontSize: 14, marginBottom: 24, lineHeight: 1.6 }}>
            L'AI usa le esperienze salvate nel tuo archivio personale.<br />
            Accedi per continuare.
          </p>
          <button className="btn btn-gold" style={{ fontSize: 15, padding: '12px 32px' }} onClick={onLogin}>
            Accedi con Replit
          </button>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>

          {/* Mode tabs */}
          <div style={{
            background: 'var(--surface)',
            border: '1px solid var(--border)',
            borderRadius: 16,
            overflow: 'hidden',
          }}>
            <div style={{ display: 'flex', borderBottom: '1px solid var(--border)' }}>
              <button
                onClick={() => setMode('url')}
                style={{
                  flex: 1,
                  padding: '14px 20px',
                  background: mode === 'url' ? 'var(--navy)' : 'transparent',
                  color: mode === 'url' ? '#fff' : 'var(--gray500)',
                  border: 'none',
                  cursor: 'pointer',
                  fontWeight: 600,
                  fontSize: 14,
                  transition: 'all 0.2s',
                }}
              >
                🔗 Incolla l'URL dell'offerta
              </button>
              <button
                onClick={() => setMode('text')}
                style={{
                  flex: 1,
                  padding: '14px 20px',
                  background: mode === 'text' ? 'var(--navy)' : 'transparent',
                  color: mode === 'text' ? '#fff' : 'var(--gray500)',
                  border: 'none',
                  cursor: 'pointer',
                  fontWeight: 600,
                  fontSize: 14,
                  transition: 'all 0.2s',
                }}
              >
                📝 Incolla il testo
              </button>
            </div>

            <div style={{ padding: 28 }}>
              {mode === 'url' ? (
                <div>
                  <label style={{ display: 'block', fontWeight: 600, color: 'var(--navy)', fontSize: 14, marginBottom: 8 }}>
                    URL dell'offerta di lavoro
                  </label>
                  <p style={{ color: 'var(--gray500)', fontSize: 12, marginBottom: 12 }}>
                    Incolla il link da Indeed, LinkedIn, InfoJobs, Glassdoor, ecc. Il backend tenterà di estrarre il testo automaticamente.
                  </p>
                  <div style={{ display: 'flex', gap: 10 }}>
                    <input
                      type="url"
                      placeholder="https://www.linkedin.com/jobs/view/..."
                      value={urlInput}
                      onChange={e => { setUrlInput(e.target.value); setUrlError(''); }}
                      style={{ flex: 1, padding: '10px 14px', borderRadius: 8, border: '1px solid var(--border)', fontSize: 14, fontFamily: 'inherit' }}
                      onKeyDown={e => { if (e.key === 'Enter') void handleFetchUrl(); }}
                    />
                    <button
                      className="btn btn-gold"
                      style={{ whiteSpace: 'nowrap', fontSize: 14 }}
                      onClick={() => void handleFetchUrl()}
                      disabled={fetchingUrl || !urlInput.trim()}
                    >
                      {fetchingUrl ? '⏳ Caricamento...' : '📥 Carica'}
                    </button>
                  </div>
                  {urlError && (
                    <div style={{ marginTop: 10, padding: '10px 14px', background: 'rgba(220,53,69,0.08)', borderRadius: 8, color: 'var(--danger)', fontSize: 13 }}>
                      ⚠️ {urlError}
                    </div>
                  )}
                </div>
              ) : (
                <div>
                  <label style={{ display: 'block', fontWeight: 600, color: 'var(--navy)', fontSize: 14, marginBottom: 8 }}>
                    Descrizione dell'offerta di lavoro
                    {urlLoaded && (
                      <span style={{ marginLeft: 8, padding: '2px 8px', background: 'rgba(var(--success-rgb),0.1)', color: 'var(--success)', borderRadius: 4, fontSize: 11, fontWeight: 600 }}>
                        ✓ Caricata dall'URL
                      </span>
                    )}
                  </label>
                  <p style={{ color: 'var(--gray500)', fontSize: 12, marginBottom: 12 }}>
                    Incolla il testo completo dell'offerta: titolo, descrizione del ruolo, requisiti e preferibilmente anche le responsabilità.
                  </p>
                  <textarea
                    rows={14}
                    placeholder="Incolla qui il testo dell'offerta di lavoro...&#10;&#10;Esempio:&#10;Cerchiamo un Senior Backend Developer per unirsi al nostro team...&#10;Requisiti: 5+ anni di esperienza con Python, familiarità con AWS..."
                    value={jobText}
                    onChange={e => { setJobText(e.target.value); setGenError(''); }}
                    style={{
                      width: '100%',
                      padding: '12px 14px',
                      borderRadius: 8,
                      border: `1px solid ${isReady ? 'var(--gold)' : 'var(--border)'}`,
                      fontSize: 14,
                      fontFamily: 'inherit',
                      resize: 'vertical',
                      lineHeight: 1.6,
                      boxSizing: 'border-box',
                      transition: 'border-color 0.2s',
                    }}
                  />
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 6 }}>
                    <span style={{ fontSize: 12, color: charCount < 50 ? 'var(--danger)' : 'var(--success)' }}>
                      {charCount < 50 ? `${50 - charCount} caratteri ancora necessari` : `✓ ${charCount} caratteri — pronto`}
                    </span>
                    <button
                      className="btn btn-ghost btn-sm"
                      style={{ fontSize: 11 }}
                      onClick={() => { setMode('url'); setUrlLoaded(false); }}
                    >
                      Carica da URL →
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* How it works */}
          <div style={{
            background: 'linear-gradient(135deg, rgba(var(--navy-rgb),0.03) 0%, rgba(var(--gold-rgb),0.05) 100%)',
            border: '1px solid var(--border)',
            borderRadius: 12,
            padding: '20px 24px',
            display: 'flex',
            gap: 32,
            flexWrap: 'wrap',
          }}>
            {[
              { icon: '🔍', label: 'Analisi', desc: "L'AI legge l'offerta e identifica le keyword chiave" },
              { icon: '💼', label: 'Selezione', desc: "Sceglie le esperienze più rilevanti dal tuo archivio" },
              { icon: '✍️', label: 'Anteprima', desc: 'Puoi vedere e modificare la selezione prima di confermare' },
              { icon: '🎯', label: 'CV pronto', desc: 'Genera summary e skill list su misura per il ruolo' },
            ].map(step => (
              <div key={step.label} style={{ flex: '1 1 140px', display: 'flex', flexDirection: 'column', gap: 4 }}>
                <div style={{ fontSize: 20 }}>{step.icon}</div>
                <div style={{ fontWeight: 700, fontSize: 13, color: 'var(--navy)' }}>{step.label}</div>
                <div style={{ fontSize: 12, color: 'var(--gray500)', lineHeight: 1.5 }}>{step.desc}</div>
              </div>
            ))}
          </div>

          {/* Error message */}
          {genError && (
            <div style={{
              padding: '14px 18px',
              background: 'rgba(220,53,69,0.08)',
              border: '1px solid rgba(220,53,69,0.2)',
              borderRadius: 10,
              color: 'var(--danger)',
              fontSize: 14,
            }}>
              ⚠️ {genError}
            </div>
          )}

          {/* Generate button */}
          <div style={{ display: 'flex', gap: 12, alignItems: 'center', justifyContent: 'flex-end' }}>
            <button
              className="btn btn-ghost"
              style={{ fontSize: 14 }}
              onClick={() => onNavigate('archivio')}
            >
              💼 Gestisci archivio
            </button>
            <button
              className="btn btn-ghost"
              style={{ fontSize: 14 }}
              onClick={() => onNavigate('candidature')}
            >
              📋 Le mie candidature
            </button>
            <button
              className="btn btn-gold"
              style={{
                fontSize: 16,
                padding: '14px 36px',
                opacity: (!isReady || generating || mode === 'url') ? 0.6 : 1,
                cursor: (!isReady || generating || mode === 'url') ? 'not-allowed' : 'pointer',
              }}
              onClick={!isReady || generating || mode === 'url' ? undefined : () => void handleGenerate()}
              disabled={!isReady || generating || mode === 'url'}
            >
              {generating ? (
                <span style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <span className="ai-pulse-ring" style={{ width: 18, height: 18, margin: 0 }} />
                  AI sta analizzando l'offerta...
                </span>
              ) : (
                '✦ Genera CV su misura'
              )}
            </button>
          </div>

          {/* Archive empty hint */}
          <div style={{
            padding: '12px 16px',
            background: 'var(--surface)',
            border: '1px solid var(--border)',
            borderRadius: 8,
            fontSize: 12,
            color: 'var(--gray500)',
            lineHeight: 1.6,
          }}>
            💡 <strong>Consiglio:</strong> Per ottenere il miglior risultato, assicurati di avere esperienze salvate nel tuo{' '}
            <button
              className="btn btn-ghost btn-sm"
              style={{ fontSize: 12, padding: '1px 6px', display: 'inline' }}
              onClick={() => onNavigate('archivio')}
            >
              archivio personale →
            </button>
            {' '}L'AI selezionerà quelle più rilevanti per questa offerta.
          </div>
        </div>
      )}

      {/* Full-screen loading overlay */}
      {generating && (
        <div className="modal-overlay" style={{ zIndex: 300 }}>
          <div className="modal-box" style={{ textAlign: 'center', padding: 56, maxWidth: 420 }}>
            <div className="ai-pulse-ring" style={{ margin: '0 auto 24px' }} />
            <div style={{ fontSize: 40, marginBottom: 16 }}>✦</div>
            <div style={{ fontFamily: 'Playfair Display, serif', fontSize: 24, fontWeight: 700, color: 'var(--navy)', marginBottom: 12 }}>
              AI sta creando il tuo CV...
            </div>
            <div style={{ color: 'var(--gray500)', fontSize: 14, lineHeight: 1.7 }}>
              Analisi dell'offerta in corso.<br />
              Selezione delle esperienze più rilevanti.<br />
              Riscrittura con le keyword richieste.<br />
              <span style={{ color: 'var(--gold)', fontWeight: 600 }}>Ci vogliono 15-30 secondi.</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
