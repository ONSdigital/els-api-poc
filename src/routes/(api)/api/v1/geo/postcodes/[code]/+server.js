import { json, error } from "@sveltejs/kit";
import getPostcode from "$lib/api/geo/getPostcode.js";
import { getAreasByPostcode } from "$lib/api/geo/getAreasByPostcode.js";
import { isValidPostcode, getParam } from "$lib/api/utils.js";

export async function GET({ params, url }) {
  const code = params.code;
  const year = getParam(url, "year", "latest");
  const groupByLevel = getParam(url, "groupByLevel", false);

  if (!isValidPostcode(code.toUpperCase()))
    error(400, `${code} is not a valid postcode`);

  const postcode = await getPostcode(code);
  if (postcode.error) error(postcode.error, postcode.message);

  const areas = await getAreasByPostcode({ postcode, year, groupByLevel });
  if (areas.error) error(areas.error, areas.message);

  return json({ ...postcode, areas });
}
