import filterDataset from "./filterDataset";

export default function filterAllDatasets(
  datasets,
  filters,
  params,
  format,
  singleIndicator = false
) {
  const filtered = [];
  for (const cube of datasets) {
    const data = filterDataset(cube, filters, params, format, singleIndicator);
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
