import { env } from '../config/env';
import { callAiParser } from '../lib/ai-parser';
import { PaymentNotificationRepository } from '../repositories/payment-notification.repository';

const POLL_INTERVAL_MS = 10_000;
const BATCH_SIZE = 20;

let pollTimer: ReturnType<typeof setTimeout> | null = null;
let workerEnabled = false;

export function startPaymentParseWorker(
  repository: PaymentNotificationRepository,
) {
  if (!env.aiBaseUrl || !env.aiApiKey || !env.aiModel) {
    console.warn('[PaymentParseWorker] AI parser disabled: missing AI_BASE_URL / AI_API_KEY / AI_MODEL');
    return;
  }

  if (workerEnabled) {
    return;
  }

  workerEnabled = true;
  schedulePoll(repository, 0);
}

export function stopPaymentParseWorker() {
  workerEnabled = false;
  if (pollTimer !== null) {
    clearTimeout(pollTimer);
    pollTimer = null;
  }
}

function schedulePoll(
  repository: PaymentNotificationRepository,
  delayMs: number = POLL_INTERVAL_MS,
) {
  pollTimer = setTimeout(() => {
    runBatch(repository)
      .catch((error) => {
        console.error('[PaymentParseWorker] Batch failed', error);
      })
      .finally(() => {
        if (workerEnabled) {
          schedulePoll(repository);
        }
      });
  }, delayMs);
}

async function runBatch(repository: PaymentNotificationRepository) {
  const records = await repository.claimPendingForProcessing(BATCH_SIZE);
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
    tickerText: string | null;
    sourceMetadata: string | null;
    postedAt: Date;
    parseAttempts: number;
  },
) {
  try {
    const result = await callAiParser({
      title: record.title,
      text: record.text,
      bigText: record.bigText,
      tickerText: record.tickerText,
      sourceMetadata: record.sourceMetadata,
      postedAt: record.postedAt.toISOString(),
    });

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
      direction: normalizeDirection(result.direction),
      amount: result.amount,
      currency: (result.currency || 'CNY').trim() || 'CNY',
      occurredAt,
      counterparty: emptyToUndefined(result.counterparty),
      scene: emptyToUndefined(result.scene),
      summary: emptyToUndefined(result.summary),
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
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

function normalizeDirection(value: string | null | undefined): 'INCOME' | 'EXPENSE' | 'UNKNOWN' {
  if (value === 'INCOME' || value === 'EXPENSE' || value === 'UNKNOWN') {
    return value;
  }
  return 'UNKNOWN';
}

function emptyToUndefined(value: string | null | undefined): string | undefined {
  const normalized = value?.trim();
  return normalized ? normalized : undefined;
}
