import { json } from "@sveltejs/kit";
import { getParam } from "$lib/api/utils.js";
import getTaxonomy from "$lib/api/metadata/getTaxonomy.js";

export function GET({url}) {
  const topic = getParam(url, "topic", "all");
  const excludeMultivariate = getParam(url, "excludeMultivariate", false);
  const hasGeo = getParam(url, "hasGeo", "all");
  const hasYear = getParam(url, "hasYear", "all");
  const flat = getParam(url, "flat", false);

  const taxonomy = getTaxonomy({
    topic,
    excludeMultivariate,
    hasGeo,
    hasYear,
    flat
  });
  
  return json(taxonomy);
}