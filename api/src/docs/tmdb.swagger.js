/**
 * @openapi
 * tags:
 *   - name: TMDB - Search
 *     description: Recherche de medias via TMDB.
 *   - name: TMDB - Catalog
 *     description: Consultation du catalogue medias TMDB.
 * components:
 *   schemas:
 *     TmdbErrorResponse:
 *       type: object
 *       properties:
 *         message:
 *           type: string
 *           example: Erreur serveur lors de la recherche de media
 *     TmdbMedia:
 *       type: object
 *       required:
 *         - id
 *         - type
 *         - title
 *         - overview
 *       properties:
 *         id:
 *           type: integer
 *           example: 603
 *         type:
 *           type: string
 *           example: movie
 *         title:
 *           type: string
 *           example: Matrix
 *         overview:
 *           type: string
 *           example: Pas de description
 *         poster:
 *           type: string
 *           nullable: true
 *           example: https://image.tmdb.org/t/p/w500/demo.jpg
 *         year:
 *           type: string
 *           nullable: true
 *           example: '1999'
 *         genre:
 *           type: string
 *           nullable: true
 *           example: Action, Science-Fiction
 *         director:
 *           type: string
 *           nullable: true
 *           example: Lana Wachowski
 *     TmdbPagination:
 *       type: object
 *       required:
 *         - page
 *         - limit
 *         - totalItems
 *         - totalPages
 *         - hasNextPage
 *         - hasPreviousPage
 *       properties:
 *         page:
 *           type: integer
 *           example: 1
 *         limit:
 *           type: integer
 *           example: 15
 *         totalItems:
 *           type: integer
 *           example: 500
 *         totalPages:
 *           type: integer
 *           example: 34
 *         hasNextPage:
 *           type: boolean
 *           example: true
 *         hasPreviousPage:
 *           type: boolean
 *           example: false
 *     TmdbMovieCatalogResponse:
 *       type: object
 *       required:
 *         - movies
 *         - pagination
 *       properties:
 *         movies:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/TmdbMedia'
 *         pagination:
 *           $ref: '#/components/schemas/TmdbPagination'
 * paths:
 *   /api/tmdb/medias/search:
 *     get:
 *       summary: Rechercher des medias sur TMDB
 *       tags:
 *         - TMDB - Search
 *       parameters:
 *         - in: query
 *           name: searchTerm
 *           schema:
 *             type: string
 *           description: "Terme de recherche. Alias accepte: q."
 *           required: false
 *         - in: query
 *           name: q
 *           schema:
 *             type: string
 *           description: Alias de searchTerm.
 *           required: false
 *         - in: query
 *           name: type
 *           schema:
 *             type: string
 *             enum: [movie, tv]
 *           description: Filtre optionnel sur le type de media.
 *       responses:
 *         200:
 *           description: Resultats de recherche TMDB.
 *           content:
 *             application/json:
 *               schema:
 *                 type: array
 *                 items:
 *                   $ref: '#/components/schemas/TmdbMedia'
 *         400:
 *           description: Parametre de recherche manquant.
 *           content:
 *             application/json:
 *               schema:
 *                 $ref: '#/components/schemas/TmdbErrorResponse'
 *         500:
 *           description: Erreur serveur.
 *           content:
 *             application/json:
 *               schema:
 *                 $ref: '#/components/schemas/TmdbErrorResponse'
 *   /api/tmdb/medias/{type}:
 *     get:
 *       summary: Recuperer les medias par type
 *       tags:
 *         - TMDB - Catalog
 *       parameters:
 *         - in: path
 *           name: type
 *           required: true
 *           schema:
 *             type: string
 *             enum: [movie, tv]
 *           description: Type de media a recuperer.
 *         - in: query
 *           name: q
 *           schema:
 *             type: string
 *           description: Recherche texte (movie uniquement sur endpoint catalogue pagine).
 *         - in: query
 *           name: searchTerm
 *           schema:
 *             type: string
 *           description: Alias de q.
 *         - in: query
 *           name: page
 *           schema:
 *             type: integer
 *             minimum: 1
 *             default: 1
 *           description: Page du catalogue movie.
 *         - in: query
 *           name: limit
 *           schema:
 *             type: integer
 *             minimum: 1
 *             default: 15
 *           description: Taille de page du catalogue movie.
 *       responses:
 *         200:
 *           description: Liste de medias ou catalogue movie pagine selon les parametres.
 *           content:
 *             application/json:
 *               schema:
 *                 oneOf:
 *                   - type: array
 *                     items:
 *                       $ref: '#/components/schemas/TmdbMedia'
 *                   - $ref: '#/components/schemas/TmdbMovieCatalogResponse'
 *         500:
 *           description: Erreur serveur.
 *           content:
 *             application/json:
 *               schema:
 *                 $ref: '#/components/schemas/TmdbErrorResponse'
 *   /api/tmdb/medias/{type}/{id}:
 *     get:
 *       summary: Recuperer un media TMDB par type et id
 *       tags:
 *         - TMDB - Catalog
 *       parameters:
 *         - in: path
 *           name: type
 *           required: true
 *           schema:
 *             type: string
 *             enum: [movie, tv]
 *           description: Type de media a recuperer.
 *         - in: path
 *           name: id
 *           required: true
 *           schema:
 *             type: integer
 *             minimum: 1
 *           description: Identifiant TMDB du media.
 *       responses:
 *         200:
 *           description: Detail du media TMDB.
 *           content:
 *             application/json:
 *               schema:
 *                 $ref: '#/components/schemas/TmdbMedia'
 *         400:
 *           description: ID manquant ou invalide.
 *           content:
 *             application/json:
 *               schema:
 *                 $ref: '#/components/schemas/TmdbErrorResponse'
 *         500:
 *           description: Erreur serveur.
 *           content:
 *             application/json:
 *               schema:
 *                 $ref: '#/components/schemas/TmdbErrorResponse'
 */

export {};
