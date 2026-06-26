-- Permission.action: fixed enum (view/create/edit/delete) → free string KEY.
-- The four CRUD verbs stay as the "families"; extra ops are composed keys
-- (`create_checkin`, `edit_validate`) so a screen can carry many ops of one
-- family without spawning a phantom screen. UNIQUE(screen_id, action) is kept.
ALTER TABLE `permissions` MODIFY `action` VARCHAR(191) NOT NULL;

-- ── Gym module collapse ──────────────────────────────────────────────────────
-- Folds the phantom gym screens into composed ops on the real screens. These
-- statements NO-OP on a fresh database (migrations run before the seed, so the
-- tables are still empty); on an existing database they upgrade it in place,
-- carrying each granted permission over to its new home.

-- 1) Rename gym.check-in → gym.check-ins (now also hosts the Validate op).
UPDATE `screens`
SET `key` = 'gym.check-ins',
    `name` = 'Check-ins',
    `description` = 'Check in to a gym and validate members.'
WHERE `key` = 'gym.check-in';

-- 2) Move the check-in CREATE op onto the Gyms screen as create_checkin. Any
--    profile that granted it keeps the grant (the permission row just moves).
UPDATE `permissions`
SET `screen_id` = (SELECT `id` FROM `screens` WHERE `key` = 'gym.gyms'),
    `action` = 'create_checkin',
    `label` = 'Check in'
WHERE `action` = 'create'
  AND `screen_id` = (SELECT `id` FROM `screens` WHERE `key` = 'gym.check-ins');

-- 3) Move the validations CREATE op onto the Check-ins screen as edit_validate.
UPDATE `permissions`
SET `screen_id` = (SELECT `id` FROM `screens` WHERE `key` = 'gym.check-ins'),
    `action` = 'edit_validate',
    `label` = 'Validate'
WHERE `action` = 'create'
  AND `screen_id` = (SELECT `id` FROM `screens` WHERE `key` = 'gym.validations');

-- 4) Drop the now-empty phantom screens (gym.history, gym.validations) and all
--    rows that depended on them (grants → memberships → permissions → screen).
--    Profile.default_screen_id is SetNull, so any landing pointer clears itself.
DELETE pp FROM `profile_permissions` pp
  JOIN `permissions` p ON pp.`permission_id` = p.`id`
  JOIN `screens` s ON p.`screen_id` = s.`id`
WHERE s.`key` IN ('gym.history', 'gym.validations');

DELETE ps FROM `profile_screens` ps
  JOIN `screens` s ON ps.`screen_id` = s.`id`
WHERE s.`key` IN ('gym.history', 'gym.validations');

DELETE p FROM `permissions` p
  JOIN `screens` s ON p.`screen_id` = s.`id`
WHERE s.`key` IN ('gym.history', 'gym.validations');

DELETE FROM `screens` WHERE `key` IN ('gym.history', 'gym.validations');
