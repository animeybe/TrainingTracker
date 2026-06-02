// server.ts
import express from "express";
import cors from "cors";
import rateLimit from "express-rate-limit";
import helmet from "helmet";
import https from "https";
import fs from "fs";
import { logger } from "./common/utils";
import apiRouter from "./presentation/routes";
import { container, ServiceKeys } from "./infrastructure/di/container";

const PORT = parseInt(process.env.PORT || "3001", 10);

const ALLOWED_ORIGINS = [
  "https://localhost:5173",
  "https://trainingtracker.ru",
  "https://www.trainingtracker.ru",
];

const RATE_LIMIT_WINDOW_MS =
  parseInt(process.env.RATE_LIMIT_WINDOW_MS!) || 15 * 60 * 1000;
const RATE_LIMIT_AUTH_MAX = parseInt(process.env.RATE_LIMIT_AUTH_MAX!) || 1000;
const RATE_LIMIT_API_MAX = parseInt(process.env.RATE_LIMIT_API_MAX!) || 1000;

const app = express();

app.use(express.json({ limit: "10mb" }));
app.use(helmet());

app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin) return callback(null, true);
      if (ALLOWED_ORIGINS.includes(origin)) return callback(null, true);
      logger.warn(`CORS blocked origin: ${origin}`);
      callback(new Error("Not allowed by CORS"));
    },
    credentials: true,
  }),
);

const createRateLimiter = (max: number, skipLocalhost = true) =>
  rateLimit({
    windowMs: RATE_LIMIT_WINDOW_MS,
    max,
    message: {
      error: "Слишком много запросов. Попробуйте позже.",
      retryAfter: Math.ceil(RATE_LIMIT_WINDOW_MS / 1000),
    },
    standardHeaders: true,
    legacyHeaders: false,
    skip: skipLocalhost
      ? (req) => ["127.0.0.1", "::1", "localhost"].includes(req.ip || "")
      : undefined,
  });

app.use("/api/auth", createRateLimiter(RATE_LIMIT_AUTH_MAX));
app.use("/api", createRateLimiter(RATE_LIMIT_API_MAX));

// Middleware для управления кэшированием
app.use((req, res, next) => {
  const { path } = req;

  // Статические файлы могут кэшироваться надолго
  if (!path.startsWith("/api")) {
    res.set("Cache-Control", "public, max-age=3600, s-maxage=86400");
  }
  // API запросы: GET — кэшируем (для офлайн-доступа), мутации — нет
  else {
    if (req.method === "GET") {
      // Разрешаем кэширование GET-запросов браузером и Service Worker'ом
      res.set("Cache-Control", "private, max-age=300");
    } else {
      // Мутации (POST/PUT/DELETE) не кэшируем
      res.set("Cache-Control", "no-store");
    }
  }
  next();
});

app.use("/api", apiRouter);

app.use((req, res) => {
  res.status(404).json({ error: "Route not found" });
});

app.use(
  (
    error: any,
    req: express.Request,
    res: express.Response,
    _next: express.NextFunction,
  ) => {
    logger.error(`Global error: ${error.message}`, {
      stack: error.stack,
      path: req.path,
      method: req.method,
    });
    res.status(500).json({ error: "Внутренняя ошибка сервера" });
  },
);

// Запуск HTTPS сервера, если есть сертификаты
let server;
if (fs.existsSync("./localhost-key.pem") && fs.existsSync("./localhost.pem")) {
  const options = {
    key: fs.readFileSync("./localhost-key.pem"),
    cert: fs.readFileSync("./localhost.pem"),
  };
  server = https.createServer(options, app);
  logger.info("✅ Запуск сервера по HTTPS");
} else {
  server = app;
  logger.info("⚠️ Сертификаты не найдены, запуск по HTTP");
}

// Запуск крона очистки и напоминаний
container.get(ServiceKeys.TRAINING_CLEANUP_SERVICE);

server.listen(PORT, "0.0.0.0", () => {
  logger.info(
    `🚀 Server running: ${server === app ? "http" : "https"}://localhost:${PORT}`,
  );
  logger.info(
    `📊 Rate limits: auth=${RATE_LIMIT_AUTH_MAX}/15m, api=${RATE_LIMIT_API_MAX}/15m`,
  );
});
