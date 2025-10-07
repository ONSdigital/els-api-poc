import geoMetadata from "$lib/data/geo-metadata.json";
import { geoLevels, geoLevelsLookup } from "$lib/config/geo-levels.js";
import getChildAreas from "./getChildAreas.js";
import { isValidAreaCode } from "../utils.js";

export default function getSiblingAreas(params = {}) {
  const cdUpper = params?.code?.toUpperCase();
  if (!isValidAreaCode(cdUpper))
    return { error: 400, message: `${params.code} is not a valid GSS code.` };

  const area = geoMetadata[cdUpper];
  if (!area)
    return { error: 400, message: `Siblings not found for ${params.code}` };

  const geoLevel = geoLevelsLookup[cdUpper.slice(0, 3)].key;
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

  return parentCode ? {
    parent: parentCode,
    siblings: getChildAreas({ code: parentCode, geoLevel }),
  } : {};
}
