/**
 * @openapi
 * tags:
 *   - name: Contact
 *     description: Formulaire de contact.
 * paths:
 *   /api/contact:
 *     post:
 *       summary: Envoyer un message de contact
 *       tags: [Contact]
 *       requestBody:
 *         required: true
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               required: [name, email, message]
 *               properties:
 *                 name:
 *                   type: string
 *                   example: Marie Dupont
 *                 email:
 *                   type: string
 *                   format: email
 *                   example: marie@exemple.fr
 *                 message:
 *                   type: string
 *                   example: Bonjour, je souhaite signaler un probleme.
 *       responses:
 *         200:
 *           description: Message envoye avec succes.
 *           content:
 *             application/json:
 *               schema:
 *                 type: object
 *                 properties:
 *                   message:
 *                     type: string
 *                     example: Message envoye avec succes.
 *         400:
 *           description: Donnees invalides.
 *         500:
 *           description: Erreur lors de l'envoi.
 */

export {};
