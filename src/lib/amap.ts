import axios from 'axios';
import { env } from '../config/env';

// POI type codes from AMap that map to semantic place labels.
// See: https://lbs.amap.com/api/webservice/guide/api/georegeo (分类编码)
// First two digits of the 6-digit type code are checked.
const POI_TYPE_PREFIX_TO_LABEL: [string, PlaceLabel][] = [
  ['12', 'home'],      // 住宅区: 商品住宅, 普通住宅
  ['17', 'home'],      // 住宅楼: 住宅区
  ['09', 'food'],      // 餐饮: 中餐, 快餐, 咖啡
  ['06', 'shop'],      // 购物: 商场, 超市
  ['08', 'leisure'],   // 娱乐: 电影院, KTV
  ['18', 'leisure'],   // 运动: 健身房, 公园
  ['14', 'education'], // 教育: 学校, 培训机构
  ['07', 'medical'],   // 医疗: 医院, 药店
  ['15', 'finance'],   // 金融: 银行, ATM
  ['10', 'transport'], // 交通: 地铁站, 公交站
  ['16', 'transport'], // 停车场
  ['90', 'transport'], // 道路
  ['13', 'work'],      // 科技园区: 写字楼, 产业园
];

export type PlaceLabel =
  | 'home'
  | 'work'
  | 'food'
  | 'shop'
  | 'leisure'
  | 'education'
  | 'medical'
  | 'finance'
  | 'transport'
  | 'other';

export interface PlaceInfo {
  address: string;
  poiName: string | null;
  poiType: string | null;  // raw AMap type string, e.g. "餐饮服务;中餐厅;中餐厅"
  placeLabel: PlaceLabel;
}

interface AmapRegeoResponse {
  status: string;
  info: string;
  regeocode?: {
    formatted_address: string;
    pois?: Array<{
      name: string;
      type: string;     // e.g. "餐饮服务;中餐厅;中餐厅"
      typecode: string; // e.g. "050100"
      distance: string;
    }>;
  };
}

function inferLabelFromTypeCode(typecode: string): PlaceLabel {
  const prefix = typecode.slice(0, 2);
  for (const [code, label] of POI_TYPE_PREFIX_TO_LABEL) {
    if (prefix === code) return label;
  }
  return 'other';
}

/**
 * Call AMap reverse geocoding API (regeo) with nearby POIs.
 * Coordinates must be in GCJ-02 (AMap native CRS).
 * Returns null if AMAP_KEY is not configured or the API call fails,
 * so callers can degrade gracefully.
 */
export async function reverseGeocode(lat: number, lon: number): Promise<PlaceInfo | null> {
  if (!env.amapKey) return null;

  let resp: AmapRegeoResponse;
  try {
    const result = await axios.get<AmapRegeoResponse>(
      'https://restapi.amap.com/v3/geocode/regeo',
      {
        params: {
          key: env.amapKey,
          location: `${lon},${lat}`,
          extensions: 'all',
          radius: 100,
          batch: false,
          roadlevel: 1,
        },
        timeout: 5000,
      },
    );
    resp = result.data;
  } catch {
    return null;
  }

  if (resp.status !== '1' || !resp.regeocode) return null;

  const regeocode = resp.regeocode;
  const address = regeocode.formatted_address ?? '';

  // Pick the nearest POI (AMap returns them sorted by distance ascending)
  const poi = regeocode.pois?.[0] ?? null;

  let placeLabel: PlaceLabel = 'other';
  if (poi?.typecode) {
    placeLabel = inferLabelFromTypeCode(poi.typecode);
  }

  return {
    address,
    poiName: poi?.name ?? null,
    poiType: poi?.type ?? null,
    placeLabel,
  };
}
