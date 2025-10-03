import { json, error } from "@sveltejs/kit";
import getPostcodesList from "$lib/api/geo/getPostcodesList.js";
import { getParam } from "$lib/api/utils.js";

export async function GET({ params, url }) {
  const code = params.code;
  const limit = getParam(url, "limit", 10);

  const postcodes = await getPostcodesList({ code, limit });
  if (postcodes.error) error(postcodes.error, postcodes.message);

  return json(postcodes);
}
