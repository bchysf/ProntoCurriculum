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

      <div style={{ padding: '32px', maxWidth: 900, margin: '0 auto' }}>
        <div className="template-grid">
          <div
            className={`template-card ${selectedTemplate === 'modern' ? 'selected' : ''}`}
            onClick={() => onSelectTemplate('modern')}
          >
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

          <div
            className={`template-card ${selectedTemplate === 'minimal' ? 'selected' : ''}`}
            onClick={() => onSelectTemplate('minimal')}
          >
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

          <div
            className={`template-card ${selectedTemplate === 'executive' ? 'selected' : ''}`}
            onClick={() => onSelectTemplate('executive')}
          >
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

          <div
            className={`template-card ${selectedTemplate === 'europass' ? 'selected' : ''}`}
            onClick={() => onSelectTemplate('europass')}
          >
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
  );
}
