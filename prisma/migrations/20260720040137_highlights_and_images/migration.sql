-- CreateEnum
CREATE TYPE "HighlightColor" AS ENUM ('KEY', 'SUPPORTING', 'REVISIT');

-- AlterEnum
ALTER TYPE "NoteKind" ADD VALUE 'IMAGE';

-- AlterTable
ALTER TABLE "Note" ADD COLUMN     "imageUrl" TEXT;

-- CreateTable
CREATE TABLE "Highlight" (
    "id" TEXT NOT NULL,
    "notebookId" TEXT NOT NULL,
    "sourceId" TEXT NOT NULL,
    "color" "HighlightColor" NOT NULL DEFAULT 'KEY',
    "text" TEXT NOT NULL,
    "startOffset" INTEGER NOT NULL,
    "endOffset" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Highlight_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Highlight_notebookId_idx" ON "Highlight"("notebookId");

-- CreateIndex
CREATE INDEX "Highlight_sourceId_idx" ON "Highlight"("sourceId");

-- AddForeignKey
ALTER TABLE "Highlight" ADD CONSTRAINT "Highlight_notebookId_fkey" FOREIGN KEY ("notebookId") REFERENCES "Notebook"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Highlight" ADD CONSTRAINT "Highlight_sourceId_fkey" FOREIGN KEY ("sourceId") REFERENCES "Source"("id") ON DELETE CASCADE ON UPDATE CASCADE;
