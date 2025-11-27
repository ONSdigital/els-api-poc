import { json, error } from "@sveltejs/kit";
import { getParam } from "$lib/api/utils";
import getIndicators from "$lib/api/metadata/getIndicators";

export function GET({ params, url }) {
  const indicator = params.indicator || getParam(url, "indicator", null);
  const topic = getParam(url, "topic", "all");
  const excludeMultivariate = getParam(url, "excludeMultivariate", false);
  const hasGeo = getParam(url, "hasGeo", "all");
  const hasYear = getParam(url, "hasYear", "all");
  const fullDims = getParam(url, "fullDims", false);
  const asLookup = getParam(url, "asLookup", false);

  const metadata = getIndicators({
    indicator,
    topic,
    excludeMultivariate,
    hasGeo,
    hasYear,
    fullDims,
    asLookup,
    singleIndicator: !!params.indicator
  });

  if (metadata.error) error(400, metadata.error);

  return json(metadata);
}