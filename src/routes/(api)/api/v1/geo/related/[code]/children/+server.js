import { json, error } from "@sveltejs/kit";
import { getParam } from "$lib/api/utils.js";
import getChildren from "$lib/api/geo/getChildren";

export function GET({ url, params }) {
  const code = params.code;
  const geoLevel = getParam(url, "geoLevel", null);

  const children = getChildren({code, geoLevel});
  if (children.error) error(children.error, children.message);

  return json(children);
}