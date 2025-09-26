import { json, error } from "@sveltejs/kit";
import getRelated from "$lib/api/geo/getRelated.js";
import { isValidAreaCode } from "$lib/api/utils";

export function GET({ params }) {
  const code = params.code;
  if (!isValidAreaCode(code)) error(400, `${code} is not a valid GSS code`);

  const relatedAreas = getRelated(code);
  if (relatedAreas.error) return error(relatedAreas.error, relatedAreas.message);

  return json(relatedAreas);
}
