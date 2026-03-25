import express from 'express';
import {
  createRecipe,
  deleteRecipe,
  getAllPublishedRecipes,
  getMyRecipes,
  getRecipe,
  submitRecipe,
  updateRecipe,
} from '../controllers/recipesController.js';
import { authMiddleware } from '../middlewares/authMiddleware.js';
import { handleRecipeImageUpload, parseRecipeMultipartFields } from '../middlewares/recipeImageUploadMiddleware.js';
import { validate } from '../middlewares/validateMiddleware.js';
import {
  createRecipeSchema,
  deleteRecipeSchema,
  getRecipeSchema,
  listRecipesSchema,
  submitRecipeSchema,
  updateRecipeSchema,
} from '../validators/recipesValidator.js';

const router = express.Router();

router.get('/', validate(listRecipesSchema), getAllPublishedRecipes);
router.get('/mine', authMiddleware, getMyRecipes);
router.get('/:id', validate(getRecipeSchema), getRecipe);
router.post('/', authMiddleware, handleRecipeImageUpload, parseRecipeMultipartFields, validate(createRecipeSchema), createRecipe);
router.patch('/:id', authMiddleware, handleRecipeImageUpload, parseRecipeMultipartFields, validate(updateRecipeSchema), updateRecipe);
router.patch('/:id/submit', authMiddleware, validate(submitRecipeSchema), submitRecipe);
router.delete('/:id', authMiddleware, validate(deleteRecipeSchema), deleteRecipe);

export default router;
