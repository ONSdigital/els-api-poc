import { pointToTile } from "@mapbox/tilebelt";
import { areaTilesBase } from "../config.js";
import pointInPolygon from "@turf/boolean-point-in-polygon";

function makeArea(props) {
  return {areacd: props.areacd, areanm: props.areanm};
}

export default async function getAreasByLngLat(lng, lat) {
  const tile = pointToTile(lng, lat, 12);
  const point = {type: "Point", coordinates: [lng, lat]};
  const url = `${areaTilesBase}/${tile[0]}/${tile[1]}.json`;

  try {
    const geojson = await (await fetch(url)).json();
    const features = geojson.features.filter(f => pointInPolygon(point, f));
		return features.map(f => makeArea(f.properties));
  } catch {
    return {error: 400, message: "No areas found. Requested coordinates out of range."}
  }
}