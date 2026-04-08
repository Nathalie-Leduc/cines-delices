import { prisma } from '../lib/prisma.js';
import { formatNotification, sendError } from './adminHelpers.js';

export async function getAdminNotifications(req, res) {
  try {
    const rawLimit = Number.parseInt(String(req.query.limit || '10'), 10);
    const limit = Number.isFinite(rawLimit) && rawLimit > 0
      ? Math.min(rawLimit, 100)
      : 10;

    await prisma.notification.deleteMany({
      where: {
        userId: req.user.id,
        isRead: false,
        OR: [
          { message: { startsWith: 'Nouvelle recette soumise:' }, recipeId: null },
          { message: { startsWith: 'Recette modifiée à valider de nouveau :' }, recipeId: null },
          {
            recipeId: { not: null },
            recipe: { is: { status: { not: 'PENDING' } } },
          },
        ],
      },
    });

    const notifications = await prisma.notification.findMany({
      where: { userId: req.user.id, isRead: false },
      orderBy: { createdAt: 'desc' },
      take: limit,
    });

    const unreadCount = await prisma.notification.count({
      where: { userId: req.user.id, isRead: false },
    });

    return res.json({
      unreadCount,
      notifications: notifications.map(formatNotification),
    });
  } catch (error) {
    return sendError(res, error, 'Erreur lors de la récupération des notifications admin.');
  }
}

export async function deleteAdminNotification(req, res) {
  try {
    const notificationId = String(req.params.id || '').trim();

    if (!notificationId) {
      return res.status(400).json({ message: 'Identifiant de notification invalide.' });
    }

    const deleted = await prisma.notification.deleteMany({
      where: { id: notificationId, userId: req.user.id },
    });

    if (deleted.count === 0) {
      return res.status(404).json({ message: 'Notification introuvable.' });
    }

    return res.status(204).send();
  } catch (error) {
    return sendError(res, error, 'Erreur lors de la suppression de la notification admin.');
  }
}
