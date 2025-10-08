import { json, error } from "@sveltejs/kit";
import { getParam } from "$lib/api/utils.js";
import getChildAreas from "$lib/api/geo/getChildAreas.js";

export function GET({ url, params }) {
  const code = params.code;
  const geoLevel = getParam(url, "geoLevel", null);

  const children = getChildAreas({code, geoLevel});
  if (children.error) error(children.error, children.message);

  return json(children);
}