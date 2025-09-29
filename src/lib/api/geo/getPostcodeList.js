import { postcodeLookupBase } from "../config.js";

export default async function getPostcodeList(code) {
  const cdUpper = code.toUpperCase();
  const cdTrimmed = cdUpper.match(/[A-Z0-9]/g).join("");
  const url = `${postcodeLookupBase}/${cdTrimmed.slice(0, 4)}.json`;
  const noCodesError = { error: 400, message: `Postcodes found for ${code}` };

  let postcodes;

  function makePostcodeRow(json, i) {
    return { cd: json.cd[i], lng: json.lng[i], lat: json.lat[i] };
  }

  try {
    const json = await (await fetch(url)).json();
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
      if (matches.length === 10) return matches;
    }
    postcodes = [...matches, ...partialMatches].slice(0, 10);
  } catch {
    return noCodesError;
  }

  return postcodes.length > 0 ? postcodes : noCodesError;
}
