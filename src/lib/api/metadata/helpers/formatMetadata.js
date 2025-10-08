export function formatDimension(indicator, dimension) {
  return {
    key: dimension,
    label: indicator.dimension[dimension].label,
    values: Object.keys(indicator.dimension[dimension].category.index),
  };
}
