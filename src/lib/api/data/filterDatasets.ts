import { filterTime, filterTimeForGeo, makeFilter, makeGeoFilter } from "./helpers/dataFilters";
import {
  toJSONStat,
  toRows,
  toCols
} from "./helpers/dataFormatters";
import { getSpreadsheetMetadata } from "./helpers/generateXLSX";
import { toCSVW } from "./helpers/dataFormatters";
import { isValidDate } from "$lib/api/utils";

// Filter and format a single JSON-Stat dataset based on selected filters/parameters
export function filterJSONStat(
  cube,
  filters,
  params,
  format,
  singleIndicator
) {
  const dims = [];

  // Filter on each dimension in sequence
  for (let i = 0; i < cube.id.length; i++) {
    const key = cube.id[i];
    const dimension = cube.dimension[key];
    const dim = {
      key: key,
      count: cube.size[i],
      values: Object.entries(dimension.category.index),
    };
    const filter = filters[key];
    if (filter && dim.key === "period") {
      if (filters.hasGeo)
        // If "hasGeo" param is applied. Only years with the requested geography are included
        dim.values = filterTimeForGeo(cube, dim.values, filters.hasGeo);

      // Time filtering depends on the time period format and range for the specific indicator
      dim.values = filterTime(dim.values, {
        time: filter,
        nearest: params.timeNearest,
      });
    } else if (filter) {
      // Non-time dimension filters can be applied the same way to any indicator
      dim.values = dim.values.filter(filter);
    }
    dims.push(dim);
  }

  // Calculate the number of values/observations in the filtered dataset
  const length = dims
    .map((dim) => dim.values.length)
    .reduce((a, b) => a * b, 1);
  if (length === 0) return null;

  // Generate the filtered dataset in the requested format
  if (format === "xlsx") {
    const data = toCols(cube, dims, params.includeNames, params.includeStatus);
    return data ? { data, meta: getSpreadsheetMetadata(cube) } : null;
  }
  if (format === "csv")
    return toRows(
      cube,
      dims,
      !singleIndicator,
      params.includeNames,
      params.includeStatus
    );
  if (format.slice(0, 4) === "cols")
    return toCols(cube, dims, params.includeNames, params.includeStatus);
  if (format.slice(0, 4) === "rows")
    return toRows(cube, dims, false, params.includeNames, params.includeStatus);
  return toJSONStat(cube, dims, params.includeNames, params.includeStatus);
}

// Filter and format the data within an array of JSON-Stat datasets
export default function filterDatasets(
  datasets,
  params,
  format,
) {
  // Check if request is for a single indicator
  const singleIndicator =
    params.topic === "all" &&
    params.indicator !== "all" &&
    [params.indicator].flat().length === 1;

  // Return only CSVW metadata, if requested
  if (params.format === "csvw") {
    return toCSVW(
      datasets,
      params.measure,
      params.href,
      singleIndicator,
      params.includeNames,
      params.includeStatus
    );
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

  const filtered = [];
  for (const cube of datasets) {
    const data = filterJSONStat(cube, filters, params, format, singleIndicator);
    if (data) filtered.push(data);
  }

  if (!filtered?.length)
    return { error: 400, message: "No data available for the selected filters." };
  if (format === "csv") return filtered.map((f) => f[1]);
  if (format === "xlsx") return filtered;

  if (["rows", "cols"].includes(format.slice(0, 4)))
    return singleIndicator && filtered.length === 1
      ? filtered[0][1]
      : Object.fromEntries(filtered);
  return singleIndicator
    ? filtered[0]
    : {
      version: "2.0",
      class: "collection",
      label: "ONS Explore Local Statistics API response",
      // updated: cube.updated,
      link: { item: filtered },
    };
}
