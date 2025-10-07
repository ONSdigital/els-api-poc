import { json } from "@sveltejs/kit";
import { getParam } from "$lib/api/utils.js";
import getGeoLevels from "$lib/api/geo/getGeoLevels.js";

export function GET({ url }) {
  const year = getParam(url, "year", "latest");
  const includeAreas = getParam(url, "includeParents", true);

  const levels = getGeoLevels({
    year,
    includeAreas,
  });

  return json(levels);
}
