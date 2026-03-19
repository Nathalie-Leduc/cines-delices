import express from "express";
import {
	approveIngredient,
	approveRecipe,
	createCategory,
	deleteCategory,
	deleteIngredient,
	deleteRecipe,
	deleteUser,
	getAdminCategories,
	getAdminIngredients,
	getAdminRecipes,
	getAdminUsers,
	getPendingRecipes,
	rejectRecipe,
	updateCategory,
	updateIngredient,
} from "../controllers/adminController.js";

const router = express.Router();

router.get('/recipes', getAdminRecipes);
router.get('/recipes/pending', getPendingRecipes);
router.patch('/recipes/:id/approve', approveRecipe);
router.patch('/recipes/:id/reject', rejectRecipe);
router.delete('/recipes/:id', deleteRecipe);

router.get('/users', getAdminUsers);
router.delete('/users/:id', deleteUser);

router.get('/categories', getAdminCategories);
router.post('/categories', createCategory);
router.patch('/categories/:id', updateCategory);
router.delete('/categories/:id', deleteCategory);

router.get('/ingredients', getAdminIngredients);
router.patch('/ingredients/:id', updateIngredient);
router.patch('/ingredients/:id/approve', approveIngredient);
router.delete('/ingredients/:id', deleteIngredient);

export default router;