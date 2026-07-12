import { Router, Request, Response } from "express";
import pino from "pino";
import { getReferralStatus, claimReferralCode } from "../lib/referralService";

const logger = pino({ name: "ReferralRouter" });
export const referralRouter = Router();

// GET /api/referral/status
referralRouter.get("/status", async (req: Request, res: Response) => {
  try {
    const user = (req as { user?: { id?: string; email?: string; name?: string } }).user;
    const userId = user?.id || "guest-user";
    const stats = await getReferralStatus(userId);
    res.json(stats);
  } catch (err: unknown) {
    logger.error({ err }, "Error fetching referral status");
    res.status(500).json({ error: "Errore nel recupero dello stato referral." });
  }
});

// POST /api/referral/claim
referralRouter.post("/claim", async (req: Request, res: Response) => {
  try {
    const { referralCode, friendEmail, friendName, friendId } = req.body;
    const user = (req as { user?: { id?: string; email?: string; name?: string } }).user;
    const targetId = friendId || user?.id || "guest-claim-id";
    const targetEmail = friendEmail || user?.email || "";
    const targetName = friendName || user?.name || "Nuovo Utente";

    const result = await claimReferralCode(referralCode, targetId, targetEmail, targetName);
    if (!result.success) {
      res.status(400).json({ error: result.message });
      return;
    }
    res.json(result);
  } catch (err: unknown) {
    logger.error({ err }, "Error claiming referral reward");
    res.status(500).json({ error: "Errore durante il riscatto del premio referral." });
  }
});
