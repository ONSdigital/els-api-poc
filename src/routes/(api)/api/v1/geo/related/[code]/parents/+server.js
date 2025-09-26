import { json, error } from "@sveltejs/kit";
import getParentAreas from "$lib/api/geo/getParentAreas.js";
import { isValidAreaCode } from "$lib/api/utils.js";

export function GET({ params }) {
  const code = params.code;
  if (!isValidAreaCode(code)) error(400, `${code} is not a valid GSS code`);

  const parents = getParentAreas(code);
  if (parents.error) error(parents.error, parents.message);

  return json(parents);
}
