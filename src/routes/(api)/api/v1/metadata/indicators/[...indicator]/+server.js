import { json, error } from "@sveltejs/kit";
import { getParam } from "$lib/api/utils.js";
import rawMetadata from "$lib/json-stat-metadata.json";
import geoGroups from "$lib/geo-groups";

function makeTopicFilter(topic) {
  return (ds) => ds.extension.topic === topic || ds.extension.subtopic === topic;
}

function makeTimeFilter(time) {
  const timeString = String(time);
  if (!timeString.match(/^\d{4}$/)) error(400, "Invalid 'time' parameter. Must be YYYY or 'all'.");
  return (ds) => Object.keys(ds.dimension.date.category.index).map(d => d.slice(0, 4)).includes(timeString);
}

function makeGeoFilter(geo) {
  if (geo.match(/[EKNSW]\d{8}/)) return (ds) => !!ds.dimension.areacd.category.index[geo];
  const geoGroup = geoGroups[geo];
  if (geoGroup) return (ds) => {
    return geoGroup.codes.every(cd => ds.extension.geography.types.includes(cd));
  }
  error(400, "Invalid 'geo' parameter. Must be a valid GSS code or geography level.");
}

function makeFilter(topic, geo, time) {
  if (topic === "all" && geo === "all" && time === "all") return () => true;
  const topicFilter = topic === "all" ? () => true : makeTopicFilter(topic);
  const timeFilter = time === "all" ? () => true : makeTimeFilter(time);
  const geoFilter = geo === "all" ? () => true : makeGeoFilter(geo);
  return (ds) => topicFilter(ds) && timeFilter(ds) && geoFilter(ds);
}

function formatMetadata(ds, includeDims = false) {
  if (!ds) return {};
  const metadata = {label: ds.label, ...ds.extension, caveats: ds.note};
  if (includeDims) metadata.dimensions = ds.id.map(key => {
    const dim = {
      key,
      label: ds.dimension[key].label,
      values: Object.keys(ds.dimension[key].category.index)
    };
    return dim;
  });
  return metadata;
}

export function GET({ params, url }) {
  const indicatorSlug = params.indicator || null;
  const topic = getParam(url, "topic", "all");
  const geo = getParam(url, "geo", "all");
  const time = getParam(url, "time", "all");
  const includeDims = getParam(url, "includeDims", false);

  if (indicatorSlug) {
    const indicator = rawMetadata.link.item.find(ds => ds.extension.slug === indicatorSlug);
    if (!indicator) error(400, "Invalid indicator code");
    return json(formatMetadata(indicator, includeDims));
  }

  const filter = makeFilter(topic, geo, time);

  const metadata = rawMetadata.link.item
    .filter(filter)
    .map(ds => formatMetadata(ds, includeDims));

  return json(metadata);
}