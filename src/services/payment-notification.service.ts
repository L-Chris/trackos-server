import { BadRequestError } from 'routing-controllers';
import { Service } from 'typedi';
import { ReportPaymentNotificationBatchDto } from '../dto/payment-notification.dto';
import { LocationRepository } from '../repositories/location.repository';
import { PaymentNotificationRepository } from '../repositories/payment-notification.repository';

@Service()
export class PaymentNotificationService {
  constructor(
    private readonly paymentNotificationRepository: PaymentNotificationRepository,
    private readonly locationRepository: LocationRepository,
  ) {}

  async reportBatch(payload: ReportPaymentNotificationBatchDto) {
    for (const record of payload.records) {
      if (!record.recordKey.trim()) {
        throw new BadRequestError('recordKey must not be empty');
      }
      if (Number.isNaN(record.postedAt.getTime())) {
        throw new BadRequestError('postedAt must be a valid date');
      }
      if (Number.isNaN(record.receivedAt.getTime())) {
        throw new BadRequestError('receivedAt must be a valid date');
      }
    }

    const { user, device } = await this.locationRepository.upsertUserAndDevice(
      payload.userId,
      payload.deviceId,
    );

    const result = await this.paymentNotificationRepository.createPaymentNotifications(
      payload.records.map((record) => ({
        recordKey: record.recordKey,
        userId: user.id,
        deviceId: device.id,
        packageName: record.packageName,
        notificationKey: record.notificationKey,
        postedAt: record.postedAt,
        receivedAt: record.receivedAt,
        title: record.title,
        text: record.text,
        bigText: record.bigText,
        tickerText: record.tickerText,
        sourceMetadata: record.sourceMetadata,
      })),
    );

    return {
      userId: payload.userId,
      deviceId: payload.deviceId,
      acceptedCount: result.count,
    };
  }
}
