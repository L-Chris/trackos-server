import { BadRequestError } from 'routing-controllers';
import { Service } from 'typedi';
import {
  QueryDailySummaryDto,
  QueryLocationsDto,
  ReportLocationBatchDto,
  ReportLocationDto,
} from '../dto/location.dto';
import { LocationRepository } from '../repositories/location.repository';
import { DailyLocationSummary } from '../types/location';

@Service()
export class LocationService {
  constructor(private readonly locationRepository: LocationRepository) {}

  async reportLocation(payload: ReportLocationDto) {
    this.validateRange(payload.recordedAt, payload.recordedAt);

    const { user, device } = await this.locationRepository.upsertUserAndDevice(payload.userId, payload.deviceId);
    const locationPoint = await this.locationRepository.createLocationPoint({
      userId: user.id,
      deviceId: device.id,
      latitude: payload.latitude,
      longitude: payload.longitude,
      recordedAt: payload.recordedAt,
      accuracy: payload.accuracy,
      speed: payload.speed,
      heading: payload.heading,
      altitude: payload.altitude,
    });

    return {
      id: locationPoint.id.toString(),
      userId: payload.userId,
      deviceId: payload.deviceId,
      recordedAt: locationPoint.recordedAt.toISOString(),
    };
  }

  async reportLocationBatch(payload: ReportLocationBatchDto) {
    for (const record of payload.records) {
      this.validateRange(record.recordedAt, record.recordedAt);
    }

    const { user, device } = await this.locationRepository.upsertUserAndDevice(payload.userId, payload.deviceId);
    const result = await this.locationRepository.createLocationPoints(
      payload.records.map((record) => ({
        userId: user.id,
        deviceId: device.id,
        latitude: record.latitude,
        longitude: record.longitude,
        recordedAt: record.recordedAt,
        accuracy: record.accuracy,
        speed: record.speed,
        heading: record.heading,
        altitude: record.altitude,
      })),
    );

    return {
      userId: payload.userId,
      deviceId: payload.deviceId,
      acceptedCount: result.count,
    };
  }

  async queryLocations(query: QueryLocationsDto) {
    this.validateRange(query.startAt, query.endAt);

    const locationPoints = await this.locationRepository.findLocationPointsByUserAndRange(
      query.userId,
      query.startAt,
      query.endAt,
    );

    return {
      userId: query.userId,
      points: locationPoints.map((point) => ({
        id: point.id.toString(),
        deviceId: point.device.externalId,
        latitude: point.latitude.toNumber(),
        longitude: point.longitude.toNumber(),
        recordedAt: point.recordedAt.toISOString(),
        accuracy: point.accuracy,
        speed: point.speed,
        heading: point.heading,
        altitude: point.altitude,
      })),
    };
  }

  async queryDailySummary(query: QueryDailySummaryDto) {
    this.validateRange(query.startAt, query.endAt);

    const locationPoints = await this.locationRepository.findLocationPointsByUserAndRange(
      query.userId,
      query.startAt,
      query.endAt,
    );

    const summaries = new Map<string, DailyLocationSummary>();

    for (const point of locationPoints) {
      const date = point.recordedAt.toISOString().slice(0, 10);
      const latitude = point.latitude.toNumber();
      const longitude = point.longitude.toNumber();
      const current = summaries.get(date);

      if (!current) {
        summaries.set(date, {
          date,
          pointCount: 1,
          firstRecordedAt: point.recordedAt.toISOString(),
          lastRecordedAt: point.recordedAt.toISOString(),
          minLatitude: latitude,
          maxLatitude: latitude,
          minLongitude: longitude,
          maxLongitude: longitude,
        });
        continue;
      }

      current.pointCount += 1;
      current.lastRecordedAt = point.recordedAt.toISOString();
      current.minLatitude = Math.min(current.minLatitude, latitude);
      current.maxLatitude = Math.max(current.maxLatitude, latitude);
      current.minLongitude = Math.min(current.minLongitude, longitude);
      current.maxLongitude = Math.max(current.maxLongitude, longitude);
    }

    return {
      userId: query.userId,
      summaries: Array.from(summaries.values()),
    };
  }

  private validateRange(startAt: Date, endAt: Date) {
    if (startAt > endAt) {
      throw new BadRequestError('startAt must be earlier than or equal to endAt');
    }
  }
}