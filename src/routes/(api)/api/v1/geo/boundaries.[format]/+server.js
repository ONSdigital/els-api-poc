import { json, error } from "@sveltejs/kit";
import { getParam } from "$lib/api/utils.js";
import getBoundaries from "$lib/api/geo/getBoundaries";

export function GET({ url, params }) {
  const format = params.format || "geojson";
  const year = getParam(url, "year", "latest");
  const country = getParam(url, "country", "all");
  const geoLevel = getParam(url, "geoLevel", "ltla");

  const boundaries = getBoundaries({
    format,
    year,
    country,
    geoLevel,
  });
  if (boundaries.error) error(boundaries.error, boundaries.message);

  return json(boundaries);
}
