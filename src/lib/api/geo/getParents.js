import geoMetadata from "$lib/geo-metadata.json";

export default function getParents(code) {
  const area = geoMetadata[code];
  if (!area) return { error: 400, message: `Parents not found for ${code}` };

  return area.parents;
}
