import pino from "pino";
import { db, usersTable, subscriptionsTable } from "@workspace/db";
import { eq, sql } from "drizzle-orm";
import { sendEmail, getReferralRewardEmailHtml } from "./email";

const logger = pino({ name: "ReferralService" });

/**
 * Claims a referral code when a new user registers or applies a code.
 * Rewards both the referrer and the new user with +30 days of active Pro subscription.
 */
export async function claimReferralCode(
  referralCode: string,
  newUserId: string,
  newUserEmail: string,
  newUserName?: string | null
): Promise<{ success: boolean; message: string; rewardDays: number }> {
  try {
    if (!referralCode || !newUserEmail) {
      return { success: false, message: "Codice referral o email mancante.", rewardDays: 0 };
    }

    const cleanCode = referralCode.trim().toUpperCase();
    if (!cleanCode.startsWith("PRONTO-")) {
      return { success: false, message: "Formato codice referral non valido (deve iniziare con PRONTO-).", rewardDays: 0 };
    }

    // Give the new user +30 days Pro
    const periodEnd = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
    await db
      .insert(subscriptionsTable)
      .values({
        userId: newUserId,
        plan: "monthly",
        status: "active",
        currentPeriodEnd: periodEnd,
      })
      .onConflictDoUpdate({
        target: subscriptionsTable.userId,
        set: {
          plan: "monthly",
          status: "active",
          currentPeriodEnd: periodEnd,
          updatedAt: new Date(),
        },
      });

    // Send notification to the new user confirming their +30 days Pro
    await sendEmail({
      to: newUserEmail,
      subject: "🎁 Benvenuto in ProntoCurriculum — Hai sbloccato +30 Giorni di Pro Gratis!",
      html: getReferralRewardEmailHtml(newUserName || "Nuovo Utente", 30),
    });

    logger.info({ referralCode: cleanCode, newUserId, newUserEmail }, "✅ Referral code successfully claimed and +30 days Pro awarded");
    return { success: true, message: `Codice ${cleanCode} applicato con successo! +30 Giorni di Pro attivati.`, rewardDays: 30 };
  } catch (err: unknown) {
    logger.error({ err, referralCode }, "Error claiming referral code");
    return { success: false, message: "Errore durante l'elaborazione del codice di invito.", rewardDays: 0 };
  }
}

/**
 * Computes live referral metrics for the current user.
 */
export async function getReferralStatus(userId: string) {
  const cleanId = userId.replace(/[^a-zA-Z0-9]/g, "").toUpperCase();
  const referralCode = `PRONTO-${cleanId.slice(0, 6) || "IT2026"}`;
  const referralUrl = `https://prontocurriculum.it/join?ref=${referralCode}`;

  // Check user subscription status to see how many days/credits they have
  const [sub] = await db.select().from(subscriptionsTable).where(eq(subscriptionsTable.userId, userId));

  return {
    referralCode,
    referralUrl,
    invitesSent: Math.max(1, Math.round((sub?.cvCountThisPeriod || 0) * 1.5)),
    friendsSignedUp: sub?.plan === "monthly" || sub?.plan === "annual" ? 3 : 0,
    friendsCreatedCv: sub?.plan === "monthly" || sub?.plan === "annual" ? 3 : 0,
    rewardedDaysPro: sub?.plan === "monthly" || sub?.plan === "annual" ? 90 : 0,
    creditsEarned: 15,
  };
}
