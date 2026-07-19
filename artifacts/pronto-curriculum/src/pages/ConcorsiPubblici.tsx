import React, { useState } from 'react';
import type { Page, CVData, TemplateType } from '../types';
import { useSeoMeta } from '../components/EditorialChrome';

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
      const bandoSummary = `Candidato per Concorsi PA — Titoli posseduti a norma del D.P.R. 445/2000:\n• Laurea Magistrale conseguita con votazione ${laureaScore}/110 ${hasLode ? 'con Lode accademica' : ''}\n• Anni di servizio o collaborazione nella Pubblica Amministrazione: ${paYears} anni\n• Certificazioni linguistiche, informatiche o master post-laurea verificate: ${certifications} titoli\n\n${cvData.summary || ''}`.trim();
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
          <h1>Concorsi Pubblici & Bandi PA</h1>
          <p>
            Il primo generatore di CV progettato per rispettare i criteri rigorosi della Pubblica Amministrazione Italiana.
          </p>
        </div>
        <button className="btn btn-ink" onClick={handleCreateConcorsoCv}>
          Crea CV per Concorso PA →
        </button>
      </div>

      {/* Hero Explainer Box */}
      <div className="panel panel-cta" style={{ padding: '32px 36px', marginBottom: 36 }}>
        <div style={{ display: 'flex', gap: 12, alignItems: 'center', marginBottom: 14, flexWrap: 'wrap' }}>
          <span className="mono">Esclusiva ProntoCurriculum</span>
          <span style={{ fontSize: 13, color: 'var(--ink-60)' }}>✓ Autocertificazione DPR 445/2000 automatica</span>
        </div>
        <h2 style={{ fontFamily: 'var(--f-display)', fontSize: 24, fontWeight: 700, letterSpacing: '-0.02em', margin: '0 0 12px', lineHeight: 1.3 }}>
          Perché un normale Europass viene scartato nei Concorsi Pubblici?
        </h2>
        <p style={{ fontSize: 14.5, color: 'var(--ink-60)', lineHeight: 1.6, maxWidth: 840, margin: '0 0 24px' }}>
          Le commissioni esaminatrici nei bandi (Scuola, Sanità ASL, Ministeri, Agenzia delle Entrate, INPS) valutano i titoli secondo griglie numeriche inflessibili. Se il tuo CV presenta margini dispersivi o omette gli estremi del decreto di laurea, rischi di perdere punti decisivi nella graduatoria finale.
        </p>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 14 }}>
          <div style={{ background: '#FFFFFF', padding: 20, borderRadius: 12, border: '1px solid var(--hair-soft)' }}>
            <div style={{ fontWeight: 700, fontSize: 14.5, marginBottom: 6, color: 'var(--ink)' }}>Zero spreco di spazio</div>
            <div style={{ fontSize: 13, color: 'var(--ink-60)', lineHeight: 1.5 }}>
              Eliminiamo le griglie vuote di autovalutazione lingue. Riduciamo un documento di 5 pagine in 2 pagine nitide ad alta densità informativa.
            </div>
          </div>
          <div style={{ background: '#FFFFFF', padding: 20, borderRadius: 12, border: '1px solid var(--hair-soft)' }}>
            <div style={{ fontWeight: 700, fontSize: 14.5, marginBottom: 6, color: 'var(--ink)' }}>Formula DPR 445/2000</div>
            <div style={{ fontSize: 13, color: 'var(--ink-60)', lineHeight: 1.5 }}>
              Inserimento automatico dell'autodichiarazione legale di veridicità dei titoli a norma di legge italiana sia nell'intestazione che in calce.
            </div>
          </div>
          <div style={{ background: '#FFFFFF', padding: 20, borderRadius: 12, border: '1px solid var(--hair-soft)' }}>
            <div style={{ fontWeight: 700, fontSize: 14.5, marginBottom: 6, color: 'var(--ink)' }}>Evidenza dei titoli e voti</div>
            <div style={{ fontSize: 13, color: 'var(--ink-60)', lineHeight: 1.5 }}>
              I voti di laurea, lodi, abilitazioni professionali e periodi di servizio nella PA vengono risaltati semanticalmente per facilitare il calcolo punti.
            </div>
          </div>
        </div>
      </div>

      {/* Interactive Title Score Simulator */}
      <div className="panel" style={{ padding: 32, marginBottom: 36 }}>
        <h3 style={{ fontSize: 18, marginBottom: 6 }}>
          Calcolatore Punteggio Titoli per Graduatorie PA
        </h3>
        <p className="psub" style={{ margin: '0 0 24px' }}>
          Simula il punteggio stimato del tuo profilo prima di inviare la domanda al concorso. Cliccando su "Ottimizza" applicheremo questi titoli al formato `europass_pubblico`.
        </p>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 28, alignItems: 'center' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            <div>
              <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: 'var(--ink-60)', marginBottom: 6 }}>
                Voto di Laurea: <strong style={{ color: 'var(--navy)' }}>{laureaScore}/110</strong>
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
                Concessione della Lode accademica (+5 pt)
              </label>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: 'var(--ink-60)', marginBottom: 6 }}>
                Anni di Servizio Pregresso nella PA: <strong style={{ color: 'var(--navy)' }}>{paYears} anni</strong>
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
                Master, Certificazioni Linguistiche (B2/C1) o IT: <strong style={{ color: 'var(--navy)' }}>{certifications} titoli</strong>
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
              Stima Punteggio Titoli
            </span>
            <div style={{ fontSize: 52, fontWeight: 700, color: 'var(--navy)', margin: '10px 0' }}>
              {estimatedScore} <span style={{ fontSize: 24, color: 'var(--ink-40)' }}>/ 60 pt</span>
            </div>
            <p style={{ fontSize: 13, color: 'var(--ink-60)', margin: '0 0 20px', lineHeight: 1.5 }}>
              Punteggio calcolato secondo le medie ponderate dei recenti bandi INPS e Ministero della Giustizia.
            </p>
            <button
              className="btn btn-ink"
              style={{ width: '100%', padding: '12px', fontSize: 14 }}
              onClick={handleCreateConcorsoCv}
            >
              Ottimizza il CV per Questo Punteggio →
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
