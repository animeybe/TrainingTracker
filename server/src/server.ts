import express from "express";
import cors from "cors";
import path from "path";
import jwt from "jsonwebtoken";
import authRoutes from "./presentation/routes/auth";
import { logger } from "./utils/logger";

const app = express();
const PORT = 3001;

app.use(express.json({ limit: "10mb" }));

app.use((req, res, next) => {
  logger.info(
    `${req.method} ${req.originalUrl} - body: ${JSON.stringify(req.body)}`,
  );
  next();
});

app.use(
  cors({
    origin: "http://localhost:5173",
    credentials: true,
    allowedHeaders: ["Content-Type", "Authorization"],
    exposedHeaders: ["Authorization"],
  }),
);

app.use((req, res, next) => {
  const PUBLIC_PATHS = ["/login", "/register"];

  if (PUBLIC_PATHS.includes(req.path)) {
    const token =
      req.headers.authorization?.replace("Bearer ", "") || req.cookies?.token;

    if (token) {
      try {
        jwt.verify(token, process.env.JWT_SECRET!);
        return res.redirect(307, "/dashboard");
      } catch {
        return next();
      }
    }
  }

  next();
});

// Routes
app.use("/api/auth", authRoutes);

app.get("/api/health", (req, res) => {
  res.json({
    status: "OK",
    timestamp: new Date().toISOString(),
    version: "1.0.0",
  });
});

app.get(
  [
    "/login",
    "/register",
    "/dashboard",
    "/profile",
    "/admin",
    "/workouts",
    "/exercises",
    "/logout",
  ],
  (req, res) => {
    res.sendFile(path.resolve(__dirname, "../../pwa/dist/index.html"));
  },
);

app.get("/*splat", (req, res) => {
  if (!req.originalUrl.startsWith("/api")) {
    res.sendFile(path.resolve(__dirname, "../../pwa/dist/index.html"));
  } else {
    res.status(404).json({ error: "API route not found" });
  }
});

app.listen(PORT, () => {
  logger.info(`Server: http://localhost:${PORT}`);
});
