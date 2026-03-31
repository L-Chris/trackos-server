-- CreateTable
CREATE TABLE `PaymentNotificationSource` (
    `id`              BIGINT       NOT NULL AUTO_INCREMENT,
    `recordKey`       VARCHAR(512) NOT NULL,
    `userId`          INTEGER      NOT NULL,
    `deviceId`        INTEGER      NOT NULL,
    `packageName`     VARCHAR(255) NOT NULL,
    `notificationKey` VARCHAR(255) NOT NULL,
    `postedAt`        DATETIME(3)  NOT NULL,
    `receivedAt`      DATETIME(3)  NOT NULL,
    `title`           VARCHAR(512) NOT NULL,
    `text`            TEXT         NOT NULL,
    `bigText`         TEXT         NULL,
    `tickerText`      VARCHAR(512) NULL,
    `sourceMetadata`  TEXT         NULL,
    `parseStatus`     VARCHAR(32)  NOT NULL DEFAULT 'PENDING',
    `parseAttempts`   INTEGER      NOT NULL DEFAULT 0,
    `nextRetryAt`     DATETIME(3)  NULL,
    `lastError`       TEXT         NULL,
    `createdAt`       DATETIME(3)  NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt`       DATETIME(3)  NOT NULL,

    UNIQUE INDEX `PaymentNotificationSource_recordKey_key`(`recordKey`),
    INDEX `PaymentNotificationSource_userId_postedAt_idx`(`userId`, `postedAt`),
    INDEX `PaymentNotificationSource_deviceId_postedAt_idx`(`deviceId`, `postedAt`),
    INDEX `PaymentNotificationSource_parseStatus_nextRetryAt_idx`(`parseStatus`, `nextRetryAt`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `PaymentRecord` (
    `id`                   BIGINT         NOT NULL AUTO_INCREMENT,
    `sourceNotificationId` BIGINT         NOT NULL,
    `userId`               INTEGER        NOT NULL,
    `deviceId`             INTEGER        NOT NULL,
    `channel`              VARCHAR(64)    NOT NULL,
    `direction`            VARCHAR(32)    NOT NULL,
    `amount`               DECIMAL(18, 4) NOT NULL,
    `currency`             VARCHAR(16)    NOT NULL DEFAULT 'CNY',
    `occurredAt`           DATETIME(3)    NOT NULL,
    `counterparty`         VARCHAR(255)   NULL,
    `scene`                VARCHAR(255)   NULL,
    `summary`              VARCHAR(512)   NULL,
    `createdAt`            DATETIME(3)    NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt`            DATETIME(3)    NOT NULL,

    UNIQUE INDEX `PaymentRecord_sourceNotificationId_key`(`sourceNotificationId`),
    INDEX `PaymentRecord_userId_occurredAt_idx`(`userId`, `occurredAt`),
    INDEX `PaymentRecord_deviceId_occurredAt_idx`(`deviceId`, `occurredAt`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `PaymentNotificationSource` ADD CONSTRAINT `PaymentNotificationSource_userId_fkey`
    FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `PaymentNotificationSource` ADD CONSTRAINT `PaymentNotificationSource_deviceId_fkey`
    FOREIGN KEY (`deviceId`) REFERENCES `Device`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `PaymentRecord` ADD CONSTRAINT `PaymentRecord_sourceNotificationId_fkey`
    FOREIGN KEY (`sourceNotificationId`) REFERENCES `PaymentNotificationSource`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `PaymentRecord` ADD CONSTRAINT `PaymentRecord_userId_fkey`
    FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `PaymentRecord` ADD CONSTRAINT `PaymentRecord_deviceId_fkey`
    FOREIGN KEY (`deviceId`) REFERENCES `Device`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
