export interface DailyLocationSummary {
  date: string;
  pointCount: number;
  firstRecordedAt: string;
  lastRecordedAt: string;
  minLatitude: number;
  maxLatitude: number;
  minLongitude: number;
  maxLongitude: number;
}
