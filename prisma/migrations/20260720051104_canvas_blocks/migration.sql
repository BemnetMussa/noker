/*
  Warnings:

  - You are about to drop the column `sourceId` on the `Highlight` table. All the data in the column will be lost.
  - You are about to drop the `Note` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `Source` table. If the table is not empty, all the data it contains will be lost.
  - Added the required column `blockId` to the `Highlight` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "BlockType" AS ENUM ('TEXT', 'SOURCE', 'IMAGE', 'UNPACK');

-- DropForeignKey
ALTER TABLE "Highlight" DROP CONSTRAINT "Highlight_sourceId_fkey";

-- DropForeignKey
ALTER TABLE "Note" DROP CONSTRAINT "Note_notebookId_fkey";

-- DropForeignKey
ALTER TABLE "Note" DROP CONSTRAINT "Note_sourceId_fkey";

-- DropForeignKey
ALTER TABLE "Source" DROP CONSTRAINT "Source_notebookId_fkey";

-- DropIndex
DROP INDEX "Highlight_sourceId_idx";

-- AlterTable
ALTER TABLE "Highlight" DROP COLUMN "sourceId",
ADD COLUMN     "blockId" TEXT NOT NULL;

-- DropTable
DROP TABLE "Note";

-- DropTable
DROP TABLE "Source";

-- DropEnum
DROP TYPE "NoteKind";

-- DropEnum
DROP TYPE "SourceType";

-- CreateTable
CREATE TABLE "Block" (
    "id" TEXT NOT NULL,
    "notebookId" TEXT NOT NULL,
    "type" "BlockType" NOT NULL DEFAULT 'TEXT',
    "x" INTEGER NOT NULL DEFAULT 0,
    "y" INTEGER NOT NULL DEFAULT 0,
    "width" INTEGER NOT NULL DEFAULT 420,
    "content" TEXT NOT NULL DEFAULT '',
    "imageUrl" TEXT,
    "quote" TEXT,
    "citation" TEXT,
    "citationUrl" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Block_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Block_notebookId_idx" ON "Block"("notebookId");

-- CreateIndex
CREATE INDEX "Highlight_blockId_idx" ON "Highlight"("blockId");

-- AddForeignKey
ALTER TABLE "Block" ADD CONSTRAINT "Block_notebookId_fkey" FOREIGN KEY ("notebookId") REFERENCES "Notebook"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Highlight" ADD CONSTRAINT "Highlight_blockId_fkey" FOREIGN KEY ("blockId") REFERENCES "Block"("id") ON DELETE CASCADE ON UPDATE CASCADE;
