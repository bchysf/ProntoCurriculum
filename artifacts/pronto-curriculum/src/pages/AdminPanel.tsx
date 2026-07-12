import { useState, useEffect, useCallback } from 'react';
import type { Page } from '../types';
import { useAuth } from '../hooks/use-auth';
import { ADMIN_EMAIL } from '../components/WorkspaceShell';

interface AdminPanelProps {
  onNavigate: (page: Page) => void;
}

interface AdminUserRow {
  id: string;
  name: string;
  email: string;
  plan: string;
  cvCountThisPeriod: number;
  createdAt: string;
}

interface RateLimiterLiveStats {
  uptimeSeconds: number;
  blockedSinceBoot: number;
  limiters: Array<{
    prefix: string;
    label: string;
    windowMinutes: number;
    maxRequests: number;
    requestsSinceBoot: number;
    activeClients: number;
    requestsInCurrentWindows: number;
    topClients: Array<{ id: string; count: number; resetInSeconds: number }>;
  }>;
}

interface AdminStats {
  platform: {
    totalUsers: number;
    totalCvs: number;
    totalTailoredCvs: number;
    totalExperiences: number;
    activeProSubscriptions: number;
    newUsersLast30Days: number;
    conversionRate: string;
  };
  systemHealth: Record<string, string>;
  rateLimiter: RateLimiterLiveStats;
  recentUsers: AdminUserRow[];
}

const HEALTH_LABELS: Record<string, string> = {
  database: 'Database PostgreSQL',
  aiPrimary: 'AI primaria (Groq)',
  aiFallback: 'AI fallback (Gemini)',
  emailService: 'Email (Resend)',
  billing: 'Pagamenti (Stripe)',
};

function healthOk(value: string): boolean {
  return value.startsWith('ONLINE') || value.startsWith('CONFIGURATA');
}

function formatUptime(seconds: number): string {
  const d = Math.floor(seconds / 86400);
  const h = Math.floor((seconds % 86400) / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  if (d > 0) return `${d}g ${h}h ${m}m`;
  if (h > 0) return `${h}h ${m}m`;
  return `${m}m ${seconds % 60}s`;
}

export default function AdminPanel({ onNavigate }: AdminPanelProps) {
  const { user, isLoading: authLoading } = useAuth();
  const [activeTab, setActiveTab] = useState<'metrics' | 'users' | 'email-tester' | 'security'>('metrics');
  const [selectedEmailType, setSelectedEmailType] = useState<'welcome' | 'cv-ready' | 'abandoned'>('welcome');
  const [testEmailAddress, setTestEmailAddress] = useState<string>('');
  const [emailSendStatus, setEmailSendStatus] = useState<{ ok: boolean; message: string } | null>(null);
  const [emailSending, setEmailSending] = useState(false);
  const [grantingId, setGrantingId] = useState<string | null>(null);

  const [loading, setLoading] = useState<boolean>(true);
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [error, setError] = useState<string | null>(null);

  const fetchStats = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/admin/stats', { credentials: 'include' });
      if (!res.ok) {
        const body = await res.json().catch(() => ({})) as { error?: string };
        throw new Error(body.error ?? `Il server ha risposto ${res.status}.`);
      }
      setStats(await res.json() as AdminStats);
    } catch (err: unknown) {
      setStats(null);
      setError(err instanceof Error ? err.message : 'Errore di rete durante il recupero delle statistiche.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void fetchStats();
  }, [fetchStats]);

  const handleGrantPro = async (id: string) => {
    setGrantingId(id);
    try {
      const res = await fetch(`/api/admin/user/${id}/grant-pro`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ days: 30, plan: 'monthly' }),
      });
      const body = await res.json().catch(() => ({})) as { error?: string; message?: string };
      if (!res.ok) {
        alert(body.error ?? `Errore ${res.status} durante l'aggiornamento dell'utente.`);
        return;
      }
      await fetchStats();
    } catch {
      alert('Errore di rete: impossibile contattare il server.');
    } finally {
      setGrantingId(null);
    }
  };

  const handleTestEmailSend = async () => {
    if (!testEmailAddress.trim()) {
      setEmailSendStatus({ ok: false, message: 'Inserisci un indirizzo email di destinazione.' });
      return;
    }
    setEmailSending(true);
    setEmailSendStatus(null);
    try {
      const res = await fetch(`/api/email/${selectedEmailType}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          email: testEmailAddress,
          name: 'Test Admin',
          cvTitle: 'CV di prova',
          atsScore: 92,
        }),
      });
      const body = await res.json().catch(() => ({})) as { error?: string };
      if (res.ok) {
        setEmailSendStatus({ ok: true, message: `Richiesta accettata dal server per ${testEmailAddress}. Controlla la casella (o i log se Resend non è configurato).` });
      } else {
        setEmailSendStatus({ ok: false, message: body.error ?? `Il server ha risposto ${res.status} — invio non riuscito.` });
      }
    } catch {
      setEmailSendStatus({ ok: false, message: 'Errore di rete: il server non è raggiungibile.' });
    } finally {
      setEmailSending(false);
    }
  };

  if (!authLoading && user?.email?.toLowerCase() !== ADMIN_EMAIL) {
    return (
      <div className="lock-state" style={{ minHeight: '50vh' }}>
        <h2>Area riservata</h2>
        <p style={{ color: 'var(--ink-60)', fontSize: 14.5 }}>
          Questa sezione è accessibile solo all'amministratore del sito.
        </p>
        <button className="btn btn-ink" onClick={() => onNavigate('dashboard')}>Vai alla Dashboard</button>
      </div>
    );
  }

  const platformCards: Array<[string, string | number, string]> = stats ? [
    ['Utenti registrati', stats.platform.totalUsers, 'Righe reali in tabella utenti'],
    ['CV creati', stats.platform.totalCvs, 'CV salvati nel database'],
    ['CV su misura', stats.platform.totalTailoredCvs, 'Generati dall\'AI per un\'offerta'],
    ['Esperienze in archivio', stats.platform.totalExperiences, 'Esperienze salvate dagli utenti'],
    ['Abbonamenti Pro attivi', stats.platform.activeProSubscriptions, 'Piani a pagamento non scaduti'],
    ['Nuovi utenti (30gg)', stats.platform.newUsersLast30Days, 'Registrati negli ultimi 30 giorni'],
    ['Attivazione', stats.platform.conversionRate, 'Utenti con almeno 1 CV creato'],
  ] : [];

  return (
    <div style={{ maxWidth: 1140, margin: '0 auto', padding: '8px 24px 80px' }}>
      {/* Header */}
      <div className="head">
        <div>
          <h1>Pannello Admin</h1>
          <p>
            Metriche reali dal database, stato della configurazione e monitor live del rate limiter.
          </p>
        </div>
        <button className="btn btn-line btn-sm" onClick={() => void fetchStats()} disabled={loading}>
          {loading ? 'Aggiornamento…' : 'Aggiorna dati'}
        </button>
      </div>

      {error && (
        <div style={{ background: '#FFF3F3', border: '1px solid #FFCECE', color: 'var(--danger, #EF4444)', padding: '12px 16px', borderRadius: 10, fontSize: 13, marginBottom: 24, display: 'flex', alignItems: 'center', gap: 12 }}>
          <span style={{ flex: 1 }}>{error}</span>
          <button className="btn btn-line btn-sm" onClick={() => void fetchStats()}>Riprova</button>
        </div>
      )}

      {/* Tabs Navigation */}
      <div style={{ display: 'flex', gap: 6, borderBottom: '1px solid var(--border-soft)', marginBottom: 32, flexWrap: 'wrap' }}>
        {[
          { id: 'metrics', label: 'Metriche & Database' },
          { id: 'users', label: 'Utenti & Abbonamenti' },
          { id: 'security', label: 'Rate Limiter live' },
          { id: 'email-tester', label: 'Test Email' },
        ].map((t) => (
          <button
            key={t.id}
            onClick={() => setActiveTab(t.id as typeof activeTab)}
            style={{
              background: 'transparent',
              color: activeTab === t.id ? 'var(--gold)' : 'var(--gray500)',
              border: 'none',
              borderBottom: activeTab === t.id ? '2px solid var(--gold)' : '2px solid transparent',
              marginBottom: -1,
              padding: '10px 16px',
              fontWeight: 700,
              fontSize: 13.5,
              cursor: 'pointer',
              transition: 'all 0.15s',
            }}
          >
            {t.label}
          </button>
        ))}
      </div>

      {loading && !stats ? (
        <div className="loading-state" style={{ minHeight: '30vh' }}>
          <div className="spinner" />
          <span>Interrogazione del database in corso…</span>
        </div>
      ) : stats ? (
        <>
          {/* TAB 1: METRICS */}
          {activeTab === 'metrics' && (
            <div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))', gap: 14, marginBottom: 32 }}>
                {platformCards.map(([label, value, sub]) => (
                  <div key={label} className="stat" style={{ cursor: 'default' }}>
                    <span className="mono">{label}</span>
                    <div className="stat-num">{typeof value === 'number' ? value.toLocaleString('it-IT') : value}</div>
                    <div className="stat-sub">{sub}</div>
                  </div>
                ))}
              </div>

              <div className="panel" style={{ padding: 24 }}>
                <h3 style={{ fontSize: 16, marginBottom: 4 }}>Stato configurazione servizi</h3>
                <p className="psub" style={{ marginBottom: 16 }}>
                  Il database è verificato con una query reale (latenza misurata); gli altri indicano se la chiave API è presente sul server.
                </p>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 12 }}>
                  {Object.entries(stats.systemHealth).map(([key, value]) => {
                    const ok = healthOk(value);
                    return (
                      <div key={key} style={{ background: 'var(--gray50)', padding: '14px 16px', borderRadius: 10, border: '1px solid var(--border-soft)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10 }}>
                        <div style={{ minWidth: 0 }}>
                          <div style={{ fontWeight: 700, fontSize: 13.5, color: 'var(--navy)' }}>
                            {HEALTH_LABELS[key] ?? key}
                          </div>
                          <div style={{ fontSize: 12, color: 'var(--gray500)' }}>{value}</div>
                        </div>
                        <span style={{
                          background: ok ? '#DCFCE7' : '#FFF3F3',
                          color: ok ? '#166534' : '#B91C1C',
                          fontWeight: 700, fontSize: 10.5, padding: '3px 9px', borderRadius: 20, flexShrink: 0,
                        }}>
                          {ok ? 'OK' : 'ASSENTE'}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: USER MANAGEMENT */}
          {activeTab === 'users' && (
            <div className="panel" style={{ padding: 24 }}>
              <h3 style={{ fontSize: 16, marginBottom: 4 }}>Ultimi 20 utenti registrati</h3>
              <p className="psub" style={{ marginBottom: 20 }}>
                Dati letti dal database a ogni aggiornamento. "Regala 30gg Pro" scrive davvero sull'abbonamento dell'utente.
              </p>

              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: 13.5 }}>
                  <thead>
                    <tr style={{ borderBottom: '1px solid var(--border-soft)' }}>
                      <th className="mono" style={{ padding: '10px 12px' }}>Utente</th>
                      <th className="mono" style={{ padding: '10px 12px' }}>Piano</th>
                      <th className="mono" style={{ padding: '10px 12px' }}>CV nel periodo</th>
                      <th className="mono" style={{ padding: '10px 12px' }}>Registrato il</th>
                      <th className="mono" style={{ padding: '10px 12px', textAlign: 'right' }}>Azioni</th>
                    </tr>
                  </thead>
                  <tbody>
                    {stats.recentUsers.length === 0 && (
                      <tr><td colSpan={5} style={{ padding: 24, textAlign: 'center', color: 'var(--gray500)' }}>Nessun utente registrato.</td></tr>
                    )}
                    {stats.recentUsers.map((u) => (
                      <tr key={u.id} style={{ borderBottom: '1px solid var(--border-soft)' }}>
                        <td style={{ padding: '12px' }}>
                          <div style={{ fontWeight: 700, color: 'var(--navy)' }}>{u.name}</div>
                          <div style={{ fontSize: 12, color: 'var(--gray500)' }}>{u.email}</div>
                        </td>
                        <td style={{ padding: '12px' }}>
                          <span style={{
                            background: u.plan === 'free' ? '#F4F4F8' : 'var(--tint, #EEEDFC)',
                            color: u.plan === 'free' ? 'var(--gray500)' : 'var(--gold)',
                            padding: '3px 10px', borderRadius: 20, fontSize: 11.5, fontWeight: 700, textTransform: 'uppercase',
                          }}>
                            {u.plan === 'monthly' ? 'Pro mensile' : u.plan === 'annual' ? 'Pro annuale' : 'Free'}
                          </span>
                        </td>
                        <td style={{ padding: '12px', fontWeight: 600, color: 'var(--navy)' }}>
                          {u.cvCountThisPeriod}
                        </td>
                        <td style={{ padding: '12px', color: 'var(--gray500)', fontSize: 12.5 }}>
                          {new Date(u.createdAt).toLocaleDateString('it-IT')}
                        </td>
                        <td style={{ padding: '12px', textAlign: 'right' }}>
                          {u.plan === 'free' ? (
                            <button
                              className="btn btn-ink btn-sm"
                              onClick={() => void handleGrantPro(u.id)}
                              disabled={grantingId === u.id}
                            >
                              {grantingId === u.id ? 'Attivazione…' : 'Regala 30gg Pro'}
                            </button>
                          ) : (
                            <span style={{ fontSize: 12, color: '#12805C', fontWeight: 600 }}>✓ Pro attivo</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB 3: RATE LIMITER — live snapshot from the server's in-memory store */}
          {activeTab === 'security' && (
            <div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))', gap: 14, marginBottom: 24 }}>
                <div className="stat" style={{ cursor: 'default' }}>
                  <span className="mono">Uptime server</span>
                  <div className="stat-num">{formatUptime(stats.rateLimiter.uptimeSeconds)}</div>
                  <div className="stat-sub">Dall'ultimo riavvio del backend</div>
                </div>
                <div className="stat" style={{ cursor: 'default' }}>
                  <span className="mono">Richieste bloccate</span>
                  <div className="stat-num" style={{ color: stats.rateLimiter.blockedSinceBoot > 0 ? 'var(--danger, #EF4444)' : undefined }}>
                    {stats.rateLimiter.blockedSinceBoot}
                  </div>
                  <div className="stat-sub">429 restituiti dal riavvio</div>
                </div>
                <div className="stat" style={{ cursor: 'default' }}>
                  <span className="mono">Richieste totali</span>
                  <div className="stat-num">
                    {stats.rateLimiter.limiters.reduce((s, l) => s + l.requestsSinceBoot, 0).toLocaleString('it-IT')}
                  </div>
                  <div className="stat-sub">Contate dal limiter dal riavvio</div>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 14 }}>
                {stats.rateLimiter.limiters.map(l => (
                  <div key={l.prefix} className="panel" style={{ margin: 0, padding: 20 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 4 }}>
                      <h3 style={{ fontSize: 15 }}>{l.label}</h3>
                      <span className="mono">{l.maxRequests} req / {l.windowMinutes} min</span>
                    </div>
                    <p className="psub" style={{ marginBottom: 14 }}>
                      Prefisso <code>{l.prefix}</code> · per utente autenticato o IP
                    </p>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8, marginBottom: 12 }}>
                      <div>
                        <div style={{ fontFamily: 'var(--f-display)', fontWeight: 700, fontSize: 20 }}>{l.requestsSinceBoot.toLocaleString('it-IT')}</div>
                        <div className="mono" style={{ fontSize: 9.5 }}>dal riavvio</div>
                      </div>
                      <div>
                        <div style={{ fontFamily: 'var(--f-display)', fontWeight: 700, fontSize: 20 }}>{l.activeClients}</div>
                        <div className="mono" style={{ fontSize: 9.5 }}>client attivi</div>
                      </div>
                      <div>
                        <div style={{ fontFamily: 'var(--f-display)', fontWeight: 700, fontSize: 20 }}>{l.requestsInCurrentWindows}</div>
                        <div className="mono" style={{ fontSize: 9.5 }}>nella finestra</div>
                      </div>
                    </div>
                    {l.topClients.length > 0 ? (
                      <div style={{ borderTop: '1px solid var(--border-soft)', paddingTop: 10 }}>
                        <div className="mono" style={{ marginBottom: 6 }}>Top consumatori (finestra corrente)</div>
                        {l.topClients.map(c => (
                          <div key={c.id} style={{ display: 'flex', justifyContent: 'space-between', gap: 10, fontSize: 12, padding: '3px 0', color: 'var(--gray500)' }}>
                            <code style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '65%' }}>{c.id}</code>
                            <span style={{ fontWeight: 700, color: c.count >= l.maxRequests ? 'var(--danger, #EF4444)' : 'var(--navy)' }}>
                              {c.count}/{l.maxRequests} · reset {c.resetInSeconds}s
                            </span>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div style={{ fontSize: 12, color: 'var(--gray400)', borderTop: '1px solid var(--border-soft)', paddingTop: 10 }}>
                        Nessuna finestra attiva in questo momento.
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 4: EMAIL TESTER */}
          {activeTab === 'email-tester' && (
            <div className="panel" style={{ padding: 24, maxWidth: 560 }}>
              <h3 style={{ fontSize: 16, marginBottom: 4 }}>Invio email di test</h3>
              <p className="psub" style={{ marginBottom: 18 }}>
                Esegue una chiamata reale a <code>/api/email/*</code>. Se Resend non è configurato il server lo segnala.
              </p>

              <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: 'var(--ink)', marginBottom: 4 }}>
                Modello
              </label>
              <select
                value={selectedEmailType}
                onChange={(e) => setSelectedEmailType(e.target.value as typeof selectedEmailType)}
                style={{ width: '100%', padding: '9px 12px', borderRadius: 8, border: '1px solid var(--gray300)', fontSize: 13.5, marginBottom: 14, background: '#fff' }}
              >
                <option value="welcome">Benvenuto (iscrizione)</option>
                <option value="cv-ready">CV pronto (punteggio ATS)</option>
                <option value="abandoned">Promemoria CV abbandonato</option>
              </select>

              <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: 'var(--ink)', marginBottom: 4 }}>
                Destinatario
              </label>
              <input
                type="email"
                value={testEmailAddress}
                onChange={(e) => setTestEmailAddress(e.target.value)}
                placeholder="indirizzo@esempio.it"
                style={{ width: '100%', padding: '9px 12px', borderRadius: 8, border: '1px solid var(--gray300)', fontSize: 13.5, marginBottom: 16 }}
              />

              <button
                className="btn btn-ink"
                style={{ width: '100%', justifyContent: 'center' }}
                onClick={() => void handleTestEmailSend()}
                disabled={emailSending}
              >
                {emailSending ? 'Invio in corso…' : 'Invia email di test'}
              </button>

              {emailSendStatus && (
                <div style={{
                  marginTop: 14, padding: '10px 14px', borderRadius: 8, fontSize: 13, fontWeight: 600,
                  background: emailSendStatus.ok ? '#DCFCE7' : '#FFF3F3',
                  border: `1px solid ${emailSendStatus.ok ? '#BBF7D0' : '#FFCECE'}`,
                  color: emailSendStatus.ok ? '#166534' : '#B91C1C',
                }}>
                  {emailSendStatus.message}
                </div>
              )}
            </div>
          )}
        </>
      ) : null}
    </div>
  );
}
