import { Page, ModalType } from '../types';
import { useT } from '../i18n/LanguageContext';

interface HomeProps {
  onNavigate: (page: Page) => void;
  onModal: (modal: ModalType) => void;
}

export default function Home({ onNavigate, onModal }: HomeProps) {
  const t = useT();
  return (
    <div>
      {/* HERO */}
      <div className="hero">
        <div className="hero-badge">
          <div className="trust-dot" />
          {t('home.badge')}
        </div>
        <h1>{t('home.headline1')}<br /><em>{t('home.headline2')}</em></h1>
        <p className="hero-desc">{t('home.subtitle')}</p>
        <div className="hero-cta">
          <button className="btn btn-gold btn-lg" onClick={() => onNavigate('builder-step1')}>
            {t('home.startFree')}
          </button>
          <button className="btn btn-outline btn-lg" onClick={() => onNavigate('builder-step1')}>
            {t('home.viewTemplates')}
          </button>
        </div>
        <div className="trust-row">
          <div className="trust-item"><div className="trust-dot" />{t('home.trust.noReg')}</div>
          <div className="trust-item"><div className="trust-dot" />{t('home.trust.ats')}</div>
          <div className="trust-item"><div className="trust-dot" />{t('home.trust.format')}</div>
          <div className="trust-item"><div className="trust-dot" />{t('home.trust.ai')}</div>
        </div>
      </div>

      {/* HOW IT WORKS */}
      <div className="section">
        <div className="section-label">{t('home.howLabel')}</div>
        <div className="section-title">{t('home.4steps')}</div>
        <p className="section-sub">{t('home.noInstall')}</p>
        <div className="steps-grid">
          <div className="step-card">
            <div className="step-num">1</div>
            <h3>{t('home.s1.title')}</h3>
            <p>{t('home.s1.desc')}</p>
          </div>
          <div className="step-card">
            <div className="step-num">2</div>
            <h3>{t('home.s2.title')}</h3>
            <p>{t('home.s2.desc')}</p>
          </div>
          <div className="step-card">
            <div className="step-num">3</div>
            <h3>{t('home.s3.title')}</h3>
            <p>{t('home.s3.desc')}</p>
          </div>
          <div className="step-card">
            <div className="step-num">4</div>
            <h3>{t('home.s4.title')}</h3>
            <p>{t('home.s4.desc')}</p>
          </div>
        </div>
      </div>

      {/* TEMPLATES */}
      <div className="templates-section">
        <div className="templates-inner">
          <div className="section-label">{t('home.templatesLabel')}</div>
          <div className="section-title">{t('home.templates4')}</div>
          <div className="template-grid">
            <div className="template-card" onClick={() => onNavigate('builder-step1')}>
              <div className="template-preview">
                <div className="t-header"><div className="t-dot" /><div className="t-dot-sm" /></div>
                <div style={{ height: 6 }} />
                <div className="t-line" style={{ width: '80%' }} />
                <div className="t-line" style={{ width: '55%' }} />
                <div style={{ height: 6 }} />
                <div className="t-section" />
                <div className="t-block">
                  <div className="t-line" style={{ width: '90%' }} />
                  <div className="t-line" style={{ width: '75%' }} />
                  <div className="t-line" style={{ width: '85%' }} />
                </div>
                <div style={{ height: 4 }} />
                <div className="t-section" />
                <div className="t-block">
                  <div className="t-line" style={{ width: '95%' }} />
                  <div className="t-line" style={{ width: '80%' }} />
                </div>
              </div>
              <div className="template-name">Moderno <span className="badge badge-gold">{t('home.mostChosen')}</span></div>
            </div>

            <div className="template-card" onClick={() => onNavigate('builder-step1')}>
              <div className="template-preview">
                <div style={{ height: 10, borderBottom: '3px solid #0B1D3A', paddingBottom: 10, marginBottom: 10 }}>
                  <div className="t-line-dark" style={{ width: '60%', height: 8, opacity: 0.4, background: '#0B1D3A', borderRadius: 2 }} />
                </div>
                <div style={{ height: 6 }} />
                <div className="t-section" style={{ background: '#0B1D3A', height: 4, opacity: 0.5 }} />
                <div className="t-block">
                  <div className="t-line" style={{ width: '90%' }} />
                  <div className="t-line" style={{ width: '75%' }} />
                </div>
                <div style={{ height: 4 }} />
                <div className="t-section" style={{ background: '#0B1D3A', height: 4, opacity: 0.5 }} />
                <div className="t-block">
                  <div className="t-line" style={{ width: '95%' }} />
                  <div className="t-line" style={{ width: '80%' }} />
                </div>
              </div>
              <div className="template-name">Minimal <span className="badge badge-navy">ATS Friendly</span></div>
            </div>

            <div className="template-card" onClick={() => onNavigate('builder-step1')}>
              <div className="template-preview" style={{ background: '#F4F3F0' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: 8, height: '100%' }}>
                  <div style={{ background: '#0B1D3A', borderRadius: 4, padding: 8 }}>
                    <div style={{ width: 30, height: 30, borderRadius: '50%', background: '#C9A84C', margin: '0 auto 8px' }} />
                    <div className="t-line" style={{ background: 'rgba(255,255,255,0.2)' }} />
                    <div className="t-line" style={{ background: 'rgba(255,255,255,0.1)', marginTop: 4 }} />
                  </div>
                  <div style={{ padding: '8px 4px' }}>
                    <div className="t-section" style={{ height: 6, margin: '0 0 8px' }} />
                    <div className="t-line" style={{ width: '90%' }} />
                    <div className="t-line" style={{ width: '75%', marginTop: 4 }} />
                  </div>
                </div>
              </div>
              <div className="template-name">Executive <span className="badge badge-navy">Con foto</span></div>
            </div>

            <div className="template-card" onClick={() => onNavigate('builder-step1')}>
              <div className="template-preview">
                <div style={{ border: '2px solid #003399', borderRadius: 4, padding: 10, height: '100%', display: 'flex', flexDirection: 'column', gap: 5 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ width: '50%', height: 6, background: '#003399', opacity: 0.4, borderRadius: 2 }} />
                    <div style={{ fontSize: 8, color: '#003399', fontWeight: 'bold' }}>EU</div>
                  </div>
                  <div className="t-line" style={{ width: '70%' }} />
                  <div style={{ height: 4 }} />
                  <div style={{ width: '40%', height: 4, background: '#003399', opacity: 0.3, borderRadius: 2 }} />
                  <div className="t-line" style={{ width: '90%' }} />
                  <div className="t-line" style={{ width: '80%' }} />
                </div>
              </div>
              <div className="template-name">Europass <span className="badge badge-green">Europeo</span></div>
            </div>
          </div>
        </div>
      </div>

      {/* PRICING */}
      <div className="pricing-section">
        <div className="pricing-inner">
          <div style={{ textAlign: 'center', marginBottom: 0 }}>
            <div className="section-label" style={{ textAlign: 'center' }}>{t('home.pricingLabel')}</div>
            <div className="section-title" style={{ textAlign: 'center' }}>{t('home.pricingTitle')}</div>
            <p className="section-sub" style={{ margin: '0 auto' }}>{t('home.pricingSub')}</p>
          </div>
          <div className="pricing-grid">
            <div className="pricing-card">
              <div className="plan-name">{t('home.planFree')}</div>
              <div className="price">
                <span className="price-currency">€</span>
                <span className="price-amount">0</span>
              </div>
              <div className="price-sub">{t('home.forever')}</div>
              <hr className="divider" />
              <div className="feature-item"><div className="check">✓</div>{t('home.free.feat1')}</div>
              <div className="feature-item"><div className="check">✓</div>{t('home.free.feat2')}</div>
              <div className="feature-item"><div className="check">✓</div>{t('home.free.feat3')}</div>
              <div className="feature-item"><div className="check">✓</div>{t('home.free.feat4')}</div>
              <button className="btn btn-ghost" style={{ width: '100%', marginTop: 20 }} onClick={() => onNavigate('builder-step1')}>{t('home.startFreeBtn')}</button>
            </div>

            <div className="pricing-card featured">
              <div className="popular-badge">{t('home.mostPopular')}</div>
              <div className="plan-name">Standard</div>
              <div className="price">
                <span className="price-currency" style={{ color: 'var(--white)' }}>€</span>
                <span className="price-amount" style={{ color: 'var(--white)' }}>25</span>
              </div>
              <div className="price-sub">{t('home.perMonth')}</div>
              <hr className="divider" />
              <div className="feature-item"><div className="check check-gold">✓</div>{t('home.std.feat1')}</div>
              <div className="feature-item"><div className="check check-gold">✓</div>{t('home.std.feat2')}</div>
              <div className="feature-item"><div className="check check-gold">✓</div>{t('home.std.feat3')}</div>
              <div className="feature-item"><div className="check check-gold">✓</div>{t('home.std.feat4')}</div>
              <div className="feature-item"><div className="check check-gold">✓</div>{t('home.std.feat5')}</div>
              <button className="btn btn-gold" style={{ width: '100%', marginTop: 20 }} onClick={() => onModal('pricing')}>{t('home.startNow')}</button>
            </div>

            <div className="pricing-card">
              <div className="coming-soon-badge">{t('home.comingSoon')}</div>
              <div className="plan-name">Pro</div>
              <div className="price">
                <span className="price-currency">€</span>
                <span className="price-amount">50</span>
              </div>
              <div className="price-sub">{t('home.allIncluded')}</div>
              <hr className="divider" />
              <div className="feature-item"><div className="check">✓</div>{t('home.pro.feat1')}</div>
              <div className="feature-item"><div className="check">✓</div>{t('home.pro.feat2')}</div>
              <div className="feature-item"><div className="check">✓</div>{t('home.pro.feat3')}</div>
              <div className="feature-item"><div className="check">✓</div>{t('home.pro.feat4')}</div>
              <div className="feature-item"><div className="check">✓</div>{t('home.pro.feat5')}</div>
              <button className="btn btn-ghost" style={{ width: '100%', marginTop: 20 }} disabled>{t('home.waitlist')}</button>
            </div>
          </div>
          <div style={{ textAlign: 'center', marginTop: 32 }}>
            <p style={{ fontSize: 13, color: 'var(--gray500)' }}>
              {t('home.singleCV')}{' '}
              <a href="#" onClick={(e) => { e.preventDefault(); onModal('pricing'); }} style={{ color: 'var(--navy)', fontWeight: 600 }}>
                {t('home.singleLink')}
              </a>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
