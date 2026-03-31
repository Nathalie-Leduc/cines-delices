import jwt from 'jsonwebtoken';
import { prisma } from '../lib/prisma.js';

function normalizeField(value) {
  return String(value || '').trim();
}

async function resolveAuthenticatedSender(req) {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null;
  }

  try {
    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    return await prisma.user.findUnique({
      where: { id: decoded.id },
      select: {
        id: true,
        role: true,
        email: true,
        nom: true,
        pseudo: true,
      },
    });
  } catch {
    return null;
  }
}

function buildContactNotificationMessage({ nom, prenom, email, demande, sender }) {
  const fullName = [prenom, nom].filter(Boolean).join(' ').trim();
  const senderLabel = sender
    ? `Membre ${fullName || sender.pseudo || 'inconnu'}`
    : `Visiteur ${fullName || 'inconnu'}`;

  return `${senderLabel} (${email}) a envoyé un message via le formulaire de contact : ${demande}`;
}

export async function submitContactMessage(req, res) {
  try {
    const nom = normalizeField(req.body?.nom);
    const prenom = normalizeField(req.body?.prenom);
    const email = normalizeField(req.body?.email);
    const demande = normalizeField(req.body?.demande || req.body?.message);

    if (!nom) {
      return res.status(400).json({ message: 'Le nom est requis.' });
    }

    if (!prenom) {
      return res.status(400).json({ message: 'Le prénom est requis.' });
    }

    if (!email) {
      return res.status(400).json({ message: 'L\'adresse e-mail est requise.' });
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return res.status(400).json({ message: 'L\'adresse e-mail n\'est pas valide.' });
    }

    if (!demande) {
      return res.status(400).json({ message: 'Le message est requis.' });
    }

    const sender = await resolveAuthenticatedSender(req);
    const adminUsers = await prisma.user.findMany({
      where: { role: 'ADMIN' },
      select: { id: true },
    });

    if (adminUsers.length > 0) {
      const notificationMessage = buildContactNotificationMessage({
        nom,
        prenom,
        email,
        demande,
        sender,
      });

      await prisma.notification.createMany({
        data: adminUsers.map((admin) => ({
          type: 'RECIPE_SUBMITTED',
          message: notificationMessage,
          userId: admin.id,
          recipeId: null,
        })),
      });
    }

    return res.status(201).json({
      success: true,
      message: 'Message envoyé avec succès.',
    });
  } catch (error) {
    console.error('[submitContactMessage]', error);
    return res.status(500).json({ message: 'Erreur lors de l\'envoi du message de contact.' });
  }
}
