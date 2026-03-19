// Export des routes
import express from "express";
import tmdbRoutes from "./tmdbRoutes.js";
import usersRoutes from "./usersRoutes.js";
import adminRoutes from "./adminRoutes.js";

const router = express.Router()

// Toutes les routes TMDB seront sous le préfixe /api/tmdb
router.use("/tmdb", tmdbRoutes);
router.use('/users', usersRoutes);
router.use('/admin', adminRoutes);

export default router;
