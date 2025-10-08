import { json, error } from "@sveltejs/kit";
import getParentAreas from "$lib/api/geo/getParentAreas.js";

export function GET({ params }) {
  const code = params.code;

  const parents = getParentAreas(code);
  if (parents.error) error(parents.error, parents.message);

  return json(parents);
}
