import express, { type Express } from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import pinoHttp from "pino-http";
import router from "./routes";
import stripeWebhookRouter from "./routes/stripeWebhook";
import ssrRouter from "./routes/ssr";
import publicProfileSsrRouter from "./routes/publicProfileSsr";
import { logger } from "./lib/logger";
import { authMiddleware } from "./middlewares/authMiddleware";

const app: Express = express();

app.use(
  pinoHttp({
    logger,
    serializers: {
      req(req) {
        return {
          id: req.id,
          method: req.method,
          url: req.url?.split("?")[0],
        };
      },
      res(res) {
        return {
          statusCode: res.statusCode,
        };
      },
    },
  }),
);
app.use(cors({ credentials: true, origin: true }));
app.use(cookieParser());

// Stripe webhook needs the raw request body for signature verification,
// so it must be mounted before the global express.json() body parser.
app.use("/api", stripeWebhookRouter);

// Default 100kb limit is too small for base64-encoded photo uploads (CV photos, profile photos).
app.use(express.json({ limit: "5mb" }));
app.use(express.urlencoded({ extended: true, limit: "5mb" }));
app.use(authMiddleware);

app.use("/api", router);

// Server-rendered SEO/GEO pages, mounted at the root path (see routes/ssr.ts
// and vercel.json's rewrite for /lavoro/*).
app.use(ssrRouter);
app.use(publicProfileSsrRouter);

export default app;
