-- Canvas coordinates are obsolete: the page is now a flowing textbook document
-- ordered by "order" and placed via "placement".
ALTER TABLE "Block" DROP COLUMN "x",
                    DROP COLUMN "y",
                    DROP COLUMN "width";
