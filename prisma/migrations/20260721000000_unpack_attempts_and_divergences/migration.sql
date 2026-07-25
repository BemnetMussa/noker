-- CreateEnum
CREATE TYPE "UnpackState" AS ENUM ('AWAITING', 'ATTEMPTED', 'SKIPPED');

-- CreateEnum
CREATE TYPE "DivergenceScope" AS ENUM ('UNPACK', 'AUDIT');

-- CreateEnum
CREATE TYPE "DivergenceKind" AS ENUM ('MATCHED', 'MISSED', 'WRONG');

-- AlterTable
ALTER TABLE "Notebook" ADD COLUMN     "condensedRevision" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "revision" INTEGER NOT NULL DEFAULT 0;

-- AlterTable
ALTER TABLE "Block" ADD COLUMN     "attempt" TEXT,
ADD COLUMN     "attemptAt" TIMESTAMP(3),
ADD COLUMN     "quoteEnd" INTEGER,
ADD COLUMN     "quoteStart" INTEGER,
ADD COLUMN     "sourceBlockId" TEXT,
ADD COLUMN     "unpackState" "UnpackState";

-- CreateTable
CREATE TABLE "Divergence" (
    "id" TEXT NOT NULL,
    "notebookId" TEXT NOT NULL,
    "blockId" TEXT,
    "scope" "DivergenceScope" NOT NULL,
    "kind" "DivergenceKind" NOT NULL,
    "text" TEXT NOT NULL,
    "dismissed" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Divergence_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Divergence_notebookId_scope_idx" ON "Divergence"("notebookId", "scope");

-- CreateIndex
CREATE INDEX "Divergence_blockId_idx" ON "Divergence"("blockId");

-- AddForeignKey
ALTER TABLE "Divergence" ADD CONSTRAINT "Divergence_notebookId_fkey" FOREIGN KEY ("notebookId") REFERENCES "Notebook"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Divergence" ADD CONSTRAINT "Divergence_blockId_fkey" FOREIGN KEY ("blockId") REFERENCES "Block"("id") ON DELETE CASCADE ON UPDATE CASCADE;

