import { Router, type IRouter, type Request, type Response } from 'express';
import { createClient } from '@supabase/supabase-js';
import {
  GetCurrentAuthUserResponse,
  LogoutMobileSessionResponse,
} from '@workspace/api-zod';
import { db, usersTable } from '@workspace/db';
import {
  clearSession,
  getSessionId,
  createSession,
  deleteSession,
  SESSION_COOKIE,
  SESSION_TTL,
  type SessionData,
} from '../lib/auth';

const router: IRouter = Router();

// Supabase Admin client (service role) — used only to verify user access tokens
const supabaseAdmin = createClient(
  process.env.SUPABASE_URL ?? '',
  process.env.SUPABASE_SERVICE_ROLE_KEY ?? '',
);

function setSessionCookie(res: Response, sid: string) {
  res.cookie(SESSION_COOKIE, sid, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: SESSION_TTL,
  });
}

async function upsertUser(data: {
  id: string;
  email: string | null;
  firstName: string | null;
  lastName: string | null;
  profileImageUrl: string | null;
}) {
  const [user] = await db
    .insert(usersTable)
    .values(data)
    .onConflictDoUpdate({
      target: usersTable.id,
      set: {
        ...data,
        updatedAt: new Date(),
      },
    })
    .returning();
  return user!;
}

// GET /api/auth/user — return current session user
router.get('/auth/user', (req: Request, res: Response) => {
  if (!req.isAuthenticated()) {
    res.status(401).json({ error: 'Unauthorized' });
    return;
  }
  res.json(
    GetCurrentAuthUserResponse.parse({
      user: req.user,
    }),
  );
});

// POST /api/auth/sync — called from frontend after Supabase Google Sign-In
// Verifies the Supabase access token and creates/updates a session
router.post('/auth/sync', async (req: Request, res: Response) => {
  const { accessToken } = req.body as { accessToken?: string };

  if (!accessToken || typeof accessToken !== 'string') {
    res.status(400).json({ error: 'Access token mancante' });
    return;
  }

  try {
    const { data, error } = await supabaseAdmin.auth.getUser(accessToken);
    if (error || !data.user) {
      throw error ?? new Error('Utente non trovato');
    }
    const supaUser = data.user;

    const metadata = supaUser.user_metadata as { full_name?: string; name?: string; avatar_url?: string; picture?: string };
    const nameParts = (metadata.full_name ?? metadata.name ?? '').split(' ');
    const firstName = nameParts[0] || null;
    const lastName = nameParts.slice(1).join(' ') || null;

    const dbUser = await upsertUser({
      id: supaUser.id,
      email: supaUser.email ?? null,
      firstName,
      lastName,
      profileImageUrl: metadata.avatar_url ?? metadata.picture ?? null,
    });

    const now = Math.floor(Date.now() / 1000);
    const sessionData: SessionData = {
      user: {
        id: dbUser.id,
        email: dbUser.email,
        firstName: dbUser.firstName,
        lastName: dbUser.lastName,
        profileImageUrl: dbUser.profileImageUrl,
      },
      access_token: accessToken,
      expires_at: now + 3600,
    };

    const sid = await createSession(sessionData);
    setSessionCookie(res, sid);
    res.json({ user: sessionData.user });
  } catch (err) {
    req.log.error({ err }, 'auth/sync error');
    res.status(401).json({ error: 'Token non valido o scaduto' });
  }
});

// GET /api/logout
router.get('/logout', async (req: Request, res: Response) => {
  const sid = getSessionId(req);
  await clearSession(res, sid);
  res.redirect('/');
});

// Mobile logout (keep for compatibility)
router.post('/mobile-auth/logout', async (req: Request, res: Response) => {
  const sid = getSessionId(req);
  if (sid) {
    await deleteSession(sid);
  }
  res.json(LogoutMobileSessionResponse.parse({ success: true }));
});

export default router;
