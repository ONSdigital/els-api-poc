import { json } from "@sveltejs/kit";
import { getParam } from "$lib/api/utils.js";
import getAreasByLngLat from "$lib/api/geo/getAreasByLngLat.js";

export async function GET({ url }) {
  const lng = getParam(url, "lng", null);
  const lat = getParam(url, "lat", null);

  const areasList = await getAreasByLngLat(lng, lat);
  if (areasList.error) error(areasList.error, areasList.message);

  return json(areasList);
}