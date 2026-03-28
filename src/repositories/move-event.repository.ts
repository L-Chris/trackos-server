import { Service } from 'typedi';
import { prisma } from '../lib/prisma';

@Service()
export class MoveEventRepository {
  async createMoveEvents(
    payloads: Array<{
      recordKey: string;
      userId: number;
      deviceId: number;
      moveType: string;
      confidence?: number;
      occurredAt: Date;
    }>,
  ) {
    return prisma.moveEvent.createMany({
      data: payloads.map((payload) => ({
        recordKey: payload.recordKey,
        userId: payload.userId,
        deviceId: payload.deviceId,
        moveType: payload.moveType,
        confidence: payload.confidence,
        occurredAt: payload.occurredAt,
      })),
      skipDuplicates: true,
    });
  }

  async findMoveEventsByUserAndRange(payload: {
    userExternalId: string;
    startAt: Date;
    endAt: Date;
    deviceExternalId?: string;
    moveType?: string;
    limit?: number;
    offset?: number;
  }) {
    return prisma.moveEvent.findMany({
      where: {
        user: {
          externalId: payload.userExternalId,
        },
        device: payload.deviceExternalId
          ? {
              externalId: payload.deviceExternalId,
            }
          : undefined,
        moveType: payload.moveType,
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
