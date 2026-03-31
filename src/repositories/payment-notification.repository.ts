import { Service } from 'typedi';
import { prisma } from '../lib/prisma';

const MAX_PARSE_ATTEMPTS = 3;
const RETRY_DELAY_MS = 5 * 60 * 1000;

@Service()
export class PaymentNotificationRepository {
  async createPaymentNotifications(
    payloads: Array<{
      recordKey: string;
      userId: number;
      deviceId: number;
      packageName: string;
      notificationKey: string;
      postedAt: Date;
      receivedAt: Date;
      title: string;
      text: string;
      bigText?: string;
      tickerText?: string;
      sourceMetadata?: string;
    }>,
  ) {
    return prisma.paymentNotificationSource.createMany({
      data: payloads.map((payload) => ({
        recordKey: payload.recordKey,
        userId: payload.userId,
        deviceId: payload.deviceId,
        packageName: payload.packageName,
        notificationKey: payload.notificationKey,
        postedAt: payload.postedAt,
        receivedAt: payload.receivedAt,
        title: payload.title,
        text: payload.text,
        bigText: payload.bigText,
        tickerText: payload.tickerText,
        sourceMetadata: payload.sourceMetadata,
        parseStatus: 'PENDING',
      })),
      skipDuplicates: true,
    });
  }

  async claimPendingForProcessing(limit: number) {
    const now = new Date();
    const records = await prisma.paymentNotificationSource.findMany({
      where: {
        OR: [
          { parseStatus: 'PENDING' },
          {
            parseStatus: 'FAILED',
            parseAttempts: { lt: MAX_PARSE_ATTEMPTS },
            nextRetryAt: { lte: now },
          },
        ],
      },
      orderBy: { createdAt: 'asc' },
      take: limit,
    });

    if (records.length === 0) {
      return [];
    }

    const ids = records.map((record) => record.id);
    await prisma.paymentNotificationSource.updateMany({
      where: { id: { in: ids } },
      data: { parseStatus: 'PROCESSING' },
    });

    return records;
  }

  async markParsed(
    id: bigint,
    paymentRecord: {
      userId: number;
      deviceId: number;
      channel: string;
      direction: string;
      amount: number;
      currency: string;
      occurredAt: Date;
      counterparty?: string;
      scene?: string;
      summary?: string;
    },
  ) {
    await prisma.$transaction([
      prisma.paymentRecord.upsert({
        where: { sourceNotificationId: id },
        create: {
          sourceNotificationId: id,
          userId: paymentRecord.userId,
          deviceId: paymentRecord.deviceId,
          channel: paymentRecord.channel,
          direction: paymentRecord.direction,
          amount: paymentRecord.amount,
          currency: paymentRecord.currency,
          occurredAt: paymentRecord.occurredAt,
          counterparty: paymentRecord.counterparty,
          scene: paymentRecord.scene,
          summary: paymentRecord.summary,
        },
        update: {
          direction: paymentRecord.direction,
          amount: paymentRecord.amount,
          currency: paymentRecord.currency,
          occurredAt: paymentRecord.occurredAt,
          counterparty: paymentRecord.counterparty,
          scene: paymentRecord.scene,
          summary: paymentRecord.summary,
        },
      }),
      prisma.paymentNotificationSource.update({
        where: { id },
        data: {
          parseStatus: 'PARSED',
          parseAttempts: { increment: 1 },
          lastError: null,
          nextRetryAt: null,
        },
      }),
    ]);
  }

  async markIgnored(id: bigint) {
    await prisma.paymentNotificationSource.update({
      where: { id },
      data: {
        parseStatus: 'IGNORED',
        parseAttempts: { increment: 1 },
        lastError: null,
        nextRetryAt: null,
      },
    });
  }

  async markFailed(id: bigint, error: string, currentAttempts: number) {
    const nextAttempts = currentAttempts + 1;
    const nextRetryAt =
      nextAttempts < MAX_PARSE_ATTEMPTS
        ? new Date(Date.now() + RETRY_DELAY_MS)
        : null;

    await prisma.paymentNotificationSource.update({
      where: { id },
      data: {
        parseStatus: 'FAILED',
        parseAttempts: { increment: 1 },
        lastError: error,
        nextRetryAt,
      },
    });
  }
}
