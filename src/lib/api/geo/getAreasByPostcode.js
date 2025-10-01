import getAreasByLngLat from "./getAreasByLngLat.js";

export async function getAreasByPostcode(params = {}) {
  const areas = await getAreasByLngLat({
    lng: params.postcode.lng,
    lat: params.postcode.lat,
    groupByLevel: params.groupByLevel
  });

  return areas;
}