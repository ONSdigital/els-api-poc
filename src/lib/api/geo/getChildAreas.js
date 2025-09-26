import geoMetadata from "$lib/geo-metadata.json";
import { geoLevels } from "$lib/geo-levels.js";

const geoArray = Object.values(geoMetadata);

export default function getChildAreas(params = {}) {
  const area = geoMetadata[params.code];
  if (!area) return { error: 400, message: `Children not found for ${params.code}` };

  const geoLevel = geoLevels[params.geoLevel];
  if (!geoLevel) return area.children;

  return geoArray
    .filter(
      (g) =>
        geoLevel.codes.includes(g.areacd.slice(0, 3)) &&
        g.parents.includes(params.code)
    )
    .map((g) => g.areacd);
}
