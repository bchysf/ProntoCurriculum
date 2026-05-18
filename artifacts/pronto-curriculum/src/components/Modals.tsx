import { useState, useRef } from 'react';
import { ModalType } from '../types';

interface ModalsProps {
  modal: ModalType;
  aiLoadingText: string;
  onClose: () => void;
  onSuccess: () => void;
  onImportComplete: () => void;
}

export default function Modals({ modal, aiLoadingText, onClose, onSuccess, onImportComplete }: ModalsProps) {
  const [importTab, setImportTab] = useState<'linkedin' | 'pdf' | 'manual'>('linkedin');
  const [selectedTier, setSelectedTier] = useState<'monthly' | 'single'>('monthly');
  const [linkedinUrl, setLinkedinUrl] = useState('');
  const [manualText, setManualText] = useState('');
  const [dragOver, setDragOver] = useState(false);
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const linkedinFileRef = useRef<HTMLInputElement>(null);
  const pdfFileRef = useRef<HTMLInputElement>(null);

  if (!modal) return null;

  const handleOverlayClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) onClose();
  };

  const triggerImport = () => {
    onClose();
    setTimeout(() => onImportComplete(), 100);
  };

  const handleFileSelected = (file: File) => {
    setUploadedFile(file);
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

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(true);
  };

  const handleDragLeave = () => setDragOver(false);

  const canImportLinkedin = linkedinUrl.trim().length > 0 || uploadedFile !== null;
  const canImportPdf = uploadedFile !== null;
  const canImportManual = manualText.trim().length > 0;

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
            <div
              className={`tier-card ${selectedTier === 'monthly' ? 'selected' : ''}`}
              onClick={() => setSelectedTier('monthly')}
            >
              <div className="tier-card-info">
                <h4>⚡ Piano Mensile</h4>
                <p>CV illimitati · Cover letter · ATS avanzato</p>
              </div>
              <div className="tier-price">€25<span style={{ fontSize: 14, fontWeight: 400 }}>/mese</span></div>
            </div>
            <div
              className={`tier-card ${selectedTier === 'single' ? 'selected' : ''}`}
              onClick={() => setSelectedTier('single')}
            >
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
          <div className="modal-sub">Risparmia tempo importando le tue informazioni da LinkedIn o da un CV esistente.</div>
          <div className="tabs">
            {(['linkedin', 'pdf', 'manual'] as const).map(t => (
              <button
                key={t}
                className={`tab ${importTab === t ? 'active' : ''}`}
                onClick={() => { setImportTab(t); setUploadedFile(null); }}
              >
                {t === 'linkedin' ? 'LinkedIn' : t === 'pdf' ? 'PDF / Word' : 'Manuale'}
              </button>
            ))}
          </div>

          {importTab === 'linkedin' && (
            <div>
              <div className="form-group">
                <label>URL profilo LinkedIn</label>
                <input
                  type="url"
                  placeholder="https://linkedin.com/in/tuo-profilo"
                  value={linkedinUrl}
                  onChange={e => setLinkedinUrl(e.target.value)}
                />
              </div>
              <p style={{ fontSize: 13, color: 'var(--gray500)', marginBottom: 16, lineHeight: 1.5 }}>
                Oppure scarica il tuo PDF da LinkedIn (Profilo → Altro → Salva come PDF) e caricalo qui sotto
              </p>
              <input
                ref={linkedinFileRef}
                type="file"
                accept=".pdf,.doc,.docx"
                style={{ display: 'none' }}
                onChange={handleFileInputChange}
              />
              <div
                className={`import-zone${dragOver ? ' drag-over' : ''}`}
                onClick={() => linkedinFileRef.current?.click()}
                onDrop={handleDrop}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
              >
                {uploadedFile ? (
                  <>
                    <div style={{ fontSize: 32, marginBottom: 8 }}>✅</div>
                    <h4>{uploadedFile.name}</h4>
                    <p style={{ color: 'var(--gold)' }}>File pronto · clicca per cambiarlo</p>
                  </>
                ) : (
                  <>
                    <div style={{ fontSize: 32, marginBottom: 8 }}>🔗</div>
                    <h4>Carica il tuo PDF LinkedIn</h4>
                    <p>Trascina il file qui o <span style={{ color: 'var(--gold)', fontWeight: 600 }}>clicca per selezionarlo</span></p>
                    <p style={{ fontSize: 12, color: 'var(--gray400)', marginTop: 4 }}>PDF, DOC, DOCX</p>
                  </>
                )}
              </div>
              <button
                className="btn btn-gold"
                style={{ width: '100%', marginTop: 16, opacity: canImportLinkedin ? 1 : 0.5 }}
                disabled={!canImportLinkedin}
                onClick={triggerImport}
              >
                ✦ Importa con AI →
              </button>
            </div>
          )}

          {importTab === 'pdf' && (
            <>
              <input
                ref={pdfFileRef}
                type="file"
                accept=".pdf,.doc,.docx"
                style={{ display: 'none' }}
                onChange={handleFileInputChange}
              />
              <div
                className={`import-zone${dragOver ? ' drag-over' : ''}`}
                onClick={() => pdfFileRef.current?.click()}
                onDrop={handleDrop}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
              >
                {uploadedFile ? (
                  <>
                    <div style={{ fontSize: 32, marginBottom: 8 }}>✅</div>
                    <h4>{uploadedFile.name}</h4>
                    <p style={{ color: 'var(--gold)' }}>File pronto · clicca per cambiarlo</p>
                  </>
                ) : (
                  <>
                    <div style={{ fontSize: 32, marginBottom: 8 }}>📄</div>
                    <h4>Carica il tuo CV esistente</h4>
                    <p>Trascina il file qui o <span style={{ color: 'var(--gold)', fontWeight: 600 }}>clicca per selezionarlo</span></p>
                    <p style={{ fontSize: 12, color: 'var(--gray400)', marginTop: 4 }}>PDF · Word (.docx) · L'AI estrarrà le informazioni automaticamente</p>
                  </>
                )}
              </div>
              <button
                className="btn btn-gold"
                style={{ width: '100%', marginTop: 16, opacity: canImportPdf ? 1 : 0.5 }}
                disabled={!canImportPdf}
                onClick={triggerImport}
              >
                ✦ Analizza con AI →
              </button>
            </>
          )}

          {importTab === 'manual' && (
            <div>
              <div className="form-group">
                <label>Incolla qui il testo del tuo CV</label>
                <textarea
                  rows={8}
                  placeholder="Incolla il contenuto del tuo CV..."
                  value={manualText}
                  onChange={e => setManualText(e.target.value)}
                />
              </div>
              <button
                className="btn btn-gold"
                style={{ width: '100%', opacity: canImportManual ? 1 : 0.5 }}
                disabled={!canImportManual}
                onClick={triggerImport}
              >
                ✦ Analizza con AI →
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
            <div style={{
              height: '100%',
              background: 'var(--gold)',
              borderRadius: 2,
              animation: 'progress 2s ease forwards'
            }} />
          </div>
        </div>
      )}
    </div>
  );
}
