import { Router } from 'express';
import {
  createRecipe,
  deleteRecipe,
  getAllPublishedRecipes,
  getRecipe,
  updateRecipe,
} from '../controllers/recipesController.js';
import { authMiddleware } from '../middlewares/authMiddleware.js';
import { validate } from '../middlewares/validateMiddleware.js';
import {
  createRecipeSchema,
  deleteRecipeSchema,
  getRecipeSchema,
  updateRecipeSchema,
} from '../validators/recipesValidator.js';

const router = Router();

router.get('/', getAllPublishedRecipes);
router.get('/:id', validate(getRecipeSchema), getRecipe);

router.post('/', authMiddleware, validate(createRecipeSchema), createRecipe);
router.patch('/:id', authMiddleware, validate(updateRecipeSchema), updateRecipe);
router.delete('/:id', authMiddleware, validate(deleteRecipeSchema), deleteRecipe);

export default router;
