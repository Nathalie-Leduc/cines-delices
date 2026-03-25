/*
  Warnings:

  - A unique constraint covering the columns `[slug]` on the table `media` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[slug]` on the table `recipes` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `slug` to the `media` table without a default value. This is not possible if the table is not empty.
  - Added the required column `slug` to the `recipes` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "NotificationType" AS ENUM ('RECIPE_SUBMITTED');

-- DropIndex
DROP INDEX "media_tmdb_id_idx";

-- AlterTable
ALTER TABLE "categories" ADD COLUMN     "color" TEXT;

-- AlterTable
ALTER TABLE "ingredients" ADD COLUMN     "approved" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "media" ADD COLUMN     "slug" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "recipes" ADD COLUMN     "image_url" TEXT,
ADD COLUMN     "slug" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "users" ADD COLUMN     "nom" TEXT;

-- CreateTable
CREATE TABLE "notifications" (
    "id" TEXT NOT NULL,
    "type" "NotificationType" NOT NULL,
    "message" TEXT NOT NULL,
    "is_read" BOOLEAN NOT NULL DEFAULT false,
    "user_id" TEXT NOT NULL,
    "recipe_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "notifications_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "notifications_user_id_is_read_idx" ON "notifications"("user_id", "is_read");

-- CreateIndex
CREATE INDEX "notifications_created_at_idx" ON "notifications"("created_at");

-- CreateIndex
CREATE UNIQUE INDEX "media_slug_key" ON "media"("slug");

-- CreateIndex
CREATE INDEX "media_slug_idx" ON "media"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "recipes_slug_key" ON "recipes"("slug");

-- CreateIndex
CREATE INDEX "recipes_slug_idx" ON "recipes"("slug");

-- CreateIndex
CREATE INDEX "recipes_status_category_id_idx" ON "recipes"("status", "category_id");

-- AddForeignKey
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_recipe_id_fkey" FOREIGN KEY ("recipe_id") REFERENCES "recipes"("id") ON DELETE SET NULL ON UPDATE CASCADE;
