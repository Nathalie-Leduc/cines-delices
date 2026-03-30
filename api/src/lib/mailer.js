import nodemailer from 'nodemailer';

// ============================================================
// SERVICE EMAIL — Nodemailer
// ============================================================
//
// 🍽️ Analogie : c'est le système de courrier du restaurant.
// On configure une seule fois l'adresse de l'expéditeur,
// puis on envoie des lettres (emails) aux clients quand nécessaire.
//
// Deux modes :
//   - DEV  : Mailtrap (les emails sont capturés, jamais envoyés)
//   - PROD : Brevo/Sendinblue (300 emails/jour gratuit)
//
// Configuration via .env :
//   SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS, SMTP_FROM
// ============================================================

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: Number(process.env.SMTP_PORT) || 587,
  secure: Number(process.env.SMTP_PORT) === 465, // true pour 465, false pour 587
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

/**
 * Envoie un email.
 *
 * @param {Object} options
 * @param {string} options.to      - Adresse du destinataire
 * @param {string} options.subject - Objet de l'email
 * @param {string} options.html    - Contenu HTML de l'email
 * @returns {Promise<boolean>}     - true si envoyé, false sinon
 */
export async function sendEmail({ to, subject, html }) {
  // Si le SMTP n'est pas configuré, on log et on skip
  // (évite de planter l'app si les vars .env sont absentes)
  if (!process.env.SMTP_HOST || !process.env.SMTP_USER) {
    console.warn(`[MAILER] SMTP non configuré — email ignoré : "${subject}" → ${to}`);
    return false;
  }

  try {
    const info = await transporter.sendMail({
      from: process.env.SMTP_FROM || '"Ciné Délices" <noreply@cine-delices.fr>',
      to,
      subject,
      html,
    });

    console.log(`[MAILER] Email envoyé à ${to} : "${subject}" (id: ${info.messageId})`);
    return true;
  } catch (error) {
    console.error(`[MAILER] Erreur envoi email à ${to} :`, error.message);
    return false;
  }
}

/**
 * Vérifie que la connexion SMTP fonctionne.
 * Utile au démarrage de l'app pour détecter les erreurs de config.
 */
export async function verifyMailer() {
  if (!process.env.SMTP_HOST || !process.env.SMTP_USER) {
    console.warn('[MAILER] SMTP non configuré — envoi d\'emails désactivé');
    return false;
  }

  try {
    await transporter.verify();
    console.log('[MAILER] Connexion SMTP vérifiée');
    return true;
  } catch (error) {
    console.error('[MAILER] Connexion SMTP échouée :', error.message);
    return false;
  }
}

export default transporter;
