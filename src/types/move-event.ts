export interface MoveEventView {
  id: string;
  deviceId: string;
  recordKey: string;
  moveType: string;
  confidence: number | null;
  occurredAt: string;
}
