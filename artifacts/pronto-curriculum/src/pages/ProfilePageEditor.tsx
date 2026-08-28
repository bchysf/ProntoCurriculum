import { useState, useEffect, useCallback } from 'react';
import { Page } from '../types';
import { useAuth } from '../hooks/use-auth';
import { Icon, IC } from '../components/StrokeIcon';
import { toast } from 'sonner';

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

interface StoredHighlight {
  id: string;
  type: 'volunteering' | 'honor' | 'project' | 'other';
  title: string;
  description: string | null;
  date: string | null;
  link: string | null;
}

interface ProfileSection {
  key: 'experiences' | 'education' | 'languages' | 'skills' | 'highlights';
  visible: boolean;
  order: number;
}

interface PublicProfile {
  id: string;
  slug: string;
  published: boolean;
  photo: string | null;
  headline: string | null;
  bio: string | null;
  selectedExperienceIds: string[];
  sections: ProfileSection[];
  publicUrl: string | null;
}

const DEFAULT_SECTIONS: ProfileSection[] = [
  { key: 'experiences', visible: true, order: 0 },
  { key: 'highlights', visible: true, order: 1 },
  { key: 'education', visible: true, order: 2 },
  { key: 'skills', visible: true, order: 3 },
  { key: 'languages', visible: true, order: 4 },
];

const SECTION_LABELS: Record<ProfileSection['key'], string> = {
  experiences: 'Esperienza',
  highlights: 'In evidenza',
  education: 'Formazione',
  skills: 'Competenze',
  languages: 'Lingue',
};

const HIGHLIGHT_TYPE_LABELS: Record<StoredHighlight['type'], string> = {
  volunteering: 'Volontariato',
  honor: 'Riconoscimento',
  project: 'Progetto',
  other: 'Altro',
};

const EMPTY_HIGHLIGHT_FORM = { type: 'project' as StoredHighlight['type'], title: '', description: '', date: '', link: '' };

interface ProfilePageEditorProps {
  onNavigate: (page: Page) => void;
}

export default function ProfilePageEditor({ onNavigate }: ProfilePageEditorProps) {
  const { isAuthenticated, isLoading, user, login } = useAuth();

  const [checkingPro, setCheckingPro] = useState(true);
  const [isPro, setIsPro] = useState(false);

  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<PublicProfile | null>(null);
  const [experiences, setExperiences] = useState<StoredExp[]>([]);
  const [highlights, setHighlights] = useState<StoredHighlight[]>([]);

  const [photo, setPhoto] = useState<string | null>(null);
  const [headline, setHeadline] = useState('');
  const [bio, setBio] = useState('');
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [sections, setSections] = useState<ProfileSection[]>(DEFAULT_SECTIONS);

  const [saving, setSaving] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [regenerating, setRegenerating] = useState(false);

  const [showExpForm, setShowExpForm] = useState(false);
  const [newExp, setNewExp] = useState({ company: '', role: '', city: '', startDate: '', endDate: '' });
  const [addingExp, setAddingExp] = useState(false);

  const [showHlForm, setShowHlForm] = useState(false);
  const [hlForm, setHlForm] = useState(EMPTY_HIGHLIGHT_FORM);
  const [savingHl, setSavingHl] = useState(false);

  const [improvingHeadline, setImprovingHeadline] = useState(false);
  const [improvingBio, setImprovingBio] = useState(false);

  const loadAll = useCallback(async () => {
    setLoading(true);
    try {
      const [profileRes, expRes, hlRes, userProfileRes] = await Promise.all([
        fetch('/api/profile-page', { credentials: 'include' }),
        fetch('/api/experiences', { credentials: 'include' }),
        fetch('/api/highlights', { credentials: 'include' }),
        fetch('/api/profile', { credentials: 'include' }),
      ]);
      const profileData = await profileRes.json() as { profile: PublicProfile | null };
      const expData = await expRes.json() as { experiences: StoredExp[] };
      const hlData = await hlRes.json() as { highlights: StoredHighlight[] };
      const userProfileData = await userProfileRes.json() as { profile: { headline?: string | null; summary?: string | null } | null };

      setExperiences(expData.experiences ?? []);
      setHighlights(hlData.highlights ?? []);

      const p = profileData.profile;
      setProfile(p);
      setPhoto(p?.photo ?? null);
      // Default headline/bio from the general CV profile on first setup, so the
      // user doesn't have to retype what they already filled in the dashboard.
      setHeadline(p?.headline ?? userProfileData.profile?.headline ?? '');
      setBio(p?.bio ?? userProfileData.profile?.summary ?? '');
      setSelectedIds(p?.selectedExperienceIds ?? []);
      setSections(p?.sections?.length ? p.sections : DEFAULT_SECTIONS);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!isAuthenticated) return;
    (async () => {
      setCheckingPro(true);
      try {
        const res = await fetch('/api/billing/status', { credentials: 'include' });
        const data = await res.json() as { subscription?: { plan?: string; status?: string } };
        const sub = data.subscription;
        setIsPro(!!sub && sub.plan !== 'free' && sub.status === 'active');
      } finally {
        setCheckingPro(false);
      }
    })();
    void loadAll();
  }, [isAuthenticated, loadAll]);

  async function persist(patch?: Partial<{ photo: string | null; headline: string; bio: string; selectedExperienceIds: string[]; sections: ProfileSection[] }>) {
    setSaving(true);
    try {
      const body = {
        photo: patch?.photo !== undefined ? patch.photo : photo,
        headline: patch?.headline !== undefined ? patch.headline : headline,
        bio: patch?.bio !== undefined ? patch.bio : bio,
        selectedExperienceIds: patch?.selectedExperienceIds ?? selectedIds,
        sections: patch?.sections ?? sections,
      };
      const res = await fetch('/api/profile-page', {
        method: 'PUT',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      if (!res.ok) {
        const d = await res.json() as { error?: string };
        throw new Error(d.error ?? 'Errore durante il salvataggio');
      }
      const data = await res.json() as { profile: PublicProfile };
      setProfile(data.profile);
      toast.success('Pagina profilo salvata');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Errore durante il salvataggio');
    } finally {
      setSaving(false);
    }
  }

  async function handleImproveHeadline() {
    setImprovingHeadline(true);
    try {
      const res = await fetch('/api/optimize-field', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ field: 'headline', value: headline }),
      });
      if (!res.ok) throw new Error('Errore AI');
      const data = await res.json() as { result: string };
      setHeadline(data.result);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Errore AI');
    } finally {
      setImprovingHeadline(false);
    }
  }

  async function handleImproveBio() {
    setImprovingBio(true);
    try {
      const res = await fetch('/api/optimize-field', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          field: 'bio',
          value: bio,
          context: { headline, experiences: orderedSelectedForAi() },
        }),
      });
      if (!res.ok) throw new Error('Errore AI');
      const data = await res.json() as { result: string };
      setBio(data.result);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Errore AI');
    } finally {
      setImprovingBio(false);
    }
  }

  function orderedSelectedForAi() {
    return selectedIds
      .map(id => experiences.find(e => e.id === id))
      .filter((e): e is StoredExp => !!e)
      .map(e => ({ role: e.role, company: e.company }));
  }

  function handlePhotoUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => setPhoto(ev.target?.result as string);
    reader.readAsDataURL(file);
  }

  function toggleExperience(id: string) {
    setSelectedIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  }

  function moveExperience(id: string, dir: -1 | 1) {
    setSelectedIds(prev => {
      const idx = prev.indexOf(id);
      if (idx < 0) return prev;
      const next = [...prev];
      const swapWith = idx + dir;
      if (swapWith < 0 || swapWith >= next.length) return prev;
      [next[idx], next[swapWith]] = [next[swapWith]!, next[idx]!];
      return next;
    });
  }

  async function handleAddExperience() {
    if (!newExp.company.trim() || !newExp.role.trim()) {
      toast.error('Azienda e ruolo sono obbligatori');
      return;
    }
    setAddingExp(true);
    try {
      const res = await fetch('/api/experiences', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          company: newExp.company,
          role: newExp.role,
          city: newExp.city || undefined,
          startDate: newExp.startDate || undefined,
          endDate: newExp.endDate || undefined,
        }),
      });
      if (!res.ok) throw new Error('Errore durante il salvataggio dell\'esperienza');
      const data = await res.json() as { experience: StoredExp };
      setExperiences(prev => [...prev, data.experience]);
      setSelectedIds(prev => [...prev, data.experience.id]);
      setNewExp({ company: '', role: '', city: '', startDate: '', endDate: '' });
      setShowExpForm(false);
      toast.success('Esperienza aggiunta all\'archivio');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Errore');
    } finally {
      setAddingExp(false);
    }
  }

  async function handleSaveHighlight() {
    if (!hlForm.title.trim()) {
      toast.error('Il titolo è obbligatorio');
      return;
    }
    setSavingHl(true);
    try {
      const res = await fetch('/api/highlights', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: hlForm.type,
          title: hlForm.title,
          description: hlForm.description || undefined,
          date: hlForm.date || undefined,
          link: hlForm.link || undefined,
        }),
      });
      if (!res.ok) throw new Error('Errore durante il salvataggio');
      const data = await res.json() as { highlight: StoredHighlight };
      setHighlights(prev => [...prev, data.highlight]);
      setHlForm(EMPTY_HIGHLIGHT_FORM);
      setShowHlForm(false);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Errore');
    } finally {
      setSavingHl(false);
    }
  }

  async function handleDeleteHighlight(id: string) {
    if (!confirm('Eliminare questo elemento?')) return;
    await fetch(`/api/highlights/${id}`, { method: 'DELETE', credentials: 'include' });
    setHighlights(prev => prev.filter(h => h.id !== id));
  }

  function toggleSectionVisible(key: ProfileSection['key']) {
    setSections(prev => prev.map(s => s.key === key ? { ...s, visible: !s.visible } : s));
  }

  async function handlePublish() {
    setPublishing(true);
    try {
      await persist();
      const res = await fetch('/api/profile-page/publish', { method: 'POST', credentials: 'include' });
      if (!res.ok) {
        const d = await res.json() as { error?: string };
        throw new Error(d.error ?? 'Errore durante la pubblicazione');
      }
      const data = await res.json() as { profile: PublicProfile };
      setProfile(data.profile);
      toast.success('Pagina pubblicata');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Errore durante la pubblicazione');
    } finally {
      setPublishing(false);
    }
  }

  async function handleUnpublish() {
    setPublishing(true);
    try {
      const res = await fetch('/api/profile-page/unpublish', { method: 'POST', credentials: 'include' });
      if (!res.ok) throw new Error('Errore');
      const data = await res.json() as { profile: PublicProfile };
      setProfile(data.profile);
      toast.success('Pagina rimossa dalla pubblicazione');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Errore');
    } finally {
      setPublishing(false);
    }
  }

  async function handleRegenerateSlug() {
    if (!confirm('Il link attuale smetterà di funzionare. Continuare?')) return;
    setRegenerating(true);
    try {
      const res = await fetch('/api/profile-page/regenerate-slug', { method: 'POST', credentials: 'include' });
      if (!res.ok) throw new Error('Errore');
      const data = await res.json() as { profile: PublicProfile };
      setProfile(data.profile);
      toast.success('Nuovo link generato');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Errore');
    } finally {
      setRegenerating(false);
    }
  }

  if (isLoading) {
    return (
      <div className="loading-state" style={{ minHeight: 300 }}>
        <div className="spinner" />
        <span>Caricamento…</span>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="lock-state" style={{ minHeight: '40vh' }}>
        <h2>Accedi per creare la tua pagina profilo pubblica</h2>
        <button className="btn btn-ink" onClick={login}>Accedi</button>
      </div>
    );
  }

  if (checkingPro || loading) {
    return (
      <div className="loading-state" style={{ minHeight: 300 }}>
        <div className="spinner" />
        <span>Caricamento…</span>
      </div>
    );
  }

  if (!isPro) {
    return (
      <div style={{ maxWidth: 640, margin: '60px auto', textAlign: 'center', padding: '0 24px' }}>
        <div style={{ width: 56, height: 56, borderRadius: 16, background: 'var(--tint)', color: 'var(--accent)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px' }}>
          <Icon d={IC.globe} size={26} />
        </div>
        <h2 style={{ fontFamily: 'var(--f-display)', fontSize: 26, fontWeight: 700, letterSpacing: '-0.02em', marginBottom: 10 }}>
          Pagina profilo pubblica
        </h2>
        <p style={{ color: 'var(--ink-60)', fontSize: 14.5, lineHeight: 1.6, marginBottom: 24 }}>
          Funzione riservata agli utenti Pro. Crea una pagina pubblica con tutte le tue esperienze,
          progetti e riconoscimenti — un link breve e professionale da condividere con i recruiter.
        </p>
        <button className="btn btn-ink" onClick={() => onNavigate('prezzi')}>Passa a Pro</button>
      </div>
    );
  }

  const orderedSelected = selectedIds.map(id => experiences.find(e => e.id === id)).filter((e): e is StoredExp => !!e);
  const unselected = experiences.filter(e => !selectedIds.includes(e.id));

  return (
    <div style={{ maxWidth: 760, margin: '0 auto', padding: '8px 24px 100px' }}>
      <div className="head">
        <div>
          <h1>Pagina profilo pubblica</h1>
          <p>Un link breve e condivisibile con tutte le tue esperienze — pensato per i recruiter.</p>
        </div>
      </div>

      {/* Publish status */}
      <div style={{ background: 'var(--gray50)', border: '1.5px solid var(--gray100)', borderRadius: 12, padding: '18px 20px', marginBottom: 24, display: 'flex', flexWrap: 'wrap', gap: 14, alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          {profile?.published && profile.publicUrl ? (
            <>
              <div style={{ fontSize: 12, color: 'var(--gray500)', marginBottom: 4 }}>La tua pagina è pubblica</div>
              <a href={profile.publicUrl} target="_blank" rel="noreferrer" style={{ fontWeight: 700, color: 'var(--accent)' }}>{profile.publicUrl}</a>
            </>
          ) : (
            <div style={{ fontSize: 13.5, color: 'var(--gray500)' }}>La tua pagina non è ancora pubblica.</div>
          )}
        </div>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          {profile?.published ? (
            <>
              <button className="btn btn-line btn-sm" disabled={regenerating} onClick={() => void handleRegenerateSlug()}>
                {regenerating ? '…' : 'Rigenera link'}
              </button>
              <button className="btn btn-line btn-sm" disabled={publishing} onClick={() => void handleUnpublish()}>
                {publishing ? '…' : 'Annulla pubblicazione'}
              </button>
            </>
          ) : (
            <button className="btn btn-ink btn-sm" disabled={publishing} onClick={() => void handlePublish()}>
              {publishing ? 'Pubblicazione…' : 'Pubblica'}
            </button>
          )}
        </div>
      </div>

      {/* Photo + headline + bio */}
      <div style={{ background: '#fff', border: '1.5px solid var(--gray100)', borderRadius: 12, padding: 20, marginBottom: 20 }}>
        <h3 style={{ fontSize: 15.5, fontWeight: 700, marginTop: 0, marginBottom: 16 }}>Foto e presentazione</h3>
        <div style={{ display: 'flex', gap: 16, alignItems: 'center', marginBottom: 16 }}>
          {photo ? (
            <img src={photo} alt="" style={{ width: 72, height: 72, borderRadius: '50%', objectFit: 'cover' }} />
          ) : (
            <div style={{ width: 72, height: 72, borderRadius: '50%', background: 'var(--gray100)' }} />
          )}
          <label className="btn btn-line btn-sm" style={{ cursor: 'pointer' }}>
            Carica foto
            <input type="file" accept="image/*" onChange={handlePhotoUpload} style={{ display: 'none' }} />
          </label>
        </div>
        <div className="form-group">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <label style={{ marginBottom: 0 }}>Titolo professionale</label>
            <button type="button" className="ai-btn" style={{ padding: '2px 8px', fontSize: 11 }} disabled={improvingHeadline} onClick={() => void handleImproveHeadline()}>
              {improvingHeadline ? '…' : 'Migliora con AI'}
            </button>
          </div>
          <input type="text" placeholder="Es. Senior Product Designer" value={headline} onChange={e => setHeadline(e.target.value)} />
        </div>
        <div className="form-group" style={{ marginBottom: 0 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <label style={{ marginBottom: 0 }}>Bio</label>
            <button type="button" className="ai-btn" style={{ padding: '2px 8px', fontSize: 11 }} disabled={improvingBio} onClick={() => void handleImproveBio()}>
              {improvingBio ? '…' : 'Migliora con AI'}
            </button>
          </div>
          <textarea rows={3} placeholder="Racconta in breve chi sei e cosa fai." value={bio} onChange={e => setBio(e.target.value)} />
        </div>
      </div>

      {/* Experience picker */}
      <div style={{ background: '#fff', border: '1.5px solid var(--gray100)', borderRadius: 12, padding: 20, marginBottom: 20 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
          <h3 style={{ fontSize: 15.5, fontWeight: 700, margin: 0 }}>Esperienze da mostrare</h3>
          <button className="btn btn-line btn-sm" onClick={() => setShowExpForm(v => !v)}>+ Nuova esperienza</button>
        </div>

        {showExpForm && (
          <div style={{ background: 'var(--gray50)', borderRadius: 10, padding: 16, marginBottom: 16 }}>
            <div className="form-row">
              <div className="form-group">
                <label>Azienda</label>
                <input type="text" value={newExp.company} onChange={e => setNewExp(f => ({ ...f, company: e.target.value }))} />
              </div>
              <div className="form-group">
                <label>Ruolo</label>
                <input type="text" value={newExp.role} onChange={e => setNewExp(f => ({ ...f, role: e.target.value }))} />
              </div>
            </div>
            <div className="form-row">
              <div className="form-group">
                <label>Città</label>
                <input type="text" value={newExp.city} onChange={e => setNewExp(f => ({ ...f, city: e.target.value }))} />
              </div>
              <div className="form-group">
                <label>Periodo</label>
                <input type="text" placeholder="es. Mar 2020 - Presente" value={newExp.startDate} onChange={e => setNewExp(f => ({ ...f, startDate: e.target.value }))} />
              </div>
            </div>
            <button className="btn btn-gold btn-sm" disabled={addingExp} onClick={() => void handleAddExperience()}>
              {addingExp ? 'Salvataggio…' : 'Salva esperienza'}
            </button>
          </div>
        )}

        {orderedSelected.length > 0 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: unselected.length ? 16 : 0 }}>
            {orderedSelected.map((exp, i) => (
              <div key={exp.id} style={{ display: 'flex', alignItems: 'center', gap: 10, border: '1.5px solid var(--gray100)', borderRadius: 10, padding: '10px 14px' }}>
                <input type="checkbox" checked onChange={() => toggleExperience(exp.id)} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <b style={{ fontSize: 13.5 }}>{exp.role}</b> <span style={{ color: 'var(--gray500)', fontSize: 12.5 }}>@ {exp.company}</span>
                </div>
                <button className="btn btn-ghost btn-sm" disabled={i === 0} onClick={() => moveExperience(exp.id, -1)} aria-label="Sposta su">↑</button>
                <button className="btn btn-ghost btn-sm" disabled={i === orderedSelected.length - 1} onClick={() => moveExperience(exp.id, 1)} aria-label="Sposta giù">↓</button>
              </div>
            ))}
          </div>
        )}

        {unselected.length > 0 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {unselected.map(exp => (
              <label key={exp.id} style={{ display: 'flex', alignItems: 'center', gap: 10, border: '1.5px dashed var(--gray100)', borderRadius: 10, padding: '10px 14px', cursor: 'pointer' }}>
                <input type="checkbox" checked={false} onChange={() => toggleExperience(exp.id)} />
                <div style={{ flex: 1, minWidth: 0, color: 'var(--gray500)' }}>
                  <b style={{ fontSize: 13.5, color: 'var(--navy)' }}>{exp.role}</b> <span style={{ fontSize: 12.5 }}>@ {exp.company}</span>
                </div>
              </label>
            ))}
          </div>
        )}

        {experiences.length === 0 && !showExpForm && (
          <p style={{ color: 'var(--gray500)', fontSize: 13.5 }}>Nessuna esperienza nel tuo archivio ancora.</p>
        )}
      </div>

      {/* Highlights */}
      <div style={{ background: '#fff', border: '1.5px solid var(--gray100)', borderRadius: 12, padding: 20, marginBottom: 20 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
          <h3 style={{ fontSize: 15.5, fontWeight: 700, margin: 0 }}>In evidenza — volontariato, progetti, riconoscimenti</h3>
          <button className="btn btn-line btn-sm" onClick={() => setShowHlForm(v => !v)}>+ Aggiungi</button>
        </div>

        {showHlForm && (
          <div style={{ background: 'var(--gray50)', borderRadius: 10, padding: 16, marginBottom: 16 }}>
            <div className="form-row">
              <div className="form-group">
                <label>Tipo</label>
                <select value={hlForm.type} onChange={e => setHlForm(f => ({ ...f, type: e.target.value as StoredHighlight['type'] }))}>
                  {Object.entries(HIGHLIGHT_TYPE_LABELS).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label>Titolo</label>
                <input type="text" value={hlForm.title} onChange={e => setHlForm(f => ({ ...f, title: e.target.value }))} />
              </div>
            </div>
            <div className="form-row">
              <div className="form-group">
                <label>Data</label>
                <input type="text" placeholder="es. 2023" value={hlForm.date} onChange={e => setHlForm(f => ({ ...f, date: e.target.value }))} />
              </div>
              <div className="form-group">
                <label>Link (opzionale)</label>
                <input type="text" value={hlForm.link} onChange={e => setHlForm(f => ({ ...f, link: e.target.value }))} />
              </div>
            </div>
            <div className="form-group">
              <label>Descrizione</label>
              <textarea rows={2} value={hlForm.description} onChange={e => setHlForm(f => ({ ...f, description: e.target.value }))} />
            </div>
            <button className="btn btn-gold btn-sm" disabled={savingHl} onClick={() => void handleSaveHighlight()}>
              {savingHl ? 'Salvataggio…' : 'Salva'}
            </button>
          </div>
        )}

        {highlights.length === 0 ? (
          <p style={{ color: 'var(--gray500)', fontSize: 13.5 }}>Ancora nessun elemento.</p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {highlights.map(h => (
              <div key={h.id} style={{ display: 'flex', alignItems: 'center', gap: 12, border: '1.5px solid var(--gray100)', borderRadius: 10, padding: '10px 14px' }}>
                <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--gold)', textTransform: 'uppercase' }}>{HIGHLIGHT_TYPE_LABELS[h.type]}</span>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <b style={{ fontSize: 13.5 }}>{h.title}</b>
                </div>
                <button className="btn btn-danger btn-sm" onClick={() => void handleDeleteHighlight(h.id)}>
                  <Icon d={IC.trash} size={13} />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Section visibility */}
      <div style={{ background: '#fff', border: '1.5px solid var(--gray100)', borderRadius: 12, padding: 20, marginBottom: 28 }}>
        <h3 style={{ fontSize: 15.5, fontWeight: 700, marginTop: 0, marginBottom: 12 }}>Sezioni visibili</h3>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}>
          {sections.map(s => (
            <label key={s.key} style={{ display: 'flex', alignItems: 'center', gap: 7, fontSize: 13, cursor: 'pointer' }}>
              <input type="checkbox" checked={s.visible} onChange={() => toggleSectionVisible(s.key)} />
              {SECTION_LABELS[s.key]}
            </label>
          ))}
        </div>
      </div>

      <button className="btn btn-ink" disabled={saving} onClick={() => void persist()}>
        {saving ? 'Salvataggio…' : 'Salva modifiche'}
      </button>
    </div>
  );
}
