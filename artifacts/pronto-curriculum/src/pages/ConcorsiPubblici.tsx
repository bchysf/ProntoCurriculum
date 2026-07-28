import React, { useState } from 'react';
import type { Page, CVData, TemplateType } from '../types';
import { useSeoMeta } from '../components/EditorialChrome';
import { useT } from '../i18n/LanguageContext';

interface ConcorsiPubbliciProps {
  onNavigate: (page: Page) => void;
  cvData?: CVData;
  onCVChange?: (data: CVData) => void;
  onTemplateChange?: (template: TemplateType) => void;
}

export default function ConcorsiPubblici({ onNavigate, cvData, onCVChange, onTemplateChange }: ConcorsiPubbliciProps) {
  useSeoMeta(
    'CV per Concorsi Pubblici: Punteggio Titoli e Template PA | ProntoCurriculum',
    'Calcola il punteggio titoli stimato per i concorsi pubblici e genera un CV in formato Europass/PA, con laurea, servizio in PA e certificazioni valorizzati secondo i bandi.',
    '/concorsi-pubblici',
  );
  const t = useT();
  const [laureaScore, setLaureaScore] = useState<number>(110);
  const [hasLode, setHasLode] = useState<boolean>(true);
  const [paYears, setPaYears] = useState<number>(2);
  const [certifications, setCertifications] = useState<number>(2);

  // Calculate estimated bando score
  const estimatedScore = Math.min(
    100,
    Math.round(
      (laureaScore / 110) * 35 +
        (hasLode ? 5 : 0) +
        paYears * 6 +
        certifications * 3.5
    ) * 10
  ) / 10;

  const handleCreateConcorsoCv = () => {
    if (onTemplateChange) {
      onTemplateChange('europass_pubblico');
    }
    if (cvData && onCVChange) {
      const bandoSummary = `${t('cp.summaryLine1')}\n• ${t('cp.summaryDegree')} ${laureaScore}/110 ${hasLode ? t('cp.summaryWithHonors') : ''}\n• ${t('cp.summaryPaYears')} ${paYears} ${t('cp.years')}\n• ${t('cp.summaryCerts')} ${certifications} ${t('cp.titlesCount')}\n\n${cvData.summary || ''}`.trim();
      onCVChange({
        ...cvData,
        summary: bandoSummary,
      });
    }
    onNavigate('builder-step1');
  };

  return (
    <div style={{ maxWidth: 1140, margin: '0 auto', padding: '8px 24px 80px' }}>
      {/* Header */}
      <div className="head">
        <div>
          <h1>{t('cp.title')}</h1>
          <p>
            {t('cp.subtitle')}
          </p>
        </div>
        <button className="btn btn-ink" onClick={handleCreateConcorsoCv}>
          {t('cp.createCta')}
        </button>
      </div>

      {/* Hero Explainer Box */}
      <div className="panel panel-cta" style={{ padding: '32px 36px', marginBottom: 36 }}>
        <div style={{ display: 'flex', gap: 12, alignItems: 'center', marginBottom: 14, flexWrap: 'wrap' }}>
          <span className="mono">{t('cp.exclusive')}</span>
          <span style={{ fontSize: 13, color: 'var(--ink-60)' }}>{t('cp.autocert')}</span>
        </div>
        <h2 style={{ fontFamily: 'var(--f-display)', fontSize: 24, fontWeight: 700, letterSpacing: '-0.02em', margin: '0 0 12px', lineHeight: 1.3 }}>
          {t('cp.whyTitle')}
        </h2>
        <p style={{ fontSize: 14.5, color: 'var(--ink-60)', lineHeight: 1.6, maxWidth: 840, margin: '0 0 24px' }}>
          {t('cp.whySub')}
        </p>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 14 }}>
          <div style={{ background: '#FFFFFF', padding: 20, borderRadius: 12, border: '1px solid var(--hair-soft)' }}>
            <div style={{ fontWeight: 700, fontSize: 14.5, marginBottom: 6, color: 'var(--ink)' }}>{t('cp.card1title')}</div>
            <div style={{ fontSize: 13, color: 'var(--ink-60)', lineHeight: 1.5 }}>
              {t('cp.card1desc')}
            </div>
          </div>
          <div style={{ background: '#FFFFFF', padding: 20, borderRadius: 12, border: '1px solid var(--hair-soft)' }}>
            <div style={{ fontWeight: 700, fontSize: 14.5, marginBottom: 6, color: 'var(--ink)' }}>{t('cp.card2title')}</div>
            <div style={{ fontSize: 13, color: 'var(--ink-60)', lineHeight: 1.5 }}>
              {t('cp.card2desc')}
            </div>
          </div>
          <div style={{ background: '#FFFFFF', padding: 20, borderRadius: 12, border: '1px solid var(--hair-soft)' }}>
            <div style={{ fontWeight: 700, fontSize: 14.5, marginBottom: 6, color: 'var(--ink)' }}>{t('cp.card3title')}</div>
            <div style={{ fontSize: 13, color: 'var(--ink-60)', lineHeight: 1.5 }}>
              {t('cp.card3desc')}
            </div>
          </div>
        </div>
      </div>

      {/* Interactive Title Score Simulator */}
      <div className="panel" style={{ padding: 32, marginBottom: 36 }}>
        <h3 style={{ fontSize: 18, marginBottom: 6 }}>
          {t('cp.calcTitle')}
        </h3>
        <p className="psub" style={{ margin: '0 0 24px' }}>
          {t('cp.calcSub')}
        </p>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 28, alignItems: 'center' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            <div>
              <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: 'var(--ink-60)', marginBottom: 6 }}>
                {t('cp.degreeGrade')} <strong style={{ color: 'var(--navy)' }}>{laureaScore}/110</strong>
              </label>
              <input
                type="range"
                min={66}
                max={110}
                value={laureaScore}
                onChange={(e) => setLaureaScore(Number(e.target.value))}
                style={{ width: '100%', accentColor: 'var(--accent)' }}
              />
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <input
                type="checkbox"
                id="lode"
                checked={hasLode}
                onChange={(e) => setHasLode(e.target.checked)}
                style={{ width: 18, height: 18, accentColor: '#2F2AE5' }}
              />
              <label htmlFor="lode" style={{ fontSize: 14, fontWeight: 600, color: 'var(--ink-60)', cursor: 'pointer' }}>
                {t('cp.honorsGrant')}
              </label>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: 'var(--ink-60)', marginBottom: 6 }}>
                {t('cp.paYearsLabel')} <strong style={{ color: 'var(--navy)' }}>{paYears} {t('cp.years')}</strong>
              </label>
              <input
                type="range"
                min={0}
                max={10}
                value={paYears}
                onChange={(e) => setPaYears(Number(e.target.value))}
                style={{ width: '100%', accentColor: 'var(--accent)' }}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: 'var(--ink-60)', marginBottom: 6 }}>
                {t('cp.certLabel')} <strong style={{ color: 'var(--navy)' }}>{certifications} {t('cp.titlesCount')}</strong>
              </label>
              <input
                type="range"
                min={0}
                max={6}
                value={certifications}
                onChange={(e) => setCertifications(Number(e.target.value))}
                style={{ width: '100%', accentColor: 'var(--accent)' }}
              />
            </div>
          </div>

          <div style={{ background: 'var(--tint)', border: '1px solid rgba(47, 42, 229, 0.2)', borderRadius: 16, padding: '32px', textAlign: 'center' }}>
            <span style={{ fontSize: 12, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--ink-60)' }}>
              {t('cp.estimatedScore')}
            </span>
            <div style={{ fontSize: 52, fontWeight: 700, color: 'var(--navy)', margin: '10px 0' }}>
              {estimatedScore} <span style={{ fontSize: 24, color: 'var(--ink-40)' }}>/ 60 pt</span>
            </div>
            <p style={{ fontSize: 13, color: 'var(--ink-60)', margin: '0 0 20px', lineHeight: 1.5 }}>
              {t('cp.scoreNote')}
            </p>
            <button
              className="btn btn-ink"
              style={{ width: '100%', padding: '12px', fontSize: 14 }}
              onClick={handleCreateConcorsoCv}
            >
              {t('cp.optimizeCta')}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
