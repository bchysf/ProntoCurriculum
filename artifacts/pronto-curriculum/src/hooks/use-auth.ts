import { useState, useEffect, useCallback, useRef } from 'react';
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

/**
 * Uses Supabase Authentication with Google Sign-In (redirect flow).
 * After sign-in, syncs the user with the backend via POST /api/auth/sync.
 */
export function useAuth(): AuthState {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);
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

  useEffect(() => {
    const { data: listener } = supabase.auth.onAuthStateChange(async (_event, session) => {
      if (!session) {
        setUser(null);
        setIsLoading(false);
        return;
      }

      if (!syncedTokens.current.has(session.access_token)) {
        syncedTokens.current.add(session.access_token);
        const synced = await syncWithBackend(session);
        setUser(synced ?? userFromSession(session));
      }
      setIsLoading(false);
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

  const loginWithEmail = useCallback(async (email: string, password: string): Promise<string | null> => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    return error?.message ?? null;
  }, []);

  const signUpWithEmail = useCallback(async (email: string, password: string): Promise<string | null> => {
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: { emailRedirectTo: window.location.origin },
    });
    return error?.message ?? null;
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

  return {
    user,
    isLoading,
    isAuthenticated: !!user,
    login,
    loginWithEmail,
    signUpWithEmail,
    logout,
  };
}
