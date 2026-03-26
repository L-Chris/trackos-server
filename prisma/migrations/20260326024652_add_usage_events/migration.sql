-- CreateTable
CREATE TABLE `UsageEvent` (
    `id` BIGINT NOT NULL AUTO_INCREMENT,
    `recordKey` VARCHAR(255) NOT NULL,
    `userId` INTEGER NOT NULL,
    `deviceId` INTEGER NOT NULL,
    `eventType` VARCHAR(64) NOT NULL,
    `packageName` VARCHAR(255) NULL,
    `className` VARCHAR(255) NULL,
    `occurredAt` DATETIME(3) NOT NULL,
    `source` VARCHAR(64) NOT NULL,
    `metadata` TEXT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `UsageEvent_recordKey_key`(`recordKey`),
    INDEX `UsageEvent_userId_occurredAt_idx`(`userId`, `occurredAt`),
    INDEX `UsageEvent_deviceId_occurredAt_idx`(`deviceId`, `occurredAt`),
    INDEX `UsageEvent_packageName_occurredAt_idx`(`packageName`, `occurredAt`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `UsageEvent` ADD CONSTRAINT `UsageEvent_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `UsageEvent` ADD CONSTRAINT `UsageEvent_deviceId_fkey` FOREIGN KEY (`deviceId`) REFERENCES `Device`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
