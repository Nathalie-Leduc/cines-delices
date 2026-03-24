import express from 'express';
import { getPublishedMoviesCatalog, getPublishedSeriesCatalog } from '../controllers/mediaController.js';

const router = express.Router();

router.get('/movies', getPublishedMoviesCatalog);
router.get('/series', getPublishedSeriesCatalog);

export default router;
