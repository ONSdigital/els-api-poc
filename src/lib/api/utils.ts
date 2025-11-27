function formatParam(param) {
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

export function getParam(url, key, fallback = undefined) {
  const param = url.searchParams.get(key);
  if (param == null) return fallback;
  return formatParam(param);
}

export function getDimensionFilters(url) {
  const params = [...url.searchParams].filter(p => p[0].startsWith("dimension_"));
  if (params.length === 0) return [];
  return params.map(p => ({key: p[0].slice(10), values: formatParam(p[1])}));
}

export function isValidAreaCode(code) {
  return !!code.match(/^[EKNSW]\d{8}$/);
}

export function isValidPostcode(code) {
  return !!code.match(/^[A-Z]{1,2}\d[A-Z\d]?\s?\d[A-Z]{2}$/);
}

export function isValidPartialPostcode(code) {
  return code.match(/^[A-Z0-9\s]*$/) && code.match(/^[A-Z]{1,2}\d{0,2}/);
}

export function isValidLngLat(lng, lat) {
  return Math.abs(lng) <= 180 && Math.abs(lat) <= 90;
}

export function isValidYear(str) {
  return !!`${str}`.match(/^\d{4}$/);
}

export function isValidMonth(str) {
  return !!`${str}`.match(/^\d{4}-\d{2}$/);
}

export function isValidDay(str) {
  return !!`${str}`.match(/^\d{4}-\d{2}-\d{2}$/);
}

export function isValidDate(str) {
  return isValidDay(str) || isValidMonth(str) || isValidYear(str) || ["earliest", "latest"].includes(str);
}
