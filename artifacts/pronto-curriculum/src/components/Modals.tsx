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
        <div className="modal-box auth-card fade-in">
          <button className="modal-close" onClick={onClose}>×</button>
          {isAuthenticated ? (
            <>
              <div className="auth-logo"><img src="/logo-icon.png" alt="ProntoCurriculum" /></div>
              <div className="auth-title">Hai già effettuato l'accesso</div>
              <div className="auth-sub">Puoi scaricare il tuo CV e accedere a tutte le funzioni.</div>
              <button className="btn btn-gold auth-submit" onClick={onClose}>
                Chiudi →
              </button>
            </>
          ) : signupDone ? (
            <>
              <div className="auth-logo"><img src="/logo-icon.png" alt="ProntoCurriculum" /></div>
              <div className="auth-title">Controlla la tua email</div>
              <div className="auth-sub">Ti abbiamo inviato un link di conferma a <strong>{email}</strong>. Aprilo per attivare il tuo account.</div>
              <button className="btn btn-gold auth-submit" onClick={onClose}>
                Ho capito
              </button>
            </>
          ) : (
            <>
              <div className="auth-logo"><img src="/logo-icon.png" alt="ProntoCurriculum" /></div>
              <div className="auth-title">{authTab === 'login' ? 'Bentornato' : 'Crea il tuo account'}</div>
              <div className="auth-sub">
                {authTab === 'login'
                  ? 'Accedi per ritrovare i tuoi CV, le candidature e l\'archivio esperienze.'
                  : 'Salva i tuoi progressi, scarica il CV e gestisci le tue candidature.'}
              </div>

              <button className="btn-google" onClick={() => { onClose(); onLogin(); }}>
                <svg width="18" height="18" viewBox="0 0 48 48" aria-hidden="true">
                  <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/>
                  <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/>
                  <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/>
                  <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/>
                </svg>
                Continua con Google
              </button>

              <div className="auth-divider">oppure</div>

              <form onSubmit={handleEmailAuth}>
                <div className="form-group">
                  <label htmlFor="auth-email">Email</label>
                  <input
                    id="auth-email"
                    type="email"
                    required
                    autoComplete="email"
                    placeholder="nome@esempio.it"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="auth-password">Password</label>
                  <input
                    id="auth-password"
                    type="password"
                    required
                    minLength={6}
                    autoComplete={authTab === 'login' ? 'current-password' : 'new-password'}
                    placeholder={authTab === 'signup' ? 'Minimo 6 caratteri' : '••••••••'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />
                </div>
                {authError && <div className="auth-error">⚠ {authError}</div>}
                <button type="submit" className="btn btn-gold auth-submit" disabled={authLoading}>
                  {authLoading ? 'Attendi…' : authTab === 'login' ? 'Accedi' : 'Crea account'}
                </button>
              </form>

              <div className="auth-switch">
                {authTab === 'login' ? (
                  <>Non hai un account?{' '}
                    <button type="button" onClick={() => { setAuthTab('signup'); setAuthError(null); }}>Registrati</button>
                  </>
                ) : (
                  <>Hai già un account?{' '}
                    <button type="button" onClick={() => { setAuthTab('login'); setAuthError(null); }}>Accedi</button>
                  </>
                )}
              </div>

              <button className="auth-skip" onClick={() => { onClose(); setTimeout(() => onSuccess(), 100); }}>
                Continua senza account
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
