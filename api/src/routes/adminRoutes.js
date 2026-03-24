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
	getAdminNotifications,
	getAdminRecipes,
	getAdminUsers,
	getPendingRecipes,
	rejectRecipe,
	updateAdminRecipe,
	updateCategory,
	updateIngredient,
	updateUserRole,
} from "../controllers/adminController.js";
import { authMiddleware } from "../middlewares/authMiddleware.js";
import { adminMiddleware } from "../middlewares/adminMiddleware.js";

const router = express.Router();

// Toutes les routes admin nécessitent d'être authentifié ET admin
router.use(authMiddleware, adminMiddleware);

router.get('/recipes', getAdminRecipes);
router.get('/recipes/pending', getPendingRecipes);
router.patch('/recipes/:id', updateAdminRecipe);
router.patch('/recipes/:id/approve', approveRecipe);
router.patch('/recipes/:id/reject', rejectRecipe);
router.delete('/recipes/:id', deleteRecipe);

router.get('/users', getAdminUsers);
router.get('/notifications', getAdminNotifications);
router.patch('/users/:id/role', updateUserRole);
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