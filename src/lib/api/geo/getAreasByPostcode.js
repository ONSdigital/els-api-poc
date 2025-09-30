import getAreasByLngLat from "./getAreasByLngLat";

export async function getAreasByPostcode(postcode) {
  const areas = await getAreasByLngLat(postcode.lng, postcode.lat);

  return areas;
}