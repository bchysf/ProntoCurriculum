import { useState } from 'react';
import { ModalType } from '../types';

interface ModalsProps {
  modal: ModalType;
  aiLoadingText: string;
  onClose: () => void;
  onSuccess: () => void;
  isAuthenticated: boolean;
  onLogin: () => void;
  onLoginWithEmail: (email: string, password: string) => Promise<string | null>;
  onSignUpWithEmail: (email: string, password: string) => Promise<string | null>;
}

export default function Modals({ modal, aiLoadingText, onClose, onSuccess, isAuthenticated, onLogin, onLoginWithEmail, onSignUpWithEmail }: ModalsProps) {
  const [selectedTier, setSelectedTier] = useState<'monthly' | 'annual' | 'single'>('monthly');
  const [checkoutLoading, setCheckoutLoading] = useState(false);
  const [authTab, setAuthTab] = useState<'login' | 'signup'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [authError, setAuthError] = useState<string | null>(null);
  const [authLoading, setAuthLoading] = useState(false);
  const [signupDone, setSignupDone] = useState(false);

  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError(null);
    setAuthLoading(true);
    try {
      if (authTab === 'login') {
        const error = await onLoginWithEmail(email, password);
        if (error) setAuthError(error);
        else onClose();
      } else {
        const error = await onSignUpWithEmail(email, password);
        if (error) setAuthError(error);
        else setSignupDone(true);
      }
    } finally {
      setAuthLoading(false);
    }
  };

  if (!modal) return null;

  const handleOverlayClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) onClose();
  };

  const startCheckout = async (plan: 'monthly' | 'annual' | 'single') => {
    if (!isAuthenticated) {
      onClose();
      onLogin();
      return;
    }
    setCheckoutLoading(true);
    try {
      const res = await fetch('/api/billing/checkout-session', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ plan }),
      });
      const data = await res.json();
      if (data.url) {
        window.location.href = data.url;
      }
    } finally {
      setCheckoutLoading(false);
    }
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
          ) : signupDone ? (
            <>
              <div style={{ fontSize: 48, marginBottom: 12 }}>📬</div>
              <div className="modal-title">Controlla la tua email</div>
              <div className="modal-sub">Ti abbiamo inviato un link di conferma per attivare l'account.</div>
              <button className="btn btn-gold" style={{ width: '100%' }} onClick={onClose}>
                Chiudi →
              </button>
            </>
          ) : (
            <>
              <div style={{ fontSize: 48, marginBottom: 12 }}>🔐</div>
              <div className="modal-title">{authTab === 'login' ? 'Accedi per continuare' : 'Crea un account'}</div>
              <div className="modal-sub">Accedi per salvare i tuoi progressi, scaricare il CV e accedere all'archivio esperienze.</div>

              <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
                <button
                  type="button"
                  className={`btn ${authTab === 'login' ? 'btn-gold' : 'btn-ghost'}`}
                  style={{ flex: 1, fontSize: 13 }}
                  onClick={() => { setAuthTab('login'); setAuthError(null); }}
                >
                  Accedi
                </button>
                <button
                  type="button"
                  className={`btn ${authTab === 'signup' ? 'btn-gold' : 'btn-ghost'}`}
                  style={{ flex: 1, fontSize: 13 }}
                  onClick={() => { setAuthTab('signup'); setAuthError(null); }}
                >
                  Registrati
                </button>
              </div>

              <form onSubmit={handleEmailAuth} style={{ textAlign: 'left', marginBottom: 12 }}>
                <input
                  type="email"
                  required
                  placeholder="Email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  style={{ width: '100%', marginBottom: 8, padding: '10px 12px', borderRadius: 8, border: '1px solid var(--gray200)' }}
                />
                <input
                  type="password"
                  required
                  minLength={6}
                  placeholder="Password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  style={{ width: '100%', marginBottom: 8, padding: '10px 12px', borderRadius: 8, border: '1px solid var(--gray200)' }}
                />
                {authError && <div style={{ color: 'var(--red, #d33)', fontSize: 13, marginBottom: 8 }}>{authError}</div>}
                <button type="submit" className="btn btn-gold" style={{ width: '100%' }} disabled={authLoading}>
                  {authLoading ? 'Attendi…' : authTab === 'login' ? 'Accedi →' : 'Registrati →'}
                </button>
              </form>

              <div style={{ display: 'flex', alignItems: 'center', gap: 8, margin: '12px 0', color: 'var(--gray400)', fontSize: 12 }}>
                <div style={{ flex: 1, height: 1, background: 'var(--gray200)' }} />
                oppure
                <div style={{ flex: 1, height: 1, background: 'var(--gray200)' }} />
              </div>

              <button className="btn btn-outline" style={{ width: '100%', marginBottom: 12 }} onClick={() => { onClose(); onLogin(); }}>
                Continua con Google →
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
          <div className="modal-sub">Sblocca il tuo CV professionale senza filigrana. Sconto -30% permanente.</div>
          <div className="tier-cards">
            <div className={`tier-card ${selectedTier === 'monthly' ? 'selected' : ''}`} onClick={() => setSelectedTier('monthly')}>
              <div className="tier-card-info">
                <h4>⚡ Piano Mensile</h4>
                <p>100 CV al mese · AI rephrasing · niente filigrana</p>
              </div>
              <div className="tier-price">
                <span className="tier-price-old">€9,99</span>
                €6,99<span style={{ fontSize: 14, fontWeight: 400 }}>/mese</span>
                <span className="tier-badge">-30%</span>
              </div>
            </div>
            <div className={`tier-card ${selectedTier === 'annual' ? 'selected' : ''}`} onClick={() => setSelectedTier('annual')}>
              <div className="tier-card-info">
                <h4>🏆 Piano Annuale</h4>
                <p>CV illimitati per un anno intero</p>
              </div>
              <div className="tier-price">
                <span className="tier-price-old">€49,99</span>
                €34,99<span style={{ fontSize: 14, fontWeight: 400 }}>/anno</span>
                <span className="tier-badge">-30%</span>
              </div>
            </div>
            <div className={`tier-card ${selectedTier === 'single' ? 'selected' : ''}`} onClick={() => setSelectedTier('single')}>
              <div className="tier-card-info">
                <h4>📄 Singolo CV</h4>
                <p>Acquisto una tantum, nessun abbonamento</p>
              </div>
              <div className="tier-price">
                <span className="tier-price-old">€2,99</span>
                €1,99
                <span className="tier-badge">-30%</span>
              </div>
            </div>
          </div>
          <button className="btn btn-gold" style={{ width: '100%', marginBottom: 12 }} disabled={checkoutLoading} onClick={() => startCheckout(selectedTier)}>
            {checkoutLoading ? 'Attendi…' : 'Procedi al pagamento →'}
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
