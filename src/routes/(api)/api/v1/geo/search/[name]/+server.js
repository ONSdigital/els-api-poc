import { json } from "@sveltejs/kit";
import { getParam } from "$lib/api/utils.js";
import getAreasByName from "$lib/api/geo/getAreasByName.js";

export function GET({ url, params }) {
  const name = params.name || null;
  const geoLevel = getParam(url, "geoLevel", null);

  const areasList = getAreasByName({name, geoLevel});
  if (areasList.error) error(areasList.error, areasList.message);

  return json(areasList);
}
