import { Router, Request, Response } from "express";
import pino from "pino";
import { db, usersTable, userCvsTable, tailoredCvsTable, experiencesTable, subscriptionsTable } from "@workspace/db";
import { sql } from "drizzle-orm";
import { getRateLimiterStats } from "../middlewares/rateLimiter";

const logger = pino({ name: "AdminRouter" });
export const adminRouter = Router();

// GET /api/admin/stats — every number here is measured, nothing is invented.
adminRouter.get("/stats", async (req: Request, res: Response) => {
  try {
    const dbT0 = Date.now();
    const [usersCountResult] = await db.select({ count: sql<number>`count(*)::int` }).from(usersTable);
    const dbLatencyMs = Date.now() - dbT0;

    const [
      [cvsCountResult],
      [tailoredCountResult],
      [experiencesCountResult],
      [usersWithCvResult],
      [newUsers30dResult],
      [activeSubsResult],
    ] = await Promise.all([
      db.select({ count: sql<number>`count(*)::int` }).from(userCvsTable),
      db.select({ count: sql<number>`count(*)::int` }).from(tailoredCvsTable),
      db.select({ count: sql<number>`count(*)::int` }).from(experiencesTable),
      db.select({ count: sql<number>`count(distinct ${userCvsTable.userId})::int` }).from(userCvsTable),
      db.select({ count: sql<number>`count(*)::int` }).from(usersTable)
        .where(sql`${usersTable.createdAt} > now() - interval '30 days'`),
      db.select({ count: sql<number>`count(*)::int` }).from(subscriptionsTable)
        .where(sql`${subscriptionsTable.status} = 'active' and ${subscriptionsTable.plan} <> 'free' and ${subscriptionsTable.currentPeriodEnd} > now()`),
    ]);

    // Recent 20 users with their subscription
    const recentUsers = await db.select().from(usersTable).orderBy(sql`${usersTable.createdAt} DESC`).limit(20);
    const userIds = recentUsers.map(u => u.id);
    const subs = userIds.length > 0
      ? await db.select().from(subscriptionsTable).where(sql`${subscriptionsTable.userId} IN (${sql.join(userIds.map(id => sql`${id}`), sql`, `)})`)
      : [];
    const subsMap = new Map(subs.map(s => [s.userId, s]));

    const totalUsers = usersCountResult?.count ?? 0;
    const usersWithCv = usersWithCvResult?.count ?? 0;

    const stats = {
      platform: {
        totalUsers,
        totalCvs: cvsCountResult?.count ?? 0,
        totalTailoredCvs: tailoredCountResult?.count ?? 0,
        totalExperiences: experiencesCountResult?.count ?? 0,
        activeProSubscriptions: activeSubsResult?.count ?? 0,
        newUsersLast30Days: newUsers30dResult?.count ?? 0,
        // Real activation rate: users that created at least one CV.
        conversionRate: totalUsers > 0 ? `${Math.round((usersWithCv / totalUsers) * 1000) / 10}%` : "—",
      },
      systemHealth: {
        // Measured: the count query above just succeeded.
        database: `ONLINE · ${dbLatencyMs}ms`,
        // Configuration checks — presence of the API keys this server actually reads.
        aiPrimary: process.env.GROQ_API_KEY
          ? `CONFIGURATA (Groq · ${process.env.GROQ_MODEL || "llama-3.3-70b-versatile"})`
          : "NON CONFIGURATA (GROQ_API_KEY mancante)",
        aiFallback: process.env.GEMINI_API_KEY
          ? `CONFIGURATA (Gemini · ${process.env.GEMINI_MODEL || "gemini-2.0-flash"})`
          : "NON CONFIGURATA (GEMINI_API_KEY mancante)",
        emailService: process.env.RESEND_API_KEY ? "CONFIGURATA (Resend)" : "NON CONFIGURATA (log-only)",
        billing: process.env.STRIPE_SECRET_KEY ? "CONFIGURATA (Stripe)" : "NON CONFIGURATA",
      },
      // Live in-memory snapshot: real counters, active windows, top consumers.
      rateLimiter: getRateLimiterStats(),
      recentUsers: recentUsers.map(u => {
        const sub = subsMap.get(u.id);
        const name = [u.firstName, u.lastName].filter(Boolean).join(" ") || "Utente";
        return {
          id: u.id,
          email: u.email || "nessuna@email.it",
          name,
          plan: sub?.plan || "free",
          cvCountThisPeriod: sub?.cvCountThisPeriod ?? 0,
          createdAt: u.createdAt,
        };
      }),
    };

    res.json(stats);
  } catch (err: unknown) {
    logger.error({ err }, "Error fetching admin stats");
    res.status(500).json({ error: "Errore durante il recupero delle statistiche di sistema." });
  }
});

// POST /api/admin/user/:id/grant-pro
adminRouter.post("/user/:id/grant-pro", async (req: Request, res: Response) => {
  try {
    const userIdStr = Array.isArray(req.params.id) ? req.params.id[0] : String(req.params.id || "");
    const { days = 30, plan = "monthly" } = req.body;

    const periodEnd = new Date(Date.now() + Number(days) * 24 * 60 * 60 * 1000);

    await db
      .insert(subscriptionsTable)
      .values({
        userId: userIdStr,
        plan: plan as "free" | "monthly" | "annual",
        status: "active",
        currentPeriodEnd: periodEnd,
      })
      .onConflictDoUpdate({
        target: subscriptionsTable.userId,
        set: {
          plan: plan as "free" | "monthly" | "annual",
          status: "active",
          currentPeriodEnd: periodEnd,
          updatedAt: new Date(),
        },
      });

    logger.info({ userId: userIdStr, days, plan }, "✅ Granted Pro plan via Admin Panel");
    res.json({ success: true, message: `Utente aggiornato al piano ${plan} per +${days} giorni.` });
  } catch (err: unknown) {
    logger.error({ err }, "Error granting pro status");
    res.status(500).json({ error: "Errore nell'aggiornamento dell'utente." });
  }
});
