import geoMetadata from "$lib/data/geo-metadata.json";
import { geoLevelsLookup } from "$lib/config/geo-levels.js";
import getChildAreas from "./getChildAreas.js";
import getParentAreas from "./getParentAreas.js";
import getSiblingAreas from "./getSiblingAreas.js";
import getSimilarAreas from "./getSimilarAreas.js";
import { isValidAreaCode } from "../utils.js";

export default function getRelatedAreas(code) {
  const cdUpper = code.toUpperCase();
  if (!isValidAreaCode(cdUpper))
    return { error: 400, message: `${code} is not a valid GSS code.` };

  const area = geoMetadata[cdUpper];
  if (!area)
    return { error: 400, message: `Related areas not found for ${code}.` };

  const geoLevel = geoLevelsLookup[cdUpper.slice(0, 3)].key;
  const parentLevel = ["ctry", "rgn"].includes(geoLevel) ? "ctry" : "rgn";

  const parents = getParentAreas(cdUpper);
  const children = getChildAreas({ code: cdUpper });
  const siblings = getSiblingAreas({ code: cdUpper, parentLevel });
  const similar = getSimilarAreas(cdUpper);

  for (const obj of [parents, children, siblings, similar]) {
    if (obj?.error) return obj;
  }
  return { parents, children, siblings, similar };
}
