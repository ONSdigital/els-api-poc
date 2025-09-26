import geoMetadata from "$lib/geo-metadata.json";
import geoGroups from "$lib/geo-groups.js";

const geoArray = Object.values(geoMetadata);

export default function getChildren(params = {}) {
  const area = geoMetadata[params.code];
  if (!area) return { error: 400, message: `Area ${code} not found` };

  const geoGroup = geoGroups[params.geoLevel];
  if (!geoGroup) return area.children;

  return geoArray
    .filter(
      (g) =>
        geoGroup.codes.includes(g.areacd.slice(0, 3)) &&
        g.parents.includes(params.code)
    )
    .map((g) => g.areacd);
}
