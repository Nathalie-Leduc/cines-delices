import express from 'express';
import { getMe, getMyRecipes } from '../controllers/index.js';
import { authMiddleware } from '../middlewares/authMiddleware.js';

const router = express.Router();

// Route pour récupérer le profil de l'utilisateur connecté
router.get('/me', authMiddleware, getMe);

// Route pour récupérer les recettes de l'utilisateur connecté
router.get('/me/recipes', authMiddleware, getMyRecipes);

export default router;
