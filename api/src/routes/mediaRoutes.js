import express from 'express';
import {
  getPublishedMovieBySlug,
  getPublishedMoviesCatalog,
  getPublishedSeriesBySlug,
  getPublishedSeriesCatalog,
} from '../controllers/mediaController.js';

const router = express.Router();

router.get('/movies', getPublishedMoviesCatalog);
router.get('/movies/:slug', getPublishedMovieBySlug);
router.get('/series', getPublishedSeriesCatalog);
router.get('/series/:slug', getPublishedSeriesBySlug);

export default router;
