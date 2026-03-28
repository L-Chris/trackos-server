-- CreateTable
CREATE TABLE `MoveEvent` (
    `id`          BIGINT       NOT NULL AUTO_INCREMENT,
    `recordKey`   VARCHAR(255) NOT NULL,
    `userId`      INTEGER      NOT NULL,
    `deviceId`    INTEGER      NOT NULL,
    `moveType`    VARCHAR(64)  NOT NULL,
    `confidence`  DOUBLE       NULL,
    `occurredAt`  DATETIME(3)  NOT NULL,
    `createdAt`   DATETIME(3)  NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `MoveEvent_recordKey_key`(`recordKey`),
    INDEX `MoveEvent_userId_occurredAt_idx`(`userId`, `occurredAt`),
    INDEX `MoveEvent_deviceId_occurredAt_idx`(`deviceId`, `occurredAt`),
    INDEX `MoveEvent_moveType_occurredAt_idx`(`moveType`, `occurredAt`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `MoveEvent` ADD CONSTRAINT `MoveEvent_userId_fkey`
    FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `MoveEvent` ADD CONSTRAINT `MoveEvent_deviceId_fkey`
    FOREIGN KEY (`deviceId`) REFERENCES `Device`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
