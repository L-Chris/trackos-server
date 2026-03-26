export interface UsageEventView {
  id: string;
  deviceId: string;
  recordKey: string;
  eventType: string;
  packageName: string | null;
  className: string | null;
  occurredAt: string;
  source: string;
  metadata: string | null;
}