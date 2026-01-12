import filterAllDatasets from "./filterAllDatasets";
import { makeFilter, makeGeoFilter } from "./helpers/dataFilters";
import { toCSVW, csvSerialise } from "./helpers/dataFormatters";
import { isValidDate } from "$lib/api/utils";
import filterIndicators from "./filterIndicators";
import generateSpreadsheet from "./helpers/generateSpreadsheet";
import readData from "$lib/data";

const cube = await readData("json-stat");

export default async function filterCollection(params = {}) {
  // Filter datasets by indicator, topic and included geographies
  let datasets = filterIndicators(cube.link.item, params);

  // Check if request is for a single indicator
  const singleIndicator =
    params.topic === "all" &&
    params.indicator !== "all" &&
    [params.indicator].flat().length === 1;

  // Return only CSVW metadata, if requested
  if (params.format === "csvw") {
    const metadata = toCSVW(
      datasets,
      params.measure,
      params.href,
      singleIndicator,
      params.includeNames,
      params.includeStatus
    );
    return { format: "json", data: metadata };
  }

  // Create filters
  const filters = {};

  // Create filters for standard dimensions
  if (params.geo !== "all" || params.geoCluster !== "all")
    filters.areacd = makeGeoFilter(params.geo, params.geoExtent, params.geoCluster);
  if (params.time !== "all") {
    if (
      [params.time]
        .flat()
        .map((t) => isValidDate(t))
        .includes(false)
    )
      return { error: 400, message: "Invalid time period requested." };
    filters.period = params.time;
  }
  if (params.measure !== "all") filters.measure = makeFilter(params.measure);

  // Add other dimension filters
  for (const filter of params.dimFilters) {
    filters[filter.key] = makeFilter(filter.values);
  }

  // Apply filters to datasets and generate output for selected format
  datasets = filterAllDatasets(
    datasets,
    filters,
    params,
    params.format,
    singleIndicator
  );
  if (datasets.error) return datasets;

  return params.format === "csv"
    ? { format: "text", data: csvSerialise(datasets) }
    : params.format === "xlsx"
      ? { format: "xlsx", data: await generateSpreadsheet(datasets) }
      : { format: "json", data: datasets };
}
