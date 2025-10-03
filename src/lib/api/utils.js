export function getParam(url, key, fallback = undefined) {
  const param = url.searchParams.get(key);
  if (!param) return fallback;
  return param === "true"
    ? true
    : param === "false"
      ? false
      : param.includes(",")
        ? param.split(",")
        : param.match(/^-?\d+(\.\d+)?$/)
          ? +param
          : param;
}

export function isValidAreaCode(code) {
  return !!code.match(/^[EKNSW]\d{8}$/);
}

export function isValidPostcode(code) {
  return !!code.match(/^[A-Z]{1,2}\d[A-Z\d]?\s?\d[A-Z]{2}$/);
}

export function isValidPartialPostcode(code) {
  return !!code.match(/^[A-Z]{1,2}\d{0,2}/);
}

export function isValidLngLat(lng, lat) {
  return Math.abs(lng) <= 180 && Math.abs(lat) <= 90;
}
