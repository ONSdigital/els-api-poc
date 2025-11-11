import { json, text, error } from "@sveltejs/kit";
import { getParam, getDimensionFilters } from "$lib/api/utils.js";
import filterCollection from "$lib/api/data/filterCollection.js";

export async function GET({ params, url }) {
  const format = params.format || "cols";
  const topic = getParam(url, "topic", "all");
  const indicator = getParam(url, "indicator", "all");
  const excludeMultivariate = getParam(url, "excludeMultivariate", false);
  const geo = getParam(url, "geo", "all");
  const geoExtent = getParam(url, "geoExtent", "all");
  const hasGeo = getParam(url, "hasGeo", "any");
  const time = getParam(url, "time", "latest");
  const timeNearest = getParam(url, "timeNearest", "none");
  const measure = getParam(url, "measure", "all");
  const includeNames = getParam(url, "includeNames", false);
  const includeStatus = getParam(url, "includeStatus", false);
	const dimFilters = getDimensionFilters(url);

	const datasets = await filterCollection({
		format,
		topic,
		indicator,
		excludeMultivariate,
		geo,
		geoExtent,
		hasGeo,
		time,
		timeNearest,
		measure,
		includeNames,
		includeStatus,
		dimFilters,
		href: url.href
	});
  if (datasets.error) error(datasets.error, datasets.message);

	return datasets.format === "ods" ? new Response(datasets.data, {
		headers: {
			'Content-Type': 'application/vnd.oasis.opendocument.spreadsheet'
		}
	}) : datasets.format === "text" ? text(datasets.data) : json(datasets.data);
}