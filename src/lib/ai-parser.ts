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

const SYSTEM_PROMPT = `You are a payment notification parser. Given a mobile notification, determine whether it describes a payment-related event and extract normalized fields.

Respond ONLY with a single JSON object. Do not wrap it in markdown. The JSON must contain exactly these fields:
- isPayment: boolean
- direction: "INCOME" | "EXPENSE" | "UNKNOWN"
- amount: number | null
- currency: string | null
- occurredAt: string | null
- counterparty: string | null
- scene: string | null
- summary: string | null`;

export async function callAiParser(payload: {
  title: string;
  text: string;
  bigText?: string | null;
  tickerText?: string | null;
  sourceMetadata?: string | null;
  postedAt?: string | null;
}): Promise<AiPaymentResult> {
  if (!env.aiBaseUrl || !env.aiApiKey || !env.aiModel) {
    throw new Error('AI parser is not configured');
  }

  const notificationText = [
    `Title: ${payload.title}`,
    `Text: ${payload.text}`,
    payload.bigText ? `BigText: ${payload.bigText}` : null,
    payload.tickerText ? `TickerText: ${payload.tickerText}` : null,
    payload.postedAt ? `PostedAt: ${payload.postedAt}` : null,
    payload.sourceMetadata ? `SourceMetadata: ${payload.sourceMetadata}` : null,
  ]
    .filter(Boolean)
    .join('\n');

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), env.aiTimeoutMs || 30000);

  let response: Response;
  try {
    response = await fetch(`${env.aiBaseUrl.replace(/\/+$/, '')}/v1/chat/completions`, {
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

  const content = json.choices?.[0]?.message?.content?.trim();
  if (!content) {
    throw new Error('AI API returned empty content');
  }

  const parsed = parseAiJson(content);
  validateAiResult(parsed);
  return parsed;
}

function parseAiJson(content: string): AiPaymentResult {
  const candidates = [content, extractJsonBlock(content)].filter(
    (value): value is string => Boolean(value),
  );

  for (const candidate of candidates) {
    try {
      return JSON.parse(candidate) as AiPaymentResult;
    } catch {
      // Try the next candidate.
    }
  }

  throw new Error(`AI returned non-JSON content: ${content.slice(0, 200)}`);
}

function extractJsonBlock(content: string): string | null {
  const fencedMatch = content.match(/```(?:json)?\s*([\s\S]*?)\s*```/i);
  if (fencedMatch?.[1]) {
    return fencedMatch[1].trim();
  }

  const firstBrace = content.indexOf('{');
  const lastBrace = content.lastIndexOf('}');
  if (firstBrace >= 0 && lastBrace > firstBrace) {
    return content.slice(firstBrace, lastBrace + 1).trim();
  }

  return null;
}

function validateAiResult(result: AiPaymentResult) {
  if (typeof result !== 'object' || result == null) {
    throw new Error('AI result is not an object');
  }

  if (typeof result.isPayment !== 'boolean') {
    throw new Error('AI result missing isPayment field');
  }

  const direction = result.direction ?? 'UNKNOWN';
  if (!['INCOME', 'EXPENSE', 'UNKNOWN'].includes(direction)) {
    throw new Error(`AI result has invalid direction: ${String(result.direction)}`);
  }

  if (result.amount != null && (typeof result.amount !== 'number' || Number.isNaN(result.amount))) {
    throw new Error('AI result has invalid amount');
  }
}
