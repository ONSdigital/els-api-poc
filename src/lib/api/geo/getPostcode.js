import { postcodeLookupBase } from "../config.js";
import { isValidPostcode } from "../utils.js";

export default async function getPostcode(code) {
  const cdUpper = code.toUpperCase();
  if (!isValidPostcode(cdUpper))
      return {error: 400, message: `${code} is not a valid postcode`};

  const cdBare = cdUpper.match(/[A-Z0-9]/g).join("");
  const url = `${postcodeLookupBase}/${cdBare.slice(0, 4)}.json`;
  const noCodesError = { error: 400, message: `Postcode ${code} not found` };

  try {
    const json = await (await fetch(url)).json();
    const regex = new RegExp(`^${cdBare}$`, "i");

    const i = json.cd.findIndex(cd => cd.replace(" ", "").match(regex));
    if (i === -1) return noCodesError;

    return {areacd: json.cd[i], lng: json.lng[i], lat: json.lat[i]};
  } catch {
    return noCodesError;
  }
}
