import express from 'express';
import {
  createCategory,
  deleteCategory,
  getAdminCategories,
  updateCategory,
} from '../controllers/adminController.js';
import { authMiddleware } from '../middlewares/authMiddleware.js';
import { adminMiddleware } from '../middlewares/adminMiddleware.js';

const router = express.Router();
const adminCategoryGuards = [authMiddleware, adminMiddleware];

router.get('/', getAdminCategories);
router.post('/', ...adminCategoryGuards, createCategory);
router.patch('/:id', ...adminCategoryGuards, updateCategory);
router.delete('/:id', ...adminCategoryGuards, deleteCategory);

export default router;
