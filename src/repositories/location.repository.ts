import { Prisma } from '@prisma/client';
import { Service } from 'typedi';
import { prisma } from '../lib/prisma';

@Service()
export class LocationRepository {
  async upsertUserAndDevice(userExternalId: string, deviceExternalId: string) {
    return prisma.$transaction(async (transaction) => {
      const user = await transaction.user.upsert({
        where: { externalId: userExternalId },
        update: {},
        create: { externalId: userExternalId },
      });

      const device = await transaction.device.upsert({
        where: { externalId: deviceExternalId },
        update: { userId: user.id },
        create: {
          externalId: deviceExternalId,
          userId: user.id,
        },
      });

      return { user, device };
    });
  }

  async createLocationPoint(payload: {
    userId: number;
    deviceId: number;
    latitude: number;
    longitude: number;
    recordedAt: Date;
    accuracy?: number;
    speed?: number;
    heading?: number;
    altitude?: number;
  }) {
    return prisma.locationPoint.create({
      data: {
        userId: payload.userId,
        deviceId: payload.deviceId,
        latitude: new Prisma.Decimal(payload.latitude),
        longitude: new Prisma.Decimal(payload.longitude),
        recordedAt: payload.recordedAt,
        accuracy: payload.accuracy,
        speed: payload.speed,
        heading: payload.heading,
        altitude: payload.altitude,
      },
    });
  }

  async createLocationPoints(payloads: Array<{
    userId: number;
    deviceId: number;
    latitude: number;
    longitude: number;
    recordedAt: Date;
    accuracy?: number;
    speed?: number;
    heading?: number;
    altitude?: number;
  }>) {
    return prisma.locationPoint.createMany({
      data: payloads.map((payload) => ({
        userId: payload.userId,
        deviceId: payload.deviceId,
        latitude: new Prisma.Decimal(payload.latitude),
        longitude: new Prisma.Decimal(payload.longitude),
        recordedAt: payload.recordedAt,
        accuracy: payload.accuracy,
        speed: payload.speed,
        heading: payload.heading,
        altitude: payload.altitude,
      })),
    });
  }

  async findLocationPointsByUserAndRange(userExternalId: string, startAt: Date, endAt: Date) {
    return prisma.locationPoint.findMany({
      where: {
        user: {
          externalId: userExternalId,
        },
        recordedAt: {
          gte: startAt,
          lte: endAt,
        },
      },
      orderBy: {
        recordedAt: 'asc',
      },
      include: {
        device: true,
      },
    });
  }
}