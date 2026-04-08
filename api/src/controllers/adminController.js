// adminController.js — barrel re-export
// Ce fichier re-exporte toutes les fonctions admin depuis leurs modules thématiques.
// adminRoutes.js importe depuis ici pour rester compatible sans modification.

export {
  getAdminRecipes,
  getPendingRecipes,
  publishRecipe,
  approveRecipe,
  rejectRecipe,
  deleteRecipe,
  updateAdminRecipe,
} from './adminRecipesController.js';

export {
  getAdminUsers,
  deleteUser,
  updateUserRole,
} from './adminUsersController.js';

export {
  getAdminCategories,
  createCategory,
  updateCategory,
  deleteCategory,
  getCategoryRecipes,
} from './adminCategoriesController.js';

export {
  getAdminIngredients,
  createAdminIngredient,
  updateIngredient,
  approveIngredient,
  deleteIngredient,
  getValidatedIngredients,
  getIngredientRecipes,
  mergeIngredients,
} from './adminIngredientsController.js';

export {
  getAdminNotifications,
  deleteAdminNotification,
} from './adminNotificationsController.js';
