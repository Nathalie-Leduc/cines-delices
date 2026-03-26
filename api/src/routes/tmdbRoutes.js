import express from "express";
import { getAllMedias, getMediaById, searchMedia } from "../controllers/index.js";
import tmdbRateLimiter from "../middlewares/tmdbRateLimiter.js";

const router = express.Router();

// ============================================================
// ROUTES TMDB — protégées par rate limiting
// ============================================================
//
// Le rate limiter s'applique à TOUTES les routes de ce fichier.
// Chaque IP est limitée à 30 requêtes/minute sur ces endpoints.

// ============================================================

router.get('/medias/search', searchMedia);
router.get('/medias/:type/:id', getMediaById);
router.get('/medias/:type', getAllMedias);
router.get('/medias', getAllMedias);

export default router;
