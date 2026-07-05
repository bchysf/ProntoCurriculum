import { Router, type IRouter, type Request, type Response } from 'express';
import { initializeApp, cert, getApps } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
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

// Initialize Firebase Admin SDK (singleton)
if (getApps().length === 0) {
  if (process.env.FIREBASE_SERVICE_ACCOUNT_JSON) {
    const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_JSON) as object;
    initializeApp({ credential: cert(serviceAccount as Parameters<typeof cert>[0]) });
  } else {
    // In development without service account, init with default credentials
    initializeApp({ projectId: process.env.FIREBASE_PROJECT_ID });
  }
}

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

// POST /api/auth/sync — called from frontend after Firebase Google Sign-In
// Verifies the Firebase ID token and creates/updates a session
router.post('/auth/sync', async (req: Request, res: Response) => {
  const { idToken } = req.body as { idToken?: string };

  if (!idToken || typeof idToken !== 'string') {
    res.status(400).json({ error: 'ID token mancante' });
    return;
  }

  try {
    const firebaseAuth = getAuth();
    const decoded = await firebaseAuth.verifyIdToken(idToken);

    const nameParts = (decoded.name ?? '').split(' ');
    const firstName = nameParts[0] ?? null;
    const lastName = nameParts.slice(1).join(' ') || null;

    const dbUser = await upsertUser({
      id: decoded.uid,
      email: decoded.email ?? null,
      firstName,
      lastName,
      profileImageUrl: decoded.picture ?? null,
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
      access_token: idToken,
      expires_at: decoded.exp ?? now + 3600,
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
