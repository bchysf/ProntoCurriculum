import { useState } from 'react';
import { ModalType } from '../types';

interface ModalsProps {
  modal: ModalType;
  aiLoadingText: string;
  onClose: () => void;
  onSuccess: () => void;
  isAuthenticated: boolean;
  onLogin: () => void;
}

export default function Modals({ modal, aiLoadingText, onClose, onSuccess, isAuthenticated, onLogin }: ModalsProps) {
  const [selectedTier, setSelectedTier] = useState<'monthly' | 'single'>('monthly');

  if (!modal) return null;

  const handleOverlayClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) onClose();
  };

  return (
    <div className="modal-overlay" onClick={handleOverlayClick}>

      {/* SIGNUP / LOGIN */}
      {modal === 'signup' && (
        <div className="modal-box fade-in" style={{ textAlign: 'center' }}>
          <button className="modal-close" onClick={onClose}>×</button>
          {isAuthenticated ? (
            <>
              <div style={{ fontSize: 48, marginBottom: 12 }}>✅</div>
              <div className="modal-title">Hai già effettuato l'accesso</div>
              <div className="modal-sub">Puoi scaricare il tuo CV e accedere a tutte le funzioni.</div>
              <button className="btn btn-gold" style={{ width: '100%' }} onClick={onClose}>
                Chiudi →
              </button>
            </>
          ) : (
            <>
              <div style={{ fontSize: 48, marginBottom: 12 }}>🔐</div>
              <div className="modal-title">Accedi per continuare</div>
              <div className="modal-sub">Accedi per salvare i tuoi progressi, scaricare il CV e accedere all'archivio esperienze.</div>
              <button className="btn btn-gold" style={{ width: '100%', marginBottom: 12 }} onClick={() => { onClose(); onLogin(); }}>
                Accedi →
              </button>
              <button className="btn btn-ghost" style={{ width: '100%', fontSize: 13 }} onClick={() => { onClose(); setTimeout(() => onSuccess(), 100); }}>
                ⬇ Continua senza account
              </button>
            </>
          )}
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

      {/* SUCCESS */}
      {modal === 'success' && (
        <div className="modal-box fade-in" style={{ textAlign: 'center' }}>
          <div style={{ fontSize: 56, marginBottom: 16 }}>🎉</div>
          <div className="modal-title">CV scaricato!</div>
          <div className="modal-sub">Il tuo curriculum professionale è pronto. Buona fortuna con la ricerca lavoro!</div>
          <button className="btn btn-gold" style={{ width: '100%', marginBottom: 12 }} onClick={onClose}>
            Perfetto →
          </button>
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
