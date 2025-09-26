import geoMetadata from "$lib/data/geo-metadata.json";
import { geoLevels, geoLevelsLookup } from "$lib/config/geo-levels.js";
import getChildAreas from "./getChildAreas.js";

export default function getSiblingAreas(params = {}) {
  const area = geoMetadata[params.code];
  if (!area)
    return { error: 400, message: `Siblings not found for ${params.code}` };

  const geoLevel = geoLevelsLookup[params.code.slice(0, 3)].key;
  if (params.parentLevel && !geoLevels[params.parentLevel])
    return {
      error: 400,
      message: `Parent level ${params.parentLevel} not found`,
    };
  const parentCode = params.parentLevel
    ? area.parents.find((p) =>
        geoLevels[params.parentLevel].codes.includes(p.slice(0, 3))
      )
    : area.parents[0];

  return {
    parent: parentCode,
    siblings: getChildAreas({ code: parentCode, geoLevel }),
  };
}
