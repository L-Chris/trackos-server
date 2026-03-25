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

export interface LocationPointView {
  id: string;
  deviceId: string;
  latitude: number;
  longitude: number;
  rawLatitude: number;
  rawLongitude: number;
  coordinateSystem: 'GCJ-02';
  recordedAt: string;
  accuracy: number | null;
  speed: number | null;
  heading: number | null;
  altitude: number | null;
}
