import { json, error } from "@sveltejs/kit";
import getPostcodeList from "$lib/api/geo/getPostcodeList.js";
import { isValidPartialPostcode } from "$lib/api/utils.js";

export async function GET({ params }) {
  const code = params.code;
  if (!isValidPartialPostcode(code.toUpperCase())) error(400, `${code} is not a valid partial postcode`);

  const postcodes = await getPostcodeList(code);
  if (postcodes.error) error(postcodes.error, postcodes.message);

  return json(postcodes);
}