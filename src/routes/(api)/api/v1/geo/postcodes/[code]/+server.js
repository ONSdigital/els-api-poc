import { json, error } from "@sveltejs/kit";
import getPostcode from "$lib/api/geo/getPostcode.js";
import { getAreasByPostcode } from "$lib/api/geo/getAreasByPostcode.js";
import { isValidPostcode } from "$lib/api/utils.js";

export async function GET({ params }) {
  const code = params.code;
  if (!isValidPostcode(code.toUpperCase())) error(400, `${code} is not a valid postcode`);

  const postcode = await getPostcode(code);
  if (postcode.error) error(postcode.error, postcode.message);

  const areas = {
    ...postcode,
    areas: await getAreasByPostcode(postcode)
  };

  return json(areas);
}