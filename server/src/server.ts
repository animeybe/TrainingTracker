import express from "express";
import cors from "cors";
import authRoutes from "./presentation/routes/auth";
import { logger } from "./utils/logger";

const app = express();
const PORT = 3001;

// Middleware
app.use(
  cors({
    origin: "http://localhost:5173",
    credentials: true,
  }),
);
app.use(express.json({ limit: "10mb" }));

app.use((req, res, next) => {
  logger.info(`${req.method} ${req.path} - body: ${JSON.stringify(req.body)}`);
  next();
});

// Routes
app.use("/api/auth", authRoutes);

// Health check
app.get("/api/health", (req, res) => {
  res.json({
    status: "OK",
    timestamp: new Date().toISOString(),
    version: "1.0.0",
  });
});

app.use((req, res) => {
  logger.warn(`${req.method} ${req.path} - 404 Not Found`);
  res.status(404).json({ error: "Route not found" });
});

app.listen(PORT, () => {
  logger.info(`🚀 Server: http://localhost:${PORT}`);
});
