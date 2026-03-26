import { Service } from 'typedi';
import { prisma } from '../lib/prisma';

@Service()
export class UsageEventRepository {
  async createUsageEvent(payload: {
    recordKey: string;
    userId: number;
    deviceId: number;
    eventType: string;
    packageName?: string;
    className?: string;
    occurredAt: Date;
    source: string;
    metadata?: string;
  }) {
    return prisma.usageEvent.create({
      data: {
        recordKey: payload.recordKey,
        userId: payload.userId,
        deviceId: payload.deviceId,
        eventType: payload.eventType,
        packageName: payload.packageName,
        className: payload.className,
        occurredAt: payload.occurredAt,
        source: payload.source,
        metadata: payload.metadata,
      },
    });
  }

  async createUsageEvents(
    payloads: Array<{
      recordKey: string;
      userId: number;
      deviceId: number;
      eventType: string;
      packageName?: string;
      className?: string;
      occurredAt: Date;
      source: string;
      metadata?: string;
    }>,
  ) {
    return prisma.usageEvent.createMany({
      data: payloads.map((payload) => ({
        recordKey: payload.recordKey,
        userId: payload.userId,
        deviceId: payload.deviceId,
        eventType: payload.eventType,
        packageName: payload.packageName,
        className: payload.className,
        occurredAt: payload.occurredAt,
        source: payload.source,
        metadata: payload.metadata,
      })),
      skipDuplicates: true,
    });
  }

  async findUsageEventsByUserAndRange(payload: {
    userExternalId: string;
    startAt: Date;
    endAt: Date;
    deviceExternalId?: string;
    packageName?: string;
    eventType?: string;
    limit?: number;
    offset?: number;
  }) {
    return prisma.usageEvent.findMany({
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
        eventType: payload.eventType,
        occurredAt: {
          gte: payload.startAt,
          lte: payload.endAt,
        },
      },
      orderBy: {
        occurredAt: 'asc',
      },
      take: payload.limit,
      skip: payload.offset,
      include: {
        device: true,
      },
    });
  }
}