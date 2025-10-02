import { json } from "@sveltejs/kit";
import { getParam } from "$lib/api/utils.js";
import getAreasByName from "$lib/api/geo/getAreasByName.js";
import getPostcodesList from "$lib/api/geo/getPostcodesList.js";

export async function GET({ url, params }) {
  const name = params.name || null;
  const limit = getParam(url, "limit", 10);
  const searchPostcodes = getParam(url, "searchPostcodes", false);
  const groupByLevel = getParam(url, "groupByLevel", false);
  const geoLevel = getParam(url, "geoLevel", "all");

  let areasList = getAreasByName({ name, limit, geoLevel, groupByLevel });
  if (areasList.error) error(areasList.error, areasList.message);

  if (searchPostcodes && areasList.length === 0)
    areasList = await getPostcodesList({ name, limit });

  return json(areasList);
}
