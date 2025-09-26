import { json, error } from "@sveltejs/kit";
import getParents from "$lib/api/geo/getParents";
import { isValidAreaCode } from "$lib/api/utils.js";

export function GET({ params }) {
  const code = params.code;
  if (!isValidAreaCode(code)) error(400, `${code} is not a valid GSS code`);

  const parents = getParents(code);
  if (parents.error) error(parents.error, parents.message);

  return json(parents);
}