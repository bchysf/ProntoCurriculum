import { Router, type IRouter } from "express";
import healthRouter from "./health";
import authRouter from "./auth";
import parseCvRouter from "./parseCv";
import optimizeCvRouter from "./optimizeCv";
import experiencesRouter from "./experiences";
import tailorCvRouter from "./tailorCv";
import translateCvRouter from "./translateCv";
import cvsRouter from "./cvs";
import profileRouter from "./profile";
import billingRouter from "./billing";
import coverLetterRouter from "./coverLetter";
import { emailRouter } from "./email";
import { adminRouter } from "./admin";
import { referralRouter } from "./referral";
import { aiRateLimit, authRateLimiter, generalRateLimiter } from "../middlewares/rateLimiter";
import { requireAdmin } from "../middlewares/authMiddleware";

const router: IRouter = Router();

// Apply general rate limiting to all requests
router.use(generalRateLimiter);

router.use(healthRouter);

// Auth throttling ONLY on auth endpoints — mounting it unscoped would make
// every API call burn the 20-req auth budget and 429 the whole app.
router.use(["/auth", "/logout", "/mobile-auth"], authRateLimiter);
router.use(authRouter);

router.use(experiencesRouter);
router.use(cvsRouter);
router.use(profileRouter);
router.use(billingRouter);
router.use(coverLetterRouter);
router.use("/email", requireAdmin, emailRouter);
router.use("/admin", requireAdmin, adminRouter);
router.use("/referral", referralRouter);

// Stricter limit ONLY on the endpoints that actually call the AI providers.
// Plain reads that live in the same routers (e.g. GET /tailored-cvs) stay out.
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
  ],
  aiRateLimit,
);
router.use(parseCvRouter);
router.use(optimizeCvRouter);
router.use(tailorCvRouter);
router.use(translateCvRouter);

export default router;
