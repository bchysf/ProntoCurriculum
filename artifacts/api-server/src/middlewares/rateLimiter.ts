import { Request, Response, NextFunction } from "express";
import pino from "pino";

const logger = pino({ name: "RateLimiter" });

interface RateLimitStoreItem {
  count: number;
  resetTime: number;
}

const store = new Map<string, RateLimitStoreItem>();

// Live counters since server boot — surfaced in the admin panel.
const totalsSinceBoot: Record<string, number> = {};
let blockedSinceBoot = 0;
const bootedAt = Date.now();

// Clean up expired entries periodically (every 5 minutes)
setInterval(() => {
  const now = Date.now();
  for (const [key, item] of store.entries()) {
    if (now > item.resetTime) {
      store.delete(key);
    }
  }
}, 5 * 60 * 1000).unref();

export interface RateLimiterOptions {
  windowMs: number; // e.g. 15 * 60 * 1000 for 15 min
  maxRequests: number; // e.g. 30 requests per window
  keyPrefix?: string;
  message?: string;
}

/**
 * High-performance in-memory rate limiter middleware.
 * Prevents API abuse and controls AI token burn without external dependencies.
 */
export function createRateLimiter({
  windowMs,
  maxRequests,
  keyPrefix = "rl",
  message = "Hai superato il limite massimo di richieste ammesse. Attendi alcuni minuti prima di riprovare.",
}: RateLimiterOptions) {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      // Use user ID from auth middleware if available, otherwise IP address
      const identifier = (req as { user?: { id?: string } }).user?.id || req.ip || req.socket.remoteAddress || "unknown-ip";
      const key = `${keyPrefix}:${identifier}`;
      const now = Date.now();

      const current = store.get(key);

      if (!current || now > current.resetTime) {
        store.set(key, {
          count: 1,
          resetTime: now + windowMs,
        });
        totalsSinceBoot[keyPrefix] = (totalsSinceBoot[keyPrefix] ?? 0) + 1;
        res.setHeader("X-RateLimit-Limit", maxRequests);
        res.setHeader("X-RateLimit-Remaining", maxRequests - 1);
        return next();
      }

      if (current.count >= maxRequests) {
        blockedSinceBoot += 1;
        const retryAfterSeconds = Math.ceil((current.resetTime - now) / 1000);
        res.setHeader("Retry-After", retryAfterSeconds);
        res.setHeader("X-RateLimit-Limit", maxRequests);
        res.setHeader("X-RateLimit-Remaining", 0);
        logger.warn({ key, count: current.count, maxRequests }, "⚠️ Rate limit exceeded");
        res.status(429).json({
          error: message,
          retryAfterSeconds,
        });
        return;
      }

      current.count += 1;
      totalsSinceBoot[keyPrefix] = (totalsSinceBoot[keyPrefix] ?? 0) + 1;
      res.setHeader("X-RateLimit-Limit", maxRequests);
      res.setHeader("X-RateLimit-Remaining", maxRequests - current.count);
      return next();
    } catch (err) {
      logger.error({ err }, "Error in rate limiter middleware");
      return next();
    }
  };
}

// Pre-configured rate limiters for distinct backend areas
export const aiRateLimiter = createRateLimiter({
  windowMs: 15 * 60 * 1000, // 15 minutes
  maxRequests: 35, // 35 AI calls per 15 min per user/IP
  keyPrefix: "ai",
  message: "Limite chiamate AI raggiunto (35 richieste per 15 minuti). Il nostro sistema protegge l'integrità del servizio. Attendi brevemente.",
});

export const authRateLimiter = createRateLimiter({
  windowMs: 15 * 60 * 1000, // 15 minutes
  maxRequests: 20, // 20 auth requests
  keyPrefix: "auth",
  message: "Troppi tentativi di autenticazione. Riprova tra 15 minuti per motivi di sicurezza.",
});

export const generalRateLimiter = createRateLimiter({
  windowMs: 5 * 60 * 1000, // 5 minutes
  maxRequests: 250, // 250 general API calls per 5 min
  keyPrefix: "gen",
});

export const aiRateLimit = aiRateLimiter;
export const apiRateLimit = generalRateLimiter;

// Static config mirror of the limiters above, keyed by prefix.
const LIMITER_CONFIG: Record<string, { windowMs: number; maxRequests: number; label: string }> = {
  ai: { windowMs: 15 * 60 * 1000, maxRequests: 35, label: "Chiamate AI" },
  auth: { windowMs: 15 * 60 * 1000, maxRequests: 20, label: "Autenticazione" },
  gen: { windowMs: 5 * 60 * 1000, maxRequests: 250, label: "API generali" },
};

export interface RateLimiterLiveStats {
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

/** Live snapshot of the in-memory rate limiter — real data, no mocks. */
export function getRateLimiterStats(): RateLimiterLiveStats {
  const now = Date.now();
  const byPrefix = new Map<string, { clients: Array<{ id: string; count: number; resetInSeconds: number }> }>();

  for (const [key, item] of store.entries()) {
    if (now > item.resetTime) continue;
    const sep = key.indexOf(":");
    const prefix = key.slice(0, sep);
    const id = key.slice(sep + 1);
    if (!byPrefix.has(prefix)) byPrefix.set(prefix, { clients: [] });
    byPrefix.get(prefix)!.clients.push({
      id,
      count: item.count,
      resetInSeconds: Math.max(0, Math.ceil((item.resetTime - now) / 1000)),
    });
  }

  const limiters = Object.entries(LIMITER_CONFIG).map(([prefix, cfg]) => {
    const clients = byPrefix.get(prefix)?.clients ?? [];
    clients.sort((a, b) => b.count - a.count);
    return {
      prefix,
      label: cfg.label,
      windowMinutes: Math.round(cfg.windowMs / 60000),
      maxRequests: cfg.maxRequests,
      requestsSinceBoot: totalsSinceBoot[prefix] ?? 0,
      activeClients: clients.length,
      requestsInCurrentWindows: clients.reduce((sum, c) => sum + c.count, 0),
      topClients: clients.slice(0, 5),
    };
  });

  return {
    uptimeSeconds: Math.round((now - bootedAt) / 1000),
    blockedSinceBoot,
    limiters,
  };
}
