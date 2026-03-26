import express from 'express';
import { createIngredient, searchIngredients } from '../controllers/ingredientsController.js';

const router = express.Router();

router.get('/search', searchIngredients);
router.post('/', createIngredient);

export default router;
