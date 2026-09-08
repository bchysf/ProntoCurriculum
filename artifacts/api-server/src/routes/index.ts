import { Router, type IRouter } from "express";
import healthRouter from "./health";
import authRouter from "./auth";
import parseCvRouter from "./parseCv";
import optimizeCvRouter from "./optimizeCv";
import experiencesRouter from "./experiences";
import highlightsRouter from "./highlights";
import publicProfileRouter from "./publicProfile";
import tailorCvRouter from "./tailorCv";
import translateCvRouter from "./translateCv";
import cvsRouter from "./cvs";
import profileRouter from "./profile";
import billingRouter from "./billing";
import coverLetterRouter from "./coverLetter";
import cvAssistantRouter from "./cvAssistant";
import { emailRouter } from "./email";
import { adminRouter } from "./admin";
import { referralRouter } from "./referral";
import { jobsRouter } from "./jobs";
import { aiRateLimit, aiRateLimiterAnon, authRateLimiter, generalRateLimiter } from "../middlewares/rateLimiter";
import { requireAdmin } from "../middlewares/authMiddleware";

const router: IRouter = Router();

// Apply general rate limiting to all requests
router.use(generalRateLimiter);

router.use(healthRouter);

// Auth throttling ONLY on auth endpoints — mounting it unscoped would make
// every API call burn the 20-req auth budget and 429 the whole app.
router.use(["/auth", "/logout", "/mobile-auth"], authRateLimiter);
router.use(authRouter);

// Stricter limit ONLY on the endpoints that actually call the AI providers.
// Plain reads that live in the same routers (e.g. GET /tailored-cvs) stay out.
// aiRateLimiterAnon stacks a lower ceiling in front for unauthenticated
// callers specifically — the cheap vector for spraying rotated IPs.
// MUST be registered before any router below that owns one of these paths —
// Express runs middleware/routers in registration order, so a router mounted
// earlier fully handles and responds to a matching request, and a rate
// limiter registered after it never gets a chance to run (this bit
// /cover-letter/generate in production: coverLetterRouter used to be mounted
// above this block).
router.use(
  [
    "/parse-cv",
    "/optimize-cv",
    "/optimize-field",
    "/fetch-job",
    "/tailor-cv",
    "/translate-cv",
    "/translate-field",
    "/tailored-cvs/interview-prep",
    "/jobs/analyze",
    "/jobs/translate",
    "/jobs/suggest-roles",
    "/jobs/salary",
    "/cv-assistant/chat",
    "/cover-letter/generate",
  ],
  aiRateLimiterAnon,
  aiRateLimit,
);

router.use(experiencesRouter);
router.use(highlightsRouter);
router.use(publicProfileRouter);
router.use(cvsRouter);
router.use(profileRouter);
router.use(billingRouter);
router.use(coverLetterRouter);
router.use("/email", requireAdmin, emailRouter);
router.use("/admin", requireAdmin, adminRouter);
router.use("/referral", referralRouter);
router.use("/jobs", jobsRouter);
router.use(parseCvRouter);
router.use(optimizeCvRouter);
router.use(tailorCvRouter);
router.use(translateCvRouter);
router.use(cvAssistantRouter);

export default router;
