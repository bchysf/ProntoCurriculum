import { useState, useEffect, useCallback } from 'react';
import { Page, CVData, SavedTailoredCv } from '../types';
import { useAuth } from '../hooks/use-firebase-auth';

interface CandidatureProps {
  onNavigate: (page: Page) => void;
  onCVLoaded: (data: CVData) => void;
  onLogin: () => void;
}

export default function Candidature({ onNavigate, onCVLoaded, onLogin }: CandidatureProps) {
  const { isAuthenticated, isLoading } = useAuth();
  const [cvs, setCvs] = useState<SavedTailoredCv[]>([]);
  const [fetching, setFetching] = useState(false);
  const [fetchError, setFetchError] = useState('');
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const fetchCvs = useCallback(async () => {
    setFetching(true);
    setFetchError('');
    try {
      const res = await fetch('/api/tailored-cvs', { credentials: 'include' });
      const data = await res.json() as { tailoredCvs?: SavedTailoredCv[]; error?: string };
      if (!res.ok) {
        setFetchError(data.error ?? 'Errore nel caricamento delle candidature.');
        return;
      }
      setCvs(data.tailoredCvs ?? []);
    } catch {
      setFetchError('Errore di rete. Controlla la connessione e riprova.');
    } finally {
      setFetching(false);
    }
  }, []);

  useEffect(() => {
    if (isAuthenticated) {
      void fetchCvs();
    }
  }, [isAuthenticated, fetchCvs]);

  const handleEdit = (cv: SavedTailoredCv) => {
    onCVLoaded(cv.cvData);
    onNavigate('builder-step2');
  };

  const handleDelete = async (id: string) => {
    setDeletingId(id);
    try {
      const res = await fetch(`/api/tailored-cvs/${id}`, {
        method: 'DELETE',
        credentials: 'include',
      });
      if (res.ok) {
        setCvs(prev => prev.filter(c => c.id !== id));
      } else {
        const data = await res.json() as { error?: string };
        alert(data.error ?? 'Errore durante l\'eliminazione.');
      }
    } catch {
      alert('Errore di rete.');
    } finally {
      setDeletingId(null);
    }
  };

  const formatDate = (iso: string) => {
    try {
      return new Date(iso).toLocaleDateString('it-IT', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
      });
    } catch {
      return iso;
    }
  };

  return (
    <div style={{ maxWidth: 760, margin: '0 auto', padding: '48px 24px' }}>

      {/* Header */}
      <div style={{ marginBottom: 40, textAlign: 'center' }}>
        <button
          className="btn btn-ghost btn-sm"
          style={{ marginBottom: 24, fontSize: 13 }}
          onClick={() => onNavigate('home')}
        >
          ← Torna alla home
        </button>
        <div style={{ fontSize: 40, marginBottom: 12 }}>📋</div>
        <h1 style={{ fontFamily: 'Playfair Display, serif', fontSize: 32, fontWeight: 700, color: 'var(--navy)', marginBottom: 12 }}>
          Le mie candidature
        </h1>
        <p style={{ color: 'var(--gray500)', fontSize: 16, maxWidth: 520, margin: '0 auto', lineHeight: 1.6 }}>
          I tuoi CV su misura generati con l'AI, pronti da modificare e scaricare.
          Vengono conservati gli ultimi 10.
        </p>
      </div>

      {/* Auth gate */}
      {!isLoading && !isAuthenticated ? (
        <div style={{
          background: 'var(--surface)',
          border: '1px solid var(--border)',
          borderRadius: 16,
          padding: 40,
          textAlign: 'center',
        }}>
          <div style={{ fontSize: 32, marginBottom: 16 }}>🔐</div>
          <h2 style={{ fontFamily: 'Playfair Display, serif', fontSize: 22, fontWeight: 700, color: 'var(--navy)', marginBottom: 8 }}>
            Accedi per vedere le tue candidature
          </h2>
          <p style={{ color: 'var(--gray500)', fontSize: 14, marginBottom: 24, lineHeight: 1.6 }}>
            Le candidature sono salvate nel tuo profilo personale.
          </p>
          <button className="btn btn-gold" style={{ fontSize: 15, padding: '12px 32px' }} onClick={onLogin}>
            Accedi con Replit
          </button>
        </div>
      ) : fetching ? (
        <div style={{ textAlign: 'center', padding: '60px 0', color: 'var(--gray500)' }}>
          <div className="ai-pulse-ring" style={{ margin: '0 auto 20px' }} />
          <div style={{ fontSize: 14 }}>Caricamento candidature...</div>
        </div>
      ) : fetchError ? (
        <div style={{
          padding: '16px 20px',
          background: 'rgba(220,53,69,0.08)',
          border: '1px solid rgba(220,53,69,0.2)',
          borderRadius: 10,
          color: 'var(--danger)',
          fontSize: 14,
          textAlign: 'center',
        }}>
          ⚠️ {fetchError}
          <button
            className="btn btn-ghost btn-sm"
            style={{ marginLeft: 12, fontSize: 13 }}
            onClick={() => void fetchCvs()}
          >
            Riprova
          </button>
        </div>
      ) : cvs.length === 0 ? (
        <div style={{
          background: 'var(--surface)',
          border: '1px solid var(--border)',
          borderRadius: 16,
          padding: 56,
          textAlign: 'center',
        }}>
          <div style={{ fontSize: 48, marginBottom: 16 }}>📭</div>
          <h2 style={{ fontFamily: 'Playfair Display, serif', fontSize: 22, fontWeight: 700, color: 'var(--navy)', marginBottom: 8 }}>
            Nessuna candidatura ancora
          </h2>
          <p style={{ color: 'var(--gray500)', fontSize: 14, marginBottom: 28, lineHeight: 1.7 }}>
            Genera il tuo primo CV su misura partendo dall'offerta di lavoro che ti interessa.<br />
            Verrà salvato automaticamente qui.
          </p>
          <button
            className="btn btn-gold"
            style={{ fontSize: 15, padding: '12px 32px' }}
            onClick={() => onNavigate('tailor')}
          >
            ✦ Genera CV su misura
          </button>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {cvs.map((cv) => (
            <div
              key={cv.id}
              style={{
                background: 'var(--surface)',
                border: '1px solid var(--border)',
                borderRadius: 14,
                padding: '20px 24px',
                display: 'flex',
                alignItems: 'center',
                gap: 16,
                transition: 'box-shadow 0.2s',
              }}
              onMouseEnter={e => { (e.currentTarget as HTMLDivElement).style.boxShadow = '0 4px 16px rgba(var(--navy-rgb),0.08)'; }}
              onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.boxShadow = 'none'; }}
            >
              {/* Icon */}
              <div style={{
                width: 44,
                height: 44,
                borderRadius: 10,
                background: 'linear-gradient(135deg, var(--navy), var(--gold))',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 20,
                flexShrink: 0,
              }}>
                ✦
              </div>

              {/* Info */}
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{
                  fontWeight: 700,
                  fontSize: 15,
                  color: 'var(--navy)',
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                }}>
                  {cv.jobTitle || 'CV su misura'}
                </div>
                <div style={{ fontSize: 12, color: 'var(--gray500)', marginTop: 3 }}>
                  Generato il {formatDate(cv.createdAt)}
                </div>
              </div>

              {/* Actions */}
              <div style={{ display: 'flex', gap: 8, flexShrink: 0 }}>
                <button
                  className="btn btn-gold btn-sm"
                  style={{ fontSize: 13, padding: '7px 16px' }}
                  onClick={() => handleEdit(cv)}
                >
                  ✏️ Modifica
                </button>
                <button
                  className="btn btn-ghost btn-sm"
                  style={{
                    fontSize: 13,
                    padding: '7px 14px',
                    color: 'var(--danger)',
                    opacity: deletingId === cv.id ? 0.5 : 1,
                  }}
                  disabled={deletingId === cv.id}
                  onClick={() => void handleDelete(cv.id)}
                >
                  {deletingId === cv.id ? '...' : '🗑️ Elimina'}
                </button>
              </div>
            </div>
          ))}

          {/* Footer hint */}
          <div style={{
            marginTop: 8,
            padding: '12px 16px',
            background: 'var(--surface)',
            border: '1px solid var(--border)',
            borderRadius: 8,
            fontSize: 12,
            color: 'var(--gray500)',
            lineHeight: 1.6,
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            gap: 12,
          }}>
            <span>
              💡 {cvs.length}/10 candidature salvate. Ogni nuovo CV generato sostituisce il più vecchio quando si raggiunge il limite.
            </span>
            <button
              className="btn btn-gold btn-sm"
              style={{ fontSize: 13, whiteSpace: 'nowrap' }}
              onClick={() => onNavigate('tailor')}
            >
              + Nuova
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
