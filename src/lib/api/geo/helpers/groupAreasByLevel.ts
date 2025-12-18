import { geoLevelsAllLookup, geoLevelsNavLookup } from "$lib/config/geoLevels";
import sortAreasByName from "./sortAreasByName";

export default function groupAreasByLevel(areas, mode = "default") {
  if (areas.length === 0) return [];

  const lookup = mode === "nav" ? geoLevelsNavLookup : geoLevelsAllLookup;
  const levels = {};

  for (const area of areas) {
    const cd = area.areacd.slice(0, 3);
    const level = lookup[cd];

    if (level && !levels[level.key]) levels[level.key] = {
      key: level.key,
      label: level.label,
      areas: [],
    };
    if (levels[level.key]) levels[level.key].areas.push(area);
  }

  return Object.values(levels)
    .map(l => ({ ...l, areas: sortAreasByName(l.areas) }));
}
