import { prisma } from '../lib/prisma.js';
import { formatUser, sendError } from './adminHelpers.js';

export async function getAdminUsers(req, res) {
  try {
    const search = String(req.query.search || '').trim();
    const users = await prisma.user.findMany({
      where: search
        ? {
            OR: [
              { pseudo: { contains: search, mode: 'insensitive' } },
              { email: { contains: search, mode: 'insensitive' } },
            ],
          }
        : undefined,
      include: {
        _count: { select: { recipes: true } },
        recipes: { include: { category: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    const formattedUsers = users.map((user) => ({
      id: user.id,
      nom: user.nom || '',
      prenom: user.pseudo,
      displayName: user.pseudo,
      email: user.email,
      role: user.role,
      totalRecipes: user._count.recipes,
      recipeCounts: formatUser(user).recipeCounts,
    }));

    return res.json(formattedUsers);
  } catch (error) {
    return sendError(res, error, 'Erreur lors de la récupération des utilisateurs admin.');
  }
}

export async function deleteUser(req, res) {
  try {
    const targetUserId = req.params.id;

    if (req.user.id === targetUserId) {
      return res.status(403).json({
        message: 'Vous ne pouvez pas supprimer votre propre compte depuis le panel admin.',
      });
    }

    const userToDelete = await prisma.user.findUnique({
      where: { id: targetUserId },
      include: { _count: { select: { recipes: true } } },
    });

    if (!userToDelete) {
      return res.status(404).json({ message: 'Utilisateur introuvable.' });
    }

    await prisma.$transaction(async (tx) => {
      await tx.recipe.deleteMany({
        where: { userId: targetUserId, status: { in: ['DRAFT', 'PENDING'] } },
      });
      await tx.user.delete({ where: { id: targetUserId } });
    });

    return res.status(204).send();
  } catch (error) {
    if (error.code === 'P2025') {
      return res.status(404).json({ message: 'Utilisateur introuvable.' });
    }
    return sendError(res, error, "Erreur lors de la suppression de l'utilisateur.");
  }
}

export async function updateUserRole(req, res) {
  try {
    const { id } = req.params;
    const { role } = req.body;

    if (role !== 'MEMBER' && role !== 'ADMIN') {
      return res.status(400).json({ message: 'Rôle invalide. Valeurs acceptées : MEMBER, ADMIN.' });
    }

    if (req.user.id === id) {
      return res.status(403).json({ message: 'Vous ne pouvez pas modifier votre propre rôle.' });
    }

    const user = await prisma.user.update({
      where: { id },
      data: { role },
      include: { recipes: { include: { category: true } } },
    });

    return res.json(formatUser(user));
  } catch (error) {
    if (error.code === 'P2025') {
      return res.status(404).json({ message: 'Utilisateur introuvable.' });
    }
    return sendError(res, error, 'Erreur lors de la mise à jour du rôle.');
  }
}
