import { TemplateType, ModalType } from '../types';

interface BuilderStep1Props {
  selectedTemplate: TemplateType;
  onSelectTemplate: (t: TemplateType) => void;
  onModal: (modal: ModalType) => void;
}

export default function BuilderStep1({ selectedTemplate, onSelectTemplate, onModal }: BuilderStep1Props) {
  return (
    <div>
      <div className="builder-header">
        <div>
          <h2>Scegli il template</h2>
          <p style={{ fontSize: 13, color: 'var(--gray500)', marginTop: 2 }}>
            Tutti i template sono ottimizzati ATS per il mercato italiano
          </p>
        </div>
        <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
          <span className="ai-chip">✦ AI Inclusa</span>
          <button className="btn btn-ghost btn-sm" onClick={() => onModal('import')}>⬆ Importa CV / LinkedIn</button>
        </div>
      </div>

      <div style={{ padding: '40px 48px', maxWidth: 1100, margin: '0 auto' }}>
        <div className="template-grid">

          {/* MODERNO */}
          <div className={`template-card ${selectedTemplate === 'modern' ? 'selected' : ''}`} onClick={() => onSelectTemplate('modern')}>
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

          {/* MINIMAL */}
          <div className={`template-card ${selectedTemplate === 'minimal' ? 'selected' : ''}`} onClick={() => onSelectTemplate('minimal')}>
            <div className="template-preview">
              <div style={{ height: 10, borderBottom: '3px solid #0B1D3A', paddingBottom: 10, marginBottom: 10 }}>
                <div style={{ width: '60%', height: 8, background: '#0B1D3A', opacity: 0.4, borderRadius: 2 }} />
              </div>
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

          {/* PROFESSIONALE CON FOTO */}
          <div className={`template-card ${selectedTemplate === 'professionale' ? 'selected' : ''}`} onClick={() => onSelectTemplate('professionale')}>
            <div className="template-preview" style={{ background: '#FAFAF8' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
                <div style={{ flex: 1 }}>
                  <div style={{ width: '70%', height: 9, background: '#0B1D3A', borderRadius: 3, marginBottom: 5 }} />
                  <div style={{ width: '45%', height: 5, background: '#C9A84C', borderRadius: 2, marginBottom: 6 }} />
                  <div style={{ display: 'flex', gap: 4 }}>
                    <div style={{ width: 30, height: 4, background: '#B8B4AB', borderRadius: 2 }} />
                    <div style={{ width: 30, height: 4, background: '#B8B4AB', borderRadius: 2 }} />
                  </div>
                </div>
                <div style={{ width: 40, height: 40, borderRadius: '50%', background: '#0B1D3A', opacity: 0.25, flexShrink: 0, marginLeft: 8 }} />
              </div>
              <div style={{ height: 2, background: '#C9A84C', marginBottom: 8 }} />
              <div className="t-section" style={{ background: '#0B1D3A', opacity: 0.35, height: 4, marginBottom: 6 }} />
              <div className="t-line" style={{ width: '90%' }} />
              <div className="t-line" style={{ width: '75%' }} />
              <div style={{ height: 5 }} />
              <div className="t-section" style={{ background: '#0B1D3A', opacity: 0.35, height: 4, marginBottom: 6 }} />
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 4 }}>
                <div className="t-line" style={{ width: '80%' }} />
                <div className="t-line" style={{ width: '70%' }} />
              </div>
            </div>
            <div className="template-name">Professionale <span className="badge badge-gold">📸 Con foto</span></div>
          </div>

          {/* EXECUTIVE */}
          <div className={`template-card ${selectedTemplate === 'executive' ? 'selected' : ''}`} onClick={() => onSelectTemplate('executive')}>
            <div className="template-preview" style={{ background: '#F4F3F0' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: 8, height: '100%' }}>
                <div style={{ background: '#0B1D3A', borderRadius: 4, padding: 8, display: 'flex', flexDirection: 'column', gap: 4 }}>
                  <div style={{ width: 32, height: 32, borderRadius: '50%', background: '#C9A84C', margin: '0 auto 8px' }} />
                  <div className="t-line" style={{ background: 'rgba(255,255,255,0.25)' }} />
                  <div className="t-line" style={{ background: 'rgba(255,255,255,0.15)', marginTop: 2 }} />
                  <div style={{ height: 4 }} />
                  <div className="t-line" style={{ background: 'rgba(255,255,255,0.2)', width: '70%' }} />
                  <div className="t-line" style={{ background: 'rgba(255,255,255,0.12)', width: '80%' }} />
                  <div className="t-line" style={{ background: 'rgba(255,255,255,0.12)', width: '65%' }} />
                </div>
                <div style={{ padding: '4px 4px' }}>
                  <div className="t-section" style={{ height: 5, margin: '0 0 7px' }} />
                  <div className="t-line" style={{ width: '90%' }} />
                  <div className="t-line" style={{ width: '75%', marginTop: 3 }} />
                  <div style={{ height: 6 }} />
                  <div className="t-section" style={{ height: 5, margin: '0 0 7px' }} />
                  <div className="t-line" style={{ width: '80%' }} />
                  <div className="t-line" style={{ width: '60%', marginTop: 3 }} />
                </div>
              </div>
            </div>
            <div className="template-name">Executive <span className="badge badge-navy">📸 Sidebar</span></div>
          </div>

          {/* EUROPASS */}
          <div className={`template-card ${selectedTemplate === 'europass' ? 'selected' : ''}`} onClick={() => onSelectTemplate('europass')}>
            <div className="template-preview">
              <div style={{ background: '#003399', borderRadius: '4px 4px 0 0', padding: '8px 10px', marginBottom: 8, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <div style={{ display: 'flex', gap: 2, marginBottom: 3 }}>
                    {[0,1,2,3,4].map(i => <span key={i} style={{ color: '#FFD700', fontSize: 7 }}>★</span>)}
                  </div>
                  <div style={{ width: 50, height: 5, background: 'rgba(255,255,255,0.4)', borderRadius: 2 }} />
                </div>
                <div style={{ width: 22, height: 28, borderRadius: 2, background: 'rgba(255,255,255,0.15)', border: '1px solid rgba(255,255,255,0.3)' }} />
              </div>
              <div style={{ width: '55%', height: 7, background: '#003399', opacity: 0.5, borderRadius: 2, marginBottom: 6 }} />
              <div style={{ border: '1px solid rgba(0,51,153,0.2)', borderRadius: 3, padding: 5, marginBottom: 6 }}>
                <div className="t-line" style={{ width: '80%', marginBottom: 3 }} />
                <div className="t-line" style={{ width: '65%' }} />
              </div>
              <div style={{ width: '40%', height: 4, background: '#003399', opacity: 0.4, borderRadius: 2, marginBottom: 4 }} />
              <div className="t-line" style={{ width: '90%' }} />
              <div className="t-line" style={{ width: '75%' }} />
            </div>
            <div className="template-name">Europass <span className="badge badge-green">🇪🇺 Europeo</span></div>
          </div>

        </div>
      </div>
    </div>
  );
}
