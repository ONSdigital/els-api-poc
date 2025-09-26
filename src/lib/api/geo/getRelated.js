import geoMetadata from "$lib/geo-metadata.json";
import { geoLevelsLookup } from "$lib/geo-levels.js";
import getChildren from "./getChildren.js";
import getParents from "./getParents.js";
import getSiblings from "./getSiblings.js";
import getSimilarAreas from "./getSimilarAreas.js";

export default function getRelated(code) {
  const area = geoMetadata[code];
    if (!area) return { error: 400, message: `Related areas not found for ${code}` };
  
  const geoLevel = geoLevelsLookup[code.slice(0, 3)].key;
  const parentLevel = ["ctry", "rgn"].includes(geoLevel) ? "ctry" : "rgn";

  const parents = getParents(code);
  const children = getChildren({ code });
  const siblings = getSiblings({ code, parentLevel });
  const similar = getSimilarAreas(code);

  for (const obj of [parents, children, siblings, similar]) {
    if (obj?.error) return obj;
  }
  return { parents, children, siblings, similar };
}