import filterAllDatasets from "./filterAllDatasets";
import { makeFilter, makeGeoFilter } from "./helpers/dataFilters";
import { toCSVW, csvSerialise } from "./helpers/dataFormatters";
import { isValidDate } from "$lib/api/utils";
import { makeDatasetGeoFilter } from "$lib/api/metadata/helpers/datasetFilters";
import generateSpreadsheet from "./helpers/generateSpreadsheet";
import readData from "$lib/data";

const cube = await readData("json-stat");

export default async function filterCollection(params = {}) {
  let datasets = cube.link.item;

  const singleIndicator =
    params.topic === "all" &&
    params.indicator !== "all" &&
    [params.indicator].flat().length === 1;
  const filters = {};

  // Filter datasets by indicator, and by topic OR sub-topic (additive)
  const topicFilter =
    params.topic === "all"
      ? () => true
      : (d) =>
        [params.topic]
          .flat()
          .some((t) => [d.extension.topic, d.extension.subTopic].includes(t));
  const indicatorFilter =
    params.indicator === "all"
      ? () => true
      : (d) => [params.indicator].flat().includes(d.extension.slug);
  const combinedFilter = ![params.topic, params.indicator].includes("all")
    ? (d) => topicFilter(d) || indicatorFilter(d)
    : (d) => topicFilter(d) && indicatorFilter(d);
  datasets = datasets.filter(combinedFilter);

  // Remove multi-variate indicators if they have not been selected explicitly
  if (params.excludeMultivariate === true) {
    datasets = datasets.filter(
      (d) =>
        !(
          d.extension.isMultivariate &&
          ![params.indicator].flat().includes(d.extension.slug)
        )
    );
  }

  // Filter for datasets that include a specific geography
  if (params.hasGeo !== "any") {
    const geoFilter = makeDatasetGeoFilter(params.hasGeo);
    if (geoFilter.error) return geoFilter;
    datasets = datasets.filter(geoFilter);
  }

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
