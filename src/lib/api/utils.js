export function getParam(url, key, fallback = null) {
  const param = url.searchParams.get(key);
  if (!param) return fallback;
  return param === "true" ? true :
    param === "false" ? false :
    param.includes(",") ? param.split(",") :
    param.match(/^\d+$/) ? +param :
    param;
}

export function isValidAreaCode(code) {
  return !!code.match(/^[EKNSW]\d{8}$/);
}