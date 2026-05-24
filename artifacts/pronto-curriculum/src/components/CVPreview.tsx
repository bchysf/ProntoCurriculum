import { CVData, TemplateType } from '../types';

interface CVPreviewProps {
  cvData: CVData;
  template: TemplateType;
}

function RenderDesc({ text, className }: { text: string; className: string }) {
  const lines = text.split('\n').map(l => l.trim()).filter(Boolean);
  const hasBullets = lines.some(l => l.startsWith('•'));
  if (hasBullets) {
    return (
      <ul style={{ margin: 0, paddingLeft: 0, listStyle: 'none' }}>
        {lines.map((line, i) => (
          <li key={i} className={className} style={{ display: 'flex', gap: 6, marginBottom: 2 }}>
            <span style={{ flexShrink: 0, color: 'inherit', opacity: 0.6 }}>{line.startsWith('•') ? '•' : '·'}</span>
            <span>{line.startsWith('•') ? line.slice(1).trim() : line}</span>
          </li>
        ))}
      </ul>
    );
  }
  return <div className={className}>{text}</div>;
}

export default function CVPreview({ cvData, template }: CVPreviewProps) {
  const name = [cvData.firstName, cvData.lastName].filter(Boolean).join(' ') || 'Il tuo nome';
  const skillsText = cvData.skills.join(' · ');
  const hasPhoto = !!cvData.photo;

  if (template === 'executive') {
    return (
      <div className="cv-doc cv-executive">
        <div className="cve-sidebar">
          <div className="cve-photo-wrap">
            {hasPhoto
              ? <img src={cvData.photo} alt="foto" className="cve-photo" />
              : <div className="cve-photo-placeholder">👤</div>
            }
          </div>
          <div className="cve-name">{name}</div>
          <div className="cve-title">{cvData.title || 'Titolo professionale'}</div>
          <div className="cve-divider" />
          <div className="cve-contact-label">Contatti</div>
          {cvData.email && <div className="cve-contact-item">✉ {cvData.email}</div>}
          {cvData.phone && <div className="cve-contact-item">✆ {cvData.phone}</div>}
          {cvData.city && <div className="cve-contact-item">◎ {cvData.city}</div>}
          {cvData.linkedin && <div className="cve-contact-item">in {cvData.linkedin}</div>}
          {cvData.skills.length > 0 && (
            <>
              <div className="cve-divider" />
              <div className="cve-contact-label">Competenze</div>
              {cvData.skills.map(s => <div key={s} className="cve-skill">{s}</div>)}
            </>
          )}
          {cvData.languages.some(l => l.name) && (
            <>
              <div className="cve-divider" />
              <div className="cve-contact-label">Lingue</div>
              {cvData.languages.filter(l => l.name).map(l => (
                <div key={l.id} className="cve-skill">{l.name} <span style={{ opacity: 0.6, fontSize: 10 }}>({l.level.split(' - ')[0]})</span></div>
              ))}
            </>
          )}
        </div>
        <div className="cve-main">
          {cvData.summary && (
            <div className="cve-section">
              <div className="cve-section-title">Profilo</div>
              <div className="cve-text">{cvData.summary}</div>
            </div>
          )}
          {cvData.experiences.some(e => e.company || e.role) && (
            <div className="cve-section">
              <div className="cve-section-title">Esperienze</div>
              {cvData.experiences.filter(e => e.company || e.role).map(exp => (
                <div key={exp.id} className="cve-exp-item">
                  <div className="cve-exp-role">{exp.role}</div>
                  <div className="cve-exp-meta">{[exp.company, exp.city, exp.from && exp.to ? `${exp.from}–${exp.to}` : exp.from || exp.to].filter(Boolean).join(' · ')}</div>
                  {exp.desc && <RenderDesc text={exp.desc} className="cve-text" />}
                </div>
              ))}
            </div>
          )}
          {cvData.education.some(e => e.institution || e.degree) && (
            <div className="cve-section">
              <div className="cve-section-title">Formazione</div>
              {cvData.education.filter(e => e.institution || e.degree).map(edu => (
                <div key={edu.id} className="cve-exp-item">
                  <div className="cve-exp-role">{edu.degree}</div>
                  <div className="cve-exp-meta">{[edu.institution, edu.from && edu.to ? `${edu.from}–${edu.to}` : edu.from || edu.to, edu.grade].filter(Boolean).join(' · ')}</div>
                </div>
              ))}
            </div>
          )}
        </div>
        <div className="cv-watermark"><div className="cv-watermark-logo">P</div>ProntoCurriculum.it</div>
      </div>
    );
  }

  if (template === 'europass') {
    return (
      <div className="cv-doc cv-europass">
        <div className="cveu-top-bar">
          <div className="cveu-eu-logo">
            <span className="cveu-stars">★ ★ ★ ★ ★</span>
            <span className="cveu-label">Curriculum Vitae</span>
          </div>
          {hasPhoto && <img src={cvData.photo} alt="foto" className="cveu-photo" />}
        </div>
        <div className="cveu-name">{name}</div>
        <div className="cveu-info-box">
          <div className="cveu-info-row"><span className="cveu-info-label">Indirizzo e-mail</span><span>{cvData.email}</span></div>
          {cvData.phone && <div className="cveu-info-row"><span className="cveu-info-label">Telefono</span><span>{cvData.phone}</span></div>}
          {cvData.city && <div className="cveu-info-row"><span className="cveu-info-label">Residenza</span><span>{cvData.city}</span></div>}
          {cvData.linkedin && <div className="cveu-info-row"><span className="cveu-info-label">LinkedIn</span><span>{cvData.linkedin}</span></div>}
          {cvData.title && <div className="cveu-info-row"><span className="cveu-info-label">Professione</span><span>{cvData.title}</span></div>}
        </div>
        {cvData.summary && (
          <div className="cveu-section">
            <div className="cveu-section-title">Profilo professionale</div>
            <div className="cveu-text">{cvData.summary}</div>
          </div>
        )}
        {cvData.experiences.some(e => e.company || e.role) && (
          <div className="cveu-section">
            <div className="cveu-section-title">Esperienza lavorativa</div>
            {cvData.experiences.filter(e => e.company || e.role).map(exp => (
              <div key={exp.id} className="cveu-exp-item">
                <div className="cveu-exp-dates">{exp.from && exp.to ? `${exp.from} – ${exp.to}` : exp.from || exp.to}</div>
                <div className="cveu-exp-content">
                  <div className="cveu-exp-role">{exp.role}</div>
                  <div className="cveu-exp-company">{[exp.company, exp.city].filter(Boolean).join(', ')}</div>
                  {exp.desc && <RenderDesc text={exp.desc} className="cveu-text" />}
                </div>
              </div>
            ))}
          </div>
        )}
        {cvData.education.some(e => e.institution || e.degree) && (
          <div className="cveu-section">
            <div className="cveu-section-title">Istruzione e formazione</div>
            {cvData.education.filter(e => e.institution || e.degree).map(edu => (
              <div key={edu.id} className="cveu-exp-item">
                <div className="cveu-exp-dates">{edu.from && edu.to ? `${edu.from} – ${edu.to}` : edu.from || edu.to}</div>
                <div className="cveu-exp-content">
                  <div className="cveu-exp-role">{edu.degree}</div>
                  <div className="cveu-exp-company">{[edu.institution, edu.grade].filter(Boolean).join(' | ')}</div>
                </div>
              </div>
            ))}
          </div>
        )}
        {cvData.skills.length > 0 && (
          <div className="cveu-section">
            <div className="cveu-section-title">Competenze</div>
            <div className="cveu-text">{skillsText}</div>
          </div>
        )}
        {cvData.languages.some(l => l.name) && (
          <div className="cveu-section">
            <div className="cveu-section-title">Lingue</div>
            <div className="cveu-text">{cvData.languages.filter(l => l.name).map(l => `${l.name}: ${l.level}`).join(' · ')}</div>
          </div>
        )}
        <div className="cv-watermark"><div className="cv-watermark-logo">P</div>ProntoCurriculum.it</div>
      </div>
    );
  }

  if (template === 'professionale') {
    return (
      <div className="cv-doc cv-professionale">
        <div className="cvp-header">
          <div className="cvp-header-left">
            <div className="cvp-name">{name}</div>
            <div className="cvp-title">{cvData.title || 'Titolo professionale'}</div>
            <div className="cvp-contact">
              {cvData.email && <span>✉ {cvData.email}</span>}
              {cvData.phone && <span>✆ {cvData.phone}</span>}
              {cvData.city && <span>◎ {cvData.city}</span>}
              {cvData.linkedin && <span>in {cvData.linkedin}</span>}
            </div>
          </div>
          <div className="cvp-photo-wrap">
            {hasPhoto
              ? <img src={cvData.photo} alt="foto" className="cvp-photo" />
              : <div className="cvp-photo-placeholder">👤</div>
            }
          </div>
        </div>
        <div className="cvp-gold-bar" />
        {cvData.summary && (
          <div className="cvp-section">
            <div className="cvp-section-title">Profilo professionale</div>
            <div className="cvp-text">{cvData.summary}</div>
          </div>
        )}
        {cvData.experiences.some(e => e.company || e.role) && (
          <div className="cvp-section">
            <div className="cvp-section-title">Esperienze lavorative</div>
            {cvData.experiences.filter(e => e.company || e.role).map(exp => (
              <div key={exp.id} className="cvp-exp-item">
                <div className="cvp-exp-header">
                  <span className="cvp-exp-role">{exp.role}</span>
                  <span className="cvp-exp-dates">{exp.from && exp.to ? `${exp.from} – ${exp.to}` : exp.from || exp.to}</span>
                </div>
                <div className="cvp-exp-company">{[exp.company, exp.city].filter(Boolean).join(' · ')}</div>
                {exp.desc && <RenderDesc text={exp.desc} className="cvp-text" />}
              </div>
            ))}
          </div>
        )}
        {cvData.education.some(e => e.institution || e.degree) && (
          <div className="cvp-section">
            <div className="cvp-section-title">Formazione</div>
            {cvData.education.filter(e => e.institution || e.degree).map(edu => (
              <div key={edu.id} className="cvp-exp-item">
                <div className="cvp-exp-header">
                  <span className="cvp-exp-role">{edu.degree}</span>
                  <span className="cvp-exp-dates">{edu.from && edu.to ? `${edu.from} – ${edu.to}` : edu.from || edu.to}</span>
                </div>
                <div className="cvp-exp-company">{[edu.institution, edu.grade].filter(Boolean).join(' · ')}</div>
              </div>
            ))}
          </div>
        )}
        <div className="cvp-bottom-row">
          {cvData.skills.length > 0 && (
            <div className="cvp-section" style={{ flex: 1 }}>
              <div className="cvp-section-title">Competenze</div>
              <div className="cvp-skills">
                {cvData.skills.map(s => <span key={s} className="cvp-skill-tag">{s}</span>)}
              </div>
            </div>
          )}
          {cvData.languages.some(l => l.name) && (
            <div className="cvp-section" style={{ flex: 1 }}>
              <div className="cvp-section-title">Lingue</div>
              {cvData.languages.filter(l => l.name).map(l => (
                <div key={l.id} className="cvp-text">{l.name} — {l.level}</div>
              ))}
            </div>
          )}
        </div>
        <div className="cv-watermark"><div className="cv-watermark-logo">P</div>ProntoCurriculum.it</div>
      </div>
    );
  }

  // ── Tecnico template (needs tag-style skills) ────────────────────────────────
  if (template === 'tecnico') {
    return (
      <div className="cv-doc template-tecnico">
        <div className="cv-header">
          <div className="cv-name">{name}</div>
          <div className="cv-title">{cvData.title || 'Titolo professionale'}</div>
          <div className="cv-contact">
            {cvData.email && <span>{cvData.email}</span>}
            {cvData.phone && <span>{cvData.phone}</span>}
            {cvData.city && <span>{cvData.city}</span>}
            {cvData.linkedin && <span>{cvData.linkedin}</span>}
          </div>
        </div>

        {cvData.summary && (
          <>
            <div className="cv-section-title">Profilo professionale</div>
            <div className="cv-exp-desc">{cvData.summary}</div>
          </>
        )}

        {cvData.experiences.some(e => e.company || e.role) && (
          <>
            <div className="cv-section-title">Esperienze lavorative</div>
            {cvData.experiences.filter(e => e.company || e.role).map(exp => (
              <div key={exp.id} className="cv-exp-item">
                <div className="cv-exp-title">{exp.role}</div>
                <div className="cv-exp-meta">
                  {[exp.company, exp.city, exp.from && exp.to ? `${exp.from} – ${exp.to}` : exp.from || exp.to].filter(Boolean).join(' · ')}
                </div>
                {exp.desc && <RenderDesc text={exp.desc} className="cv-exp-desc" />}
              </div>
            ))}
          </>
        )}

        {cvData.education.some(e => e.institution || e.degree) && (
          <>
            <div className="cv-section-title">Formazione</div>
            {cvData.education.filter(e => e.institution || e.degree).map(edu => (
              <div key={edu.id} className="cv-exp-item">
                <div className="cv-exp-title">{edu.degree}</div>
                <div className="cv-exp-meta">
                  {[edu.institution, edu.from && edu.to ? `${edu.from} – ${edu.to}` : edu.from || edu.to, edu.grade].filter(Boolean).join(' · ')}
                </div>
              </div>
            ))}
          </>
        )}

        {cvData.skills.length > 0 && (
          <>
            <div className="cv-section-title">Competenze</div>
            <div className="cv-tecnico-tags">
              {cvData.skills.map(s => <span key={s} className="cv-tecnico-tag">{s}</span>)}
            </div>
          </>
        )}

        {cvData.languages.some(l => l.name) && (
          <>
            <div className="cv-section-title">Lingue</div>
            <div className="cv-exp-desc">
              {cvData.languages.filter(l => l.name).map(l => `${l.name} (${l.level})`).join(' · ')}
            </div>
          </>
        )}

        <div className="cv-watermark">
          <div className="cv-watermark-logo">P</div>
          ProntoCurriculum.it
        </div>
      </div>
    );
  }

  // ── Classico template ────────────────────────────────────────────────────────
  if (template === 'classico') {
    return (
      <div className="cv-doc template-classico">
        <div className="cv-header">
          <div className="cv-name">{name}</div>
          <div className="cv-title">{cvData.title || 'Titolo professionale'}</div>
          <div className="cv-contact">
            {cvData.email && <span>{cvData.email}</span>}
            {cvData.phone && <span>{cvData.phone}</span>}
            {cvData.city && <span>{cvData.city}</span>}
            {cvData.linkedin && <span>{cvData.linkedin}</span>}
          </div>
        </div>

        {cvData.summary && (
          <>
            <div className="cv-section-title">Profilo professionale</div>
            <div className="cv-exp-desc">{cvData.summary}</div>
          </>
        )}

        {cvData.experiences.some(e => e.company || e.role) && (
          <>
            <div className="cv-section-title">Esperienze lavorative</div>
            {cvData.experiences.filter(e => e.company || e.role).map(exp => (
              <div key={exp.id} className="cv-exp-item">
                <div className="cv-exp-title">{exp.role}</div>
                <div className="cv-exp-meta">
                  {[exp.company, exp.city, exp.from && exp.to ? `${exp.from} – ${exp.to}` : exp.from || exp.to].filter(Boolean).join(' · ')}
                </div>
                {exp.desc && <RenderDesc text={exp.desc} className="cv-exp-desc" />}
              </div>
            ))}
          </>
        )}

        {cvData.education.some(e => e.institution || e.degree) && (
          <>
            <div className="cv-section-title">Formazione</div>
            {cvData.education.filter(e => e.institution || e.degree).map(edu => (
              <div key={edu.id} className="cv-exp-item">
                <div className="cv-exp-title">{edu.degree}</div>
                <div className="cv-exp-meta">
                  {[edu.institution, edu.from && edu.to ? `${edu.from} – ${edu.to}` : edu.from || edu.to, edu.grade].filter(Boolean).join(' · ')}
                </div>
              </div>
            ))}
          </>
        )}

        {cvData.skills.length > 0 && (
          <>
            <div className="cv-section-title">Competenze</div>
            <div className="cv-exp-desc">{skillsText}</div>
          </>
        )}

        {cvData.languages.some(l => l.name) && (
          <>
            <div className="cv-section-title">Lingue</div>
            <div className="cv-exp-desc">
              {cvData.languages.filter(l => l.name).map(l => `${l.name} (${l.level})`).join(' · ')}
            </div>
          </>
        )}

        <div className="cv-watermark">
          <div className="cv-watermark-logo">P</div>
          ProntoCurriculum.it
        </div>
      </div>
    );
  }

  // modern / minimal / compatto share the same JSX — CSS handles visual differences
  const SINGLE_COL_TEMPLATES = ['modern', 'minimal', 'compatto'];
  const templateClass = SINGLE_COL_TEMPLATES.includes(template)
    ? `cv-doc template-${template}`
    : 'cv-doc template-modern';

  return (
    <div className={templateClass}>
      <div className="cv-header">
        {(template === 'modern') && hasPhoto && (
          <img src={cvData.photo} alt="foto" style={{ width: 70, height: 70, borderRadius: '50%', objectFit: 'cover', border: '3px solid var(--gold)', position: 'absolute', top: 20, right: 20 }} />
        )}
        <div className="cv-name">{name}</div>
        <div className="cv-title">{cvData.title || 'Titolo professionale'}</div>
        <div className="cv-contact">
          {cvData.email && <span>{cvData.email}</span>}
          {cvData.phone && <span>{cvData.phone}</span>}
          {cvData.city && <span>{cvData.city}</span>}
          {cvData.linkedin && <span>{cvData.linkedin}</span>}
        </div>
      </div>

      {cvData.summary && (
        <>
          <div className="cv-section-title">Profilo professionale</div>
          <div className="cv-exp-desc">{cvData.summary}</div>
        </>
      )}

      {cvData.experiences.some(e => e.company || e.role) && (
        <>
          <div className="cv-section-title">Esperienze lavorative</div>
          {cvData.experiences.filter(e => e.company || e.role).map(exp => (
            <div key={exp.id} className="cv-exp-item">
              <div className="cv-exp-title">{exp.role}</div>
              <div className="cv-exp-meta">
                {[exp.company, exp.city, exp.from && exp.to ? `${exp.from} – ${exp.to}` : exp.from || exp.to].filter(Boolean).join(' · ')}
              </div>
              {exp.desc && <RenderDesc text={exp.desc} className="cv-exp-desc" />}
            </div>
          ))}
        </>
      )}

      {cvData.education.some(e => e.institution || e.degree) && (
        <>
          <div className="cv-section-title">Formazione</div>
          {cvData.education.filter(e => e.institution || e.degree).map(edu => (
            <div key={edu.id} className="cv-exp-item">
              <div className="cv-exp-title">{edu.degree}</div>
              <div className="cv-exp-meta">
                {[edu.institution, edu.from && edu.to ? `${edu.from} – ${edu.to}` : edu.from || edu.to, edu.grade].filter(Boolean).join(' · ')}
              </div>
            </div>
          ))}
        </>
      )}

      {cvData.skills.length > 0 && (
        <>
          <div className="cv-section-title">Competenze</div>
          <div className="cv-exp-desc">{skillsText}</div>
        </>
      )}

      {cvData.languages.some(l => l.name) && (
        <>
          <div className="cv-section-title">Lingue</div>
          <div className="cv-exp-desc">
            {cvData.languages.filter(l => l.name).map(l => `${l.name} (${l.level})`).join(' · ')}
          </div>
        </>
      )}

      <div className="cv-watermark">
        <div className="cv-watermark-logo">P</div>
        ProntoCurriculum.it
      </div>
    </div>
  );
}
