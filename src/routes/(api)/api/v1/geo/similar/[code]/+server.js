import { json, error } from "@sveltejs/kit";
import getSimilarAreas from "$lib/api/getSimilarAreas.js";

export function GET({ params }) {
  const code = params.code;

  const similarAreas = getSimilarAreas(code);
  if (!similarAreas) return error(400, `Similar areas not available for ${code}`);

  return json(similarAreas);
}