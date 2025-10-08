import geoMetadata from "$lib/data/geo-metadata.json";
import { isValidAreaCode } from "../utils.js";

export default function getParentAreas(code) {
  const cdUpper = code?.toUpperCase();
  if (!isValidAreaCode(cdUpper))
    return { error: 400, message: `${code} is not a valid GSS code.` };

  const area = geoMetadata[cdUpper];
  if (!area) return { error: 400, message: `Parents not found for ${code}` };

  return area.parents;
}
