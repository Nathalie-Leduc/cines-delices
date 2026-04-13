import express from 'express';
import { createIngredient, searchIngredients } from '../controllers/ingredientsController.js';
import { authMiddleware } from '../middlewares/authMiddleware.js';

const router = express.Router();

// Recherche publique — les visiteurs peuvent voir les ingrédients
router.get('/search', searchIngredients);

// Création protégée — seuls les membres connectés peuvent créer des ingrédients
router.post('/', authMiddleware, createIngredient);

export default router;
