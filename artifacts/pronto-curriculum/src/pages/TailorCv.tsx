import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { CVData, Experience, Page } from '../types';
import { useAuth } from '../hooks/use-auth';
import { useSeoMeta } from '../components/EditorialChrome';
import { useT } from '../i18n/LanguageContext';

interface TailorCvProps {
  onNavigate: (page: Page) => void;
  onCVLoaded: (data: CVData) => void;
  onLogin: () => void;
}

type InputMode = 'url' | 'text';
type ViewState = 'form' | 'preview';

interface PreviewData {
  cvData: CVData;
}

export default function TailorCv({ onNavigate, onCVLoaded, onLogin }: TailorCvProps) {
  useSeoMeta(
    'CV su Misura per Ogni Offerta con l\'AI | ProntoCurriculum',
    'Incolla l\'annuncio di lavoro e lascia che l\'AI adatti il tuo CV: seleziona le esperienze più rilevanti, riscrive titolo e sommario e massimizza la compatibilità con l\'offerta.',
    '/cv-su-misura',
  );
  const { isAuthenticated, isLoading } = useAuth();
  const t = useT();
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
  const [editingTitleSummary, setEditingTitleSummary] = useState(false);
  const [editedTitle, setEditedTitle] = useState<string | null>(null);
  const [editedSummary, setEditedSummary] = useState<string | null>(null);
  const [excludedExperiences, setExcludedExperiences] = useState<Experience[]>([]);
  const [excludedSectionOpen, setExcludedSectionOpen] = useState(false);

  // Handoff from the jobs board: prefill the pasted announcement.
  useEffect(() => {
    const raw = sessionStorage.getItem('pc_pending_job');
    if (!raw) return;
    sessionStorage.removeItem('pc_pending_job');
    try {
      const job = JSON.parse(raw) as { title?: string; company?: string; description?: string };
      if (job.description) {
        setMode('text');
        setJobText(`${job.title ?? ''}${job.company ? ` — ${job.company}` : ''}\n\n${job.description}`.trim());
      }
    } catch { /* ignore malformed handoff */ }
  }, []);

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
        setUrlError(data.error ?? t('tc.errExtract'));
        setMode('text');
        return;
      }
      setJobText(data.text);
      setUrlLoaded(true);
      setMode('text');
    } catch {
      setUrlError(t('tc.errNetworkPaste'));
      setMode('text');
    } finally {
      setFetchingUrl(false);
    }
  };

  const handleGenerate = async (excludeExperienceIds?: string[], excludedExps?: Experience[]) => {
    const description = jobText.trim();
    if (description.length < 50) {
      setGenError(t('tc.errTooShort'));
      return;
    }
    setGenerating(true);
    setGenError('');
    setViewState('form');
    if (!excludeExperienceIds) {
      setExcludedExperiences([]);
    }
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
      const data = await res.json() as { cvData?: CVData; error?: string };
      if (!res.ok || !data.cvData) {
        setGenError(data.error ?? t('tc.errGenerateCV'));
        return;
      }
      setPreviewData({ cvData: data.cvData });
      setSelectedExpIds(new Set(data.cvData.experiences.map(e => e.id)));
      setEditedDescs({});
      setEditedTitle(null);
      setEditedSummary(null);
      setEditingTitleSummary(false);
      if (excludedExps && excludedExps.length > 0) {
        setExcludedExperiences(excludedExps);
        setExcludedSectionOpen(false);
      }
      setViewState('preview');
    } catch {
      setGenError(t('tc.errNetworkRetry'));
    } finally {
      setGenerating(false);
    }
  };

  const [confirming, setConfirming] = useState(false);
  const [savedCvId, setSavedCvId] = useState<string | null>(null);

  const handleConfirm = async () => {
    if (!previewData) return;
    const filtered = {
      ...previewData.cvData,
      title: editedTitle !== null ? editedTitle : previewData.cvData.title,
      summary: editedSummary !== null ? editedSummary : previewData.cvData.summary,
      experiences: previewData.cvData.experiences
        .filter(e => selectedExpIds.has(e.id))
        .map(e => editedDescs[e.id] !== undefined ? { ...e, desc: editedDescs[e.id] } : e),
    };
    setConfirming(true);
    let saveError = false;
    try {
      const body: Record<string, unknown> = { cvData: filtered, jobDescription: jobText };
      if (savedCvId) body.existingCvId = savedCvId;
      const res = await fetch('/api/tailor-cv/confirm', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
        credentials: 'include',
      });
      if (!res.ok) {
        saveError = true;
      } else {
        const data = await res.json() as { savedCvId?: string };
        if (data.savedCvId) setSavedCvId(data.savedCvId);
      }
    } catch {
      saveError = true;
    } finally {
      setConfirming(false);
    }
    if (saveError) {
      toast.warning(t('tc.savedWarning'), {
        duration: 5000,
      });
    } else {
      toast.success(t('tc.savedSuccess'), {
        duration: 4000,
      });
    }
    onCVLoaded(filtered);
    onNavigate('builder-step2');
  };

  const handleRegenerate = () => {
    const excluded = previewData
      ? previewData.cvData.experiences.filter(e => !selectedExpIds.has(e.id))
      : [];
    const excludedIds = excluded.map(e => e.id);
    setViewState('form');
    setPreviewData(null);
    setSelectedExpIds(new Set());
    void handleGenerate(
      excludedIds.length > 0 ? excludedIds : undefined,
      excluded.length > 0 ? excluded : undefined,
    );
  };

  const addExcludedBack = (exp: Experience) => {
    setPreviewData(prev => {
      if (!prev) return prev;
      return {
        ...prev,
        cvData: {
          ...prev.cvData,
          experiences: [...prev.cvData.experiences, exp],
        },
      };
    });
    setSelectedExpIds(prev => new Set([...prev, exp.id]));
    setExcludedExperiences(prev => prev.filter(e => e.id !== exp.id));
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
      <div style={{ maxWidth: 760, margin: '0 auto', padding: '8px 24px 48px' }}>
        {/* Header */}
        <div className="head">
          <div>
            <button
              className="btn btn-ghost btn-sm"
              style={{ marginBottom: 10, marginLeft: -12 }}
              onClick={() => setViewState('form')}
            >
              {t('tc.backToOffer')}
            </button>
            <h1>{t('tc.previewTitle')}</h1>
            <p style={{ maxWidth: 560 }}>
              {t('tc.previewSub1')} {cvData.experiences.length} {t('tc.previewSub2')}
            </p>
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

          {/* AI-generated title + summary */}
          {(() => {
            const displayTitle = editedTitle !== null ? editedTitle : cvData.title;
            const displaySummary = editedSummary !== null ? editedSummary : cvData.summary;
            const titleWasEdited = editedTitle !== null && editedTitle !== cvData.title;
            const summaryWasEdited = editedSummary !== null && editedSummary !== cvData.summary;
            const wasEdited = titleWasEdited || summaryWasEdited;
            return (
              <div style={{
                background: 'linear-gradient(135deg, rgba(var(--navy-rgb),0.04) 0%, rgba(var(--gold-rgb),0.07) 100%)',
                border: `1px solid ${editingTitleSummary ? 'var(--gold)' : 'var(--border)'}`,
                borderRadius: 16,
                padding: '24px 28px',
                transition: 'border-color 0.15s',
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
                  <div style={{ fontSize: 18 }}>🎯</div>
                  <div style={{ fontWeight: 700, fontSize: 15, color: 'var(--navy)', flex: 1 }}>{t('tc.aiTitleProfile')}</div>
                  <button
                    onClick={() => {
                      if (editingTitleSummary) {
                        setEditingTitleSummary(false);
                      } else {
                        if (editedTitle === null) setEditedTitle(cvData.title);
                        if (editedSummary === null) setEditedSummary(cvData.summary);
                        setEditingTitleSummary(true);
                      }
                    }}
                    style={{
                      padding: '3px 12px',
                      fontSize: 12,
                      fontWeight: 600,
                      border: `1px solid ${editingTitleSummary ? 'var(--navy)' : 'var(--border)'}`,
                      borderRadius: 6,
                      background: editingTitleSummary ? 'var(--navy)' : 'transparent',
                      color: editingTitleSummary ? '#fff' : wasEdited ? 'var(--navy)' : 'var(--gray500)',
                      cursor: 'pointer',
                      transition: 'all 0.15s',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {editingTitleSummary ? t('tc.close') : wasEdited ? t('tc.edited') : t('tc.editBtn')}
                  </button>
                </div>
                {editingTitleSummary ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                    <input
                      type="text"
                      value={displayTitle}
                      onChange={e => setEditedTitle(e.target.value)}
                      style={{
                        width: '100%',
                        padding: '9px 12px',
                        borderRadius: 8,
                        border: '1.5px solid var(--gold)',
                        fontSize: 16,
                        fontWeight: 700,
                        fontFamily: 'inherit',
                        color: 'var(--navy)',
                        background: 'rgba(var(--gold-rgb),0.04)',
                        outline: 'none',
                        boxSizing: 'border-box',
                      }}
                    />
                    <textarea
                      value={displaySummary}
                      onChange={e => setEditedSummary(e.target.value)}
                      rows={5}
                      style={{
                        width: '100%',
                        padding: '10px 12px',
                        borderRadius: 8,
                        border: '1.5px solid var(--gold)',
                        fontSize: 14,
                        fontFamily: 'inherit',
                        lineHeight: 1.7,
                        resize: 'vertical',
                        color: 'var(--navy)',
                        background: 'rgba(var(--gold-rgb),0.04)',
                        outline: 'none',
                        boxSizing: 'border-box',
                      }}
                    />
                  </div>
                ) : (
                  <>
                    <div style={{ fontWeight: 700, fontSize: 18, color: 'var(--navy)', marginBottom: 10 }}>
                      {displayTitle}
                    </div>
                    <div style={{ fontSize: 14, color: 'var(--gray500)', lineHeight: 1.7 }}>
                      {displaySummary}
                    </div>
                  </>
                )}
              </div>
            );
          })()}

          {/* Experiences */}
          <div>
            <div style={{ fontWeight: 700, fontSize: 15, color: 'var(--navy)', marginBottom: 12, display: 'flex', alignItems: 'center', gap: 8 }}>
              <span>💼</span>
              <span>{t('tc.selectedExps')}</span>
              <span style={{
                padding: '2px 10px',
                background: confirmedCount > 0 ? 'rgba(var(--gold-rgb),0.15)' : 'rgba(220,53,69,0.1)',
                color: confirmedCount > 0 ? 'var(--navy)' : 'var(--danger)',
                borderRadius: 20,
                fontSize: 12,
                fontWeight: 600,
              }}>
                {confirmedCount} / {cvData.experiences.length} {t('tc.selectedCount')}
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
                            {isEditing ? t('tc.close') : wasEdited ? t('tc.edited') : t('tc.editBtn')}
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

          {/* Excluded experiences — collapsed section shown after Rigenera */}
          {excludedExperiences.length > 0 && (
            <div style={{
              border: '1px dashed var(--border)',
              borderRadius: 12,
              overflow: 'hidden',
            }}>
              <button
                onClick={() => setExcludedSectionOpen(o => !o)}
                style={{
                  width: '100%',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 10,
                  padding: '14px 20px',
                  background: 'rgba(0,0,0,0.02)',
                  border: 'none',
                  cursor: 'pointer',
                  textAlign: 'left',
                }}
              >
                <span style={{ fontSize: 15, color: 'var(--gray500)' }}>
                  {excludedSectionOpen ? '▾' : '▸'}
                </span>
                <span style={{ fontWeight: 600, fontSize: 14, color: 'var(--gray500)', flex: 1 }}>
                  {t('tc.excludedByAI')} ({excludedExperiences.length})
                </span>
                <span style={{
                  fontSize: 11,
                  color: 'var(--gray500)',
                  fontWeight: 500,
                }}>
                  {t('tc.clickToSeeAdd')}
                </span>
              </button>

              {excludedSectionOpen && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10, padding: '4px 16px 16px' }}>
                  {excludedExperiences.map(exp => (
                    <div
                      key={exp.id}
                      style={{
                        background: 'var(--surface)',
                        border: '1px solid var(--border)',
                        borderRadius: 10,
                        padding: '14px 18px',
                        display: 'flex',
                        alignItems: 'flex-start',
                        gap: 14,
                        opacity: 0.75,
                      }}
                    >
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, alignItems: 'baseline', marginBottom: 4 }}>
                          <span style={{ fontWeight: 700, fontSize: 14, color: 'var(--navy)' }}>{exp.role}</span>
                          <span style={{ color: 'var(--gray500)', fontSize: 13 }}>@ {exp.company}</span>
                          {exp.city && (
                            <span style={{ color: 'var(--gray500)', fontSize: 12 }}>• {exp.city}</span>
                          )}
                          {(exp.from || exp.to) && (
                            <span style={{
                              marginLeft: 'auto',
                              fontSize: 11,
                              color: 'var(--gray500)',
                              whiteSpace: 'nowrap',
                              background: 'rgba(0,0,0,0.04)',
                              padding: '2px 7px',
                              borderRadius: 5,
                              border: '1px solid var(--border)',
                            }}>
                              {exp.from}{exp.from && exp.to ? ' → ' : ''}{exp.to}
                            </span>
                          )}
                        </div>
                        {exp.desc && (
                          <div style={{
                            fontSize: 12,
                            color: 'var(--gray500)',
                            lineHeight: 1.6,
                            whiteSpace: 'pre-line',
                            marginTop: 4,
                          }}>
                            {exp.desc}
                          </div>
                        )}
                      </div>
                      <button
                        onClick={() => addExcludedBack(exp)}
                        style={{
                          flexShrink: 0,
                          padding: '5px 14px',
                          fontSize: 13,
                          fontWeight: 600,
                          border: '1.5px solid var(--gold)',
                          borderRadius: 7,
                          background: 'transparent',
                          color: 'var(--navy)',
                          cursor: 'pointer',
                          whiteSpace: 'nowrap',
                          transition: 'all 0.15s',
                        }}
                        onMouseEnter={e => {
                          (e.currentTarget as HTMLButtonElement).style.background = 'var(--gold)';
                          (e.currentTarget as HTMLButtonElement).style.color = '#fff';
                        }}
                        onMouseLeave={e => {
                          (e.currentTarget as HTMLButtonElement).style.background = 'transparent';
                          (e.currentTarget as HTMLButtonElement).style.color = 'var(--navy)';
                        }}
                      >
                        {t('tc.add')}
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

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
                <span>{t('tc.skillsForOffer')}</span>
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
          {(() => {
            const allExcluded = confirmedCount === 0 && cvData.experiences.length > 0;
            return (
              <>
                {confirmedCount === 0 && (
                  <div style={{
                    padding: '12px 16px',
                    background: 'rgba(220,53,69,0.07)',
                    border: '1px solid rgba(220,53,69,0.2)',
                    borderRadius: 10,
                    color: 'var(--danger)',
                    fontSize: 13,
                  }}>
                    {allExcluded
                      ? t('tc.excludedAllWarning')
                      : t('tc.selectAtLeastOne')}
                  </div>
                )}

                <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end', paddingTop: 4 }}>
                  <button
                    className="btn btn-ghost"
                    style={{
                      fontSize: 14,
                      opacity: allExcluded || generating ? 0.45 : 1,
                      cursor: allExcluded || generating ? 'not-allowed' : 'pointer',
                    }}
                    onClick={allExcluded || generating ? undefined : handleRegenerate}
                    disabled={allExcluded || generating}
                    title={allExcluded ? t('tc.excludedAllTitle') : undefined}
                  >
                    {generating ? (
                      <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <span className="ai-pulse-ring" style={{ width: 16, height: 16, margin: 0 }} />
                        {t('tc.regenerating')}
                      </span>
                    ) : (
                      t('tc.regenerate')
                    )}
                  </button>
                  <button
                    className="btn btn-gold"
                    style={{
                      fontSize: 15,
                      padding: '13px 32px',
                      opacity: confirmedCount === 0 || confirming ? 0.5 : 1,
                      cursor: confirmedCount === 0 || confirming ? 'not-allowed' : 'pointer',
                    }}
                    onClick={confirmedCount > 0 && !confirming ? handleConfirm : undefined}
                    disabled={confirmedCount === 0 || confirming}
                  >
                    {confirming ? (
                      <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <span className="ai-pulse-ring" style={{ width: 16, height: 16, margin: 0 }} />
                        {t('tc.saving')}
                      </span>
                    ) : (
                      t('tc.confirmOpenBuilder')
                    )}
                  </button>
                </div>
              </>
            );
          })()}
        </div>

        {/* Re-generating overlay */}
        {generating && (
          <div className="modal-overlay" style={{ zIndex: 300 }}>
            <div className="modal-box" style={{ textAlign: 'center', padding: 56, maxWidth: 420 }}>
              <div className="ai-pulse-ring" style={{ margin: '0 auto 24px' }} />
              <div style={{ fontSize: 40, marginBottom: 16 }}>✦</div>
              <div style={{ fontSize: 24, fontWeight: 700, color: 'var(--navy)', marginBottom: 12 }}>
                {t('tc.regeneratingTitle')}
              </div>
              <div style={{ color: 'var(--gray500)', fontSize: 14, lineHeight: 1.7 }}>
                {t('tc.regeneratingSub')}<br />
                <span style={{ color: 'var(--gold)', fontWeight: 600 }}>{t('tc.takesSeconds')}</span>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div style={{ maxWidth: 760, margin: '0 auto', padding: '8px 24px 48px' }}>

      {/* Header */}
      <div className="head">
        <div>
          <h1>{t('tc.mainTitle')}</h1>
          <p style={{ maxWidth: 560 }}>
            {t('tc.mainSub')}
          </p>
        </div>
      </div>

      {/* Auth gate */}
      {!isLoading && !isAuthenticated ? (
        <div className="lock-state" style={{ minHeight: '40vh' }}>
          <h2>{t('tc.loginGate')}</h2>
          <p style={{ color: 'var(--ink-60)', fontSize: 14.5, maxWidth: 440, lineHeight: 1.6 }}>
            {t('tc.loginGateSub')}
          </p>
          <button className="btn btn-ink" onClick={onLogin}>
            {t('nav.login')}
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
                {t('tc.tabUrl')}
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
                {t('tc.tabText')}
              </button>
            </div>

            <div style={{ padding: 28 }}>
              {mode === 'url' ? (
                <div>
                  <label style={{ display: 'block', fontWeight: 600, color: 'var(--navy)', fontSize: 14, marginBottom: 8 }}>
                    {t('tc.urlLabel')}
                  </label>
                  <p style={{ color: 'var(--gray500)', fontSize: 12, marginBottom: 12 }}>
                    {t('tc.urlHint')}
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
                      {fetchingUrl ? t('tc.loadingBtn') : t('tc.loadBtn')}
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
                    {t('tc.textLabel')}
                    {urlLoaded && (
                      <span style={{ marginLeft: 8, padding: '2px 8px', background: 'rgba(var(--success-rgb),0.1)', color: 'var(--success)', borderRadius: 4, fontSize: 11, fontWeight: 600 }}>
                        {t('tc.loadedFromURL')}
                      </span>
                    )}
                  </label>
                  <p style={{ color: 'var(--gray500)', fontSize: 12, marginBottom: 12 }}>
                    {t('tc.textHint')}
                  </p>
                  <textarea
                    rows={14}
                    placeholder={t('tc.textPlaceholder')}
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
                      {charCount < 50 ? `${50 - charCount} ${t('tc.charsNeeded')}` : `✓ ${charCount} ${t('tc.charsReady')}`}
                    </span>
                    <button
                      className="btn btn-ghost btn-sm"
                      style={{ fontSize: 11 }}
                      onClick={() => { setMode('url'); setUrlLoaded(false); }}
                    >
                      {t('tc.loadFromURL')}
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
              { icon: '🔍', label: t('tc.step1Label'), desc: t('tc.step1Desc') },
              { icon: '💼', label: t('tc.step2Label'), desc: t('tc.step2Desc') },
              { icon: '✍️', label: t('tc.step3Label'), desc: t('tc.step3Desc') },
              { icon: '🎯', label: t('tc.step4Label'), desc: t('tc.step4Desc') },
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
          <div style={{ display: 'flex', gap: 12, alignItems: 'center', justifyContent: 'flex-end', flexWrap: 'wrap' }}>
            <button
              className="btn btn-ghost"
              style={{ fontSize: 14 }}
              onClick={() => onNavigate('archivio')}
            >
              {t('tc.manageArchive')}
            </button>
            <button
              className="btn btn-ghost"
              style={{ fontSize: 14 }}
              onClick={() => onNavigate('candidature')}
            >
              {t('tc.myApplications')}
            </button>
            {previewData && (
              <button
                className="btn btn-ghost"
                style={{ fontSize: 14, borderColor: 'var(--gold)', color: 'var(--navy)' }}
                onClick={() => setViewState('preview')}
                disabled={generating}
              >
                {t('tc.backToPreview')}
              </button>
            )}
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
                  {t('tc.analyzingOffer')}
                </span>
              ) : (
                previewData ? t('tc.regenerateCV') : t('tc.generateTailoredCV')
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
            💡 <strong>{t('tc.tipStrong')}</strong> {t('tc.tipText1')}{' '}
            <button
              className="btn btn-ghost btn-sm"
              style={{ fontSize: 12, padding: '1px 6px', display: 'inline' }}
              onClick={() => onNavigate('archivio')}
            >
              {t('tc.personalArchive')}
            </button>
            {' '}{t('tc.tipText2')}
          </div>
        </div>
      )}

      {/* Full-screen loading overlay */}
      {generating && (
        <div className="modal-overlay" style={{ zIndex: 300 }}>
          <div className="modal-box" style={{ textAlign: 'center', padding: 56, maxWidth: 420 }}>
            <div className="ai-pulse-ring" style={{ margin: '0 auto 24px' }} />
            <div style={{ fontSize: 40, marginBottom: 16 }}>✦</div>
            <div style={{ fontSize: 24, fontWeight: 700, color: 'var(--navy)', marginBottom: 12 }}>
              {t('tc.creatingCV')}
            </div>
            <div style={{ color: 'var(--gray500)', fontSize: 14, lineHeight: 1.7 }}>
              {t('tc.analyzingJobStep')}<br />
              {t('tc.selectingExpsStep')}<br />
              {t('tc.rewritingKwStep')}<br />
              <span style={{ color: 'var(--gold)', fontWeight: 600 }}>{t('tc.takesSeconds')}</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
