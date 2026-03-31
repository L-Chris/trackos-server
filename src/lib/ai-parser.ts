import { env } from '../config/env';

export interface AiPaymentResult {
  isPayment: boolean;
  direction: 'INCOME' | 'EXPENSE' | 'UNKNOWN';
  amount: number | null;
  currency: string | null;
  occurredAt: string | null;
  counterparty: string | null;
  scene: string | null;
  summary: string | null;
}

const SYSTEM_PROMPT = `You are a payment notification parser. Given a mobile notification (title + text), determine if it is a payment-related notification and extract structured information.

Respond ONLY with a single JSON object — no markdown, no explanation. The JSON must have exactly these fields:
- isPayment: boolean — true if this is a payment/transfer/refund notification
- direction: "INCOME" | "EXPENSE" | "UNKNOWN" — whether money came in or went out
- amount: number | null — the transaction amount as a number (e.g. 123.45), null if not found
- currency: string | null — the currency code (e.g. "CNY", "USD"), null if not found
- occurredAt: string | null — ISO 8601 datetime if present in the notification, null otherwise
- counterparty: string | null — the other party name, null if not found
- scene: string | null — the payment scene/merchant/description, null if not found
- summary: string | null — a short one-sentence summary of the transaction, null if not a payment`;

export async function callAiParser(
  title: string,
  text: string,
  bigText?: string | null,
): Promise<AiPaymentResult> {
  const notificationText = [
    `Title: ${title}`,
    `Text: ${text}`,
    bigText ? `Details: ${bigText}` : null,
  ]
    .filter(Boolean)
    .join('\n');

  const controller = new AbortController();
  const timeoutId = setTimeout(
    () => controller.abort(),
    env.aiTimeoutMs || 30000,
  );

  let response: Response;
  try {
    response = await fetch(`${env.aiBaseUrl}/v1/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${env.aiApiKey}`,
      },
      body: JSON.stringify({
        model: env.aiModel,
        temperature: 0,
        messages: [
          { role: 'system', content: SYSTEM_PROMPT },
          { role: 'user', content: notificationText },
        ],
      }),
      signal: controller.signal,
    });
  } finally {
    clearTimeout(timeoutId);
  }

  if (!response.ok) {
    throw new Error(`AI API returned HTTP ${response.status}`);
  }

  const json = (await response.json()) as {
    choices?: Array<{ message?: { content?: string } }>;
  };

  const content = json.choices?.[0]?.message?.content;
  if (!content) {
    throw new Error('AI API returned empty content');
  }

  let parsed: AiPaymentResult;
  try {
    parsed = JSON.parse(content.trim()) as AiPaymentResult;
  } catch {
    throw new Error(`AI returned non-JSON content: ${content.slice(0, 200)}`);
  }

  if (typeof parsed.isPayment !== 'boolean') {
    throw new Error('AI result missing isPayment field');
  }

  return parsed;
}
