ALTER TABLE `StoreSettings`
    ADD COLUMN `customIconSvg` TEXT NULL,
    ADD COLUMN `customIconColor` VARCHAR(191) NOT NULL DEFAULT '#e74c6f';