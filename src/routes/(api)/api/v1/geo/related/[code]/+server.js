import { json, error } from "@sveltejs/kit";
import getRelatedAreas from "$lib/api/geo/getRelatedAreas.js";

export function GET({ params }) {
  const code = params.code;

  const relatedAreas = getRelatedAreas(code);
  if (relatedAreas.error) return error(relatedAreas.error, relatedAreas.message);

  return json(relatedAreas);
}
