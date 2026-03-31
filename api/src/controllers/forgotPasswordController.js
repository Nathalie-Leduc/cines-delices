import crypto from 'crypto';
import { prisma } from '../lib/prisma.js';
import { sendResetPasswordMail } from '../lib/mailer.js';
import 'dotenv/config';

console.log('FORGOT CONTROLLER OK');

// Fonction appelée quand l'utilisateur demande "mot de passe oublié"

export const forgotPassword = async (req, res) => {
  console.log('FORGOT ROUTE OK');

  // On récupère l'email envoyé par le frontend
  const { email } = req.body;

  // Vérification : email obligatoire
  if (!email) {
    return res.status(400).json({ message: "Email requis" });
  }

  // Recherche de l'utilisateur en base
  const user = await prisma.user.findUnique({
    where: { email }
  });

  // Sécurité : on ne dit jamais si l'utilisateur existe ou non
  if (!user) {
    return res.status(200).json({
      message: "Si le compte existe, un email a été envoyé"
    });
  }

  // Génération d'un token aléatoire sécurisé (32 bytes)
  const resetToken = crypto.randomBytes(32).toString('hex');
  console.log("TOKEN RESET :", resetToken); 
  // Définition d'une date d'expiration (15 minutes)
  const expires = new Date(Date.now() + 15 * 60 * 1000);

  // Mise à jour de l'utilisateur en base avec le token et son expiration
  await prisma.user.update({
    where: { email },
    data: {
      resetToken,
      resetTokenExpires: expires
    }
  });

  // Construction du lien de réinitialisation (adapter l'URL à ton domaine)
  const baseUrl = process.env.CLIENT_URL || 'http://localhost:5173';
  const resetLink = `${baseUrl}/reset-password?token=${resetToken}`;

  // Envoi de l'email de simulation
  try {
    await sendResetPasswordMail(email, resetLink);
  } catch (err) {
    console.error('Erreur envoi mail:', err);
    // On ne révèle pas l'échec à l'utilisateur pour la sécurité
  }

  // Réponse envoyée au frontend (toujours la même pour la sécurité)
  return res.status(200).json({
    message: "Si le compte existe, un email a été envoyé"
  });
  
};