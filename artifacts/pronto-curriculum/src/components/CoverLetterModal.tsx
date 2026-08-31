import { useEffect, useState } from 'react';
import { CVData, TemplateType } from '../types';
import type { SupportedLanguage } from '../utils/aiTranslate';
import { toast } from 'sonner';

interface CoverLetterResult {
  fitScore: number | null;
  fitNote: string;
  recipient: string;
  hookParagraph: string;
  valueParagraph: string;
  cultureParagraph: string;
  closingParagraph: string;
  signOff: string;
}

interface CoverLetterModalProps {
  cvData: CVData;
  template: TemplateType;
  lang: SupportedLanguage;
  onClose: () => void;
}

const TONES: { id: 'human' | 'formal' | 'enthusiastic' | 'concise' | 'executive'; label: string }[] = [
  { id: 'human', label: 'Naturale' },
  { id: 'formal', label: 'Formale' },
  { id: 'enthusiastic', label: 'Entusiasta' },
  { id: 'concise', label: 'Conciso' },
  { id: 'executive', label: 'Executive' },
];

function fitColor(score: number | null): string {
  if (score === null) return '#7A756A';
  if (score >= 70) return '#1A6B45';
  if (score >= 40) return '#B7791F';
  return '#B33A3A';
}

export default function CoverLetterModal({ cvData, template, lang, onClose }: CoverLetterModalProps) {
  const [jobLink, setJobLink] = useState('');
  const [jobText, setJobText] = useState('');
  const [jobTitle, setJobTitle] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [tone, setTone] = useState<'human' | 'formal' | 'enthusiastic' | 'concise' | 'executive'>('human');
  const [loading, setLoading] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [result, setResult] = useState<CoverLetterResult | null>(null);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = '';
    };
  }, [onClose]);

  const handleGenerate = async () => {
    if (!jobLink.trim() && !jobText.trim() && !jobTitle.trim() && !companyName.trim()) {
      toast.error('Incolla un link, un testo di annuncio, o almeno titolo/azienda.');
      return;
    }

    setLoading(true);
    try {
      let jobDescription = jobText.trim();

      if (!jobDescription && jobLink.trim()) {
        const fetchRes = await fetch('/api/fetch-job', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ url: jobLink.trim() }),
        });
        const fetchJson = await fetchRes.json();
        if (!fetchRes.ok) {
          throw new Error(fetchJson.error || "Impossibile recuperare il testo dell'annuncio dal link.");
        }
        jobDescription = fetchJson.text ?? '';
      }

      const genRes = await fetch('/api/cover-letter/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          cvData,
          jobTitle: jobTitle || cvData.title || 'Candidatura',
          companyName: companyName || 'Azienda',
          jobDescription,
          tone,
          language: lang,
        }),
      });
      const genJson = await genRes.json();
      if (!genRes.ok || !genJson.success) {
        throw new Error(genJson.error || 'Errore durante la generazione della lettera.');
      }

      setResult(genJson.data);

      // Best-effort save so the letter shows up in the dashboard/candidature
      // list — not blocking, and a failure here shouldn't hide the letter
      // the user just successfully generated.
      fetch('/api/cover-letter/save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          letterData: genJson.data,
          jobTitle: jobTitle || cvData.title || '',
          companyName: companyName || '',
          tone,
        }),
      }).catch(() => {});
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Errore imprevisto.';
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = async () => {
    if (!result) return;
    setDownloading(true);
    try {
      const res = await fetch('/api/cover-letter/export/docx', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...result,
          applicantName: [cvData.firstName, cvData.lastName].filter(Boolean).join(' ') || 'Candidato',
          applicantEmail: cvData.email || '',
          applicantPhone: cvData.phone || '',
          jobTitle: jobTitle || cvData.title || 'Candidatura',
          companyName: companyName || 'Azienda',
          template,
        }),
      });
      if (!res.ok) throw new Error('Errore durante il download.');
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `Lettera_Presentazione_${(cvData.firstName || 'Candidato').replace(/\s+/g, '_')}.docx`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      setTimeout(() => URL.revokeObjectURL(url), 10_000);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Errore durante il download.';
      toast.error(message);
    } finally {
      setDownloading(false);
    }
  };

  return (
    <div className="clm-overlay" onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="clm-modal">
        <div className="clm-header">
          <span className="clm-title">Genera lettera di presentazione</span>
          <button className="clm-close" onClick={onClose} aria-label="Chiudi">✕</button>
        </div>

        {!result ? (
          <div className="clm-body">
            <p className="clm-hint">Incolla il link dell'annuncio (o il testo) — l'AI valuta quanto la tua esperienza combacia col ruolo e scrive la lettera di conseguenza.</p>
            <div className="clm-field">
              <label>Link annuncio di lavoro</label>
              <input type="text" placeholder="https://..." value={jobLink} onChange={e => setJobLink(e.target.value)} disabled={loading} />
            </div>
            <div className="clm-field">
              <label>Oppure incolla il testo dell'annuncio</label>
              <textarea rows={5} placeholder="Descrizione della posizione..." value={jobText} onChange={e => setJobText(e.target.value)} disabled={loading} />
            </div>
            <div className="clm-row">
              <div className="clm-field" style={{ flex: 1 }}>
                <label>Ruolo</label>
                <input type="text" placeholder={cvData.title || 'es. Product Manager'} value={jobTitle} onChange={e => setJobTitle(e.target.value)} disabled={loading} />
              </div>
              <div className="clm-field" style={{ flex: 1 }}>
                <label>Azienda</label>
                <input type="text" placeholder="es. Acme Srl" value={companyName} onChange={e => setCompanyName(e.target.value)} disabled={loading} />
              </div>
            </div>
            <div className="clm-field">
              <label>Tono</label>
              <div className="clm-tone-row">
                {TONES.map(tn => (
                  <button
                    key={tn.id}
                    className={`clm-tone-btn${tone === tn.id ? ' on' : ''}`}
                    onClick={() => setTone(tn.id)}
                    disabled={loading}
                  >
                    {tn.label}
                  </button>
                ))}
              </div>
            </div>
            <button className="btn btn-ink" style={{ width: '100%', justifyContent: 'center' }} onClick={() => void handleGenerate()} disabled={loading}>
              {loading ? 'Analisi in corso…' : 'Analizza e genera lettera'}
            </button>
          </div>
        ) : (
          <div className="clm-body">
            <div className="clm-fit" style={{ borderColor: fitColor(result.fitScore) }}>
              <span className="clm-fit-score" style={{ color: fitColor(result.fitScore) }}>
                {result.fitScore ?? '—'}<span className="clm-fit-max">/100</span>
              </span>
              <span className="clm-fit-note">{result.fitNote}</span>
            </div>
            <div className="clm-letter">
              <p>{result.recipient}</p>
              <p>{result.hookParagraph}</p>
              <p>{result.valueParagraph}</p>
              <p>{result.cultureParagraph}</p>
              <p>{result.closingParagraph}</p>
              <p style={{ whiteSpace: 'pre-line' }}>{result.signOff}</p>
            </div>
            <div className="clm-row">
              <button className="btn btn-ghost btn-sm" onClick={() => setResult(null)}>← Rigenera</button>
              <button className="btn btn-ink btn-sm" style={{ flex: 1, justifyContent: 'center' }} onClick={() => void handleDownload()} disabled={downloading}>
                {downloading ? 'Download…' : 'Scarica in Word'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
