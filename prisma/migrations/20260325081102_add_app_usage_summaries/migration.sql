-- CreateTable
CREATE TABLE `AppUsageSummary` (
    `id` BIGINT NOT NULL AUTO_INCREMENT,
    `recordKey` VARCHAR(255) NOT NULL,
    `userId` INTEGER NOT NULL,
    `deviceId` INTEGER NOT NULL,
    `packageName` VARCHAR(255) NOT NULL,
    `appName` VARCHAR(255) NOT NULL,
    `windowStartAt` DATETIME(3) NOT NULL,
    `windowEndAt` DATETIME(3) NOT NULL,
    `foregroundTimeMs` BIGINT NOT NULL,
    `lastUsedAt` DATETIME(3) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `AppUsageSummary_recordKey_key`(`recordKey`),
    INDEX `AppUsageSummary_userId_windowEndAt_idx`(`userId`, `windowEndAt`),
    INDEX `AppUsageSummary_deviceId_windowEndAt_idx`(`deviceId`, `windowEndAt`),
    INDEX `AppUsageSummary_packageName_windowEndAt_idx`(`packageName`, `windowEndAt`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `AppUsageSummary` ADD CONSTRAINT `AppUsageSummary_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `AppUsageSummary` ADD CONSTRAINT `AppUsageSummary_deviceId_fkey` FOREIGN KEY (`deviceId`) REFERENCES `Device`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
