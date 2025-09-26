import rawMetadata from "$lib/json-stat-metadata.json";
import { formatDimension } from "./helpers/formatMetadata";

export default function getDimensions(params = {}) {
  // Get relevant indicator from all metadata
  const indicator = rawMetadata.link.item.find(ds => ds.extension.slug === params.indicator);
  if (!indicator) return {error: 400, message: `Invalid indicator code ${params.indicator}`};

  // If filtered for single dimension
  if (params.dimension) {
    if (indicator.dimension[params.dimension]) {
      return formatDimension(indicator, params.dimension);
    } else {
      return {error: 400, message: `Invalid dimension code ${params.dimension}`};
    }
  }

  // Otherwise return all dimensions
  return indicator.id.map(key => formatDimension(indicator, key));
}
