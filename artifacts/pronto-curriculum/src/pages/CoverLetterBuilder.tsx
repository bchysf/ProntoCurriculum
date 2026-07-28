import React, { useState } from 'react';
import type { Page, CVData, TemplateType } from '../types';
import { toast } from 'sonner';
import { useSeoMeta } from '../components/EditorialChrome';
import { CountrySelect } from '../components/CountrySelect';
import { useT, useLanguage } from '../i18n/LanguageContext';

const LOCALE_MAP: Record<string, string> = { IT: 'it-IT', EN: 'en-US', FR: 'fr-FR', DE: 'de-DE', ES: 'es-ES', PT: 'pt-PT' };

interface CoverLetterBuilderProps {
  cvData: CVData;
  template?: TemplateType;
  onNavigate: (page: Page) => void;
}

interface CoverLetterData {
  recipient: string;
  hookParagraph: string;
  valueParagraph: string;
  cultureParagraph: string;
  closingParagraph: string;
  signOff: string;
}

export default function CoverLetterBuilder({ cvData, template = 'modern', onNavigate }: CoverLetterBuilderProps) {
  useSeoMeta(
    'Genera Lettera di Presentazione con l\'AI | ProntoCurriculum',
    'Crea una lettera di presentazione professionale in italiano in pochi secondi: l\'AI la scrive a partire dal tuo CV e dall\'annuncio di lavoro, con tono formale, entusiasta o executive a scelta.',
    '/genera-lettera-presentazione',
  );
  const t = useT();
  const { lang } = useLanguage();
  const LETTER_LANGS = [
    { code: 'IT', label: t('cl.langItalian'), flag: 'it' },
    { code: 'EN', label: t('cl.langEnglish'), flag: 'gb' },
    { code: 'FR', label: t('cl.langFrench'), flag: 'fr' },
    { code: 'DE', label: t('cl.langGerman'), flag: 'de' },
    { code: 'ES', label: t('cl.langSpanish'), flag: 'es' },
  ];
  const [jobTitle, setJobTitle] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [jobDescription, setJobDescription] = useState('');
  const [tone, setTone] = useState<'formal' | 'enthusiastic' | 'concise' | 'executive'>('formal');
  const [language, setLanguage] = useState('IT');
  const [isGenerating, setIsGenerating] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);

  const [letterData, setLetterData] = useState<CoverLetterData>({
    recipient: t('cl.defaultRecipient'),
    hookParagraph: t('cl.defaultHook'),
    valueParagraph: t('cl.defaultValue'),
    cultureParagraph: t('cl.defaultCulture'),
    closingParagraph: t('cl.defaultClosing'),
    signOff: `${t('cl.regards')}\n${cvData?.firstName ?? t('cl.nameFallback')} ${cvData?.lastName ?? t('cl.lastNameFallback')}`
  });

  const handleGenerateAI = async () => {
    if (!jobTitle.trim() && !companyName.trim() && !jobDescription.trim()) {
      toast.error(t('cl.errFillOne'));
      return;
    }

    setIsGenerating(true);
    try {
      const res = await fetch('/api/cover-letter/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          cvData,
          jobTitle: jobTitle || cvData?.title || t('cl.applicationFallback'),
          companyName: companyName || t('cl.targetCompanyFallback'),
          jobDescription,
          tone,
          language
        })
      });

      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error || t('cl.errGenerate'));
      }

      setLetterData(json.data);
      toast.success(t('cl.generatedSuccess'));
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      toast.error(message);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleDownloadDOCX = async () => {
    setIsDownloading(true);
    try {
      const res = await fetch('/api/cover-letter/export/docx', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          recipient: letterData.recipient,
          hookParagraph: letterData.hookParagraph,
          valueParagraph: letterData.valueParagraph,
          cultureParagraph: letterData.cultureParagraph,
          closingParagraph: letterData.closingParagraph,
          signOff: letterData.signOff,
          applicantName: `${cvData?.firstName ?? ''} ${cvData?.lastName ?? ''}`.trim() || t('cl.candidateFallback'),
          applicantEmail: cvData?.email || t('cl.exampleEmail'),
          applicantPhone: cvData?.phone || '+39 000 000000',
          jobTitle: jobTitle || cvData?.title || t('cl.applicationFallback'),
          companyName: companyName || t('cl.targetCompanyFallback'),
          template
        })
      });

      if (!res.ok) {
        throw new Error(t('cl.errDocx'));
      }

      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      const sanitizedName = (`${cvData?.firstName ?? ''}_${cvData?.lastName ?? ''}`).replace(/[^a-zA-Z0-9_-]/g, '_') || 'Candidato';
      a.download = `Lettera_Presentazione_${sanitizedName}_ProntoCurriculum.docx`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      toast.success(t('cl.docxDownloaded'));
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      toast.error(message);
    } finally {
      setIsDownloading(false);
    }
  };

  const handleCopyText = () => {
    const fullText = `${cvData?.firstName ?? ''} ${cvData?.lastName ?? ''}
${jobTitle || cvData?.title || ''} · ${cvData?.email || ''} · ${cvData?.phone || ''}

${new Date().toLocaleDateString(LOCALE_MAP[lang] ?? 'it-IT', { day: 'numeric', month: 'long', year: 'numeric' })}
${t('cl.dearCompany')} ${companyName || t('cl.targetCompanyFallback')}
${t('cl.subjectLine')} ${jobTitle || cvData?.title || t('cl.applicationFallback')}

${letterData.recipient}

${letterData.hookParagraph}

${letterData.valueParagraph}

${letterData.cultureParagraph}

${letterData.closingParagraph}

${letterData.signOff}`;

    navigator.clipboard.writeText(fullText);
    toast.success(t('cl.copiedToClipboard'));
  };

  const fieldLabel: React.CSSProperties = { fontSize: 12, fontWeight: 700, color: 'var(--ink)', display: 'block', marginBottom: 4 };
  const docLabel: React.CSSProperties = { fontSize: 9.5, fontWeight: 700, color: '#2F2AE5', letterSpacing: 0.8, textTransform: 'uppercase', display: 'block', marginBottom: 2 };
  const docTextarea: React.CSSProperties = { width: '100%', border: '1px dashed transparent', padding: '3px 6px', fontSize: 13, lineHeight: 1.55, color: '#334155', borderRadius: 4, outline: 'none', background: '#FAFAF8', fontFamily: 'inherit', resize: 'vertical' };

  return (
    <div style={{ maxWidth: 1400, margin: '0 auto', height: 'calc(100vh - 36px)', display: 'flex', flexDirection: 'column' }}>
      {/* Top Header Bar */}
      <div className="head" style={{ marginBottom: 14, alignItems: 'center' }}>
        <div>
          <h1>{t('cl.title')}</h1>
          <p>
            {t('cl.subtitle')}
          </p>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button className="btn btn-ghost btn-sm" onClick={() => onNavigate('builder-step2')}>
            {t('cl.backToCV')}
          </button>
          <button className="btn btn-line btn-sm" onClick={handleCopyText} title={t('cl.copyTextTitle')}>
            {t('cl.copyText')}
          </button>
          <button
            className="btn btn-ink btn-sm"
            onClick={handleDownloadDOCX}
            disabled={isDownloading}
          >
            {isDownloading ? <span className="spinner" /> : null}
            {t('cl.downloadWord')}
          </button>
        </div>
      </div>

      {/* Main Split Grid — both columns scroll internally, page never scrolls */}
      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(330px, 5fr) 7fr', gap: 18, flex: 1, minHeight: 0 }}>

        {/* LEFT COLUMN: Input & Settings */}
        <div className="panel" style={{ margin: 0, padding: '18px 20px', overflowY: 'auto', display: 'flex', flexDirection: 'column' }}>
          <h3 style={{ fontSize: 15, marginBottom: 2 }}>{t('cl.applicationData')}</h3>
          <p className="psub" style={{ marginBottom: 14 }}>
            {t('cl.moreContext')}
          </p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div>
              <label style={fieldLabel}>
                {t('cl.roleTarget')} <span style={{ color: 'var(--accent, #2F2AE5)' }}>*</span>
              </label>
              <input
                type="text"
                className="input"
                placeholder="es. Senior Growth Marketing Manager"
                value={jobTitle}
                onChange={(e) => setJobTitle(e.target.value)}
                style={{ width: '100%' }}
              />
            </div>

            <div>
              <label style={fieldLabel}>
                {t('cl.targetCompany')} <span style={{ color: 'var(--accent, #2F2AE5)' }}>*</span>
              </label>
              <input
                type="text"
                className="input"
                placeholder="es. Bending Spoons, Ferrari, Enel"
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
                style={{ width: '100%' }}
              />
            </div>

            <div>
              <label style={fieldLabel}>
                {t('cl.jobPosting')} <span style={{ color: 'var(--ink-40, #9297A1)', fontWeight: 500 }}>{t('cl.recommendedATS')}</span>
              </label>
              <textarea
                className="input"
                rows={5}
                placeholder={t('cl.jobPostingPlaceholder')}
                value={jobDescription}
                onChange={(e) => setJobDescription(e.target.value)}
                style={{ width: '100%', fontSize: 13, resize: 'vertical' }}
              />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 0.8fr', gap: 10 }}>
              <div>
                <label style={fieldLabel}>{t('cl.toneOfVoice')}</label>
                <select
                  className="input"
                  value={tone}
                  onChange={(e) => setTone(e.target.value as unknown as typeof tone)}
                  style={{ width: '100%' }}
                >
                  <option value="formal">{t('cl.toneFormal')}</option>
                  <option value="enthusiastic">{t('cl.toneEnthusiastic')}</option>
                  <option value="concise">{t('cl.toneConcise')}</option>
                  <option value="executive">{t('cl.toneExecutive')}</option>
                </select>
              </div>

              <div>
                <label style={fieldLabel}>{t('cl.letterLanguage')}</label>
                <CountrySelect
                  variant="field"
                  options={LETTER_LANGS}
                  value={language}
                  onChange={setLanguage}
                  ariaLabel={t('cl.letterLanguageAria')}
                  style={{ width: '100%' }}
                />
              </div>
            </div>

            <button
              className="btn btn-ink"
              onClick={handleGenerateAI}
              disabled={isGenerating}
              style={{ width: '100%', marginTop: 4, justifyContent: 'center' }}
            >
              {isGenerating ? (
                <>
                  <span className="spinner" /> {t('cl.generating')}
                </>
              ) : (
                <>{t('cl.generateWithAI')}</>
              )}
            </button>
            <p style={{ fontSize: 11.5, color: 'var(--ink-40, #9297A1)', textAlign: 'center', margin: 0, lineHeight: 1.45 }}>
              {t('cl.editInPreview')}
            </p>
          </div>
        </div>

        {/* RIGHT COLUMN: Live Interactive Preview */}
        <div style={{ display: 'flex', flexDirection: 'column', minHeight: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8, flexShrink: 0 }}>
            <span className="mono">{t('cl.docPreview')}</span>
            <span style={{ fontSize: 10.5, background: 'var(--tint, #EEEDFC)', color: 'var(--accent, #2F2AE5)', padding: '2px 8px', borderRadius: 100, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              {template}
            </span>
            <span style={{ fontSize: 11.5, color: 'var(--ink-40, #9297A1)', marginLeft: 'auto' }}>
              {t('cl.clickToEdit')}
            </span>
          </div>

          {/* Document Sheet Preview — scrolls on its own */}
          <div
            className="sheet"
            style={{
              flex: 1,
              minHeight: 0,
              overflowY: 'auto',
              background: '#FFFFFF',
              padding: '28px 34px',
              borderRadius: 12,
              border: '1px solid var(--hair-soft, rgba(20,23,31,0.07))',
              boxShadow: '0 8px 24px rgba(0,0,0,0.05)',
              fontFamily: template === 'executive' || template === 'europass' ? 'Arial, sans-serif' : 'DM Sans, Satoshi, sans-serif',
              color: '#1E293B',
              lineHeight: 1.6
            }}
          >
            {/* Header / Applicant Info */}
            <div style={{ borderBottom: '2px solid #0B1D3A', paddingBottom: 12, marginBottom: 16 }}>
              <h2 style={{ fontSize: 20, fontWeight: 800, margin: '0 0 3px', color: '#0B1D3A', letterSpacing: '-0.4px' }}>
                {(cvData?.firstName ?? t('cl.nameFallback')).toUpperCase()} {(cvData?.lastName ?? t('cl.lastNameFallback')).toUpperCase()}
              </h2>
              <div style={{ fontSize: 12, color: '#64748B', fontWeight: 500 }}>
                {jobTitle || cvData?.title || t('cl.professionalFallback')} · {cvData?.email || t('cl.exampleEmail')} · {cvData?.phone || '+39 000 000000'}
              </div>
            </div>

            {/* Date and Company Header */}
            <div style={{ marginBottom: 16, fontSize: 12.5 }}>
              <div style={{ color: '#64748B', marginBottom: 6 }}>
                {new Date().toLocaleDateString(LOCALE_MAP[lang] ?? 'it-IT', { day: 'numeric', month: 'long', year: 'numeric' })}
              </div>
              <div style={{ fontWeight: 700, color: '#0F172A', fontSize: 13 }}>
                {t('cl.dearCompany')} {companyName || t('cl.targetCompanyFallback')}
              </div>
              <div style={{ fontWeight: 700, color: '#0B1D3A', marginTop: 2, fontSize: 12.5 }}>
                {t('cl.subjectLine')} {jobTitle || cvData?.title || t('cl.applicationFallback')}
              </div>
            </div>

            {/* Recipient Greeting */}
            <div style={{ marginBottom: 10 }}>
              <input
                type="text"
                value={letterData.recipient}
                onChange={(e) => setLetterData({ ...letterData, recipient: e.target.value })}
                style={{ width: '100%', fontWeight: 700, fontSize: 13, border: 'none', background: 'transparent', color: '#0F172A', outline: 'none', fontFamily: 'inherit' }}
              />
            </div>

            {/* 4 Paragraphs (Hook, Value, Culture, Closing) */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <div>
                <label style={docLabel}>{t('cl.p1Label')}</label>
                <textarea
                  rows={3}
                  value={letterData.hookParagraph}
                  onChange={(e) => setLetterData({ ...letterData, hookParagraph: e.target.value })}
                  style={docTextarea}
                  onFocus={(e) => { e.target.style.borderColor = '#2F2AE5'; }}
                  onBlur={(e) => { e.target.style.borderColor = 'transparent'; }}
                />
              </div>

              <div>
                <label style={docLabel}>{t('cl.p2Label')}</label>
                <textarea
                  rows={4}
                  value={letterData.valueParagraph}
                  onChange={(e) => setLetterData({ ...letterData, valueParagraph: e.target.value })}
                  style={docTextarea}
                  onFocus={(e) => { e.target.style.borderColor = '#2F2AE5'; }}
                  onBlur={(e) => { e.target.style.borderColor = 'transparent'; }}
                />
              </div>

              <div>
                <label style={docLabel}>{t('cl.p3Label')}</label>
                <textarea
                  rows={3}
                  value={letterData.cultureParagraph}
                  onChange={(e) => setLetterData({ ...letterData, cultureParagraph: e.target.value })}
                  style={docTextarea}
                  onFocus={(e) => { e.target.style.borderColor = '#2F2AE5'; }}
                  onBlur={(e) => { e.target.style.borderColor = 'transparent'; }}
                />
              </div>

              <div>
                <label style={docLabel}>{t('cl.p4Label')}</label>
                <textarea
                  rows={2}
                  value={letterData.closingParagraph}
                  onChange={(e) => setLetterData({ ...letterData, closingParagraph: e.target.value })}
                  style={docTextarea}
                  onFocus={(e) => { e.target.style.borderColor = '#2F2AE5'; }}
                  onBlur={(e) => { e.target.style.borderColor = 'transparent'; }}
                />
              </div>
            </div>

            {/* Sign Off */}
            <div style={{ marginTop: 14 }}>
              <textarea
                rows={2}
                value={letterData.signOff}
                onChange={(e) => setLetterData({ ...letterData, signOff: e.target.value })}
                style={{ ...docTextarea, fontWeight: 700, color: '#0F172A', background: 'transparent' }}
              />
            </div>

            {/* GDPR Privacy Clause */}
            <div style={{ marginTop: 16, paddingTop: 10, borderTop: '1px solid var(--hair-soft, rgba(20,23,31,0.07))', fontSize: 10, fontStyle: 'italic', color: '#94A3B8' }}>
              {t('cl.gdprClause')}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
