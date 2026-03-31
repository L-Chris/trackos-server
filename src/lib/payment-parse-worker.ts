import { callAiParser } from '../lib/ai-parser';
import { PaymentNotificationRepository } from '../repositories/payment-notification.repository';

const POLL_INTERVAL_MS = 10_000;
const BATCH_SIZE = 20;

let pollTimer: ReturnType<typeof setTimeout> | null = null;

export function startPaymentParseWorker(
  repository: PaymentNotificationRepository,
) {
  schedulePoll(repository);
}

export function stopPaymentParseWorker() {
  if (pollTimer !== null) {
    clearTimeout(pollTimer);
    pollTimer = null;
  }
}

function schedulePoll(repository: PaymentNotificationRepository) {
  pollTimer = setTimeout(() => {
    runBatch(repository).finally(() => schedulePoll(repository));
  }, POLL_INTERVAL_MS);
}

async function runBatch(repository: PaymentNotificationRepository) {
  let records: Awaited<ReturnType<typeof repository.claimPendingForProcessing>>;
  try {
    records = await repository.claimPendingForProcessing(BATCH_SIZE);
  } catch (err) {
    console.error('[PaymentParseWorker] Failed to claim records', err);
    return;
  }

  if (records.length === 0) return;

  await Promise.allSettled(records.map((record) => processRecord(repository, record)));
}

async function processRecord(
  repository: PaymentNotificationRepository,
  record: {
    id: bigint;
    userId: number;
    deviceId: number;
    title: string;
    text: string;
    bigText: string | null;
    postedAt: Date;
    parseAttempts: number;
  },
) {
  try {
    const result = await callAiParser(record.title, record.text, record.bigText);

    if (!result.isPayment) {
      await repository.markIgnored(record.id);
      return;
    }

    if (result.amount == null || typeof result.amount !== 'number') {
      await repository.markFailed(
        record.id,
        'AI returned isPayment=true but amount is missing or invalid',
        record.parseAttempts,
      );
      return;
    }

    const occurredAt = result.occurredAt
      ? parseDate(result.occurredAt) ?? record.postedAt
      : record.postedAt;

    await repository.markParsed(record.id, {
      userId: record.userId,
      deviceId: record.deviceId,
      channel: 'ALIPAY',
      direction: result.direction ?? 'UNKNOWN',
      amount: result.amount,
      currency: result.currency ?? 'CNY',
      occurredAt,
      counterparty: result.counterparty ?? undefined,
      scene: result.scene ?? undefined,
      summary: result.summary ?? undefined,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error(
      `[PaymentParseWorker] Failed to process record ${record.id}:`,
      message,
    );
    await repository.markFailed(record.id, message, record.parseAttempts).catch(() => {});
  }
}

function parseDate(value: string): Date | null {
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? null : d;
}
