import express from 'express';
import { deleteMyNotification, getMe, getMyNotifications, getMyRecipes } from '../controllers/index.js';
import { authMiddleware } from '../middlewares/authMiddleware.js';

const router = express.Router();

// Route pour récupérer le profil de l'utilisateur connecté
router.get('/me', authMiddleware, getMe);

// Route pour récupérer les recettes de l'utilisateur connecté
router.get('/me/recipes', authMiddleware, getMyRecipes);

// Route pour récupérer les notifications de l'utilisateur connecté
router.get('/me/notifications', authMiddleware, getMyNotifications);

// Route pour supprimer une notification du membre
router.delete('/me/notifications/:id', authMiddleware, deleteMyNotification);

export default router;
