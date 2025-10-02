import { json, error } from "@sveltejs/kit";
import { getParam } from "$lib/api/utils.js";
import getAreasByLngLat from "$lib/api/geo/getAreasByLngLat.js";

export async function GET({ url }) {
  const lng = getParam(url, "lng", null);
  const lat = getParam(url, "lat", null);
  const year = getParam(url, "year", "latest");
  const groupByLevel = getParam(url, "groupByLevel", false);

  const areasList = await getAreasByLngLat({lng, lat, year, groupByLevel});
  if (areasList.error) error(areasList.error, areasList.message);

  return json(areasList);
}