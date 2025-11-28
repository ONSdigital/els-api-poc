type parsedParam = string | string[] | number | boolean | null;

function parseParam(param: string): parsedParam {
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

export function getParam(url: URL, key: string, fallback: parsedParam) {
  const param = url.searchParams.get(key);
  if (param == null) return fallback;
  return parseParam(param);
}

export function getDimensionFilters(url: URL) {
  const params = [...url.searchParams].filter((p) =>
    p[0].startsWith("dimension_")
  );
  if (params.length === 0) return [];
  return params.map((p) => ({
    key: p[0].slice(10),
    values: formatParam(p[1]),
  }));
}

export function isValidAreaCode(code: string): boolean {
  return !!code.match(/^[EKNSW]\d{8}$/);
}

export function isValidPostcode(code: string): boolean {
  return !!code.match(/^[A-Z]{1,2}\d[A-Z\d]?\s?\d[A-Z]{2}$/);
}

export function isValidPartialPostcode(code: string): boolean {
  return code.match(/^[A-Z0-9\s]*$/) && code.match(/^[A-Z]{1,2}\d{0,2}/);
}

export function isValidLngLat(lng: number, lat: number): boolean {
  return Math.abs(lng) <= 180 && Math.abs(lat) <= 90;
}

export function isValidYear(str: string): boolean {
  return !!`${str}`.match(/^\d{4}$/);
}

export function isValidMonth(str: string): boolean {
  return !!`${str}`.match(/^\d{4}-\d{2}$/);
}

export function isValidDay(str: string): boolean {
  return !!`${str}`.match(/^\d{4}-\d{2}-\d{2}$/);
}

export function isValidDate(str: string): boolean {
  return (
    isValidDay(str) ||
    isValidMonth(str) ||
    isValidYear(str) ||
    ["earliest", "latest"].includes(str)
  );
}
