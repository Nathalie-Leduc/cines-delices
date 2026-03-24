import express from 'express';
import { getPublishedMoviesCatalog } from '../controllers/mediaController.js';

const router = express.Router();

router.get('/movies', getPublishedMoviesCatalog);

export default router;
