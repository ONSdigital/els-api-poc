import { json, error } from "@sveltejs/kit";
import { getParam } from "$lib/api/utils.js";
import getSiblingAreas from "$lib/api/geo/getSiblingAreas.js";

export function GET({ url, params }) {
  const code = params.code;
  const parentLevel = getParam(url, "parentLevel", null);

  const siblings = getSiblingAreas({code, parentLevel});
  if (siblings.error) error(siblings.error, siblings.message);

  return json(siblings);
}