import { json } from "@sveltejs/kit";
import { getParam } from "$lib/api/utils.js";
import geoMetadata from "$lib/geo-metadata.json";
import geoGroups from "$lib/geo-groups.js";

const geoArray = Object.values(geoMetadata);

export function GET({ url, params }) {
  const code = params.code;
  const area = geoMetadata[code];
  if (!area) return json({message: "Area not found"});

  const geoLevel = getParam(url, "geoLevel", null);
  const geoGroup = geoGroups[geoLevel];
  if (!geoGroup) return json(area.children);

  return json(
    geoArray.filter(g => geoGroup.codes.includes(g.areacd.slice(0, 3)) && g.parents.includes(code))
      .map(g => g.areacd)
  );
}