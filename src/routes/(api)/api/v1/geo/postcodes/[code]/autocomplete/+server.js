import { json, error } from "@sveltejs/kit";
import getPostcodesList from "$lib/api/geo/getPostcodesList.js";
import { isValidPartialPostcode } from "$lib/api/utils.js";

export async function GET({ params }) {
  const code = params.code;
  if (!isValidPartialPostcode(code.toUpperCase())) error(400, `${code} is not a valid partial postcode`);

  const postcodes = await getPostcodesList(code);
  if (postcodes.error) error(postcodes.error, postcodes.message);

  return json(postcodes);
}