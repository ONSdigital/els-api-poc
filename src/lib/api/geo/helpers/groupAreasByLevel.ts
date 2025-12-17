import { geoLevelsAllArray, geoLevelsNavArray } from "$lib/config/geoLevels";

export default function groupAreasByLevel(areas, mode = "default") {
  if (areas.length === 0) return [];

  const cds = new Set(areas.map((a) => a.areacd.slice(0, 3)));
  const levels = (mode === "nav" ? geoLevelsNavArray : geoLevelsAllArray).filter((l) =>
    l.codes.some((cd) => cds.has(cd))
  );
  const areaGroups = levels.map((l) => ({
    key: l.key,
    label: l.label,
    areas: [],
  }));

  while (areas.length > 0) {
    const area = areas.shift();
    for (let i = 0; i < levels.length; i++) {
      if (levels[i].codes.includes(area.areacd.slice(0, 3))) {
        areaGroups[i].areas.push(area);
        break;
      }
    }
  }

  return areaGroups.filter(l => l.areas.length > 0);
}
