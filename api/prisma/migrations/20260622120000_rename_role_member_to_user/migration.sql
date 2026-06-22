-- Rename the `Role` enum value `MEMBER` -> `USER`.
-- Widen the enum first so existing rows can be remapped, then narrow it.
ALTER TABLE `users` MODIFY `role` ENUM('MEMBER', 'ADMIN', 'USER') NOT NULL DEFAULT 'USER';
UPDATE `users` SET `role` = 'USER' WHERE `role` = 'MEMBER';
ALTER TABLE `users` MODIFY `role` ENUM('ADMIN', 'USER') NOT NULL DEFAULT 'USER';
