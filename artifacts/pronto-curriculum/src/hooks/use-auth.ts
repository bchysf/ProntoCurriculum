import { createContext, useContext, useState, useEffect, useCallback, useRef, type ReactNode } from 'react';
import { createElement } from 'react';
import type { Session } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';

export interface AuthUser {
  id: string;
  email: string | null;
  firstName: string | null;
  lastName: string | null;
  profileImageUrl: string | null;
}

interface AuthState {
  user: AuthUser | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: () => void;
  loginWithEmail: (email: string, password: string) => Promise<string | null>;
  signUpWithEmail: (email: string, password: string) => Promise<string | null>;
  logout: () => void;
}

function userFromSession(session: Session): AuthUser {
  const metadata = session.user.user_metadata as { full_name?: string; name?: string; avatar_url?: string; picture?: string };
  const nameParts = (metadata.full_name ?? metadata.name ?? '').split(' ');
  return {
    id: session.user.id,
    email: session.user.email ?? null,
    firstName: nameParts[0] || null,
    lastName: nameParts.slice(1).join(' ') || null,
    profileImageUrl: metadata.avatar_url ?? metadata.picture ?? null,
  };
}

const AuthContext = createContext<AuthState | null>(null);

/**
 * Single shared auth state for the whole app (provided once at the root).
 * Two things feed it:
 *  - Supabase's client session (Google OAuth), via onAuthStateChange.
 *  - Our own httpOnly session cookie (email/password auth), which has no
 *    client-side Supabase session at all — so on mount we also ask the
 *    backend directly via GET /api/auth/user to rehydrate after a page
 *    reload or in a component that mounts after login already happened.
 */
export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [supabaseChecked, setSupabaseChecked] = useState(false);
  const [cookieChecked, setCookieChecked] = useState(false);
  const syncedTokens = useRef<Set<string>>(new Set());

  const syncWithBackend = useCallback(async (session: Session): Promise<AuthUser | null> => {
    try {
      const res = await fetch('/api/auth/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ accessToken: session.access_token }),
      });
      if (!res.ok) return null;
      const data = await res.json() as { user: AuthUser };
      return data.user ?? null;
    } catch {
      return null;
    }
  }, []);

  // Rehydrate from the httpOnly session cookie (covers email/password auth,
  // which never creates a Supabase client session).
  useEffect(() => {
    fetch('/api/auth/user', { credentials: 'include' })
      .then(res => res.ok ? res.json() : null)
      .then((data: { user: AuthUser } | null) => {
        if (data?.user) setUser(data.user);
      })
      .catch(() => {})
      .finally(() => setCookieChecked(true));
  }, []);

  useEffect(() => {
    const { data: listener } = supabase.auth.onAuthStateChange(async (_event, session) => {
      if (!session) {
        setSupabaseChecked(true);
        return;
      }

      if (!syncedTokens.current.has(session.access_token)) {
        syncedTokens.current.add(session.access_token);
        const synced = await syncWithBackend(session);
        setUser(synced ?? userFromSession(session));
      }
      setSupabaseChecked(true);
    });

    return () => listener.subscription.unsubscribe();
  }, [syncWithBackend]);

  const login = useCallback(async () => {
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: window.location.origin },
    });
    // Browser navigates away to Google and back — onAuthStateChange handles the rest.
  }, []);

  // Password auth runs server-side (POST /api/auth/login|signup) instead of calling
  // Supabase directly from the browser, so a client-side network blocker on the
  // third-party auth domain can't take login/signup down.
  const loginWithEmail = useCallback(async (email: string, password: string): Promise<string | null> => {
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json() as { user?: AuthUser; error?: string };
      if (!res.ok) return data.error ?? 'Errore durante l\'accesso';
      if (data.user) setUser(data.user);
      return null;
    } catch {
      return 'Errore di rete durante l\'accesso';
    }
  }, []);

  const signUpWithEmail = useCallback(async (email: string, password: string): Promise<string | null> => {
    try {
      const res = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json() as { user?: AuthUser; error?: string; requiresConfirmation?: boolean };
      if (!res.ok) return data.error ?? 'Errore durante la registrazione';
      if (data.user) setUser(data.user);
      return null;
    } catch {
      return 'Errore di rete durante la registrazione';
    }
  }, []);

  const logout = useCallback(async () => {
    try {
      await supabase.auth.signOut();
      await fetch('/api/logout', { credentials: 'include', redirect: 'manual' });
      setUser(null);
      syncedTokens.current.clear();
    } catch (err) {
      console.error('Logout error', err);
    }
  }, []);

  const value: AuthState = {
    user,
    isLoading: !supabaseChecked || !cookieChecked,
    isAuthenticated: !!user,
    login,
    loginWithEmail,
    signUpWithEmail,
    logout,
  };

  return createElement(AuthContext.Provider, { value }, children);
}

export function useAuth(): AuthState {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within an AuthProvider');
  return ctx;
}
