// routes/index.ts

import { Router } from "express";

import authRoutes from "./auth.routes";
import exerciseRoutes from "./exercise.routes";
import profileRoutes from "./profile.routes";
import favoriteRoutes from "./favorite.routes";
import leastFavoriteRoutes from "./least-favorite.routes";
import planRoutes from "./plan.routes";

const apiRouter = Router();

apiRouter.use("/auth", authRoutes);
apiRouter.use("/exercises", exerciseRoutes);
apiRouter.use("/profile", profileRoutes);
apiRouter.use("/favorites", favoriteRoutes);
apiRouter.use("/least-favorites", leastFavoriteRoutes);
apiRouter.use("/plan", planRoutes);

export default apiRouter;
