import { CVData, TemplateType } from '../types';

export type CvLang = 'IT' | 'EN' | 'FR' | 'DE' | 'ES' | 'PT';

export const CV_LABELS: Record<CvLang, {
  profile: string; profileShort: string;
  experience: string; experienceShort: string; experienceEuro: string;
  education: string; educationEuro: string;
  skills: string; languages: string; contacts: string;
  namePlaceholder: string; titlePlaceholder: string;
  emailLabel: string; phoneLabel: string; cityLabel: string; professionLabel: string;
  privacyClause: string;
  present: string; grade: string;
}> = {
  IT: {
    profile: 'Profilo professionale', profileShort: 'Profilo',
    experience: 'Esperienze lavorative', experienceShort: 'Esperienze', experienceEuro: 'Esperienza lavorativa',
    education: 'Formazione', educationEuro: 'Istruzione e formazione',
    skills: 'Competenze', languages: 'Lingue', contacts: 'Contatti',
    namePlaceholder: 'Il tuo nome', titlePlaceholder: 'Titolo professionale',
    emailLabel: 'Indirizzo e-mail', phoneLabel: 'Telefono', cityLabel: 'Residenza', professionLabel: 'Professione',
    privacyClause: 'Autorizzo il trattamento dei miei dati personali ai sensi del D.Lgs. 196/2003 e del Regolamento UE 2016/679 (GDPR).',
    present: 'Presente', grade: 'Voto',
  },
  EN: {
    profile: 'Professional Profile', profileShort: 'Profile',
    experience: 'Work Experience', experienceShort: 'Experience', experienceEuro: 'Work Experience',
    education: 'Education', educationEuro: 'Education & Training',
    skills: 'Skills', languages: 'Languages', contacts: 'Contacts',
    namePlaceholder: 'Your name', titlePlaceholder: 'Professional title',
    emailLabel: 'E-mail address', phoneLabel: 'Phone', cityLabel: 'Location', professionLabel: 'Profession',
    privacyClause: 'I hereby authorize the processing of my personal data pursuant to EU Regulation 2016/679 (GDPR).',
    present: 'Present', grade: 'Grade',
  },
  FR: {
    profile: 'Profil professionnel', profileShort: 'Profil',
    experience: 'Expériences professionnelles', experienceShort: 'Expériences', experienceEuro: 'Expérience professionnelle',
    education: 'Formation', educationEuro: 'Éducation et formation',
    skills: 'Compétences', languages: 'Langues', contacts: 'Contacts',
    namePlaceholder: 'Votre nom', titlePlaceholder: 'Titre professionnel',
    emailLabel: 'Adresse e-mail', phoneLabel: 'Téléphone', cityLabel: 'Lieu', professionLabel: 'Profession',
    privacyClause: "J'autorise le traitement de mes données personnelles conformément au Règlement UE 2016/679 (RGPD).",
    present: "Aujourd'hui", grade: 'Note',
  },
  DE: {
    profile: 'Berufliches Profil', profileShort: 'Profil',
    experience: 'Berufserfahrung', experienceShort: 'Erfahrung', experienceEuro: 'Berufserfahrung',
    education: 'Ausbildung', educationEuro: 'Bildung und Ausbildung',
    skills: 'Kompetenzen', languages: 'Sprachen', contacts: 'Kontakt',
    namePlaceholder: 'Ihr Name', titlePlaceholder: 'Berufsbezeichnung',
    emailLabel: 'E-Mail-Adresse', phoneLabel: 'Telefon', cityLabel: 'Wohnort', professionLabel: 'Beruf',
    privacyClause: 'Ich erkläre mich mit der Verarbeitung meiner personenbezogenen Daten gemäß EU-Verordnung 2016/679 (DSGVO) einverstanden.',
    present: 'Heute', grade: 'Note',
  },
  ES: {
    profile: 'Perfil profesional', profileShort: 'Perfil',
    experience: 'Experiencia laboral', experienceShort: 'Experiencia', experienceEuro: 'Experiencia laboral',
    education: 'Formación', educationEuro: 'Educación y formación',
    skills: 'Competencias', languages: 'Idiomas', contacts: 'Contactos',
    namePlaceholder: 'Tu nombre', titlePlaceholder: 'Título profesional',
    emailLabel: 'Dirección e-mail', phoneLabel: 'Teléfono', cityLabel: 'Ubicación', professionLabel: 'Profesión',
    privacyClause: 'Autorizo el tratamiento de mis datos personales conforme al Reglamento UE 2016/679 (RGPD).',
    present: 'Actualidad', grade: 'Nota',
  },
  PT: {
    profile: 'Perfil profissional', profileShort: 'Perfil',
    experience: 'Experiência profissional', experienceShort: 'Experiência', experienceEuro: 'Experiência profissional',
    education: 'Formação', educationEuro: 'Educação e formação',
    skills: 'Competências', languages: 'Idiomas', contacts: 'Contactos',
    namePlaceholder: 'O seu nome', titlePlaceholder: 'Título profissional',
    emailLabel: 'Endereço e-mail', phoneLabel: 'Telefone', cityLabel: 'Localização', professionLabel: 'Profissão',
    privacyClause: 'Autorizo o tratamento dos meus dados pessoais nos termos do Regulamento UE 2016/679 (RGPD).',
    present: 'Atualidade', grade: 'Nota',
  },
};

interface CVPreviewProps {
  cvData: CVData;
  template: TemplateType;
  lang?: CvLang;
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

export default function CVPreview({ cvData, template, lang = 'IT' }: CVPreviewProps) {
  const t = CV_LABELS[lang] ?? CV_LABELS.IT;
  const name = [cvData.firstName, cvData.lastName].filter(Boolean).join(' ') || t.namePlaceholder;
  const effectiveSkills = cvData.skillCategories?.length
    ? cvData.skillCategories.flatMap(c => c.skills)
    : cvData.skills;
  const skillsText = effectiveSkills.join(' · ');
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
          <div className="cve-title">{cvData.title || t.titlePlaceholder}</div>
          <div className="cve-divider" />
          <div className="cve-contact-label">{t.contacts}</div>
          {cvData.email && <div className="cve-contact-item">✉ {cvData.email}</div>}
          {cvData.phone && <div className="cve-contact-item">✆ {cvData.phone}</div>}
          {cvData.city && <div className="cve-contact-item">◎ {cvData.city}</div>}
          {cvData.linkedin && <div className="cve-contact-item">in {cvData.linkedin}</div>}
          {cvData.skillCategories?.length
            ? cvData.skillCategories.map(cat => (
                <div key={cat.name}>
                  <div className="cve-divider" />
                  <div className="cve-contact-label">{cat.name}</div>
                  {cat.skills.map(s => <div key={s} className="cve-skill">{s}</div>)}
                </div>
              ))
            : effectiveSkills.length > 0 && (
                <>
                  <div className="cve-divider" />
                  <div className="cve-contact-label">{t.skills}</div>
                  {effectiveSkills.map(s => <div key={s} className="cve-skill">{s}</div>)}
                </>
              )
          }
          {cvData.languages.some(l => l.name) && (
            <>
              <div className="cve-divider" />
              <div className="cve-contact-label">{t.languages}</div>
              {cvData.languages.filter(l => l.name).map(l => (
                <div key={l.id} className="cve-skill">{l.name} <span style={{ opacity: 0.6, fontSize: 10 }}>({l.level.split(' - ')[0]})</span></div>
              ))}
            </>
          )}
        </div>
        <div className="cve-main">
          {cvData.summary && (
            <div className="cve-section">
              <div className="cve-section-title">{t.profileShort}</div>
              <div className="cve-text">{cvData.summary}</div>
            </div>
          )}
          {cvData.experiences.some(e => e.company || e.role) && (
            <div className="cve-section">
              <div className="cve-section-title">{t.experienceShort}</div>
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
              <div className="cve-section-title">{t.education}</div>
              {cvData.education.filter(e => e.institution || e.degree).map(edu => (
                <div key={edu.id} className="cve-exp-item">
                  <div className="cve-exp-role">{edu.degree}</div>
                  <div className="cve-exp-meta">{[edu.institution, edu.from && edu.to ? `${edu.from}–${edu.to}` : edu.from || edu.to, edu.grade].filter(Boolean).join(' · ')}</div>
                </div>
              ))}
            </div>
          )}
        </div>
        <div className="cv-privacy-clause">{t.privacyClause}</div>
        <div className="cv-watermark"><div className="cv-watermark-logo">P</div>ProntoCurriculum.it</div>
      </div>
    );
  }

  if (template === 'europass' || template === 'europass_pubblico') {
    return (
      <div className={`cv-doc cv-europass ${template === 'europass_pubblico' ? 'cv-pubblico-mode' : ''}`} style={template === 'europass_pubblico' ? { padding: '24px 32px', fontSize: '95%' } : {}}>
        <div className="cveu-top-bar">
          <div className="cveu-eu-logo">
            <span className="cveu-stars">★ ★ ★ ★ ★</span>
            <span className="cveu-label">{template === 'europass_pubblico' ? 'Curriculum Vitae — Formato Pubblico PA' : 'Curriculum Vitae'}</span>
          </div>
          {hasPhoto && <img src={cvData.photo} alt="foto" className="cveu-photo" />}
        </div>
        <div className="cveu-name">{name}</div>
        {template === 'europass_pubblico' && (
          <div style={{ fontSize: 10, fontStyle: 'italic', color: '#334155', background: '#F8FAFC', padding: '8px 12px', borderRadius: 6, borderLeft: '3px solid #0F172A', margin: '10px 0 14px', lineHeight: 1.4, border: '1px solid #E2E8F0' }}>
            <strong>Dichiarazione sostitutiva di certificazione (artt. 46 e 47 D.P.R. 445/2000):</strong> Il/La sottoscritto/a dichiara sotto la propria responsabilità che le informazioni, i titoli di studio e i periodi di servizio riportati nel presente curriculum vitae corrispondono al vero.
          </div>
        )}
        <div className="cveu-info-box">
          <div className="cveu-info-row"><span className="cveu-info-label">{t.emailLabel}</span><span>{cvData.email}</span></div>
          {cvData.phone && <div className="cveu-info-row"><span className="cveu-info-label">{t.phoneLabel}</span><span>{cvData.phone}</span></div>}
          {cvData.city && <div className="cveu-info-row"><span className="cveu-info-label">{t.cityLabel}</span><span>{cvData.city}</span></div>}
          {cvData.linkedin && <div className="cveu-info-row"><span className="cveu-info-label">LinkedIn</span><span>{cvData.linkedin}</span></div>}
          {cvData.title && <div className="cveu-info-row"><span className="cveu-info-label">{t.professionLabel}</span><span>{cvData.title}</span></div>}
        </div>
        {cvData.summary && (
          <div className="cveu-section">
            <div className="cveu-section-title">{t.profile}</div>
            <div className="cveu-text">{cvData.summary}</div>
          </div>
        )}
        {cvData.experiences.some(e => e.company || e.role) && (
          <div className="cveu-section">
            <div className="cveu-section-title">{t.experienceEuro}</div>
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
            <div className="cveu-section-title">{t.educationEuro}</div>
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
        {effectiveSkills.length > 0 && (
          <div className="cveu-section">
            <div className="cveu-section-title">{t.skills}</div>
            <div className="cveu-text">{skillsText}</div>
          </div>
        )}
        {cvData.languages.some(l => l.name) && (
          <div className="cveu-section">
            <div className="cveu-section-title">{t.languages}</div>
            <div className="cveu-text">{cvData.languages.filter(l => l.name).map(l => `${l.name}: ${l.level}`).join(' · ')}</div>
          </div>
        )}
        <div className="cv-privacy-clause">{t.privacyClause}</div>
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
            <div className="cvp-title">{cvData.title || t.titlePlaceholder}</div>
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
            <div className="cvp-section-title">{t.profile}</div>
            <div className="cvp-text">{cvData.summary}</div>
          </div>
        )}
        {cvData.experiences.some(e => e.company || e.role) && (
          <div className="cvp-section">
            <div className="cvp-section-title">{t.experience}</div>
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
            <div className="cvp-section-title">{t.education}</div>
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
          {effectiveSkills.length > 0 && (
            <div className="cvp-section" style={{ flex: 1 }}>
              <div className="cvp-section-title">{t.skills}</div>
              {cvData.skillCategories?.length ? (
                cvData.skillCategories.map(cat => (
                  <div key={cat.name} style={{ marginBottom: 6 }}>
                    <div style={{ fontSize: 9, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px', opacity: 0.6, marginBottom: 3 }}>{cat.name}</div>
                    <div className="cvp-skills">
                      {cat.skills.map(s => <span key={s} className="cvp-skill-tag">{s}</span>)}
                    </div>
                  </div>
                ))
              ) : (
                <div className="cvp-skills">
                  {effectiveSkills.map(s => <span key={s} className="cvp-skill-tag">{s}</span>)}
                </div>
              )}
            </div>
          )}
          {cvData.languages.some(l => l.name) && (
            <div className="cvp-section" style={{ flex: 1 }}>
              <div className="cvp-section-title">{t.languages}</div>
              {cvData.languages.filter(l => l.name).map(l => (
                <div key={l.id} className="cvp-text">{l.name} — {l.level}</div>
              ))}
            </div>
          )}
        </div>
        <div className="cv-privacy-clause">{t.privacyClause}</div>
        <div className="cv-watermark"><div className="cv-watermark-logo">P</div>ProntoCurriculum.it</div>
      </div>
    );
  }

  // ── Tecnico template (needs tag-style skills) ────────────────────────────────
  if (template === 'tecnico' || template === 'nordico') {
    const tagClass = template === 'nordico' ? 'cv-nordico-tag' : 'cv-tecnico-tag';
    const tagsClass = template === 'nordico' ? 'cv-nordico-tags' : 'cv-tecnico-tags';
    return (
      <div className={`cv-doc template-${template}`}>
        <div className="cv-header">
          <div className="cv-name">{name}</div>
          <div className="cv-title">{cvData.title || t.titlePlaceholder}</div>
          <div className="cv-contact">
            {cvData.email && <span>{cvData.email}</span>}
            {cvData.phone && <span>{cvData.phone}</span>}
            {cvData.city && <span>{cvData.city}</span>}
            {cvData.linkedin && <span>{cvData.linkedin}</span>}
          </div>
        </div>

        {cvData.summary && (
          <>
            <div className="cv-section-title">{t.profile}</div>
            <div className="cv-exp-desc">{cvData.summary}</div>
          </>
        )}

        {cvData.experiences.some(e => e.company || e.role) && (
          <>
            <div className="cv-section-title">{t.experience}</div>
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
            <div className="cv-section-title">{t.education}</div>
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

        {effectiveSkills.length > 0 && (
          <>
            <div className="cv-section-title">{t.skills}</div>
            {cvData.skillCategories?.length ? (
              cvData.skillCategories.map(cat => (
                <div key={cat.name} style={{ marginBottom: 6 }}>
                  <div style={{ fontSize: 9, fontWeight: 700, textTransform: 'uppercase', opacity: 0.6, marginBottom: 3 }}>{cat.name}</div>
                  <div className={tagsClass}>
                    {cat.skills.map(s => <span key={s} className={tagClass}>{s}</span>)}
                  </div>
                </div>
              ))
            ) : (
              <div className={tagsClass}>
                {effectiveSkills.map(s => <span key={s} className={tagClass}>{s}</span>)}
              </div>
            )}
          </>
        )}

        {cvData.languages.some(l => l.name) && (
          <>
            <div className="cv-section-title">{t.languages}</div>
            <div className="cv-exp-desc">
              {cvData.languages.filter(l => l.name).map(l => `${l.name} (${l.level})`).join(' · ')}
            </div>
          </>
        )}

        <div className="cv-privacy-clause">{t.privacyClause}</div>
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
          <div className="cv-title">{cvData.title || t.titlePlaceholder}</div>
          <div className="cv-contact">
            {cvData.email && <span>{cvData.email}</span>}
            {cvData.phone && <span>{cvData.phone}</span>}
            {cvData.city && <span>{cvData.city}</span>}
            {cvData.linkedin && <span>{cvData.linkedin}</span>}
          </div>
        </div>

        {cvData.summary && (
          <>
            <div className="cv-section-title">{t.profile}</div>
            <div className="cv-exp-desc">{cvData.summary}</div>
          </>
        )}

        {cvData.experiences.some(e => e.company || e.role) && (
          <>
            <div className="cv-section-title">{t.experience}</div>
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
            <div className="cv-section-title">{t.education}</div>
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

        {effectiveSkills.length > 0 && (
          <>
            <div className="cv-section-title">{t.skills}</div>
            <div className="cv-exp-desc">{skillsText}</div>
          </>
        )}

        {cvData.languages.some(l => l.name) && (
          <>
            <div className="cv-section-title">{t.languages}</div>
            <div className="cv-exp-desc">
              {cvData.languages.filter(l => l.name).map(l => `${l.name} (${l.level})`).join(' · ')}
            </div>
          </>
        )}

        <div className="cv-privacy-clause">{t.privacyClause}</div>
        <div className="cv-watermark">
          <div className="cv-watermark-logo">P</div>
          ProntoCurriculum.it
        </div>
      </div>
    );
  }

  // modern / minimal / compatto / milano / elegante / corporate share JSX — CSS differs
  const SINGLE_COL_TEMPLATES = ['modern', 'minimal', 'compatto', 'milano', 'elegante', 'corporate'];
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
        <div className="cv-title">{cvData.title || t.titlePlaceholder}</div>
        <div className="cv-contact">
          {cvData.email && <span>{cvData.email}</span>}
          {cvData.phone && <span>{cvData.phone}</span>}
          {cvData.city && <span>{cvData.city}</span>}
          {cvData.linkedin && <span>{cvData.linkedin}</span>}
        </div>
      </div>

      {cvData.summary && (
        <>
          <div className="cv-section-title">{t.profile}</div>
          <div className="cv-exp-desc">{cvData.summary}</div>
        </>
      )}

      {cvData.experiences.some(e => e.company || e.role) && (
        <>
          <div className="cv-section-title">{t.experience}</div>
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
          <div className="cv-section-title">{t.education}</div>
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

      {effectiveSkills.length > 0 && (
        <>
          <div className="cv-section-title">{t.skills}</div>
          <div className="cv-exp-desc">{skillsText}</div>
        </>
      )}

      {cvData.languages.some(l => l.name) && (
        <>
          <div className="cv-section-title">{t.languages}</div>
          <div className="cv-exp-desc">
            {cvData.languages.filter(l => l.name).map(l => `${l.name} (${l.level})`).join(' · ')}
          </div>
        </>
      )}

      <div className="cv-privacy-clause">{t.privacyClause}</div>
      <div className="cv-watermark">
        <div className="cv-watermark-logo">P</div>
        ProntoCurriculum.it
      </div>
    </div>
  );
}
