import { json, error } from "@sveltejs/kit";
import { getParam } from "$lib/api/utils.js";
import getIndicators from "$lib/api/metadata/getIndicators.js";

export function GET({ params, url }) {
  const indicator = params.indicator || null;
  const topic = getParam(url, "topic", "all");
  const geo = getParam(url, "geo", "all");
  const time = getParam(url, "time", "all");
  const includeDims = getParam(url, "includeDims", false);

  const metadata = getIndicators({
    indicator,
    topic,
    geo,
    time,
    includeDims
  });

  if (metadata.error) error(400, metadata.error);

  return json(metadata);
}