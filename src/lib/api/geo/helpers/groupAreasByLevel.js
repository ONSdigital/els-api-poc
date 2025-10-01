import { geoLevelsAllArray } from "$lib/config/geo-levels.js";

export default function groupAreasByLevel(areas) {
  if (areas.length === 0) return [];
  
  const cds = new Set(areas.map((a) => a.areacd.slice(0, 3)));
  const levels = geoLevelsAllArray.filter((l) =>
    l.codes.some((cd) => cds.has(cd))
  );

  return levels.map((l) => ({
    key: l.key,
    label: l.label,
    areas: areas.filter((a) => l.codes.includes(a.areacd.slice(0, 3))),
  }));
}
