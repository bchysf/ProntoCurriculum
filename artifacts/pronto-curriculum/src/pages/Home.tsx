import { Page, ModalType } from '../types';

interface HomeProps {
  onNavigate: (page: Page) => void;
  onModal: (modal: ModalType) => void;
}

export default function Home({ onNavigate, onModal }: HomeProps) {
  return (
    <div>
      {/* HERO */}
      <div className="hero">
        <div className="hero-badge">
          <div className="trust-dot" />
          Ottimizzato per sistemi ATS italiani ed europei
        </div>
        <h1>Il curriculum che<br /><em>apre le porte</em></h1>
        <p className="hero-desc">
          Crea un CV professionale in minuti grazie all'AI. Scegli il template, rispondi alle domande, scarica il risultato.
        </p>
        <div className="hero-cta">
          <button className="btn btn-gold btn-lg" onClick={() => onNavigate('builder-step1')}>
            Inizia gratis →
          </button>
          <button className="btn btn-outline btn-lg" onClick={() => onNavigate('builder-step1')}>
            Vedi i template
          </button>
        </div>
        <div className="trust-row">
          <div className="trust-item"><div className="trust-dot" />Nessuna registrazione richiesta</div>
          <div className="trust-item"><div className="trust-dot" />ATS Score incluso</div>
          <div className="trust-item"><div className="trust-dot" />Formato europeo & italiano</div>
          <div className="trust-item"><div className="trust-dot" />AI integrata</div>
        </div>
      </div>

      {/* HOW IT WORKS */}
      <div className="section">
        <div className="section-label">Come funziona</div>
        <div className="section-title">Pronto in 4 passi</div>
        <p className="section-sub">Niente da installare, niente da imparare. Il nostro assistente AI ti guida in ogni fase.</p>
        <div className="steps-grid">
          <div className="step-card">
            <div className="step-num">1</div>
            <h3>Scegli il template</h3>
            <p>4 modelli professionali ottimizzati ATS per il mercato italiano ed europeo</p>
          </div>
          <div className="step-card">
            <div className="step-num">2</div>
            <h3>Inserisci le informazioni</h3>
            <p>Rispondi alle domande guidate o importa da LinkedIn / curriculum precedente</p>
          </div>
          <div className="step-card">
            <div className="step-num">3</div>
            <h3>L'AI ottimizza tutto</h3>
            <p>Rigenera testi, ottimizza per parole chiave ATS, suggerisce miglioramenti</p>
          </div>
          <div className="step-card">
            <div className="step-num">4</div>
            <h3>Scarica o condividi</h3>
            <p>PDF professionale pronto. Versione gratuita con filigrana, Pro senza</p>
          </div>
        </div>
      </div>

      {/* TEMPLATES */}
      <div className="templates-section">
        <div className="templates-inner">
          <div className="section-label">Template</div>
          <div className="section-title">4 modelli professionali</div>
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
              <div className="template-name">Moderno <span className="badge badge-gold">🏆 Più scelto</span></div>
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
            <div className="section-label" style={{ textAlign: 'center' }}>Prezzi</div>
            <div className="section-title" style={{ textAlign: 'center' }}>Semplice e trasparente</div>
            <p className="section-sub" style={{ margin: '0 auto' }}>Inizia gratis, aggiorna quando sei pronto.</p>
          </div>
          <div className="pricing-grid">
            <div className="pricing-card">
              <div className="plan-name">Gratuito</div>
              <div className="price">
                <span className="price-currency">€</span>
                <span className="price-amount">0</span>
              </div>
              <div className="price-sub">Per sempre</div>
              <hr className="divider" />
              <div className="feature-item"><div className="check">✓</div>1 curriculum con filigrana</div>
              <div className="feature-item"><div className="check">✓</div>Tutti i template</div>
              <div className="feature-item"><div className="check">✓</div>AI di base</div>
              <div className="feature-item"><div className="check">✓</div>ATS Score</div>
              <button className="btn btn-ghost" style={{ width: '100%', marginTop: 20 }} onClick={() => onNavigate('builder-step1')}>Inizia gratis</button>
            </div>

            <div className="pricing-card featured">
              <div className="popular-badge">⚡ Più popolare</div>
              <div className="plan-name">Standard</div>
              <div className="price">
                <span className="price-currency" style={{ color: 'var(--white)' }}>€</span>
                <span className="price-amount" style={{ color: 'var(--white)' }}>25</span>
              </div>
              <div className="price-sub">/mese · CV illimitati</div>
              <hr className="divider" />
              <div className="feature-item"><div className="check check-gold">✓</div>CV illimitati senza filigrana</div>
              <div className="feature-item"><div className="check check-gold">✓</div>AI avanzata + rigenerazione</div>
              <div className="feature-item"><div className="check check-gold">✓</div>Cover letter AI inclusa</div>
              <div className="feature-item"><div className="check check-gold">✓</div>Import LinkedIn / PDF</div>
              <div className="feature-item"><div className="check check-gold">✓</div>Analisi ATS avanzata</div>
              <button className="btn btn-gold" style={{ width: '100%', marginTop: 20 }} onClick={() => onModal('pricing')}>Inizia ora</button>
            </div>

            <div className="pricing-card">
              <div className="coming-soon-badge">Presto</div>
              <div className="plan-name">Pro</div>
              <div className="price">
                <span className="price-currency">€</span>
                <span className="price-amount">50</span>
              </div>
              <div className="price-sub">/mese · Tutto incluso</div>
              <hr className="divider" />
              <div className="feature-item"><div className="check">✓</div>Tutto di Standard</div>
              <div className="feature-item"><div className="check">✓</div>CV tailored per offerta di lavoro</div>
              <div className="feature-item"><div className="check">✓</div>Offerte da Indeed, Areajob, JobRapido</div>
              <div className="feature-item"><div className="check">✓</div>Match CV ↔ posizione</div>
              <div className="feature-item"><div className="check">✓</div>Offerte internazionali</div>
              <button className="btn btn-ghost" style={{ width: '100%', marginTop: 20 }} disabled>Lista d'attesa →</button>
            </div>
          </div>
          <div style={{ textAlign: 'center', marginTop: 32 }}>
            <p style={{ fontSize: 13, color: 'var(--gray500)' }}>
              Hai solo 1 CV da fare?{' '}
              <a href="#" onClick={(e) => { e.preventDefault(); onModal('pricing'); }} style={{ color: 'var(--navy)', fontWeight: 600 }}>
                Acquista singolo per 10€ →
              </a>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
