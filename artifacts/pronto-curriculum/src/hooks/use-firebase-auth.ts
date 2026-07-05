import { useState, useEffect, useCallback, useRef } from 'react';
import {
  GoogleAuthProvider,
  signInWithPopup,
  signOut,
  onAuthStateChanged,
  type User as FirebaseUser,
} from 'firebase/auth';
import { auth } from '../lib/firebase';

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
  logout: () => void;
}

/**
 * Drop-in replacement for @workspace/replit-auth-web `useAuth`.
 * Uses Firebase Authentication with Google Sign-In.
 * After sign-in, syncs the user with the backend via POST /api/auth/sync.
 */
export function useAuth(): AuthState {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const syncedUids = useRef<Set<string>>(new Set());

  /**
   * Syncs a Firebase user with the backend session.
   * Returns the normalized AuthUser from our DB.
   */
  const syncWithBackend = useCallback(async (firebaseUser: FirebaseUser): Promise<AuthUser | null> => {
    try {
      const idToken = await firebaseUser.getIdToken();
      const res = await fetch('/api/auth/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ idToken }),
      });
      if (!res.ok) return null;
      const data = await res.json() as { user: AuthUser };
      return data.user ?? null;
    } catch {
      return null;
    }
  }, []);

  useEffect(() => {
    // Listen for Firebase auth state changes
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (!firebaseUser) {
        setUser(null);
        setIsLoading(false);
        return;
      }

      // Avoid duplicate syncs for the same uid in the same session
      if (!syncedUids.current.has(firebaseUser.uid)) {
        syncedUids.current.add(firebaseUser.uid);
        const synced = await syncWithBackend(firebaseUser);
        if (synced) {
          setUser(synced);
        } else {
          // Fall back to Firebase user data
          const nameParts = (firebaseUser.displayName ?? '').split(' ');
          setUser({
            id: firebaseUser.uid,
            email: firebaseUser.email,
            firstName: nameParts[0] ?? null,
            lastName: nameParts.slice(1).join(' ') || null,
            profileImageUrl: firebaseUser.photoURL,
          });
        }
      } else {
        // Already synced — just refresh from backend
        try {
          const res = await fetch('/api/auth/user', { credentials: 'include' });
          if (res.ok) {
            const data = await res.json() as { user: AuthUser };
            setUser(data.user ?? null);
          }
        } catch {
          // If backend check fails, use Firebase data
          const nameParts = (firebaseUser.displayName ?? '').split(' ');
          setUser({
            id: firebaseUser.uid,
            email: firebaseUser.email,
            firstName: nameParts[0] ?? null,
            lastName: nameParts.slice(1).join(' ') || null,
            profileImageUrl: firebaseUser.photoURL,
          });
        }
      }
      setIsLoading(false);
    });

    return unsubscribe;
  }, [syncWithBackend]);

  const login = useCallback(async () => {
    try {
      const provider = new GoogleAuthProvider();
      provider.addScope('email');
      provider.addScope('profile');
      await signInWithPopup(auth, provider);
      // onAuthStateChanged will handle the rest
    } catch (err) {
      // User closed popup — not an error
      console.warn('Login cancelled', err);
    }
  }, []);

  const logout = useCallback(async () => {
    try {
      await signOut(auth);
      await fetch('/api/logout', { credentials: 'include', redirect: 'manual' });
      setUser(null);
      syncedUids.current.clear();
    } catch (err) {
      console.error('Logout error', err);
    }
  }, []);

  return {
    user,
    isLoading,
    isAuthenticated: !!user,
    login,
    logout,
  };
}
