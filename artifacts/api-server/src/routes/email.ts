import { Router, Request, Response } from "express";
import pino from "pino";
import {
  sendEmail,
  getWelcomeEmailHtml,
  getCvReadyEmailHtml,
  getAbandonedCvEmailHtml,
  getTrialExpiryEmailHtml,
  getReferralRewardEmailHtml,
} from "../lib/email";

const logger = pino({ name: "EmailRouter" });
export const emailRouter = Router();

// POST /api/email/welcome
emailRouter.post("/welcome", async (req: Request, res: Response) => {
  try {
    const { email, name } = req.body;
    if (!email) {
      res.status(400).json({ error: "L'indirizzo email è obbligatorio." });
      return;
    }
    const html = getWelcomeEmailHtml(name || "Professionista");
    const result = await sendEmail({
      to: email,
      subject: "Benvenuto in ProntoCurriculum — Supera i filtri ATS!",
      html,
    });
    res.json(result);
  } catch (err: unknown) {
    logger.error({ err }, "Error in POST /api/email/welcome");
    res.status(500).json({ error: "Errore durante l'invio dell'email di benvenuto." });
  }
});

// POST /api/email/cv-ready
emailRouter.post("/cv-ready", async (req: Request, res: Response) => {
  try {
    const { email, cvTitle, atsScore } = req.body;
    if (!email) {
      res.status(400).json({ error: "L'indirizzo email è obbligatorio." });
      return;
    }
    const html = getCvReadyEmailHtml(cvTitle || "Curriculum Professionale", typeof atsScore === 'number' ? atsScore : 82);
    const result = await sendEmail({
      to: email,
      subject: `Il tuo CV "${cvTitle || "Curriculum"}" è pronto e ottimizzato (Punteggio ATS: ${atsScore || 82})`,
      html,
    });
    res.json(result);
  } catch (err: unknown) {
    logger.error({ err }, "Error in POST /api/email/cv-ready");
    res.status(500).json({ error: "Errore durante l'invio della notifica CV pronto." });
  }
});

// POST /api/email/abandoned
emailRouter.post("/abandoned", async (req: Request, res: Response) => {
  try {
    const { email, name } = req.body;
    if (!email) {
      res.status(400).json({ error: "L'indirizzo email è obbligatorio." });
      return;
    }
    const html = getAbandonedCvEmailHtml(name || "Professionista");
    const result = await sendEmail({
      to: email,
      subject: "💼 Non lasciare il tuo CV a metà — Riprendi da dove hai lasciato",
      html,
    });
    res.json(result);
  } catch (err: unknown) {
    logger.error({ err }, "Error in POST /api/email/abandoned");
    res.status(500).json({ error: "Errore durante l'invio del promemoria." });
  }
});

// POST /api/email/preview — returns exact HTML for rendering inside the admin/testing interface
emailRouter.post("/preview", (req: Request, res: Response) => {
  const { type, name, cvTitle, atsScore, daysLeft, rewardedDays } = req.body;
  let html = "";
  switch (type) {
    case "welcome":
      html = getWelcomeEmailHtml(name || "Mario Rossi");
      break;
    case "cv-ready":
      html = getCvReadyEmailHtml(cvTitle || "CV Executive IT 2026", typeof atsScore === 'number' ? atsScore : 88);
      break;
    case "abandoned":
      html = getAbandonedCvEmailHtml(name || "Mario Rossi");
      break;
    case "trial-expiry":
      html = getTrialExpiryEmailHtml(name || "Mario Rossi", typeof daysLeft === 'number' ? daysLeft : 3);
      break;
    case "referral":
      html = getReferralRewardEmailHtml(name || "Mario Rossi", typeof rewardedDays === 'number' ? rewardedDays : 30);
      break;
    default:
      html = getWelcomeEmailHtml("Mario Rossi");
  }
  res.json({ html });
});
