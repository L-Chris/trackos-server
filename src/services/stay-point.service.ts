import { BadRequestError } from 'routing-controllers';
import { Service } from 'typedi';
import { QueryStayPointsDto } from '../dto/query-stay-points.dto';
import { reverseGeocode } from '../lib/amap';
import { wgs84ToGcj02 } from '../lib/geo';
import { haversineDistance } from '../lib/geospatial';
import { stDbscan } from '../lib/st-dbscan';
import { LocationRepository } from '../repositories/location.repository';
import { StayPoint } from '../types/stay-point';

const DEFAULT_EPS1 = 100;    // meter
const DEFAULT_EPS2 = 1800;   // seconds (30 minutes)
const DEFAULT_MIN_PTS = 10;
// 某个点周围（100m, 1800s）内只要有10个GPS点就能成核心点

@Service()
export class StayPointService {
  constructor(private readonly locationRepository: LocationRepository) {}

  async queryStayPoints(query: QueryStayPointsDto): Promise<{
    userId: string;
    stayPoints: StayPoint[];
    noisePointCount: number;
  }> {
    if (query.startAt >= query.endAt) {
      throw new BadRequestError('startAt must be earlier than endAt');
    }

    const eps1 = query.eps1 ?? DEFAULT_EPS1;
    const eps2 = query.eps2 ?? DEFAULT_EPS2;
    const minPts = query.minPts ?? DEFAULT_MIN_PTS;

    const locationPoints = await this.locationRepository.findLocationPointsByUserAndRange(
      query.userId,
      query.startAt,
      query.endAt,
    );

    if (locationPoints.length === 0) {
      return { userId: query.userId, stayPoints: [], noisePointCount: 0 };
    }

    const algorithmInput = locationPoints.map((p) => ({
      lat: p.latitude.toNumber(),
      lon: p.longitude.toNumber(),
      timestamp: p.recordedAt,
    }));

    const clusters = stDbscan(algorithmInput, { eps1, eps2, minPts });

    const clusteredPointCount = clusters.reduce((sum, c) => sum + c.length, 0);
    const noisePointCount = locationPoints.length - clusteredPointCount;

    // Build cluster geometries (without place info yet)
    interface ClusterGeometry {
      id: number;
      gcjLat: number;
      gcjLon: number;
      startTime: string;
      endTime: string;
      durationSec: number;
      pointCount: number;
      radiusM: number;
    }

    const geometries: ClusterGeometry[] = clusters.map((memberIndices, clusterIdx) => {
      const members = memberIndices.map((i) => ({
        lat: algorithmInput[i].lat,
        lon: algorithmInput[i].lon,
        recordedAt: locationPoints[i].recordedAt,
      }));

      const rawCenterLat = members.reduce((s, m) => s + m.lat, 0) / members.length;
      const rawCenterLon = members.reduce((s, m) => s + m.lon, 0) / members.length;

      const corrected = wgs84ToGcj02(rawCenterLat, rawCenterLon);

      let startTimeMs = Infinity;
      let endTimeMs = -Infinity;
      for (const m of members) {
        const t = m.recordedAt.getTime();
        if (t < startTimeMs) startTimeMs = t;
        if (t > endTimeMs) endTimeMs = t;
      }

      const durationSec = Math.round((endTimeMs - startTimeMs) / 1000);

      let radiusM = 0;
      for (const m of members) {
        const d = haversineDistance(rawCenterLat, rawCenterLon, m.lat, m.lon);
        if (d > radiusM) radiusM = d;
      }

      return {
        id: clusterIdx,
        gcjLat: corrected.latitude,
        gcjLon: corrected.longitude,
        startTime: new Date(startTimeMs).toISOString(),
        endTime: new Date(endTimeMs).toISOString(),
        durationSec,
        pointCount: members.length,
        radiusM: Math.round(radiusM * 10) / 10,
      };
    });

    // Enrich all stay points with place info concurrently (graceful degradation on failure)
    const placeResults = await Promise.all(
      geometries.map((g) => reverseGeocode(g.gcjLat, g.gcjLon)),
    );

    const enriched: StayPoint[] = geometries.map((g, i) => {
      const place = placeResults[i];
      return {
        id: g.id,
        centerLat: g.gcjLat,
        centerLon: g.gcjLon,
        startTime: g.startTime,
        endTime: g.endTime,
        durationSec: g.durationSec,
        pointCount: g.pointCount,
        radiusM: g.radiusM,
        address: place?.address ?? null,
        poiName: place?.poiName ?? null,
        poiType: place?.poiType ?? null,
        placeLabel: place?.placeLabel ?? null,
      };
    });

    enriched.sort((a, b) => a.startTime.localeCompare(b.startTime));

    return { userId: query.userId, stayPoints: enriched, noisePointCount };
  }
}
