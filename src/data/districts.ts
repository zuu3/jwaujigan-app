import rawDistricts from './districts.json';

type DistrictEntry = { province: string | null; district: string; areas: string[] };

function normalize(v: string) {
  return v.trim().replace(/\s+/g, '').replace(/[·ㆍ․]/g, '').replace(/[()]/g, '')
    .replace(/제(?=\d)/g, '').replace(/특별자치도/g, '도').replace(/특별자치시/g, '시')
    .replace(/특별시/g, '시').replace(/광역시/g, '시');
}

function formatArea(area: string) {
  return area.endsWith('일원') ? `${area.slice(0, -2)} 전체` : area.replace(/제(?=\d)/g, '');
}

function formatDistrict(district: string) {
  return district.replace(/선거구$/, '');
}

export type DistrictOption = {
  id: string;
  province: string | null;
  district: string;
  districtLabel: string;
  area: string;
  areaLabel: string;
  displayLabel: string;
};

const districts = rawDistricts as DistrictEntry[];

export const DISTRICT_OPTIONS: DistrictOption[] = districts.flatMap((entry) => {
  const seen = new Set<string>();
  return entry.areas.filter((a) => { if (seen.has(a)) return false; seen.add(a); return true; }).map((area) => {
    const districtLabel = formatDistrict(entry.district);
    const areaLabel = formatArea(area);
    return {
      id: `${entry.district}:${area}`,
      province: entry.province,
      district: entry.district,
      districtLabel,
      area,
      areaLabel,
      displayLabel: `${districtLabel} ${areaLabel}`.trim(),
    };
  });
});

export const PROVINCES = [...new Set(districts.map((d) => d.province).filter(Boolean))] as string[];

export function searchDistricts(query: string, province?: string | null): DistrictOption[] {
  const q = normalize(query);
  if (!q && !province) return [];
  let list = province ? DISTRICT_OPTIONS.filter((o) => o.province === province) : DISTRICT_OPTIONS;
  if (!q) return list;
  return list
    .map((o) => {
      const nd = normalize(o.districtLabel);
      const na = normalize(o.areaLabel);
      const np = normalize(o.province ?? '');
      let score = 0;
      if (nd === q || na === q) score = 4;
      else if (nd.startsWith(q) || na.startsWith(q)) score = 3;
      else if (nd.includes(q) || na.includes(q) || np.includes(q)) score = 2;
      else if (normalize(o.displayLabel).includes(q)) score = 1;
      return { o, score };
    })
    .filter((x) => x.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, 30)
    .map((x) => x.o);
}
