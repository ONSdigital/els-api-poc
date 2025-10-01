import { pointToTile } from "@mapbox/tilebelt";
import pointInPolygon from "@turf/boolean-point-in-polygon";
import { areaTilesBase } from "../config.js";
import groupAreasByLevel from "./helpers/groupAreasByLevel.js";

function makeArea(props) {
  return {areacd: props.areacd, areanm: props.areanm};
}

export default async function getAreasByLngLat(params = {}) {
  const tile = pointToTile(params.lng, params.lat, 12);
  const point = {type: "Point", coordinates: [params.lng, params.lat]};
  const url = `${areaTilesBase}/${tile[0]}/${tile[1]}.json`;

  try {
    const geojson = await (await fetch(url)).json();
    const features = geojson.features.filter(f => pointInPolygon(point, f));
		const areas = features.map(f => makeArea(f.properties));
    return params.groupByLevel ? groupAreasByLevel(areas) : areas;
  } catch {
    return {error: 400, message: "No areas found. Requested coordinates out of range."}
  }
}