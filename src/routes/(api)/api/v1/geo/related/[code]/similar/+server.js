import { json, error } from "@sveltejs/kit";
import getSimilarAreas from "$lib/api/geo/getSimilarAreas.js";

export function GET({ params }) {
  const code = params.code;

  const similar = getSimilarAreas(code);
  if (similar.error) error(similar.error, similar.message);

  return json(similar);
}
