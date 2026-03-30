import { haversineDistance } from './geospatial';

export interface STDBSCANInput {
  lat: number;
  lon: number;
  timestamp: Date;
}

export interface STDBSCANParams {
  eps1: number;   // spatial threshold in meters
  eps2: number;   // temporal threshold in seconds
  minPts: number; // minimum points to form a core point
}

const UNVISITED = -2;
const NOISE = -1;

function getNeighbors(
  points: STDBSCANInput[],
  idx: number,
  eps1: number,
  eps2: number,
  timestamps: number[],
): number[] {
  const p = points[idx];
  const pTime = timestamps[idx];
  const neighbors: number[] = [];

  for (let i = 0; i < points.length; i++) {
    const q = points[i];
    const spatialDist = haversineDistance(p.lat, p.lon, q.lat, q.lon);
    if (spatialDist > eps1) continue;
    const temporalDist = Math.abs(pTime - timestamps[i]);
    if (temporalDist <= eps2) {
      neighbors.push(i);
    }
  }

  return neighbors;
}

/**
 * ST-DBSCAN: Spatio-Temporal DBSCAN clustering.
 *
 * Returns an array of clusters. Each cluster is an array of indices into
 * the original `points` array. NOISE points are not included in any cluster.
 */
export function stDbscan(points: STDBSCANInput[], params: STDBSCANParams): number[][] {
  const { eps1, eps2, minPts } = params;
  const n = points.length;
  if (n === 0) return [];

  // Pre-compute timestamps in seconds for efficiency
  const timestamps = points.map((p) => p.timestamp.getTime() / 1000);

  const labels = new Int32Array(n).fill(UNVISITED);
  const clusters: number[][] = [];

  for (let i = 0; i < n; i++) {
    if (labels[i] !== UNVISITED) continue;

    const neighbors = getNeighbors(points, i, eps1, eps2, timestamps);

    if (neighbors.length < minPts) {
      labels[i] = NOISE;
      continue;
    }

    // Start a new cluster
    const clusterIdx = clusters.length;
    clusters.push([]);
    labels[i] = clusterIdx;
    clusters[clusterIdx].push(i);

    // BFS expansion using a seed set
    const seedSet = new Set<number>(neighbors);
    seedSet.delete(i);

    while (seedSet.size > 0) {
      const j = seedSet.values().next().value as number;
      seedSet.delete(j);

      if (labels[j] === NOISE) {
        // Border point: reassign to this cluster but do not expand
        labels[j] = clusterIdx;
        clusters[clusterIdx].push(j);
        continue;
      }

      if (labels[j] !== UNVISITED) continue;

      labels[j] = clusterIdx;
      clusters[clusterIdx].push(j);

      const jNeighbors = getNeighbors(points, j, eps1, eps2, timestamps);
      if (jNeighbors.length >= minPts) {
        for (const k of jNeighbors) {
          if (labels[k] === UNVISITED || labels[k] === NOISE) {
            seedSet.add(k);
          }
        }
      }
    }
  }

  return clusters;
}
