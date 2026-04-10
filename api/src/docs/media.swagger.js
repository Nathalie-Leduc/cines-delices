/**
 * @openapi
 * tags:
 *   - name: Media
 *     description: Catalogue films et series associes aux recettes.
 * components:
 *   schemas:
 *     MediaItem:
 *       type: object
 *       required: [id, title, type]
 *       properties:
 *         id:
 *           type: string
 *           format: uuid
 *         title:
 *           type: string
 *           example: Matrix
 *         slug:
 *           type: string
 *           example: matrix-1999
 *         type:
 *           type: string
 *           enum: [MOVIE, SERIES]
 *           example: MOVIE
 *         year:
 *           type: string
 *           nullable: true
 *           example: '1999'
 *         posterUrl:
 *           type: string
 *           nullable: true
 *         director:
 *           type: string
 *           nullable: true
 *           example: Lana Wachowski
 *         synopsis:
 *           type: string
 *           nullable: true
 *         recipesCount:
 *           type: integer
 *           example: 4
 * paths:
 *   /api/media/movies:
 *     get:
 *       summary: Catalogue des films avec recettes publiees
 *       tags: [Media]
 *       responses:
 *         200:
 *           description: Liste des films.
 *           content:
 *             application/json:
 *               schema:
 *                 type: array
 *                 items:
 *                   $ref: '#/components/schemas/MediaItem'
 *   /api/media/movies/{slug}:
 *     get:
 *       summary: Detail d'un film par slug
 *       tags: [Media]
 *       parameters:
 *         - in: path
 *           name: slug
 *           required: true
 *           schema: { type: string }
 *           example: matrix-1999
 *       responses:
 *         200:
 *           description: Detail du film avec ses recettes.
 *           content:
 *             application/json:
 *               schema:
 *                 $ref: '#/components/schemas/MediaItem'
 *         404:
 *           description: Film introuvable.
 *   /api/media/series:
 *     get:
 *       summary: Catalogue des series avec recettes publiees
 *       tags: [Media]
 *       responses:
 *         200:
 *           description: Liste des series.
 *           content:
 *             application/json:
 *               schema:
 *                 type: array
 *                 items:
 *                   $ref: '#/components/schemas/MediaItem'
 *   /api/media/series/{slug}:
 *     get:
 *       summary: Detail d'une serie par slug
 *       tags: [Media]
 *       parameters:
 *         - in: path
 *           name: slug
 *           required: true
 *           schema: { type: string }
 *           example: breaking-bad-2008
 *       responses:
 *         200:
 *           description: Detail de la serie avec ses recettes.
 *           content:
 *             application/json:
 *               schema:
 *                 $ref: '#/components/schemas/MediaItem'
 *         404:
 *           description: Serie introuvable.
 */

export {};
