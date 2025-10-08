const uk = {label: "United Kingdom", codes: ["K02"]};
const ctry = {label: "Country", codes: ["E92", "N92", "S92", "W92"]};
const rgn = {label: "Region", codes: ["E12"]};
const cauth = {label: "Combined authority", codes: ["E47"]};
const cty = {label: "County", codes: ["E10"]};
const ua = {label: "Unitary authority", codes: ["E06", "E07", "E08", "E09", "N09", "S12", "W06"]};
const lad = {label: "Non-metropolitan district", codes: ["E07"]};
const utla = {label: "Upper tier/unitary authority", codes: [...cty.codes, ...ua.codes]};
const ltla = {label: "Lower tier/unitary authority", codes: [...ua.codes, ...lad.codes]};
const wpc = {label: "Parliamentary constituency", codes: ["E14", "N05", "N06", "S14", "W07"]};
const wd = {label: "Electoral ward", codes: ["E05", "W05"]};
const par = {label: "Parish", codes: ["E04", "W04"]};
const sener = {label: "Senedd electoral region", codes: ["W10"]};
const senc = {label: "Senedd constituency", codes: ["W09"]};
const msoa = {label: "Middle-layer super output area", codes: ["E02", "W02"]};
const lsoa = {label: "Lower-layer super output area", codes: ["E01", "W01"]};
const oa = {label: "Output area", codes: ["E00", "W00"]};

const altLabels = {
	E08: "Metropolitan district",
	E09: "Borough",
	N09: "Local government district",
	S12: "Council area",
  W04: "Community"
};

export const geoLevels = {
  ctry: {label: ctry.label, codes: [...uk.codes, ...ctry.codes]},
  rgn: {label: "Region/country", codes: ["N92", "S92", "W92", ...rgn.codes]},
  cauth,
  utla,
  ltla
};

export const geoLevelsNamed = {uk, rgn, cauth, cty, ltla, wpc, wd, par, sener, senc};
export const geoLevelsAll = {...geoLevelsNamed, msoa, lsoa, oa};

function makeArray(obj) {
  return Object.keys(obj).map((key) => ({
    key,
    ...obj[key],
  }));
}

function makeLookup(arr) {
  const lookup = {};
  for (const level of arr) {
    for (const code of level.codes) lookup[code] = {
      ...level,
      label: altLabels[code] || level.label
    };
  }
  return lookup;
}

export const geoLevelsArray = makeArray(geoLevels);
export const geoLevelsLookup = makeLookup(geoLevelsArray);

export const geoLevelsAllArray = makeArray(geoLevelsAll);
export const geoLevelsAllLookup = makeLookup(geoLevelsAllArray);
