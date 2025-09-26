import geoMetadata from "$lib/geo-metadata.json";
import { geoLevelsLookup } from "$lib/geo-levels.js";
import getChildAreas from "./getChildAreas.js";
import getParentAreas from "./getParentAreas.js";
import getSiblingAreas from "./getSiblingAreas.js";
import getSimilarAreas from "./getSimilarAreas.js";

export default function getRelatedAreas(code) {
  const area = geoMetadata[code];
    if (!area) return { error: 400, message: `Related areas not found for ${code}` };
  
  const geoLevel = geoLevelsLookup[code.slice(0, 3)].key;
  const parentLevel = ["ctry", "rgn"].includes(geoLevel) ? "ctry" : "rgn";

  const parents = getParentAreas(code);
  const children = getChildAreas({ code });
  const siblings = getSiblingAreas({ code, parentLevel });
  const similar = getSimilarAreas(code);

  for (const obj of [parents, children, siblings, similar]) {
    if (obj?.error) return obj;
  }
  return { parents, children, siblings, similar };
}