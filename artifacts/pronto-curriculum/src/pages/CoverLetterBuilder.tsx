import React, { useState } from 'react';
import type { Page, CVData, TemplateType } from '../types';
import { toast } from 'sonner';
import { useSeoMeta } from '../components/EditorialChrome';
import { CountrySelect } from '../components/CountrySelect';

const LETTER_LANGS = [
  { code: 'IT', label: 'Italiano', flag: 'it' },
  { code: 'EN', label: 'Inglese', flag: 'gb' },
  { code: 'FR', label: 'Francese', flag: 'fr' },
  { code: 'DE', label: 'Tedesco', flag: 'de' },
  { code: 'ES', label: 'Spagnolo', flag: 'es' },
];

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
  const [jobTitle, setJobTitle] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [jobDescription, setJobDescription] = useState('');
  const [tone, setTone] = useState<'formal' | 'enthusiastic' | 'concise' | 'executive'>('formal');
  const [language, setLanguage] = useState('IT');
  const [isGenerating, setIsGenerating] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);

  const [letterData, setLetterData] = useState<CoverLetterData>({
    recipient: 'Gentile Responsabile della Selezione,',
    hookParagraph: 'Con la presente intendo sottoporre alla Vostra attenzione la mia candidatura per la posizione aperta all\'interno del Vostro stimato team.',
    valueParagraph: 'Nel corso della mia esperienza professionale ho sviluppato solide competenze tecniche e relazionali, raggiungendo costantemente gli obiettivi di performance prefissati e contribuendo positivamente alla crescita dei dipartimenti in cui ho operato.',
    cultureParagraph: 'Condivido pienamente i valori di innovazione e qualità che contraddistinguono la Vostra realtà aziendale e sono motivato/a a portare il mio entusiasmo e il mio metodo di lavoro orientato ai risultati.',
    closingParagraph: 'Resto a Vostra completa disposizione per un colloquio conoscitivo o una breve chiamata di approfondimento. Ringraziando per l\'attenzione, porgo i miei più cordiali saluti.',
    signOff: `Cordiali saluti,\n${cvData?.firstName ?? 'Nome'} ${cvData?.lastName ?? 'Cognome'}`
  });

  const handleGenerateAI = async () => {
    if (!jobTitle.trim() && !companyName.trim() && !jobDescription.trim()) {
      toast.error('Inserisci almeno il Ruolo, l\'Azienda o l\'Annuncio di lavoro prima di generare con AI.');
      return;
    }

    setIsGenerating(true);
    try {
      const res = await fetch('/api/cover-letter/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          cvData,
          jobTitle: jobTitle || cvData?.title || 'Candidatura',
          companyName: companyName || 'Azienda Target',
          jobDescription,
          tone,
          language
        })
      });

      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error || 'Errore durante la generazione AI');
      }

      setLetterData(json.data);
      toast.success('Lettera di presentazione ad alta conversione generata con successo!');
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
          applicantName: `${cvData?.firstName ?? ''} ${cvData?.lastName ?? ''}`.trim() || 'Candidato',
          applicantEmail: cvData?.email || 'email@esempio.it',
          applicantPhone: cvData?.phone || '+39 000 000000',
          jobTitle: jobTitle || cvData?.title || 'Candidatura',
          companyName: companyName || 'Azienda Target',
          template
        })
      });

      if (!res.ok) {
        throw new Error('Errore durante la creazione del file Word (.docx)');
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
      toast.success('Documento Word scaricato correttamente!');
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

${new Date().toLocaleDateString('it-IT', { day: 'numeric', month: 'long', year: 'numeric' })}
Spett.le ${companyName || 'Azienda Target'}
Oggetto: Candidatura per la posizione di ${jobTitle || cvData?.title || 'Candidatura'}

${letterData.recipient}

${letterData.hookParagraph}

${letterData.valueParagraph}

${letterData.cultureParagraph}

${letterData.closingParagraph}

${letterData.signOff}`;

    navigator.clipboard.writeText(fullText);
    toast.success('Testo completo copiato negli appunti!');
  };

  const fieldLabel: React.CSSProperties = { fontSize: 12, fontWeight: 700, color: 'var(--ink)', display: 'block', marginBottom: 4 };
  const docLabel: React.CSSProperties = { fontSize: 9.5, fontWeight: 700, color: '#2F2AE5', letterSpacing: 0.8, textTransform: 'uppercase', display: 'block', marginBottom: 2 };
  const docTextarea: React.CSSProperties = { width: '100%', border: '1px dashed transparent', padding: '3px 6px', fontSize: 13, lineHeight: 1.55, color: '#334155', borderRadius: 4, outline: 'none', background: '#FAFAF8', fontFamily: 'inherit', resize: 'vertical' };

  return (
    <div style={{ maxWidth: 1400, margin: '0 auto', height: 'calc(100vh - 36px)', display: 'flex', flexDirection: 'column' }}>
      {/* Top Header Bar */}
      <div className="head" style={{ marginBottom: 14, alignItems: 'center' }}>
        <div>
          <h1>Lettera di presentazione</h1>
          <p>
            L'AI analizza il tuo CV e l'annuncio per scrivere una lettera con la struttura in 4 parti dei top recruiter.
          </p>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button className="btn btn-ghost btn-sm" onClick={() => onNavigate('builder-step2')}>
            ← Torna al CV
          </button>
          <button className="btn btn-line btn-sm" onClick={handleCopyText} title="Copia testo negli appunti">
            Copia testo
          </button>
          <button
            className="btn btn-ink btn-sm"
            onClick={handleDownloadDOCX}
            disabled={isDownloading}
          >
            {isDownloading ? <span className="spinner" /> : null}
            Scarica Word (.docx)
          </button>
        </div>
      </div>

      {/* Main Split Grid — both columns scroll internally, page never scrolls */}
      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(330px, 5fr) 7fr', gap: 18, flex: 1, minHeight: 0 }}>

        {/* LEFT COLUMN: Input & Settings */}
        <div className="panel" style={{ margin: 0, padding: '18px 20px', overflowY: 'auto', display: 'flex', flexDirection: 'column' }}>
          <h3 style={{ fontSize: 15, marginBottom: 2 }}>Dati della candidatura</h3>
          <p className="psub" style={{ marginBottom: 14 }}>
            Più contesto dai all'AI, più la lettera sarà su misura.
          </p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div>
              <label style={fieldLabel}>
                Ruolo / posizione target <span style={{ color: 'var(--accent, #2F2AE5)' }}>*</span>
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
                Azienda target <span style={{ color: 'var(--accent, #2F2AE5)' }}>*</span>
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
                Annuncio di lavoro <span style={{ color: 'var(--ink-40, #9297A1)', fontWeight: 500 }}>(consigliato per il match ATS)</span>
              </label>
              <textarea
                className="input"
                rows={5}
                placeholder="Incolla il testo dell'annuncio o l'elenco dei requisiti richiesti…"
                value={jobDescription}
                onChange={(e) => setJobDescription(e.target.value)}
                style={{ width: '100%', fontSize: 13, resize: 'vertical' }}
              />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 0.8fr', gap: 10 }}>
              <div>
                <label style={fieldLabel}>Tono di voce</label>
                <select
                  className="input"
                  value={tone}
                  onChange={(e) => setTone(e.target.value as unknown as typeof tone)}
                  style={{ width: '100%' }}
                >
                  <option value="formal">Formale e istituzionale</option>
                  <option value="enthusiastic">Entusiasta e dinamico</option>
                  <option value="concise">Conciso e diretto (KPI)</option>
                  <option value="executive">Executive & leadership</option>
                </select>
              </div>

              <div>
                <label style={fieldLabel}>Lingua</label>
                <CountrySelect
                  variant="field"
                  options={LETTER_LANGS}
                  value={language}
                  onChange={setLanguage}
                  ariaLabel="Lingua della lettera"
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
                  <span className="spinner" /> Generazione in corso…
                </>
              ) : (
                <>Genera lettera con AI →</>
              )}
            </button>
            <p style={{ fontSize: 11.5, color: 'var(--ink-40, #9297A1)', textAlign: 'center', margin: 0, lineHeight: 1.45 }}>
              Puoi modificare ogni paragrafo direttamente nell'anteprima a destra.
            </p>
          </div>
        </div>

        {/* RIGHT COLUMN: Live Interactive Preview */}
        <div style={{ display: 'flex', flexDirection: 'column', minHeight: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8, flexShrink: 0 }}>
            <span className="mono">Anteprima documento</span>
            <span style={{ fontSize: 10.5, background: 'var(--tint, #EEEDFC)', color: 'var(--accent, #2F2AE5)', padding: '2px 8px', borderRadius: 100, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              {template}
            </span>
            <span style={{ fontSize: 11.5, color: 'var(--ink-40, #9297A1)', marginLeft: 'auto' }}>
              Clicca su un paragrafo per modificarlo
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
                {(cvData?.firstName ?? 'Nome').toUpperCase()} {(cvData?.lastName ?? 'Cognome').toUpperCase()}
              </h2>
              <div style={{ fontSize: 12, color: '#64748B', fontWeight: 500 }}>
                {jobTitle || cvData?.title || 'Professionista'} · {cvData?.email || 'email@esempio.it'} · {cvData?.phone || '+39 000 000000'}
              </div>
            </div>

            {/* Date and Company Header */}
            <div style={{ marginBottom: 16, fontSize: 12.5 }}>
              <div style={{ color: '#64748B', marginBottom: 6 }}>
                {new Date().toLocaleDateString('it-IT', { day: 'numeric', month: 'long', year: 'numeric' })}
              </div>
              <div style={{ fontWeight: 700, color: '#0F172A', fontSize: 13 }}>
                Spett.le {companyName || 'Azienda Target'}
              </div>
              <div style={{ fontWeight: 700, color: '#0B1D3A', marginTop: 2, fontSize: 12.5 }}>
                Oggetto: Candidatura per la posizione di {jobTitle || cvData?.title || 'Candidatura'}
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
                <label style={docLabel}>1. Il gancio (hook iniziale)</label>
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
                <label style={docLabel}>2. Valore concreto & risultati (KPI)</label>
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
                <label style={docLabel}>3. Allineamento culturale e metodo</label>
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
                <label style={docLabel}>4. Call-to-action (richiesta colloquio)</label>
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
              Autorizzo il trattamento dei miei dati personali ai sensi del D.Lgs. 196/2003 e del Regolamento UE 2016/679 (GDPR).
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
