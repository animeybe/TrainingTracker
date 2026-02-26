import express from "express";
import cors from "cors";
import path from "path";
import rateLimit from "express-rate-limit";
import { logger } from "./common/utils";
import apiRouter from "./presentation/routes";
import { authenticateToken } from "./presentation/middleware/auth.middleware";
import planRouter from "./presentation/routes/plan.routes";

const app = express();
const PORT = process.env.PORT || 3001;
const DIST_PATH = path.resolve(__dirname, "../../pwa/dist");
const RATE_LIMIT_WINDOW_MS =
  parseInt(process.env.RATE_LIMIT_WINDOW_MS!) || 15 * 60 * 1000;
const RATE_LIMIT_AUTH_MAX = parseInt(process.env.RATE_LIMIT_AUTH_MAX!) || 5;
const RATE_LIMIT_API_MAX = parseInt(process.env.RATE_LIMIT_API_MAX!) || 100;

const createRateLimiter = (
  windowMs: number,
  max: number,
  skipLocalhost = true,
) =>
  rateLimit({
    windowMs,
    max,
    message: {
      error: "Слишком много запросов. Попробуйте позже.",
      retryAfter: Math.ceil(windowMs / 1000),
    },
    standardHeaders: true,
    legacyHeaders: false,
    skip: skipLocalhost
      ? (req) => {
          return ["127.0.0.1", "::1", "localhost"].includes(req.ip || "");
        }
      : undefined,
  });

const authLimiter = createRateLimiter(
  RATE_LIMIT_WINDOW_MS,
  RATE_LIMIT_AUTH_MAX,
  true,
);
const apiLimiter = createRateLimiter(
  RATE_LIMIT_WINDOW_MS,
  RATE_LIMIT_API_MAX,
  true,
);

app.use(express.json({ limit: "10mb" }));
app.use(express.static(DIST_PATH));
app.use(
  cors({
    origin: process.env.FRONTEND_URL || "http://localhost:5173",
    credentials: true,
  }),
);

// Rate limiting
app.use("/api/auth", authLimiter);
app.use("/api", apiRouter);
app.use("/api/plan", planRouter);
app.use("/api", apiLimiter);

// SPA routes
app.get("/dashboard", authenticateToken, (req, res) => {
  res.sendFile(path.join(DIST_PATH, "index.html"));
});

app.get("*", (req, res) => {
  res.sendFile(path.join(DIST_PATH, "index.html"));
});

// Global error handler
app.use(
  (
    error: any,
    req: express.Request,
    res: express.Response,
    next: express.NextFunction,
  ) => {
    logger.error(`Global error: ${error.message}`, {
      stack: error.stack,
      path: req.path,
      method: req.method,
    });
    res.status(500).json({ error: "Внутренняя ошибка сервера" });
  },
);

app.listen(PORT, () => {
  logger.info(`🚀 Server running: http://localhost:${PORT}`);
  logger.info(
    `📊 Rate limits: auth=${RATE_LIMIT_AUTH_MAX}/15m, api=${RATE_LIMIT_API_MAX}/15m`,
  );
});
