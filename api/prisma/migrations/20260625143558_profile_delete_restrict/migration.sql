-- DropForeignKey
ALTER TABLE `user_profiles` DROP FOREIGN KEY `user_profiles_profile_id_fkey`;

-- DropIndex
DROP INDEX `user_profiles_profile_id_fkey` ON `user_profiles`;

-- AddForeignKey
ALTER TABLE `user_profiles` ADD CONSTRAINT `user_profiles_profile_id_fkey` FOREIGN KEY (`profile_id`) REFERENCES `profiles`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
