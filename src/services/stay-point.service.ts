import { BadRequestError } from 'routing-controllers';
import { Service } from 'typedi';
import { QueryStayPointsDto } from '../dto/query-stay-points.dto';
import { wgs84ToGcj02 } from '../lib/geo';
import { haversineDistance } from '../lib/geospatial';
import { stDbscan } from '../lib/st-dbscan';
import { LocationRepository } from '../repositories/location.repository';
import { StayPoint } from '../types/stay-point';

const DEFAULT_EPS1 = 200;    // meters
const DEFAULT_EPS2 = 1800;   // seconds (30 minutes)
const DEFAULT_MIN_PTS = 5;

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

    const stayPoints: StayPoint[] = clusters.map((memberIndices, clusterIdx) => {
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
        centerLat: corrected.latitude,
        centerLon: corrected.longitude,
        startTime: new Date(startTimeMs).toISOString(),
        endTime: new Date(endTimeMs).toISOString(),
        durationSec,
        pointCount: members.length,
        radiusM: Math.round(radiusM * 10) / 10,
      };
    });

    stayPoints.sort((a, b) => a.startTime.localeCompare(b.startTime));

    return { userId: query.userId, stayPoints, noisePointCount };
  }
}
