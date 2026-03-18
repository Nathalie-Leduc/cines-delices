// Export des routes
import express from "express";
import tmdbRoutes from "./tmdbRoutes.js";
import usersRoutes from "./usersRoutes.js";

const router = express.Router()

// Toutes les routes TMDB seront sous le préfixe /api/tmdb
router.use("/tmdb", tmdbRoutes);
router.use('/users', usersRoutes);

export default router;
