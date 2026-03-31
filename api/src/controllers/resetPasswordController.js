import argon2 from 'argon2';
import { prisma } from '../lib/prisma.js';
import { sendPasswordChangedMail } from '../lib/mailer.js';

// Fonction appelée quand l'utilisateur envoie son nouveau mot de passe
export const resetPassword = async (req, res) => {

  // On récupère le token et le nouveau mot de passe
  const { token, password } = req.body;

  if (!token || !password) {
    return res.status(400).json({ message: "Token et mot de passe requis" });
  }

  // Recherche d'un utilisateur avec :
  // - le bon token
  // - un token encore valide (non expiré)
  const user = await prisma.user.findFirst({
    where: {
      resetToken: token,
      resetTokenExpires: {
        gte: new Date() // gte = "greater than or equal" (pas expiré)
      }
    }
  });

  // Si aucun utilisateur trouvé → token invalide ou expiré
  if (!user) {
    return res.status(400).json({
      message: "Token invalide ou expiré"
    });
  }

  // Hash du mot de passe (sécurité)
  const hashedPassword = await argon2.hash(password);

  // Mise à jour en base
  await prisma.user.update({
    where: { id: user.id },
    data: {
      passwordHash: hashedPassword, // nouveau mot de passe sécurisé
      resetToken: null,         // suppression du token
      resetTokenExpires: null   // suppression de l'expiration
    }
  });
  // Envoi d'un email de confirmation de changement de mot de passe
  try {
    await sendPasswordChangedMail(user.email);
    console.log("✅ Mail confirmation envoyé");
  } catch (err) {
    console.error('Erreur envoi mail de confirmation:', err);
    // Ne pas révéler l'échec à l'utilisateur
  }

  // Réponse OK
  return res.json({ message: "Mot de passe mis à jour" });
};


