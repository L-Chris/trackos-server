import { BadRequestError } from 'routing-controllers';
import { Service } from 'typedi';
import {
  QueryAppUsageSummariesDto,
  QueryDailyAppUsageSummaryDto,
  QueryUsageRankingDto,
  QueryUsageTrendDto,
  ReportAppUsageSummaryBatchDto,
  ReportAppUsageSummaryDto,
} from '../dto/app-usage-summary.dto';
import { AppUsageSummaryRepository } from '../repositories/app-usage-summary.repository';
import { LocationRepository } from '../repositories/location.repository';
import {
  AppUsageSummaryView,
  DailyAppUsageRanking,
  DailyAppUsageSummary,
  UsageRankingView,
  UsageTrendBucketView,
} from '../types/app-usage-summary';

@Service()
export class AppUsageSummaryService {
  constructor(
    private readonly appUsageSummaryRepository: AppUsageSummaryRepository,
    private readonly locationRepository: LocationRepository,
  ) {}

  async reportAppUsageSummary(payload: ReportAppUsageSummaryDto) {
    this.validateWindow(payload.windowStartAt, payload.windowEndAt, payload.foregroundTimeMs);

    const { user, device } = await this.locationRepository.upsertUserAndDevice(payload.userId, payload.deviceId);
    const summary = await this.appUsageSummaryRepository.createAppUsageSummary({
      recordKey: payload.recordKey,
      userId: user.id,
      deviceId: device.id,
      packageName: payload.packageName,
      appName: payload.appName,
      windowStartAt: payload.windowStartAt,
      windowEndAt: payload.windowEndAt,
      foregroundTimeMs: payload.foregroundTimeMs,
      lastUsedAt: payload.lastUsedAt,
    });

    return {
      id: summary.id.toString(),
      userId: payload.userId,
      deviceId: payload.deviceId,
      recordKey: payload.recordKey,
      windowEndAt: summary.windowEndAt.toISOString(),
    };
  }

  async reportAppUsageSummaryBatch(payload: ReportAppUsageSummaryBatchDto) {
    for (const record of payload.records) {
      this.validateWindow(record.windowStartAt, record.windowEndAt, record.foregroundTimeMs);
    }

    const { user, device } = await this.locationRepository.upsertUserAndDevice(payload.userId, payload.deviceId);
    const result = await this.appUsageSummaryRepository.createAppUsageSummaries(
      payload.records.map((record) => ({
        recordKey: record.recordKey,
        userId: user.id,
        deviceId: device.id,
        packageName: record.packageName,
        appName: record.appName,
        windowStartAt: record.windowStartAt,
        windowEndAt: record.windowEndAt,
        foregroundTimeMs: record.foregroundTimeMs,
        lastUsedAt: record.lastUsedAt,
      })),
    );

    return {
      userId: payload.userId,
      deviceId: payload.deviceId,
      acceptedCount: result.count,
    };
  }

  async queryAppUsageSummaries(query: QueryAppUsageSummariesDto) {
    this.validateWindow(query.startAt, query.endAt, 0);

    const summaries = await this.appUsageSummaryRepository.findAppUsageSummariesByUserAndRange({
      userExternalId: query.userId,
      startAt: query.startAt,
      endAt: query.endAt,
      deviceExternalId: query.deviceId,
      packageName: query.packageName,
    });

    return {
      userId: query.userId,
      summaries: summaries.map(
        (summary): AppUsageSummaryView => ({
          id: summary.id.toString(),
          deviceId: summary.device.externalId,
          packageName: summary.packageName,
          appName: summary.appName,
          windowStartAt: summary.windowStartAt.toISOString(),
          windowEndAt: summary.windowEndAt.toISOString(),
          foregroundTimeMs: Number(summary.foregroundTimeMs),
          lastUsedAt: summary.lastUsedAt?.toISOString() ?? null,
        }),
      ),
    };
  }

  async queryDailySummary(query: QueryDailyAppUsageSummaryDto) {
    this.validateWindow(query.startAt, query.endAt, 0);

    const summaries = await this.appUsageSummaryRepository.findAppUsageSummariesByUserAndRange({
      userExternalId: query.userId,
      startAt: query.startAt,
      endAt: query.endAt,
      deviceExternalId: query.deviceId,
      packageName: query.packageName,
    });

    const dailyMap = new Map<string, Map<string, DailyAppUsageRanking>>();

    for (const summary of summaries) {
      const date = summary.windowEndAt.toISOString().slice(0, 10);
      const dayRanking = dailyMap.get(date) ?? new Map<string, DailyAppUsageRanking>();
      const existing = dayRanking.get(summary.packageName);
      const lastUsedAt = summary.lastUsedAt?.toISOString() ?? null;

      if (!existing) {
        dayRanking.set(summary.packageName, {
          packageName: summary.packageName,
          appName: summary.appName,
          totalForegroundTimeMs: Number(summary.foregroundTimeMs),
          lastUsedAt,
          recordCount: 1,
        });
        dailyMap.set(date, dayRanking);
        continue;
      }

      existing.totalForegroundTimeMs += Number(summary.foregroundTimeMs);
      existing.recordCount += 1;
      if (lastUsedAt != null && (existing.lastUsedAt == null || existing.lastUsedAt < lastUsedAt)) {
        existing.lastUsedAt = lastUsedAt;
      }
    }

    const days = Array.from(dailyMap.entries()).map(
      ([date, rankings]): DailyAppUsageSummary => ({
        date,
        rankings: Array.from(rankings.values()).sort(
          (left, right) => right.totalForegroundTimeMs - left.totalForegroundTimeMs,
        ),
      }),
    );

    return {
      userId: query.userId,
      days,
    };
  }

  async queryUsageRanking(query: QueryUsageRankingDto) {
    this.validateWindow(query.startAt, query.endAt, 0);

    const summaries = await this.appUsageSummaryRepository.findAppUsageSummariesByUserAndRange({
      userExternalId: query.userId,
      startAt: query.startAt,
      endAt: query.endAt,
      deviceExternalId: query.deviceId,
      packageName: query.packageName,
    });

    const rankingMap = new Map<string, UsageRankingView & { deviceIds: Set<string> }>();

    for (const summary of summaries) {
      const existing = rankingMap.get(summary.packageName);
      const lastUsedAt = summary.lastUsedAt?.toISOString() ?? null;

      if (!existing) {
        rankingMap.set(summary.packageName, {
          packageName: summary.packageName,
          appName: summary.appName,
          totalForegroundTimeMs: Number(summary.foregroundTimeMs),
          lastUsedAt,
          deviceCount: 1,
          recordCount: 1,
          deviceIds: new Set([summary.device.externalId]),
        });
        continue;
      }

      existing.totalForegroundTimeMs += Number(summary.foregroundTimeMs);
      existing.recordCount += 1;
      existing.deviceIds.add(summary.device.externalId);
      existing.deviceCount = existing.deviceIds.size;
      if (lastUsedAt != null && (existing.lastUsedAt == null || existing.lastUsedAt < lastUsedAt)) {
        existing.lastUsedAt = lastUsedAt;
      }
    }

    const limit = query.limit ?? 12;
    const rankings = Array.from(rankingMap.values())
      .sort((left, right) => right.totalForegroundTimeMs - left.totalForegroundTimeMs)
      .slice(0, limit)
      .map(({ deviceIds: _deviceIds, ...item }) => item);

    return {
      userId: query.userId,
      rankings,
    };
  }

  async queryUsageTrend(query: QueryUsageTrendDto) {
    this.validateWindow(query.startAt, query.endAt, 0);

    const summaries = await this.appUsageSummaryRepository.findAppUsageSummariesByUserAndRange({
      userExternalId: query.userId,
      startAt: query.startAt,
      endAt: query.endAt,
      deviceExternalId: query.deviceId,
      packageName: query.packageName,
    });

    const bucketMinutes = this.resolveBucketMinutes(query.bucket);
    const bucketMap = new Map<string, UsageTrendBucketView & { packageNames: Set<string> }>();

    for (const summary of summaries) {
      const bucketStart = this.floorToBucket(summary.windowEndAt, bucketMinutes);
      const bucketKey = bucketStart.toISOString();
      const existing = bucketMap.get(bucketKey);

      if (!existing) {
        bucketMap.set(bucketKey, {
          bucketStartAt: bucketStart.toISOString(),
          bucketEndAt: new Date(bucketStart.getTime() + bucketMinutes * 60 * 1000).toISOString(),
          totalForegroundTimeMs: Number(summary.foregroundTimeMs),
          activeAppCount: 1,
          packageNames: new Set([summary.packageName]),
        });
        continue;
      }

      existing.totalForegroundTimeMs += Number(summary.foregroundTimeMs);
      existing.packageNames.add(summary.packageName);
      existing.activeAppCount = existing.packageNames.size;
    }

    const buckets = Array.from(bucketMap.values())
      .sort((left, right) => left.bucketStartAt.localeCompare(right.bucketStartAt))
      .map(({ packageNames: _packageNames, ...item }) => item);

    return {
      userId: query.userId,
      bucket: query.bucket ?? 'hour',
      buckets,
    };
  }

  private resolveBucketMinutes(bucket: string | undefined) {
    switch (bucket) {
      case '15m':
        return 15;
      case '30m':
        return 30;
      case 'day':
        return 24 * 60;
      case 'hour':
      default:
        return 60;
    }
  }

  private floorToBucket(date: Date, bucketMinutes: number) {
    const bucketMs = bucketMinutes * 60 * 1000;
    return new Date(Math.floor(date.getTime() / bucketMs) * bucketMs);
  }

  private validateWindow(startAt: Date, endAt: Date, foregroundTimeMs: number) {
    if (startAt > endAt) {
      throw new BadRequestError('windowStartAt must be earlier than or equal to windowEndAt');
    }

    if (foregroundTimeMs < 0) {
      throw new BadRequestError('foregroundTimeMs must be non-negative');
    }
  }
}