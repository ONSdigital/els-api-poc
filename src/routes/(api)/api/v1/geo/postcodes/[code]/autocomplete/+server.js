import { json, error } from "@sveltejs/kit";
import getPostcodesList from "$lib/api/geo/getPostcodesList.js";
import { getParam, isValidPartialPostcode } from "$lib/api/utils.js";

export async function GET({ params, url }) {
  const code = params.code;
  const limit = getParam(url, "limit", 10);

  if (!isValidPartialPostcode(code.toUpperCase()))
    error(400, `${code} is not a valid partial postcode`);

  const postcodes = await getPostcodesList({ code, limit });
  if (postcodes.error) error(postcodes.error, postcodes.message);

  return json(postcodes);
}
