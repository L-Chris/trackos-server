import { BadRequestError } from 'routing-controllers';
import { Service } from 'typedi';
import {
  QueryMoveEventsDto,
  ReportMoveEventBatchDto,
  moveTypes,
} from '../dto/move-event.dto';
import { LocationRepository } from '../repositories/location.repository';
import { MoveEventRepository } from '../repositories/move-event.repository';
import { MoveEventView } from '../types/move-event';

@Service()
export class MoveEventService {
  constructor(
    private readonly moveEventRepository: MoveEventRepository,
    private readonly locationRepository: LocationRepository,
  ) {}

  async reportMoveEventBatch(payload: ReportMoveEventBatchDto) {
    for (const record of payload.records) {
      if (Number.isNaN(record.occurredAt.getTime())) {
        throw new BadRequestError('occurredAt must be a valid date');
      }
      if (!moveTypes.includes(record.moveType as (typeof moveTypes)[number])) {
        throw new BadRequestError(`unsupported moveType: ${record.moveType}`);
      }
    }

    const { user, device } = await this.locationRepository.upsertUserAndDevice(
      payload.userId,
      payload.deviceId,
    );
    const result = await this.moveEventRepository.createMoveEvents(
      payload.records.map((record) => ({
        recordKey: record.recordKey,
        userId: user.id,
        deviceId: device.id,
        moveType: record.moveType,
        confidence: record.confidence,
        occurredAt: record.occurredAt,
      })),
    );

    return {
      userId: payload.userId,
      deviceId: payload.deviceId,
      acceptedCount: result.count,
    };
  }

  async queryMoveEvents(query: QueryMoveEventsDto) {
    if (query.startAt > query.endAt) {
      throw new BadRequestError('startAt must be earlier than or equal to endAt');
    }

    const events = await this.moveEventRepository.findMoveEventsByUserAndRange({
      userExternalId: query.userId,
      startAt: query.startAt,
      endAt: query.endAt,
      deviceExternalId: query.deviceId,
      moveType: query.moveType,
      limit: query.limit,
      offset: query.offset,
    });

    return {
      userId: query.userId,
      events: events.map(
        (event): MoveEventView => ({
          id: event.id.toString(),
          deviceId: event.device.externalId,
          recordKey: event.recordKey,
          moveType: event.moveType,
          confidence: event.confidence,
          occurredAt: event.occurredAt.toISOString(),
        }),
      ),
    };
  }
}
