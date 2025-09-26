import { json } from "@sveltejs/kit";
import { getParam } from "$lib/api/utils.js";
import getTaxonomy from "$lib/api/metadata/getTaxonomy.js";

export function GET({url}) {
  const flat = getParam(url, "flat", false);

  const taxonomy = getTaxonomy({flat});
  
  return json(taxonomy);
}