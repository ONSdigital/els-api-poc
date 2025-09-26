import { json, error } from "@sveltejs/kit";
import { getParam } from "$lib/api/utils.js";
import getSiblings from "$lib/api/geo/getSiblings.js";

export function GET({ url, params }) {
  const code = params.code;
  const parentLevel = getParam(url, "parentLevel", null);

  const siblings = getSiblings({code, parentLevel});
  if (siblings.error) error(siblings.error, siblings.message);

  return json(siblings);
}