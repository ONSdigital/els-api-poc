import { json } from "@sveltejs/kit";
import { getParam } from "$lib/api/utils.js";
import getAreasList from "$lib/api/geo/getAreasList";

export function GET({ url }) {
  const geo = getParam(url, "geo", "all");
  const year = getParam(url, "year", "latest");
  const includeParents = getParam(url, "includeParents", false);
  const includeChildren = getParam(url, "includeChildren", false);
  const includeDates = getParam(url, "includeDates", false);
  const includeLevel = getParam(url, "includeLevel", false);

  const areasList = getAreasList({
    geo,
    year,
    includeParents,
    includeChildren,
    includeDates,
    includeLevel
  });

  return json(areasList);
}