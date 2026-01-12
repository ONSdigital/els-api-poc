import { filterTime, filterTimeForGeo } from "./helpers/dataFilters";
import {
  toJSONStat,
  toRows,
  toCols
} from "./helpers/dataFormatters";
import { getSpreadsheetMetadata } from "./helpers/generateSpreadsheet";

export default function filterDataset(
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
