import { useState, useEffect } from 'react';
import { ModalType } from '../types';
import { useT } from '../i18n/LanguageContext';

interface ModalsProps {
  modal: ModalType;
  aiLoadingText: string;
  onClose: () => void;
  onSuccess: () => void;
  isAuthenticated: boolean;
  onLogin: () => void;
  onLoginWithEmail: (email: string, password: string) => Promise<string | null>;
  onSignUpWithEmail: (email: string, password: string) => Promise<string | null>;
  // Switches the currently-open modal to the login/signup form — used when an
  // unauthenticated visitor tries to check out, instead of forcing Google.
  onRequireAuth: () => void;
}

interface BillingStatus {
  authenticated: boolean;
  freeTrialUsed: boolean;
  credits: number;
  canDownloadFree: boolean;
}

export default function Modals({ modal, aiLoadingText, onClose, onSuccess, isAuthenticated, onLogin, onLoginWithEmail, onSignUpWithEmail, onRequireAuth }: ModalsProps) {
  const t = useT();
  const [checkoutLoading, setCheckoutLoading] = useState(false);
  const [authTab, setAuthTab] = useState<'login' | 'signup'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [authError, setAuthError] = useState<string | null>(null);
  const [authLoading, setAuthLoading] = useState(false);
  const [signupDone, setSignupDone] = useState(false);
  const [billingStatus, setBillingStatus] = useState<BillingStatus | null>(null);

  useEffect(() => {
    if (modal !== 'pricing' || !isAuthenticated) return;
    fetch('/api/billing/status', { credentials: 'include' })
      .then(res => res.ok ? res.json() : null)
      .then(data => { if (data) setBillingStatus(data); });
  }, [modal, isAuthenticated]);

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

  const startCheckout = async () => {
    if (!isAuthenticated) {
      onRequireAuth();
      return;
    }
    setCheckoutLoading(true);
    try {
      const res = await fetch('/api/billing/checkout-session', {
        method: 'POST',
        credentials: 'include',
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
              <div className="auth-title">{t('modal.alreadyLoggedIn')}</div>
              <div className="auth-sub">{t('modal.alreadyLoggedInSub')}</div>
              <button className="btn btn-gold auth-submit" onClick={onClose}>
                {t('modal.close')}
              </button>
            </>
          ) : signupDone ? (
            <>
              <div className="auth-logo"><img src="/logo-icon.png" alt="ProntoCurriculum" /></div>
              <div className="auth-title">{t('modal.checkYourEmail')}</div>
              <div className="auth-sub">{t('modal.confirmLinkPrefix')} <strong>{email}</strong>. {t('modal.confirmLinkSuffix')}</div>
              <button className="btn btn-gold auth-submit" onClick={onClose}>
                {t('modal.gotIt')}
              </button>
            </>
          ) : (
            <>
              <div className="auth-logo"><img src="/logo-icon.png" alt="ProntoCurriculum" /></div>
              <div className="auth-title">{authTab === 'login' ? t('modal.welcomeBack') : t('modal.createYourAccount')}</div>
              <div className="auth-sub">
                {authTab === 'login' ? t('modal.loginSub') : t('modal.signupSub')}
              </div>

              <button className="btn-google" onClick={() => { onClose(); onLogin(); }}>
                <svg width="18" height="18" viewBox="0 0 48 48" aria-hidden="true">
                  <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/>
                  <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/>
                  <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/>
                  <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/>
                </svg>
                {t('modal.continueWithGoogle')}
              </button>

              <div className="auth-divider">{t('modal.or')}</div>

              <form onSubmit={handleEmailAuth}>
                <div className="form-group">
                  <label htmlFor="auth-email">{t('modal.email')}</label>
                  <input
                    id="auth-email"
                    type="email"
                    required
                    autoComplete="email"
                    placeholder={t('modal.emailPlaceholder')}
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="auth-password">{t('modal.password')}</label>
                  <input
                    id="auth-password"
                    type="password"
                    required
                    minLength={6}
                    autoComplete={authTab === 'login' ? 'current-password' : 'new-password'}
                    placeholder={authTab === 'signup' ? t('modal.minChars') : '••••••••'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />
                </div>
                {authError && <div className="auth-error">⚠ {authError}</div>}
                <button type="submit" className="btn btn-gold auth-submit" disabled={authLoading}>
                  {authLoading ? t('modal.pleaseWait') : authTab === 'login' ? t('modal.login') : t('modal.createAccount')}
                </button>
              </form>

              <div className="auth-switch">
                {authTab === 'login' ? (
                  <>{t('modal.noAccountYet')}{' '}
                    <button type="button" onClick={() => { setAuthTab('signup'); setAuthError(null); }}>{t('modal.signUp')}</button>
                  </>
                ) : (
                  <>{t('modal.alreadyHaveAccount')}{' '}
                    <button type="button" onClick={() => { setAuthTab('login'); setAuthError(null); }}>{t('modal.login')}</button>
                  </>
                )}
              </div>
            </>
          )}
        </div>
      )}

      {/* PRICING */}
      {modal === 'pricing' && (
        <div className="modal-box fade-in">
          <button className="modal-close" onClick={onClose}>×</button>
          {billingStatus && !billingStatus.freeTrialUsed ? (
            <>
              <div className="modal-title">{t('modal.firstCvFree')}</div>
              <div className="modal-sub">{t('modal.firstCvFreeSub')}</div>
            </>
          ) : (
            <>
              <div className="modal-title">{t('modal.unlockYourCv')}</div>
              <div className="modal-sub">{t('modal.freeTrialUsedSub')}</div>
            </>
          )}
          <div className="tier-cards">
            <div className="tier-card selected">
              <div className="tier-card-info">
                <h4>{t('modal.oneCvOnePayment')}</h4>
                <p>{t('modal.tierDesc')}</p>
              </div>
              <div className="tier-price">
                €1,99<span style={{ fontSize: 14, fontWeight: 400 }}>/CV</span>
              </div>
            </div>
          </div>
          <button className="btn btn-gold" style={{ width: '100%', marginBottom: 12 }} disabled={checkoutLoading} onClick={() => void startCheckout()}>
            {checkoutLoading ? t('modal.pleaseWait') : t('modal.proceedToPayment')}
          </button>
        </div>
      )}

      {/* SUCCESS */}
      {modal === 'success' && (
        <div className="modal-box fade-in" style={{ textAlign: 'center' }}>
          <div style={{ fontSize: 56, marginBottom: 16 }}>🎉</div>
          <div className="modal-title">{t('modal.cvDownloaded')}</div>
          <div className="modal-sub">{t('modal.cvReadySub')}</div>
          <button className="btn btn-gold" style={{ width: '100%', marginBottom: 12 }} onClick={onClose}>
            {t('modal.perfect')}
          </button>
        </div>
      )}

      {/* AI LOADING */}
      {modal === 'ai-loading' && (
        <div className="modal-box fade-in" style={{ textAlign: 'center', maxWidth: 340 }}>
          <div style={{ fontSize: 40, marginBottom: 16 }} className="pulsing">✦</div>
          <div className="modal-title" style={{ fontSize: 20 }}>{t('modal.aiWorking')}</div>
          <p style={{ fontSize: 14, color: 'var(--gray500)' }}>{aiLoadingText}</p>
          <div style={{ marginTop: 20, height: 4, background: 'var(--gray100)', borderRadius: 2, overflow: 'hidden' }}>
            <div style={{ height: '100%', background: 'var(--gold)', borderRadius: 2, animation: 'progress 2s ease forwards' }} />
          </div>
        </div>
      )}
    </div>
  );
}
