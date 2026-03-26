import { BadRequestError } from 'routing-controllers';
import { Service } from 'typedi';
import {
  QueryUsageEventsDto,
  ReportUsageEventBatchDto,
  ReportUsageEventDto,
  usageEventTypes,
} from '../dto/usage-event.dto';
import { LocationRepository } from '../repositories/location.repository';
import { UsageEventRepository } from '../repositories/usage-event.repository';
import { UsageEventView } from '../types/usage-event';

@Service()
export class UsageEventService {
  constructor(
    private readonly usageEventRepository: UsageEventRepository,
    private readonly locationRepository: LocationRepository,
  ) {}

  async reportUsageEvent(payload: ReportUsageEventDto) {
    this.validateEvent(payload.occurredAt, payload.eventType);

    const { user, device } = await this.locationRepository.upsertUserAndDevice(payload.userId, payload.deviceId);
    const event = await this.usageEventRepository.createUsageEvent({
      recordKey: payload.recordKey,
      userId: user.id,
      deviceId: device.id,
      eventType: payload.eventType,
      packageName: payload.packageName,
      className: payload.className,
      occurredAt: payload.occurredAt,
      source: payload.source,
      metadata: payload.metadata,
    });

    return {
      id: event.id.toString(),
      userId: payload.userId,
      deviceId: payload.deviceId,
      recordKey: payload.recordKey,
      occurredAt: event.occurredAt.toISOString(),
    };
  }

  async reportUsageEventBatch(payload: ReportUsageEventBatchDto) {
    for (const record of payload.records) {
      this.validateEvent(record.occurredAt, record.eventType);
    }

    const { user, device } = await this.locationRepository.upsertUserAndDevice(payload.userId, payload.deviceId);
    const result = await this.usageEventRepository.createUsageEvents(
      payload.records.map((record) => ({
        recordKey: record.recordKey,
        userId: user.id,
        deviceId: device.id,
        eventType: record.eventType,
        packageName: record.packageName,
        className: record.className,
        occurredAt: record.occurredAt,
        source: record.source,
        metadata: record.metadata,
      })),
    );

    return {
      userId: payload.userId,
      deviceId: payload.deviceId,
      acceptedCount: result.count,
    };
  }

  async queryUsageEvents(query: QueryUsageEventsDto) {
    if (query.startAt > query.endAt) {
      throw new BadRequestError('startAt must be earlier than or equal to endAt');
    }

    const events = await this.usageEventRepository.findUsageEventsByUserAndRange({
      userExternalId: query.userId,
      startAt: query.startAt,
      endAt: query.endAt,
      deviceExternalId: query.deviceId,
      packageName: query.packageName,
      eventType: query.eventType,
      limit: query.limit,
      offset: query.offset,
    });

    return {
      userId: query.userId,
      events: events.map(
        (event): UsageEventView => ({
          id: event.id.toString(),
          deviceId: event.device.externalId,
          recordKey: event.recordKey,
          eventType: event.eventType,
          packageName: event.packageName,
          className: event.className,
          occurredAt: event.occurredAt.toISOString(),
          source: event.source,
          metadata: event.metadata,
        }),
      ),
    };
  }

  private validateEvent(occurredAt: Date, eventType: string) {
    if (Number.isNaN(occurredAt.getTime())) {
      throw new BadRequestError('occurredAt must be a valid date');
    }

    if (!usageEventTypes.includes(eventType as (typeof usageEventTypes)[number])) {
      throw new BadRequestError(`unsupported eventType: ${eventType}`);
    }
  }
}