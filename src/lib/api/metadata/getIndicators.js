import { makeDatasetFilter } from "./helpers/datasetFilters.js";
import { formatDimension } from "./helpers/formatMetadata.js";
import readData from "$lib/data";

const rawMetadata = await readData("json-stat");

function formatMetadata(ds, minimalMetadata = false, fullDims = false) {
  if (!ds) return {};
  if (minimalMetadata)
    return {
      label: ds.label,
      slug: ds.extension.slug,
      topic: ds.extension.topic,
      subTopic: ds.extension.subTopic,
      description: ds.extension.subtitle,
    };

  const metadata = { label: ds.label, ...ds.extension, updated: ds.updated, caveats: ds.note };
  metadata.dimensions = Object.fromEntries(ds.id.map((key, i) => [key, {...formatDimension(ds, key, fullDims), order: i}]));
  return metadata;
}

export default function getIndicators(params = {}) {
  if (params.indicator) {
    const indicator = rawMetadata.link.item.find(
      (ds) => ds.extension.slug === params.indicator
    );
    if (!indicator) return { error: "Invalid indicator code" };
    return formatMetadata(
      indicator,
      params.minimalMetadata,
      params.fullDims
    );
  }

  const filter = makeDatasetFilter(
    params.topic,
    params.excludeMultivariate,
    params.hasGeo,
    params.hasYear
  );
  if (filter.error) return filter;

  const metadata = rawMetadata.link.item
    .filter(filter)
    .map((ds) =>
      formatMetadata(ds, params.minimalMetadata, params.fullDims)
    );

  return metadata;
}
