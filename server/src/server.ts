import express from "express";
import cors from "cors";
import path from "path";
import { logger } from "./common/utils";
import apiRouter from "./presentation/routes"; // ✅ Barrel export
import { authenticateToken } from "./presentation/middleware/auth.middleware";
import {
  requireUser,
  requireAdmin,
} from "./presentation/middleware/roles.middleware";

const app = express();
const PORT = process.env.PORT || 3001;
const DIST_PATH = path.resolve(__dirname, "../../pwa/dist");

app.use(express.json({ limit: "10mb" }));
app.use(express.static(DIST_PATH));
app.use(cors({ origin: process.env.FRONTEND_URL || "http://localhost:5173" }));

// 🔥 API (все роуты через presentation)
app.use("/api", apiRouter);

// 🔥 SPA + Auth guards
app.get("/dashboard", authenticateToken, requireUser, (req, res) => {
  res.sendFile(path.join(DIST_PATH, "index.html"));
});

app.get("*", (req, res) => {
  res.sendFile(path.join(DIST_PATH, "index.html"));
});

app.listen(PORT, () => {
  logger.info(`Server running: http://localhost:${PORT}`);
});
