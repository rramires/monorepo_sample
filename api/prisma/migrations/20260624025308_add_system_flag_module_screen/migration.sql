-- AlterTable
ALTER TABLE `modules` ADD COLUMN `is_system` BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE `screens` ADD COLUMN `is_system` BOOLEAN NOT NULL DEFAULT false;
