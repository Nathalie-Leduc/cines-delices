// Export des routes
import express from "express";
import tmdbRoutes from "./tmdbRoutes.js";

const router = express.Router()

// Toutes les routes TMDB seront sous le préfixe /api/tmdb
router.use("/tmdb", tmdbRoutes);

export default router;
