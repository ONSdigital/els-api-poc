import geoMetadata from "$lib/data/geo-metadata.json";
import { geoLevels } from "$lib/config/geo-levels.js";
import { isValidAreaCode } from "../utils.js";

const geoArray = Object.values(geoMetadata);

export default function getChildAreas(params = {}) {
  const cdUpper = params?.code?.toUpperCase();
  if (!isValidAreaCode(cdUpper))
    return { error: 400, message: `${params.code} is not a valid GSS code.` };

  const area = geoMetadata[cdUpper];
  if (!area)
    return { error: 400, message: `Children not found for ${params.code}` };

  const geoLevel = geoLevels[params.geoLevel];
  if (!geoLevel) return area.children;

  return geoArray
    .filter(
      (g) =>
        geoLevel.codes.includes(g.areacd.slice(0, 3)) &&
        g.parents.includes(cdUpper)
    )
    .map((g) => g.areacd);
}
