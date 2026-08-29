import pino from "pino";
import { db, usersTable, subscriptionsTable } from "@workspace/db";
import { eq, sql } from "drizzle-orm";
import { sendEmail, getReferralRewardEmailHtml } from "./email";

const logger = pino({ name: "ReferralService" });

const REFERRAL_REWARD_CREDITS = 3;

/**
 * Claims a referral code when a new user registers or applies a code.
 * Rewards the new user with bonus CV credits.
 */
export async function claimReferralCode(
  referralCode: string,
  newUserId: string,
  newUserEmail: string,
  newUserName?: string | null
): Promise<{ success: boolean; message: string; rewardCredits: number }> {
  try {
    if (!referralCode || !newUserEmail) {
      return { success: false, message: "Codice referral o email mancante.", rewardCredits: 0 };
    }

    const cleanCode = referralCode.trim().toUpperCase();
    if (!cleanCode.startsWith("PRONTO-")) {
      return { success: false, message: "Formato codice referral non valido (deve iniziare con PRONTO-).", rewardCredits: 0 };
    }

    await db
      .insert(subscriptionsTable)
      .values({ userId: newUserId, credits: REFERRAL_REWARD_CREDITS })
      .onConflictDoUpdate({
        target: subscriptionsTable.userId,
        set: {
          credits: sql`${subscriptionsTable.credits} + ${REFERRAL_REWARD_CREDITS}`,
          updatedAt: new Date(),
        },
      });

    // Send notification to the new user confirming their bonus credits
    await sendEmail({
      to: newUserEmail,
      subject: "🎁 Benvenuto in ProntoCurriculum — Hai sbloccato 3 CV Gratis!",
      html: getReferralRewardEmailHtml(newUserName || "Nuovo Utente", REFERRAL_REWARD_CREDITS),
    });

    logger.info({ referralCode: cleanCode, newUserId, newUserEmail }, "✅ Referral code successfully claimed and bonus credits awarded");
    return { success: true, message: `Codice ${cleanCode} applicato con successo! +${REFERRAL_REWARD_CREDITS} CV gratuiti attivati.`, rewardCredits: REFERRAL_REWARD_CREDITS };
  } catch (err: unknown) {
    logger.error({ err, referralCode }, "Error claiming referral code");
    return { success: false, message: "Errore durante l'elaborazione del codice di invito.", rewardCredits: 0 };
  }
}

/**
 * Computes live referral metrics for the current user.
 */
export async function getReferralStatus(userId: string) {
  const cleanId = userId.replace(/[^a-zA-Z0-9]/g, "").toUpperCase();
  const referralCode = `PRONTO-${cleanId.slice(0, 6) || "IT2026"}`;
  const referralUrl = `https://prontocurriculum.it/join?ref=${referralCode}`;

  const [sub] = await db.select().from(subscriptionsTable).where(eq(subscriptionsTable.userId, userId));

  return {
    referralCode,
    referralUrl,
    creditsEarned: sub?.credits ?? 0,
  };
}
