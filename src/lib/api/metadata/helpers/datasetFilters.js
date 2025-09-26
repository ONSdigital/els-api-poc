// Functions to filter JSON-Stat at a dataset level
import geoGroups from "$lib/geo-groups";

export function makeTopicFilter(topic) {
  return (ds) =>
    ds.extension.topic === topic || ds.extension.subtopic === topic;
}

export function makeTimeFilter(time) {
  const timeString = String(time);
  if (!timeString.match(/^\d{4}$/))
    return {error: "Invalid 'time' parameter. Must be YYYY or 'all'."};
  return (ds) =>
    Object.keys(ds.dimension.date.category.index)
      .map((d) => d.slice(0, 4))
      .includes(timeString);
}

export function makeGeoFilter(geo) {
  if (geo.match(/[EKNSW]\d{8}/))
    return (ds) => !!ds.dimension.areacd.category.index[geo];
  const geoGroup = geoGroups[geo];
  if (geoGroup)
    return (ds) => {
      return geoGroup.codes.every((cd) =>
        ds.extension.geography.types.includes(cd)
      );
    };
  return {error: "Invalid 'geo' parameter. Must be a valid GSS code or geography level."};
}

export function makeDatasetFilter(topic, geo, time) {
  if (topic === "all" && geo === "all" && time === "all") return () => true;
  const topicFilter = topic === "all" ? () => true : makeTopicFilter(topic);
  const timeFilter = time === "all" ? () => true : makeTimeFilter(time);
  if (timeFilter.error) return timeFilter;
  const geoFilter = geo === "all" ? () => true : makeGeoFilter(geo);
  if (geoFilter.error) return geoFilter;
  return (ds) => topicFilter(ds) && timeFilter(ds) && geoFilter(ds);
}
