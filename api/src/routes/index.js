// Export des routes
import express from "express";
import tmdbRoutes from "./tmdbRoutes.js";
import usersRoutes from "./usersRoutes.js";
import adminRoutes from "./adminRoutes.js";
import authRoutes from "./authRoutes.js";
import recipesRoutes from "./recipesRoutes.js";

const router = express.Router()

// Toutes les routes seront sous le préfixe /api/
router.use('/tmdb', tmdbRoutes);
router.use('/users', usersRoutes);
router.use('/admin', adminRoutes);
router.use('/auth', authRoutes);
router.use('/recipes', recipesRoutes);

export default router;
