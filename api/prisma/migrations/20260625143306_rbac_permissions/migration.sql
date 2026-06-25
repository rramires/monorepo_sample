/*
  Warnings:

  - You are about to drop the column `can_create` on the `profile_screens` table. All the data in the column will be lost.
  - You are about to drop the column `can_delete` on the `profile_screens` table. All the data in the column will be lost.
  - You are about to drop the column `can_edit` on the `profile_screens` table. All the data in the column will be lost.
  - You are about to drop the column `can_view` on the `profile_screens` table. All the data in the column will be lost.
  - You are about to drop the column `is_default` on the `profile_screens` table. All the data in the column will be lost.

*/
-- DropForeignKey
ALTER TABLE `profile_screens` DROP FOREIGN KEY `profile_screens_screen_id_fkey`;

-- DropForeignKey
ALTER TABLE `screens` DROP FOREIGN KEY `screens_module_id_fkey`;

-- DropIndex
DROP INDEX `profile_screens_screen_id_fkey` ON `profile_screens`;

-- DropIndex
DROP INDEX `screens_module_id_fkey` ON `screens`;

-- AlterTable
ALTER TABLE `modules` ADD COLUMN `is_active` BOOLEAN NOT NULL DEFAULT true;

-- AlterTable
ALTER TABLE `profile_screens` DROP COLUMN `can_create`,
    DROP COLUMN `can_delete`,
    DROP COLUMN `can_edit`,
    DROP COLUMN `can_view`,
    DROP COLUMN `is_default`;

-- AlterTable
ALTER TABLE `profiles` ADD COLUMN `default_screen_id` VARCHAR(36) NULL,
    ADD COLUMN `is_active` BOOLEAN NOT NULL DEFAULT true;

-- AlterTable
ALTER TABLE `screens` ADD COLUMN `is_active` BOOLEAN NOT NULL DEFAULT true,
    ADD COLUMN `is_enabled` BOOLEAN NOT NULL DEFAULT true;

-- CreateTable
CREATE TABLE `permissions` (
    `id` VARCHAR(36) NOT NULL,
    `screen_id` VARCHAR(36) NOT NULL,
    `action` ENUM('view', 'create', 'edit', 'delete') NOT NULL,
    `label` VARCHAR(100) NOT NULL,
    `is_system` BOOLEAN NOT NULL DEFAULT false,

    UNIQUE INDEX `permissions_screen_id_action_key`(`screen_id`, `action`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `profile_permissions` (
    `profile_id` VARCHAR(36) NOT NULL,
    `permission_id` VARCHAR(36) NOT NULL,

    PRIMARY KEY (`profile_id`, `permission_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `screens` ADD CONSTRAINT `screens_module_id_fkey` FOREIGN KEY (`module_id`) REFERENCES `modules`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `profiles` ADD CONSTRAINT `profiles_default_screen_id_fkey` FOREIGN KEY (`default_screen_id`) REFERENCES `screens`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `profile_screens` ADD CONSTRAINT `profile_screens_screen_id_fkey` FOREIGN KEY (`screen_id`) REFERENCES `screens`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `permissions` ADD CONSTRAINT `permissions_screen_id_fkey` FOREIGN KEY (`screen_id`) REFERENCES `screens`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `profile_permissions` ADD CONSTRAINT `profile_permissions_profile_id_fkey` FOREIGN KEY (`profile_id`) REFERENCES `profiles`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `profile_permissions` ADD CONSTRAINT `profile_permissions_permission_id_fkey` FOREIGN KEY (`permission_id`) REFERENCES `permissions`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
