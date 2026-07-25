-- CreateEnum
CREATE TYPE "BlockPlacement" AS ENUM ('BODY', 'MARGIN');

-- AlterTable
ALTER TABLE "Block" ADD COLUMN     "order" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "placement" "BlockPlacement" NOT NULL DEFAULT 'BODY';
