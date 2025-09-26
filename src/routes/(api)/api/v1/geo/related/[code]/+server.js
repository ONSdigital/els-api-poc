import { json, error } from "@sveltejs/kit";
import getRelatedAreas from "$lib/api/geo/getRelatedAreas.js";
import { isValidAreaCode } from "$lib/api/utils";

export function GET({ params }) {
  const code = params.code;
  if (!isValidAreaCode(code)) error(400, `${code} is not a valid GSS code`);

  const relatedAreas = getRelatedAreas(code);
  if (relatedAreas.error) return error(relatedAreas.error, relatedAreas.message);

  return json(relatedAreas);
}
