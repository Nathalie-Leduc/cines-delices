/*
  Warnings:

  - A unique constraint covering the columns `[tmdb_id,type]` on the table `media` will be added. If there are existing duplicate values, this will fail.

*/
-- DropForeignKey
ALTER TABLE "recipes" DROP CONSTRAINT "recipes_user_id_fkey";

-- DropIndex
DROP INDEX "media_tmdb_id_key";

-- AlterTable
ALTER TABLE "media" ADD COLUMN     "realisateur" TEXT;

-- AlterTable
ALTER TABLE "recipes" ALTER COLUMN "user_id" DROP NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "media_tmdb_id_type_key" ON "media"("tmdb_id", "type");

-- AddForeignKey
ALTER TABLE "recipes" ADD CONSTRAINT "recipes_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
