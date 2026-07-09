import { useState, useEffect } from 'react';
import { useAuth } from '../hooks/use-auth';

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
  onNavigate: (page: 'home' | 'builder-step1' | 'builder-step2' | 'archivio') => void;
}

export default function Archivio({ onNavigate }: ArchivioProps) {
  const { isAuthenticated, isLoading, login } = useAuth();
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
      setError('Azienda e ruolo sono obbligatori.');
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
        setError(d.error ?? 'Errore durante il salvataggio.');
        return;
      }
      await load();
      cancelForm();
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm('Eliminare questa esperienza dall\'archivio?')) return;
    await fetch(`/api/experiences/${id}`, { method: 'DELETE', credentials: 'include' });
    setExperiences(prev => prev.filter(e => e.id !== id));
  }

  if (isLoading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 300 }}>
        <div style={{ color: 'var(--gray500)', fontSize: 14 }}>Caricamento...</div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div style={{ maxWidth: 480, margin: '80px auto', textAlign: 'center', padding: '0 24px' }}>
        <div style={{ fontSize: 48, marginBottom: 16 }}>🔒</div>
        <h2 style={{ fontFamily: 'Playfair Display, serif', fontSize: 26, fontWeight: 700, color: 'var(--navy)', marginBottom: 12 }}>
          Accedi per vedere l'archivio
        </h2>
        <p style={{ color: 'var(--gray500)', fontSize: 15, marginBottom: 28 }}>
          Salva le tue esperienze lavorative e importale in qualsiasi CV con un click.
        </p>
        <button className="btn btn-gold" onClick={login}>Accedi con Replit</button>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: 760, margin: '0 auto', padding: '40px 24px 80px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 32 }}>
        <button className="btn btn-ghost btn-sm" onClick={() => onNavigate('home')} style={{ fontSize: 13 }}>
          ← Torna alla home
        </button>
        <div style={{ flex: 1 }}>
          <h1 style={{ fontFamily: 'Playfair Display, serif', fontSize: 28, fontWeight: 700, color: 'var(--navy)', margin: 0 }}>
            Le mie esperienze
          </h1>
          <p style={{ color: 'var(--gray500)', fontSize: 13, margin: '4px 0 0' }}>
            Il tuo archivio personale — importa direttamente nel builder
          </p>
        </div>
        <button className="btn btn-gold" onClick={openAdd}>+ Aggiungi</button>
      </div>

      {showForm && (
        <div style={{ background: 'var(--gray50)', border: '1.5px solid var(--gray100)', borderRadius: 12, padding: '24px', marginBottom: 24 }}>
          <h3 style={{ fontFamily: 'Playfair Display, serif', fontSize: 18, fontWeight: 700, color: 'var(--navy)', marginBottom: 20, marginTop: 0 }}>
            {editId ? 'Modifica esperienza' : 'Nuova esperienza'}
          </h3>

          {error && (
            <div style={{ background: '#FFF3F3', border: '1px solid #FFCECE', borderRadius: 8, padding: '10px 14px', color: 'var(--danger)', fontSize: 13, marginBottom: 16 }}>
              {error}
            </div>
          )}

          <div className="form-row">
            <div className="form-group">
              <label>Azienda *</label>
              <input type="text" placeholder="es. Accenture" value={form.company} onChange={e => setForm(f => ({ ...f, company: e.target.value }))} />
            </div>
            <div className="form-group">
              <label>Ruolo *</label>
              <input type="text" placeholder="es. Project Manager" value={form.role} onChange={e => setForm(f => ({ ...f, role: e.target.value }))} />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>Città</label>
              <input type="text" placeholder="es. Milano" value={form.city} onChange={e => setForm(f => ({ ...f, city: e.target.value }))} />
            </div>
            <div className="form-group">
              <label>Data inizio</label>
              <input type="text" placeholder="Gen 2020" value={form.startDate} onChange={e => setForm(f => ({ ...f, startDate: e.target.value }))} />
            </div>
          </div>

          <div className="form-row" style={{ alignItems: 'flex-end' }}>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label>Data fine</label>
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
                Lavoro ancora qui
              </label>
            </div>
          </div>

          <div className="form-group" style={{ marginTop: 12 }}>
            <label>Descrizione</label>
            <textarea rows={3} placeholder="Responsabilità e risultati..." value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} />
          </div>

          <div className="form-group">
            <label>Competenze usate</label>
            <input type="text" placeholder="React, TypeScript, Agile (separate da virgola)" value={form.skills} onChange={e => setForm(f => ({ ...f, skills: e.target.value }))} />
          </div>

          <div style={{ display: 'flex', gap: 10, marginTop: 8 }}>
            <button className="btn btn-gold" onClick={handleSave} disabled={saving}>
              {saving ? 'Salvataggio...' : editId ? 'Salva modifiche' : 'Salva esperienza'}
            </button>
            <button className="btn btn-ghost" onClick={cancelForm}>Annulla</button>
          </div>
        </div>
      )}

      {fetching ? (
        <div style={{ color: 'var(--gray500)', fontSize: 14, textAlign: 'center', padding: 40 }}>Caricamento esperienze...</div>
      ) : experiences.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '60px 24px', background: 'var(--gray50)', borderRadius: 12, border: '1.5px dashed var(--gray100)' }}>
          <div style={{ fontSize: 40, marginBottom: 12 }}>💼</div>
          <div style={{ fontFamily: 'Playfair Display, serif', fontSize: 18, fontWeight: 700, color: 'var(--navy)', marginBottom: 8 }}>
            Archivio vuoto
          </div>
          <div style={{ color: 'var(--gray500)', fontSize: 14, marginBottom: 20 }}>
            Aggiungi le tue esperienze lavorative per importarle rapidamente nei tuoi CV.
          </div>
          <button className="btn btn-gold" onClick={openAdd}>+ Aggiungi la prima esperienza</button>
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
                    {exp.startDate ?? ''}{(exp.startDate && (exp.endDate || exp.isCurrent)) ? ' → ' : ''}{exp.isCurrent ? 'Presente' : (exp.endDate ?? '')}
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
                <button className="btn btn-ghost btn-sm" onClick={() => openEdit(exp)} style={{ fontSize: 12 }}>✏ Modifica</button>
                <button className="btn btn-danger btn-sm" onClick={() => handleDelete(exp.id)} style={{ fontSize: 12 }}>🗑 Elimina</button>
              </div>
            </div>
          ))}
        </div>
      )}

      {!showForm && experiences.length > 0 && (
        <div style={{ marginTop: 24, textAlign: 'center' }}>
          <button className="btn btn-ghost" onClick={openAdd}>+ Aggiungi altra esperienza</button>
        </div>
      )}
    </div>
  );
}
