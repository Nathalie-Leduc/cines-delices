import express from 'express';
import { getMe, getMyRecipes } from '../controllers/index.js';
import { requireAuth } from '../middlewares/index.js';

const router = express.Router();

// Route pour récupérer le profil de l'utilisateur connecté
router.get('/me', requireAuth, getMe);

// Route pour récupérer les recettes de l'utilisateur connecté
router.get('/me/recipes', requireAuth, getMyRecipes);

export default router;
