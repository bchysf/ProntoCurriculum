import { useState, useEffect } from 'react';
import { useAuth } from '../hooks/use-auth';
import type { Page } from '../types';
import { useT } from '../i18n/LanguageContext';

interface StoredExp {
  id: string;
  company: string;
  role: string;
  city: string | null;
  startDate: string | null;
  endDate: string | null;
  isCurrent: boolean;
  description: string | null;
  skills: string[];
}

interface ExpForm {
  company: string;
  role: string;
  city: string;
  startDate: string;
  endDate: string;
  isCurrent: boolean;
  description: string;
  skills: string;
}

const EMPTY_FORM: ExpForm = {
  company: '',
  role: '',
  city: '',
  startDate: '',
  endDate: '',
  isCurrent: false,
  description: '',
  skills: '',
};

function formToPayload(f: ExpForm) {
  return {
    company: f.company,
    role: f.role,
    city: f.city || undefined,
    startDate: f.startDate || undefined,
    endDate: f.isCurrent ? undefined : (f.endDate || undefined),
    isCurrent: f.isCurrent,
    description: f.description || undefined,
    skills: f.skills ? f.skills.split(',').map(s => s.trim()).filter(Boolean) : [],
  };
}

function rowToForm(r: StoredExp): ExpForm {
  return {
    company: r.company,
    role: r.role,
    city: r.city ?? '',
    startDate: r.startDate ?? '',
    endDate: r.endDate ?? '',
    isCurrent: r.isCurrent,
    description: r.description ?? '',
    skills: (r.skills ?? []).join(', '),
  };
}

interface ArchivioProps {
  onNavigate: (page: Page) => void;
}

export default function Archivio({ onNavigate }: ArchivioProps) {
  const { isAuthenticated, isLoading, login } = useAuth();
  const t = useT();
  const [experiences, setExperiences] = useState<StoredExp[]>([]);
  const [fetching, setFetching] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState<ExpForm>(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function load() {
    setFetching(true);
    try {
      const res = await fetch('/api/experiences', { credentials: 'include' });
      if (res.ok) {
        const data = await res.json() as { experiences: StoredExp[] };
        setExperiences(data.experiences);
      }
    } finally {
      setFetching(false);
    }
  }

  useEffect(() => {
    if (isAuthenticated) load();
    else if (!isLoading) setFetching(false);
  }, [isAuthenticated, isLoading]);

  function openAdd() {
    setEditId(null);
    setForm(EMPTY_FORM);
    setError(null);
    setShowForm(true);
  }

  function openEdit(exp: StoredExp) {
    setEditId(exp.id);
    setForm(rowToForm(exp));
    setError(null);
    setShowForm(true);
  }

  function cancelForm() {
    setShowForm(false);
    setEditId(null);
    setForm(EMPTY_FORM);
    setError(null);
  }

  async function handleSave() {
    if (!form.company.trim() || !form.role.trim()) {
      setError(t('arch.errRequired'));
      return;
    }
    setSaving(true);
    setError(null);
    try {
      const payload = formToPayload(form);
      const url = editId ? `/api/experiences/${editId}` : '/api/experiences';
      const method = editId ? 'PUT' : 'POST';
      const res = await fetch(url, {
        method,
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const d = await res.json() as { error?: string };
        setError(d.error ?? t('arch.errSave'));
        return;
      }
      await load();
      cancelForm();
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm(t('arch.confirmDelete'))) return;
    await fetch(`/api/experiences/${id}`, { method: 'DELETE', credentials: 'include' });
    setExperiences(prev => prev.filter(e => e.id !== id));
  }

  if (isLoading) {
    return (
      <div className="loading-state" style={{ minHeight: 300 }}>
        <div className="spinner" />
        <span>{t('arch.loading')}</span>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="lock-state" style={{ minHeight: '40vh' }}>
        <h2>{t('arch.loginGate')}</h2>
        <p style={{ color: 'var(--ink-60)', fontSize: 14.5, maxWidth: 440 }}>
          {t('arch.loginGateSub')}
        </p>
        <button className="btn btn-ink" onClick={login}>{t('nav.login')}</button>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: 760, margin: '0 auto', padding: '8px 24px 80px' }}>
      <div className="head">
        <div>
          <h1>{t('arch.title')}</h1>
          <p>
            {t('arch.subtitle')}
          </p>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button className="btn btn-line" onClick={() => onNavigate('cover-letter')}>
            {t('ws.coverLetter')}
          </button>
          <button className="btn btn-ink" onClick={openAdd}>{t('arch.add')}</button>
        </div>
      </div>

      {showForm && (
        <div style={{ background: 'var(--gray50)', border: '1.5px solid var(--gray100)', borderRadius: 12, padding: '24px', marginBottom: 24 }}>
          <h3 style={{ fontSize: 18, fontWeight: 700, color: 'var(--navy)', marginBottom: 20, marginTop: 0 }}>
            {editId ? t('arch.editExp') : t('arch.newExp')}
          </h3>

          {error && (
            <div style={{ background: '#FFF3F3', border: '1px solid #FFCECE', borderRadius: 8, padding: '10px 14px', color: 'var(--danger)', fontSize: 13, marginBottom: 16 }}>
              {error}
            </div>
          )}

          <div className="form-row">
            <div className="form-group">
              <label>{t('arch.company')}</label>
              <input type="text" placeholder="es. Accenture" value={form.company} onChange={e => setForm(f => ({ ...f, company: e.target.value }))} />
            </div>
            <div className="form-group">
              <label>{t('arch.role')}</label>
              <input type="text" placeholder="es. Project Manager" value={form.role} onChange={e => setForm(f => ({ ...f, role: e.target.value }))} />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>{t('arch.city')}</label>
              <input type="text" placeholder="es. Milano" value={form.city} onChange={e => setForm(f => ({ ...f, city: e.target.value }))} />
            </div>
            <div className="form-group">
              <label>{t('arch.startDate')}</label>
              <input type="text" placeholder="Gen 2020" value={form.startDate} onChange={e => setForm(f => ({ ...f, startDate: e.target.value }))} />
            </div>
          </div>

          <div className="form-row" style={{ alignItems: 'flex-end' }}>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label>{t('arch.endDate')}</label>
              <input
                type="text"
                placeholder="Dic 2023"
                value={form.endDate}
                disabled={form.isCurrent}
                onChange={e => setForm(f => ({ ...f, endDate: e.target.value }))}
                style={{ opacity: form.isCurrent ? 0.4 : 1 }}
              />
            </div>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  checked={form.isCurrent}
                  onChange={e => setForm(f => ({ ...f, isCurrent: e.target.checked, endDate: e.target.checked ? '' : f.endDate }))}
                  style={{ width: 16, height: 16, accentColor: 'var(--gold)' }}
                />
                {t('arch.stillWorkHere')}
              </label>
            </div>
          </div>

          <div className="form-group" style={{ marginTop: 12 }}>
            <label>{t('arch.description')}</label>
            <textarea rows={3} placeholder={t('arch.descPlaceholder')} value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} />
          </div>

          <div className="form-group">
            <label>{t('arch.skillsUsed')}</label>
            <input type="text" placeholder={t('arch.skillsPlaceholder')} value={form.skills} onChange={e => setForm(f => ({ ...f, skills: e.target.value }))} />
          </div>

          <div style={{ display: 'flex', gap: 10, marginTop: 8 }}>
            <button className="btn btn-gold" onClick={handleSave} disabled={saving}>
              {saving ? t('arch.saving') : editId ? t('arch.saveChanges') : t('arch.saveExp')}
            </button>
            <button className="btn btn-ghost" onClick={cancelForm}>{t('arch.cancel')}</button>
          </div>
        </div>
      )}

      {fetching ? (
        <div style={{ color: 'var(--gray500)', fontSize: 14, textAlign: 'center', padding: 40 }}>{t('arch.loadingExp')}</div>
      ) : experiences.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '60px 24px', background: 'var(--gray50)', borderRadius: 12, border: '1.5px dashed var(--gray100)' }}>
          <div style={{ fontSize: 40, marginBottom: 12 }}>💼</div>
          <div style={{ fontSize: 18, fontWeight: 700, color: 'var(--navy)', marginBottom: 8 }}>
            {t('arch.emptyTitle')}
          </div>
          <div style={{ color: 'var(--gray500)', fontSize: 14, marginBottom: 20 }}>
            {t('arch.emptySub')}
          </div>
          <button className="btn btn-gold" onClick={openAdd}>{t('arch.addFirstExp')}</button>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {experiences.map(exp => (
            <div key={exp.id} style={{ background: '#fff', border: '1.5px solid var(--gray100)', borderRadius: 12, padding: '18px 20px', display: 'flex', gap: 16 }}>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: 10, flexWrap: 'wrap' }}>
                  <span style={{ fontWeight: 700, fontSize: 15, color: 'var(--navy)' }}>{exp.role}</span>
                  <span style={{ fontSize: 13, color: 'var(--gold)', fontWeight: 600 }}>@ {exp.company}</span>
                  {exp.city && <span style={{ fontSize: 12, color: 'var(--gray500)' }}>· {exp.city}</span>}
                </div>
                {(exp.startDate || exp.endDate || exp.isCurrent) && (
                  <div style={{ fontSize: 12, color: 'var(--gray500)', marginTop: 3 }}>
                    {exp.startDate ?? ''}{(exp.startDate && (exp.endDate || exp.isCurrent)) ? ' → ' : ''}{exp.isCurrent ? t('arch.present') : (exp.endDate ?? '')}
                  </div>
                )}
                {exp.description && (
                  <p style={{ fontSize: 13, color: 'var(--gray500)', marginTop: 8, lineHeight: 1.55, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                    {exp.description}
                  </p>
                )}
                {exp.skills && exp.skills.length > 0 && (
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5, marginTop: 8 }}>
                    {exp.skills.map(s => (
                      <span key={s} style={{ fontSize: 11, background: 'var(--gold-light)', color: 'var(--navy)', borderRadius: 6, padding: '2px 8px', fontWeight: 600 }}>{s}</span>
                    ))}
                  </div>
                )}
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6, flexShrink: 0 }}>
                <button className="btn btn-ghost btn-sm" onClick={() => openEdit(exp)} style={{ fontSize: 12 }}>{t('arch.edit')}</button>
                <button className="btn btn-danger btn-sm" onClick={() => handleDelete(exp.id)} style={{ fontSize: 12 }}>{t('arch.delete')}</button>
              </div>
            </div>
          ))}
        </div>
      )}

      {!showForm && experiences.length > 0 && (
        <div style={{ marginTop: 24, textAlign: 'center' }}>
          <button className="btn btn-ghost" onClick={openAdd}>{t('arch.addAnotherExp')}</button>
        </div>
      )}
    </div>
  );
}
