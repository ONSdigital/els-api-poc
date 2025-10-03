import { isValidPartialPostcode } from "$lib/api/utils.js";
import { postcodeLookupBase } from "../config.js";

function makePostcodeRow(json, i) {
  return { areacd: json.cd[i], lng: json.lng[i], lat: json.lat[i] };
}

export default async function getPostcodesList(params = {}) {
  const cdUpper = params?.code?.toUpperCase();
  if (!isValidPartialPostcode(cdUpper))
    return { error: 400, message: `${params.code} is not a valid partial postcode.` };

  const cdTrimmed = cdUpper.match(/[A-Z0-9]/g).join("");
  const url = `${postcodeLookupBase}/${cdTrimmed.slice(0, 4)}.json`;
  const noCodesError = {
    error: 400,
    message: `No postcodes found for ${params.code}`,
  };

  let postcodes;

  try {
    const json = await (await fetch(url)).json();

    const limit = params.limit || 10;
    const matches = [];
    const partialMatches = [];

    for (let i = 0; i < json.cd.length; i++) {
      if (json.cd[i].slice(0, cdUpper.length) === cdUpper) {
        matches.push(makePostcodeRow(json, i));
      } else if (
        json.cd[i].replace(" ", "").slice(0, cdTrimmed.length) === cdTrimmed
      ) {
        partialMatches.push(makePostcodeRow(json, i));
      }
      if (matches.length === limit) return matches;
    }
    postcodes = [...matches, ...partialMatches].slice(0, limit);
  } catch {
    return noCodesError;
  }

  return postcodes.length > 0 ? postcodes : noCodesError;
}
