import { Service } from 'typedi';
import { prisma } from '../lib/prisma';

@Service()
export class AppUsageSummaryRepository {
  async createAppUsageSummary(payload: {
    recordKey: string;
    userId: number;
    deviceId: number;
    packageName: string;
    appName: string;
    windowStartAt: Date;
    windowEndAt: Date;
    foregroundTimeMs: number;
    lastUsedAt?: Date;
  }) {
    return prisma.appUsageSummary.create({
      data: {
        recordKey: payload.recordKey,
        userId: payload.userId,
        deviceId: payload.deviceId,
        packageName: payload.packageName,
        appName: payload.appName,
        windowStartAt: payload.windowStartAt,
        windowEndAt: payload.windowEndAt,
        foregroundTimeMs: BigInt(payload.foregroundTimeMs),
        lastUsedAt: payload.lastUsedAt,
      },
    });
  }

  async createAppUsageSummaries(
    payloads: Array<{
      recordKey: string;
      userId: number;
      deviceId: number;
      packageName: string;
      appName: string;
      windowStartAt: Date;
      windowEndAt: Date;
      foregroundTimeMs: number;
      lastUsedAt?: Date;
    }>,
  ) {
    return prisma.appUsageSummary.createMany({
      data: payloads.map((payload) => ({
        recordKey: payload.recordKey,
        userId: payload.userId,
        deviceId: payload.deviceId,
        packageName: payload.packageName,
        appName: payload.appName,
        windowStartAt: payload.windowStartAt,
        windowEndAt: payload.windowEndAt,
        foregroundTimeMs: BigInt(payload.foregroundTimeMs),
        lastUsedAt: payload.lastUsedAt,
      })),
      skipDuplicates: true,
    });
  }

  async findAppUsageSummariesByUserAndRange(payload: {
    userExternalId: string;
    startAt: Date;
    endAt: Date;
    deviceExternalId?: string;
    packageName?: string;
  }) {
    return prisma.appUsageSummary.findMany({
      where: {
        user: {
          externalId: payload.userExternalId,
        },
        device: payload.deviceExternalId
          ? {
              externalId: payload.deviceExternalId,
            }
          : undefined,
        packageName: payload.packageName
          ? {
              contains: payload.packageName,
            }
          : undefined,
        windowEndAt: {
          gte: payload.startAt,
          lte: payload.endAt,
        },
      },
      orderBy: {
        windowEndAt: 'asc',
      },
      include: {
        device: true,
      },
    });
  }
}