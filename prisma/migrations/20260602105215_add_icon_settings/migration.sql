ALTER TABLE `StoreSettings`
    ADD COLUMN `loadingIcon` VARCHAR(191) NOT NULL DEFAULT 'ring',
    ADD COLUMN `notAddedIcon` VARCHAR(191) NOT NULL DEFAULT 'heart-outline',
    ADD COLUMN `addedIcon` VARCHAR(191) NOT NULL DEFAULT 'heart-filled',
    ADD COLUMN `loadingIconColor` VARCHAR(191) NOT NULL DEFAULT '#6b7280';