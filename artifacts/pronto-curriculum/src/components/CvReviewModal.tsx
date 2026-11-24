import { useEffect, useMemo, useRef, useState } from 'react';
import { toast } from 'sonner';
import { CVData } from '../types';
import { aiCvReview, applyReviewChanges, type CvReview, type ReviewChange, type ReviewWeakness } from '../utils/aiCvAssistant';
import { CountrySelect, JOB_COUNTRIES, type CountryOption } from './CountrySelect';
import { Icon, IC } from './StrokeIcon';
import { useLanguage, useT } from '../i18n/LanguageContext';

// Market the CV is most likely aimed at, from the language it's written in.
const DEFAULT_COUNTRY_BY_CV_LANG: Record<string, string> = {
  IT: 'it', EN: 'gb', FR: 'fr', DE: 'de', ES: 'es', PT: 'pt',
};

const REVIEW_COUNTRIES: CountryOption[] = [...JOB_COUNTRIES, { code: 'pt', label: 'Portogallo' }];

const SEVERITY_COLOR: Record<ReviewWeakness['severity'], string> = {
  high: '#B33A3A',
  medium: '#B7791F',
  low: '#5A6270',
};

function scoreColor(score: number): string {
  if (score >= 70) return '#1A6B45';
  if (score >= 40) return '#B7791F';
  return '#B33A3A';
}

interface CvReviewModalProps {
  cvData: CVData;
  cvLang: string;
  initialCountry?: string | null;
  autoRun?: boolean;
  onCVChange: (data: CVData) => void;
  onClose: () => void;
}

export default function CvReviewModal({ cvData, cvLang, initialCountry, autoRun, onCVChange, onClose }: CvReviewModalProps) {
  const t = useT();
  const { lang: uiLang } = useLanguage();

  const countryOptions = useMemo(() => {
    let names: Intl.DisplayNames | null = null;
    try { names = new Intl.DisplayNames([uiLang.toLowerCase()], { type: 'region' }); } catch { /* old browser: keep default labels */ }
    return REVIEW_COUNTRIES
      .map(o => ({ ...o, label: names?.of(o.code.toUpperCase()) ?? o.label }))
      .sort((a, b) => a.label.localeCompare(b.label));
  }, [uiLang]);

  const [country, setCountry] = useState(initialCountry ?? DEFAULT_COUNTRY_BY_CV_LANG[cvLang] ?? 'it');
  const [targetRole, setTargetRole] = useState('');
  const [loading, setLoading] = useState(false);
  const [review, setReview] = useState<CvReview | null>(null);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [applied, setApplied] = useState<Set<string>>(new Set());
  const [expanded, setExpanded] = useState<Set<string>>(new Set());

  const runReview = async () => {
    setLoading(true);
    try {
      const result = await aiCvReview(cvData, country, targetRole, uiLang, cvLang);
      setReview(result);
      // Every applicable fix starts checked: the common case is "apply them all".
      setSelected(new Set(result.weaknesses.filter(w => w.change).map(w => w.id)));
      setApplied(new Set());
      setExpanded(new Set());
    } catch (err) {
      toast.error(err instanceof Error ? err.message : t('review.error'));
    } finally {
      setLoading(false);
    }
  };

  const didAutoRun = useRef(false);
  useEffect(() => {
    if (autoRun && !didAutoRun.current) {
      didAutoRun.current = true;
      void runReview();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autoRun]);

  const fixable = review?.weaknesses.filter(w => w.change && !applied.has(w.id)) ?? [];
  const toApply = fixable.filter(w => selected.has(w.id));
  const allSelected = fixable.length > 0 && toApply.length === fixable.length;
  const reviewCountryName = review ? (countryOptions.find(o => o.code === review.country)?.label ?? review.countryName) : '';

  const toggle = (set: Set<string>, id: string) => {
    const next = new Set(set);
    if (next.has(id)) next.delete(id); else next.add(id);
    return next;
  };

  const applySelected = () => {
    if (!toApply.length) return;
    const before = cvData;
    onCVChange(applyReviewChanges(cvData, toApply.map(w => w.change as ReviewChange)));
    setApplied(prev => new Set([...prev, ...toApply.map(w => w.id)]));
    toast.success(t('review.appliedToast').replace('{count}', String(toApply.length)), {
      duration: 10000,
      action: {
        label: t('review.undo'),
        onClick: () => {
          onCVChange(before);
          setApplied(prev => {
            const next = new Set(prev);
            toApply.forEach(w => next.delete(w.id));
            return next;
          });
        },
      },
    });
  };

  const expName = (id: string) => {
    const exp = cvData.experiences.find(e => e.id === id);
    return exp ? [exp.role, exp.company].filter(Boolean).join(' · ') : '';
  };

  const describeChange = (c: ReviewChange): { label: string; preview?: string } => {
    switch (c.type) {
      case 'set_title': return { label: t('review.ch.title'), preview: c.value };
      case 'set_summary': return { label: t('review.ch.summary'), preview: c.value };
      case 'set_experience_desc': return { label: t('review.ch.expDesc').replace('{name}', expName(c.experienceId)), preview: c.value };
      case 'add_skills': return { label: `${t('review.ch.addSkills')}: ${c.values.join(', ')}` };
      case 'remove_skills': return { label: `${t('review.ch.removeSkills')}: ${c.values.join(', ')}` };
      case 'remove_photo': return { label: t('review.ch.removePhoto') };
      case 'set_privacy_clause': return { label: t(c.value ? 'review.ch.privacyOn' : 'review.ch.privacyOff') };
      case 'sort_experiences': return { label: t('review.ch.sort') };
    }
  };

  return (
    <div className="clm-overlay" onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="clm-modal crv-modal">
        <div className="clm-header">
          <span className="clm-title">{t('review.title')}</span>
          <button className="clm-close" onClick={onClose} aria-label={t('ai.close')}>✕</button>
        </div>

        <div className="clm-body">
          <p className="clm-hint">{t('review.hint')}</p>
          <div className="clm-row crv-form">
            <div className="clm-field" style={{ flex: '1 1 170px' }}>
              <label>{t('review.country')}</label>
              <CountrySelect variant="field" options={countryOptions} value={country} onChange={setCountry} disabled={loading} ariaLabel={t('review.country')} />
            </div>
            <div className="clm-field" style={{ flex: '1 1 170px' }}>
              <label>{t('review.targetRole')}</label>
              <input type="text" placeholder={cvData.title || t('review.targetRolePlaceholder')} value={targetRole} onChange={e => setTargetRole(e.target.value)} disabled={loading} />
            </div>
          </div>
          <button className={`btn ${review ? 'btn-line' : 'btn-ink'}`} style={{ width: '100%', justifyContent: 'center' }} onClick={() => void runReview()} disabled={loading}>
            {loading ? t('review.running') : <><Icon d={IC.spark} size={13} /> {review ? t('review.rerun') : t('review.run')}</>}
          </button>

          {review && !loading && (
            <>
              <div className="clm-fit" style={{ borderColor: scoreColor(review.score) }}>
                <span className="clm-fit-score" style={{ color: scoreColor(review.score) }}>
                  {review.score}<span className="clm-fit-max">/100</span>
                </span>
                <span className="clm-fit-note">{review.verdict}</span>
              </div>

              {review.weaknesses.length === 0 ? (
                <div className="ai-panel-empty">{t('review.noIssues')}</div>
              ) : (
                <div className="crv-list">
                  {review.weaknesses.map(w => {
                    const isApplied = applied.has(w.id);
                    const change = w.change ? describeChange(w.change) : null;
                    return (
                      <div key={w.id} className={`crv-item${isApplied ? ' applied' : ''}`}>
                        <div className="crv-item-head">
                          <span className="crv-sev" style={{ color: SEVERITY_COLOR[w.severity], borderColor: SEVERITY_COLOR[w.severity] }}>
                            {t(`review.sev.${w.severity}`)}
                          </span>
                          <b>{w.title}</b>
                        </div>
                        {w.detail && <p className="crv-detail">{w.detail}</p>}
                        {w.norm && (
                          <p className="crv-norm">
                            <span>{t('review.whyIn').replace('{country}', reviewCountryName)}</span> {w.norm}
                          </p>
                        )}
                        {w.fix && <p className="crv-fix"><Icon d={IC.bulb} size={12} /> {w.fix}</p>}

                        {change ? (
                          <div className="crv-change">
                            <label className="crv-check">
                              <input
                                type="checkbox"
                                checked={isApplied || selected.has(w.id)}
                                disabled={isApplied}
                                onChange={() => setSelected(prev => toggle(prev, w.id))}
                              />
                              <span>{isApplied ? `✓ ${t('review.applied')}` : change.label}</span>
                            </label>
                            {change.preview && !isApplied && (
                              <>
                                <button className="crv-toggle" onClick={() => setExpanded(prev => toggle(prev, w.id))}>
                                  {expanded.has(w.id) ? t('review.hideChange') : t('review.showChange')}
                                </button>
                                {expanded.has(w.id) && <div className="crv-preview">{change.preview}</div>}
                              </>
                            )}
                          </div>
                        ) : (
                          <div className="crv-advice">{t('review.adviceOnly')}</div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}

              {fixable.length > 0 && (
                <div className="crv-foot">
                  <button className="btn btn-ghost btn-sm" onClick={() => setSelected(allSelected ? new Set() : new Set(fixable.map(w => w.id)))}>
                    {allSelected ? t('review.selectNone') : t('review.selectAll')}
                  </button>
                  <button className="btn btn-ink btn-sm" style={{ flex: 1, justifyContent: 'center' }} onClick={applySelected} disabled={!toApply.length}>
                    <Icon d={IC.check} size={12} />{' '}
                    {(allSelected ? t('review.applyAll') : t('review.applySelected')).replace('{count}', String(toApply.length))}
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
