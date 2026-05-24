import { useState, useRef } from 'react';
import { ModalType, CVData } from '../types';
import { extractTextFromPDF, extractPhotoFromPDF } from '../utils/parseCV';
import { aiParseCV } from '../utils/aiParseCV';

interface ModalsProps {
  modal: ModalType;
  aiLoadingText: string;
  onClose: () => void;
  onSuccess: () => void;
  onImportComplete: (data: Partial<CVData>) => void;
}

export default function Modals({ modal, aiLoadingText, onClose, onSuccess, onImportComplete }: ModalsProps) {
  const [importTab, setImportTab] = useState<'linkedin' | 'pdf' | 'manual'>('linkedin');
  const [selectedTier, setSelectedTier] = useState<'monthly' | 'single'>('monthly');
  const [linkedinUrl, setLinkedinUrl] = useState('');
  const [manualText, setManualText] = useState('');
  const [dragOver, setDragOver] = useState(false);
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [extracting, setExtracting] = useState(false);
  const [extractError, setExtractError] = useState('');
  const linkedinFileRef = useRef<HTMLInputElement>(null);
  const pdfFileRef = useRef<HTMLInputElement>(null);

  if (!modal) return null;

  const handleOverlayClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) onClose();
  };

  const handleFileSelected = (file: File) => {
    setUploadedFile(file);
    setExtractError('');
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFileSelected(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file) handleFileSelected(file);
  };

  const handleDragOver = (e: React.DragEvent) => { e.preventDefault(); setDragOver(true); };
  const handleDragLeave = () => setDragOver(false);

  const doExtractAndImport = async (file: File) => {
    setExtracting(true);
    setExtractError('');
    try {
      const isPdf = file.name.toLowerCase().endsWith('.pdf');
      let text = '';
      let photo: string | null = null;

      if (isPdf) {
        [text, photo] = await Promise.all([
          extractTextFromPDF(file),
          extractPhotoFromPDF(file),
        ]);
      } else {
        text = await file.text();
      }

      const data = await aiParseCV(text);
      if (photo) data.photo = photo;
      onClose();
      setTimeout(() => onImportComplete(data), 100);
    } catch (err) {
      const msg = err instanceof Error ? err.message : '';
      setExtractError(msg.includes('server') ? `Errore AI: ${msg}. Riprova tra qualche secondo.` : 'Impossibile leggere il file. Prova con un altro formato o usa il testo manuale.');
    } finally {
      setExtracting(false);
    }
  };

  const handleImportLinkedin = async () => {
    if (uploadedFile) {
      await doExtractAndImport(uploadedFile);
    } else if (linkedinUrl.trim()) {
      onClose();
      setTimeout(() => onImportComplete({ linkedin: linkedinUrl.trim() }), 100);
    }
  };

  const handleImportPdf = async () => {
    if (uploadedFile) await doExtractAndImport(uploadedFile);
  };

  const handleImportManual = async () => {
    if (!manualText.trim()) return;
    setExtracting(true);
    setExtractError('');
    try {
      const data = await aiParseCV(manualText);
      onClose();
      setTimeout(() => onImportComplete(data), 100);
    } catch {
      setExtractError('Errore AI. Riprova tra qualche secondo.');
    } finally {
      setExtracting(false);
    }
  };

  const canImportLinkedin = linkedinUrl.trim().length > 0 || uploadedFile !== null;
  const canImportPdf = uploadedFile !== null;
  const canImportManual = manualText.trim().length > 0;

  const UploadZone = ({ fileRef }: { fileRef: React.RefObject<HTMLInputElement | null> }) => (
    <div
      className={`import-zone${dragOver ? ' drag-over' : ''}`}
      onClick={() => fileRef.current?.click()}
      onDrop={handleDrop}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
    >
      {uploadedFile ? (
        <>
          <div style={{ fontSize: 32, marginBottom: 8 }}>✅</div>
          <h4>{uploadedFile.name}</h4>
          <p style={{ color: 'var(--gold)' }}>File caricato · clicca per cambiarlo</p>
        </>
      ) : (
        <>
          <div style={{ fontSize: 32, marginBottom: 8 }}>📄</div>
          <h4>Carica il tuo CV</h4>
          <p>Trascina il file qui o <span style={{ color: 'var(--gold)', fontWeight: 600 }}>clicca per selezionarlo</span></p>
          <p style={{ fontSize: 12, color: 'var(--gray400)', marginTop: 4 }}>PDF o Word (.docx)</p>
        </>
      )}
    </div>
  );

  return (
    <div className="modal-overlay" onClick={handleOverlayClick}>

      {/* SIGNUP */}
      {modal === 'signup' && (
        <div className="modal-box fade-in">
          <button className="modal-close" onClick={onClose}>×</button>
          <div className="modal-title">Il tuo CV è pronto! 🎉</div>
          <div className="modal-sub">Crea un account gratuito per scaricare il tuo curriculum e salvare i tuoi progressi.</div>
          <div className="form-group">
            <label>Email</label>
            <input type="email" placeholder="mario.rossi@email.com" />
          </div>
          <div className="form-group">
            <label>Password</label>
            <input type="password" placeholder="Minimo 8 caratteri" />
          </div>
          <button className="btn btn-gold" style={{ width: '100%', marginBottom: 12 }} onClick={() => { onClose(); setTimeout(() => onSuccess(), 100); }}>
            Crea account gratuito →
          </button>
          <button className="btn btn-ghost" style={{ width: '100%', fontSize: 13 }} onClick={() => { onClose(); setTimeout(() => onSuccess(), 100); }}>
            ⬇ Scarica gratis con filigrana
          </button>
          <p style={{ textAlign: 'center', fontSize: 12, color: 'var(--gray500)', marginTop: 16 }}>
            Hai già un account? <a href="#" style={{ color: 'var(--navy)' }}>Accedi</a>
          </p>
        </div>
      )}

      {/* PRICING */}
      {modal === 'pricing' && (
        <div className="modal-box fade-in">
          <button className="modal-close" onClick={onClose}>×</button>
          <div className="modal-title">Scegli il tuo piano</div>
          <div className="modal-sub">Sblocca il tuo CV professionale senza filigrana.</div>
          <div className="tier-cards">
            <div className={`tier-card ${selectedTier === 'monthly' ? 'selected' : ''}`} onClick={() => setSelectedTier('monthly')}>
              <div className="tier-card-info">
                <h4>⚡ Piano Mensile</h4>
                <p>CV illimitati · Cover letter · ATS avanzato</p>
              </div>
              <div className="tier-price">€25<span style={{ fontSize: 14, fontWeight: 400 }}>/mese</span></div>
            </div>
            <div className={`tier-card ${selectedTier === 'single' ? 'selected' : ''}`} onClick={() => setSelectedTier('single')}>
              <div className="tier-card-info">
                <h4>📄 Singolo CV</h4>
                <p>Acquisto una tantum, nessun abbonamento</p>
              </div>
              <div className="tier-price">€10</div>
            </div>
          </div>
          <button className="btn btn-gold" style={{ width: '100%', marginBottom: 12 }} onClick={() => { onClose(); setTimeout(() => onSuccess(), 100); }}>
            Procedi al pagamento →
          </button>
          <button className="btn btn-ghost" style={{ width: '100%', fontSize: 13 }} onClick={() => { onClose(); setTimeout(() => onSuccess(), 100); }}>
            ⬇ Continua gratis con filigrana
          </button>
        </div>
      )}

      {/* IMPORT */}
      {modal === 'import' && (
        <div className="modal-box wide fade-in">
          <button className="modal-close" onClick={onClose}>×</button>
          <div className="modal-title">Importa il tuo profilo</div>
          <div className="modal-sub">L'AI estrarrà automaticamente le informazioni dal tuo CV esistente.</div>
          <div className="tabs">
            {(['linkedin', 'pdf', 'manual'] as const).map(t => (
              <button
                key={t}
                className={`tab ${importTab === t ? 'active' : ''}`}
                onClick={() => { setImportTab(t); setUploadedFile(null); setExtractError(''); }}
              >
                {t === 'linkedin' ? 'LinkedIn' : t === 'pdf' ? 'PDF / Word' : 'Testo'}
              </button>
            ))}
          </div>

          {importTab === 'linkedin' && (
            <div>
              <div style={{ background: 'rgba(201,168,76,0.08)', border: '1px solid rgba(201,168,76,0.3)', borderRadius: 8, padding: '12px 16px', marginBottom: 16, fontSize: 13, color: 'var(--navy)', lineHeight: 1.6 }}>
                <strong>📌 Come importare da LinkedIn:</strong><br />
                Vai su LinkedIn → Il tuo profilo → Altro → <strong>Salva come PDF</strong>, poi carica il file qui sotto.
              </div>
              <div className="form-group">
                <label>Oppure inserisci l'URL del tuo profilo LinkedIn</label>
                <input
                  type="url"
                  placeholder="https://linkedin.com/in/tuo-profilo"
                  value={linkedinUrl}
                  onChange={e => setLinkedinUrl(e.target.value)}
                />
                <div className="form-hint">Verrà salvato nel CV come link al tuo profilo</div>
              </div>
              <input ref={linkedinFileRef} type="file" accept=".pdf,.doc,.docx" style={{ display: 'none' }} onChange={handleFileInputChange} />
              <UploadZone fileRef={linkedinFileRef} />
              {extractError && <p style={{ color: '#e53e3e', fontSize: 13, marginBottom: 12 }}>{extractError}</p>}
              <button
                className="btn btn-gold"
                style={{ width: '100%', opacity: canImportLinkedin && !extracting ? 1 : 0.5 }}
                disabled={!canImportLinkedin || extracting}
                onClick={handleImportLinkedin}
              >
                {extracting ? '⏳ Estrazione in corso...' : '✦ Importa e compila il CV →'}
              </button>
            </div>
          )}

          {importTab === 'pdf' && (
            <>
              <input ref={pdfFileRef} type="file" accept=".pdf,.doc,.docx" style={{ display: 'none' }} onChange={handleFileInputChange} />
              <UploadZone fileRef={pdfFileRef} />
              {extractError && <p style={{ color: '#e53e3e', fontSize: 13, marginBottom: 12 }}>{extractError}</p>}
              <button
                className="btn btn-gold"
                style={{ width: '100%', marginTop: 4, opacity: canImportPdf && !extracting ? 1 : 0.5 }}
                disabled={!canImportPdf || extracting}
                onClick={handleImportPdf}
              >
                {extracting ? '⏳ Lettura PDF in corso...' : '✦ Estrai informazioni con AI →'}
              </button>
            </>
          )}

          {importTab === 'manual' && (
            <div>
              <div className="form-group">
                <label>Incolla qui il testo del tuo CV</label>
                <textarea
                  rows={9}
                  placeholder="Incolla il contenuto del tuo CV: nome, contatti, esperienze, formazione..."
                  value={manualText}
                  onChange={e => setManualText(e.target.value)}
                />
                <div className="form-hint">Copia e incolla il testo dal tuo CV — l'AI leggerà e compilerà tutti i campi automaticamente</div>
              </div>
              {extractError && <p style={{ color: '#e53e3e', fontSize: 13, marginBottom: 12 }}>{extractError}</p>}
              <button
                className="btn btn-gold"
                style={{ width: '100%', opacity: canImportManual && !extracting ? 1 : 0.5 }}
                disabled={!canImportManual || extracting}
                onClick={handleImportManual}
              >
                {extracting ? '⏳ AI sta leggendo il tuo CV...' : '✦ Analizza con AI e compila →'}
              </button>
            </div>
          )}
        </div>
      )}

      {/* SUCCESS */}
      {modal === 'success' && (
        <div className="modal-box fade-in" style={{ textAlign: 'center' }}>
          <div style={{ fontSize: 56, marginBottom: 16 }}>🎉</div>
          <div className="modal-title">CV scaricato!</div>
          <div className="modal-sub">Il tuo curriculum professionale è pronto. Buona fortuna con la ricerca lavoro!</div>
          <button className="btn btn-gold" style={{ width: '100%', marginBottom: 12 }} onClick={onClose}>
            Visualizza il tuo account →
          </button>
          <p style={{ fontSize: 12, color: 'var(--gray500)' }}>Hai scaricato 1 CV su ∞ illimitati del tuo piano</p>
        </div>
      )}

      {/* AI LOADING */}
      {modal === 'ai-loading' && (
        <div className="modal-box fade-in" style={{ textAlign: 'center', maxWidth: 340 }}>
          <div style={{ fontSize: 40, marginBottom: 16 }} className="pulsing">✦</div>
          <div className="modal-title" style={{ fontSize: 20 }}>AI al lavoro...</div>
          <p style={{ fontSize: 14, color: 'var(--gray500)' }}>{aiLoadingText}</p>
          <div style={{ marginTop: 20, height: 4, background: 'var(--gray100)', borderRadius: 2, overflow: 'hidden' }}>
            <div style={{ height: '100%', background: 'var(--gold)', borderRadius: 2, animation: 'progress 2s ease forwards' }} />
          </div>
        </div>
      )}
    </div>
  );
}
