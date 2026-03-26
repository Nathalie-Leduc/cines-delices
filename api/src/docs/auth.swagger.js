/**
 * @openapi
 * components:
 *   schemas:
 *     AuthUser:
 *       type: object
 *       required:
 *         - id
 *         - email
 *         - pseudo
 *         - role
 *         - createdAt
 *       properties:
 *         id:
 *           type: string
 *           format: uuid
 *           example: 27273931-fd90-4a0e-9078-f4378c5888d9
 *         email:
 *           type: string
 *           format: email
 *           example: marie@cinedelices.fr
 *         nom:
 *           type: string
 *           nullable: true
 *           example: Dupont
 *         pseudo:
 *           type: string
 *           example: marie.dupont
 *         role:
 *           type: string
 *           enum:
 *             - MEMBER
 *             - ADMIN
 *           example: MEMBER
 *         createdAt:
 *           type: string
 *           format: date-time
 *           example: 2026-03-26T10:00:00.000Z
 *     AuthTokenResponse:
 *       type: object
 *       required:
 *         - token
 *         - user
 *       properties:
 *         token:
 *           type: string
 *           description: JWT d'authentification
 *         user:
 *           $ref: '#/components/schemas/AuthUser'
 *     ErrorResponse:
 *       type: object
 *       required:
 *         - error
 *       properties:
 *         error:
 *           type: string
 *           example: Erreur serveur
 *         details:
 *           oneOf:
 *             - type: string
 *             - type: array
 *               items:
 *                 type: string
 *     ValidationErrorResponse:
 *       type: object
 *       required:
 *         - error
 *       properties:
 *         error:
 *           type: string
 *           example: Donnees invalides
 *         details:
 *           type: array
 *           items:
 *             type: string
 *           example:
 *             - body.email: Format email invalide
 *             - body.password: Le mot de passe est obligatoire
 */

/**
 * @openapi
 * /api/auth/register:
 *   post:
 *     summary: Creer un nouveau compte utilisateur
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
 *               - acceptedPolicies
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
 *                 example: MotDePasse123!
 *               acceptedPolicies:
 *                 type: boolean
 *                 example: true
 *     responses:
 *       201:
 *         description: Compte cree avec succes
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/AuthTokenResponse'
 *                 - type: object
 *                   properties:
 *                     message:
 *                       type: string
 *                       example: Compte cree avec succes
 *       400:
 *         description: Donnees invalides
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ValidationErrorResponse'
 *       409:
 *         description: Email ou pseudo deja utilise
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       500:
 *         description: Erreur serveur
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */

/**
 * @openapi
 * /api/auth/login:
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
 *                 example: MotDePasse123!
 *     responses:
 *       200:
 *         description: Connexion reussie
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/AuthTokenResponse'
 *       400:
 *         description: Donnees invalides
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ValidationErrorResponse'
 *       401:
 *         description: Email ou mot de passe incorrect
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       500:
 *         description: Erreur serveur
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */

/**
 * @openapi
 * /api/auth/logout:
 *   get:
 *     summary: Deconnecter l'utilisateur
 *     tags:
 *       - Auth
 *     responses:
 *       200:
 *         description: Deconnexion reussie
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               required:
 *                 - message
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Deconnecte avec succes
 */

/**
 * @openapi
 * /api/auth/me:
 *   get:
 *     summary: Recuperer le profil utilisateur connecte
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
 *               allOf:
 *                 - $ref: '#/components/schemas/AuthUser'
 *                 - type: object
 *                   properties:
 *                     _count:
 *                       type: object
 *                       properties:
 *                         recipes:
 *                           type: integer
 *                           example: 3
 *       401:
 *         description: Non authentifie (JWT manquant ou invalide)
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       404:
 *         description: Utilisateur introuvable
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       500:
 *         description: Erreur serveur
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *   put:
 *     summary: Mettre a jour le profil utilisateur connecte
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
 *         description: Profil mis a jour
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               required:
 *                 - message
 *                 - user
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Profil mis a jour
 *                 user:
 *                   $ref: '#/components/schemas/AuthUser'
 *       400:
 *         description: Donnees invalides
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ValidationErrorResponse'
 *       401:
 *         description: Non authentifie (JWT manquant ou invalide)
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       409:
 *         description: Email ou pseudo deja utilise
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       500:
 *         description: Erreur serveur
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *   patch:
 *     summary: Mettre a jour partiellement le profil utilisateur connecte
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
 *         description: Profil mis a jour
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               required:
 *                 - message
 *                 - user
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Profil mis a jour
 *                 user:
 *                   $ref: '#/components/schemas/AuthUser'
 *       400:
 *         description: Donnees invalides
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ValidationErrorResponse'
 *       401:
 *         description: Non authentifie (JWT manquant ou invalide)
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       409:
 *         description: Email ou pseudo deja utilise
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       500:
 *         description: Erreur serveur
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *   delete:
 *     summary: Supprimer le compte utilisateur connecte
 *     tags:
 *       - Auth
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Compte supprime
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               required:
 *                 - message
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Compte supprime
 *       401:
 *         description: Non authentifie (JWT manquant ou invalide)
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       500:
 *         description: Erreur serveur
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */

/**
 * @openapi
 * /api/auth/me/password:
 *   put:
 *     summary: Mettre a jour le mot de passe de l'utilisateur connecte
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
 *             required:
 *               - currentPassword
 *               - newPassword
 *               - confirmPassword
 *             properties:
 *               currentPassword:
 *                 type: string
 *                 format: password
 *                 example: AncienMdp123!
 *               newPassword:
 *                 type: string
 *                 format: password
 *                 example: NouveauMdp123!
 *               confirmPassword:
 *                 type: string
 *                 format: password
 *                 example: NouveauMdp123!
 *     responses:
 *       200:
 *         description: Mot de passe mis a jour
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               required:
 *                 - message
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Mot de passe mis a jour
 *       400:
 *         description: Donnees invalides ou mot de passe actuel incorrect
 *         content:
 *           application/json:
 *             schema:
 *               oneOf:
 *                 - $ref: '#/components/schemas/ValidationErrorResponse'
 *                 - $ref: '#/components/schemas/ErrorResponse'
 *       401:
 *         description: Non authentifie (JWT manquant ou invalide)
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       404:
 *         description: Utilisateur introuvable
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       500:
 *         description: Erreur serveur
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
