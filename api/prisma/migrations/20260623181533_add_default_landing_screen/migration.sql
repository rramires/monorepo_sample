-- AlterTable
ALTER TABLE `profile_screens` ADD COLUMN `is_default` BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE `users` ADD COLUMN `default_screen_key` VARCHAR(100) NULL;
