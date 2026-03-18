import express from 'express';
import { getAllMedias, getMediaById, searchMedia } from '../controllers/tmdbConstrollers.js';

const router = express.Router();

router.get('/medias/search', searchMedia);
router.get('/medias/:type/:id', getMediaById);
router.get('/medias/:type', getAllMedias);
router.get('/medias', getAllMedias);

export default router;
