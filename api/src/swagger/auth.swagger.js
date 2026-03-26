/**
 * @swagger
 * components:
 *   schemas:
 *     User:
 *       type: object
 *       properties:
 *         id:
 *           type: integer
 *           example: 1
 *         email:
 *           type: string
 *           example: marie@cinedelices.fr
 *         nom:
 *           type: string
 *           example: Dupont
 *         prenom:
 *           type: string
 *           example: Marie
 *         pseudo:
 *           type: string
 *           example: marie.dupont
 *         role:
 *           type: string
 *           example: membre
 *         createdAt:
 *           type: string
 *           format: date-time
 *           example: 2024-03-26T10:00:00.000Z
 *     ErrorResponse:
 *       type: object
 *       properties:
 *         error:
 *           type: string
 *           example: Erreur serveur
 *         details:
 *           type: string
 *           example: Stacktrace ou message détaillé
 */
/**
 * @swagger
 * /me:
 *   delete:
 *     summary: Supprimer le compte utilisateur connecté
 *     tags:
 *       - Auth
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Compte supprimé
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Compte supprimé
 *       401:
 *         description: Non authentifié (JWT manquant ou invalide)
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: Token manquant ou invalide
 *       500:
 *         description: Erreur serveur
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: Erreur serveur
 *                 details:
 *                   type: string
 */
/**
 * @swagger
 * /me:
 *   put:
 *     summary: Mettre à jour le profil utilisateur connecté
 *     tags:
 *       - Auth
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               nom:
 *                 type: string
 *                 example: Dupont
 *               pseudo:
 *                 type: string
 *                 example: marie.dupont
 *               email:
 *                 type: string
 *                 format: email
 *                 example: marie@cinedelices.fr
 *     responses:
 *       200:
 *         description: Profil mis à jour
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Profil mis à jour
 *                 user:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: integer
 *                     email:
 *                       type: string
 *                     nom:
 *                       type: string
 *                     pseudo:
 *                       type: string
 *                     role:
 *                       type: string
 *                     createdAt:
 *                       type: string
 *                       format: date-time
 *       400:
 *         description: Données invalides
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: Données invalides
 *       401:
 *         description: Non authentifié (JWT manquant ou invalide)
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: Token manquant ou invalide
 *       409:
 *         description: Email ou pseudo déjà utilisé
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: Email ou pseudo déjà utilisé
 *       500:
 *         description: Erreur serveur
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: Erreur serveur
 *                 details:
 *                   type: string
 */
/**
 * @swagger
 * /me:
 *   get:
 *     summary: Récupérer les informations du profil utilisateur connecté
 *     tags:
 *       - Auth
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Informations du profil utilisateur
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 id:
 *                   type: integer
 *                 email:
 *                   type: string
 *                 nom:
 *                   type: string
 *                 pseudo:
 *                   type: string
 *                 role:
 *                   type: string
 *                 createdAt:
 *                   type: string
 *                   format: date-time
 *                 _count:
 *                   type: object
 *                   properties:
 *                     recipes:
 *                       type: integer
 *       401:
 *         description: Non authentifié (JWT manquant ou invalide)
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: Token manquant ou invalide
 *       404:
 *         description: Utilisateur introuvable
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: Utilisateur introuvable
 *       500:
 *         description: Erreur serveur
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: Erreur serveur
 *                 details:
 *                   type: string
 */
/**
 * @swagger
 * /logout:
 *   get:
 *     summary: Déconnecter l'utilisateur
 *     tags:
 *       - Auth
 *     responses:
 *       200:
 *         description: Déconnexion réussie
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Déconnecté avec succès
 */
/**
 * @swagger
 * /login:
 *   post:
 *     summary: Authentifier un utilisateur
 *     tags:
 *       - Auth
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - password
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 example: marie@cinedelices.fr
 *               password:
 *                 type: string
 *                 format: password
 *                 example: "MotDePasse123!"
 *     responses:
 *       200:
 *         description: Connexion réussie
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 token:
 *                   type: string
 *                   description: JWT d'authentification
 *                 user:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: integer
 *                     email:
 *                       type: string
 *                     nom:
 *                       type: string
 *                     pseudo:
 *                       type: string
 *                     role:
 *                       type: string
 *       401:
 *         description: Email ou mot de passe incorrect
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: Email ou mot de passe incorrect
 *       500:
 *         description: Erreur serveur
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: Erreur serveur
 *                 details:
 *                   type: string
 */
/**
 * @swagger
 * /register:
 *   post:
 *     summary: Cr e9er un nouveau compte utilisateur
 *     tags:
 *       - Auth
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - nom
 *               - prenom
 *               - password
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 example: marie@cinedelices.fr
 *               nom:
 *                 type: string
 *                 example: Dupont
 *               prenom:
 *                 type: string
 *                 example: Marie
 *               pseudo:
 *                 type: string
 *                 example: marie.dupont
 *               password:
 *                 type: string
 *                 format: password
 *                 example: "MotDePasse123!"
 *     responses:
 *       201:
 *         description: Compte cr e9 e9 avec succ e8s
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Compte cr e9 e9 avec succ e8s 3ac
 *                 token:
 *                   type: string
 *                   description: JWT d'authentification
 *                 user:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: integer
 *                     email:
 *                       type: string
 *                     nom:
 *                       type: string
 *                     pseudo:
 *                       type: string
 *                     role:
 *                       type: string
 *       409:
 *         description: Email ou pseudo d e9j e0 utilis e9
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: Ce pseudo est d e9j e0 utilis e9
 *       500:
 *         description: Erreur serveur
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: Erreur serveur
 *                 details:
 *                   type: string
 */
