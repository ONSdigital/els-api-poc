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
        dim.values = filterTimeForGeo(cube, dim.values, filters.hasGeo);
      dim.values = filterTime(dim.values, {
        time: filter,
        nearest: params.timeNearest,
      });
    } else if (filter) dim.values = dim.values.filter(filter);
    dims.push(dim);
  }
  const length = dims
    .map((dim) => dim.values.length)
    .reduce((a, b) => a * b, 1);
  if (length === 0) return null;

  if (format === "ods") {
    const data = toCols(cube, dims, params.includeNames, params.includeStatus);
    return data ? { data, meta: getSpreadsheetMetadata(cube) } : null;
  }
  if (format.slice(0, 4) === "cols")
    return toCols(cube, dims, params.includeNames, params.includeStatus);
  if (format.slice(0, 4) === "rows")
    return toRows(cube, dims, false, params.includeNames, params.includeStatus);
  if (format === "csv")
    return toRows(
      cube,
      dims,
      !singleIndicator,
      params.includeNames,
      params.includeStatus
    );
  return toJSONStat(cube, dims, params.includeNames, params.includeStatus);
}
