import pino from "pino";

// pino-pretty's transport spawns a worker thread that resolves the package
// at runtime, which crashes in a bundled serverless function where it isn't
// shipped — so never enable it on Vercel, regardless of NODE_ENV. Locally
// (dev script doesn't set NODE_ENV) pretty logging stays on as before.
const isDevelopment =
  process.env.NODE_ENV !== "production" && !process.env.VERCEL;

export const logger = pino({
  level: process.env.LOG_LEVEL ?? "info",
  redact: [
    "req.headers.authorization",
    "req.headers.cookie",
    "res.headers['set-cookie']",
  ],
  ...(isDevelopment
    ? {
        transport: {
          target: "pino-pretty",
          options: { colorize: true },
        },
      }
    : {}),
});
