export interface AppUsageSummaryView {
  id: string;
  deviceId: string;
  packageName: string;
  appName: string;
  windowStartAt: string;
  windowEndAt: string;
  foregroundTimeMs: number;
  lastUsedAt: string | null;
}

export interface DailyAppUsageRanking {
  packageName: string;
  appName: string;
  totalForegroundTimeMs: number;
  lastUsedAt: string | null;
  recordCount: number;
}

export interface DailyAppUsageSummary {
  date: string;
  rankings: DailyAppUsageRanking[];
}