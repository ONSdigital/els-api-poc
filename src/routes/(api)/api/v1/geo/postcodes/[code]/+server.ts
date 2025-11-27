import { json, error } from "@sveltejs/kit";
import getPostcode from "$lib/api/geo/getPostcode.js";
import { getAreasByPostcode } from "$lib/api/geo/getAreasByPostcode.js";
import { getParam } from "$lib/api/utils.js";

export async function GET({ params, url }) {
  const code = params.code;
  const year = getParam(url, "year", "latest");
  const geoLevel = getParam(url, "geoLevel", "all");
  const groupByLevel = getParam(url, "groupByLevel", false);

  const postcode = await getPostcode(code);
  if (postcode.error) error(postcode.error, postcode.message);

  const areas = await getAreasByPostcode({ code, postcode, year, geoLevel, groupByLevel });
  if (areas.error) error(areas.error, areas.message);

  return json(areas);
}
