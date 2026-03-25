-- CreateEnum
CREATE TYPE "Role" AS ENUM ('MEMBER', 'ADMIN');

-- CreateEnum
CREATE TYPE "RecipeStatus" AS ENUM ('DRAFT', 'PENDING', 'PUBLISHED');

-- CreateEnum
CREATE TYPE "MediaType" AS ENUM ('MOVIE', 'SERIES');

-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "pseudo" TEXT NOT NULL,
    "password_hash" TEXT NOT NULL,
    "role" "Role" NOT NULL DEFAULT 'MEMBER',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "categories" (
    "id" TEXT NOT NULL,
    "nom" TEXT NOT NULL,
    "description" TEXT,

    CONSTRAINT "categories_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "genres" (
    "id" TEXT NOT NULL,
    "nom" TEXT NOT NULL,
    "tmdb_genre_id" INTEGER NOT NULL,

    CONSTRAINT "genres_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "media_genres" (
    "media_id" TEXT NOT NULL,
    "genre_id" TEXT NOT NULL,

    CONSTRAINT "media_genres_pkey" PRIMARY KEY ("media_id","genre_id")
);

-- CreateTable
CREATE TABLE "media" (
    "id" TEXT NOT NULL,
    "tmdb_id" INTEGER NOT NULL,
    "titre" TEXT NOT NULL,
    "type" "MediaType" NOT NULL,
    "poster_url" TEXT,
    "synopsis" TEXT,
    "annee" INTEGER,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "media_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "recipes" (
    "id" TEXT NOT NULL,
    "titre" TEXT NOT NULL,
    "instructions" TEXT NOT NULL,
    "nombre_personnes" INTEGER,
    "temps_preparation" INTEGER,
    "temps_cuisson" INTEGER,
    "status" "RecipeStatus" NOT NULL DEFAULT 'DRAFT',
    "rejection_reason" TEXT,
    "user_id" TEXT NOT NULL,
    "category_id" TEXT NOT NULL,
    "media_id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "recipes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "recipe_ingredients" (
    "recipe_id" TEXT NOT NULL,
    "ingredient_id" TEXT NOT NULL,
    "quantity" TEXT,
    "unit" TEXT,

    CONSTRAINT "recipe_ingredients_pkey" PRIMARY KEY ("recipe_id","ingredient_id")
);

-- CreateTable
CREATE TABLE "ingredients" (
    "id" TEXT NOT NULL,
    "nom" TEXT NOT NULL,

    CONSTRAINT "ingredients_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "users_pseudo_key" ON "users"("pseudo");

-- CreateIndex
CREATE INDEX "users_email_idx" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "categories_nom_key" ON "categories"("nom");

-- CreateIndex
CREATE UNIQUE INDEX "genres_tmdb_genre_id_key" ON "genres"("tmdb_genre_id");

-- CreateIndex
CREATE UNIQUE INDEX "media_tmdb_id_key" ON "media"("tmdb_id");

-- CreateIndex
CREATE INDEX "media_tmdb_id_idx" ON "media"("tmdb_id");

-- CreateIndex
CREATE INDEX "media_type_idx" ON "media"("type");

-- CreateIndex
CREATE INDEX "recipes_status_idx" ON "recipes"("status");

-- CreateIndex
CREATE INDEX "recipes_user_id_idx" ON "recipes"("user_id");

-- CreateIndex
CREATE INDEX "recipes_category_id_idx" ON "recipes"("category_id");

-- CreateIndex
CREATE INDEX "recipes_media_id_idx" ON "recipes"("media_id");

-- CreateIndex
CREATE UNIQUE INDEX "ingredients_nom_key" ON "ingredients"("nom");

-- CreateIndex
CREATE INDEX "ingredients_nom_idx" ON "ingredients"("nom");

-- AddForeignKey
ALTER TABLE "media_genres" ADD CONSTRAINT "media_genres_media_id_fkey" FOREIGN KEY ("media_id") REFERENCES "media"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "media_genres" ADD CONSTRAINT "media_genres_genre_id_fkey" FOREIGN KEY ("genre_id") REFERENCES "genres"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "recipes" ADD CONSTRAINT "recipes_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "recipes" ADD CONSTRAINT "recipes_category_id_fkey" FOREIGN KEY ("category_id") REFERENCES "categories"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "recipes" ADD CONSTRAINT "recipes_media_id_fkey" FOREIGN KEY ("media_id") REFERENCES "media"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "recipe_ingredients" ADD CONSTRAINT "recipe_ingredients_recipe_id_fkey" FOREIGN KEY ("recipe_id") REFERENCES "recipes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "recipe_ingredients" ADD CONSTRAINT "recipe_ingredients_ingredient_id_fkey" FOREIGN KEY ("ingredient_id") REFERENCES "ingredients"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
