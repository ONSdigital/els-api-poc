import { json, error } from "@sveltejs/kit";
import rawMetadata from "$lib/json-stat-metadata.json";

export function GET({ params }) {
  const indicatorSlug = params.indicator || null;
  const dimensionSlug = params.dimension || null;

  // Get relevant indicator from all metadata
  const indicator = rawMetadata.link.item.find(ds => ds.extension.slug === indicatorSlug);
  if (!indicator) error(400, "Invalid indicator code");
  
  // If filtered for single dimension
  if (dimensionSlug) {
    if (indicator.dimension[dimensionSlug]) {
      const dimension = {
        key: dimensionSlug,
        label: indicator.dimension[dimensionSlug].label,
        values: Object.keys(indicator.dimension[dimensionSlug].category.index)
      };
      return json(dimension);
    } else {
      error(400, "Invalid dimension code");
    }
  }

  // Return all dimensions
  const dimensions = indicator.id.map(key => {
    const dim = {
      key,
      label: indicator.dimension[key].label,
      values: Object.keys(indicator.dimension[key].category.index)
    };
    return dim;
  });
  return json(dimensions);
}