import { PlaceLabel } from '../lib/amap';

export interface StayPoint {
  id: number;               // 0-based cluster index, stable per request
  centerLat: number;        // GCJ-02 centroid latitude
  centerLon: number;        // GCJ-02 centroid longitude
  startTime: string;        // ISO 8601, earliest recordedAt in cluster
  endTime: string;          // ISO 8601, latest recordedAt in cluster
  durationSec: number;      // (endTime - startTime) in whole seconds
  pointCount: number;       // number of GPS fixes in this cluster
  radiusM: number;          // max haversine distance from centroid to any member (1 decimal)
  address: string | null;   // formatted address from AMap reverse geocoding
  poiName: string | null;   // name of the nearest POI
  poiType: string | null;   // raw AMap POI type string (e.g. "餐饮服务;中餐厅;中餐厅")
  placeLabel: PlaceLabel | null; // semantic label: home/work/food/shop/...
}
