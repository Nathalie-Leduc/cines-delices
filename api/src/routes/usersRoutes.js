import express from 'express';
import { getMyRecipes } from '../controllers/index.js';
import { requireAuth } from '../middlewares/index.js';

const router = express.Router();

router.get('/me/recipes', requireAuth, getMyRecipes);

export default router;
