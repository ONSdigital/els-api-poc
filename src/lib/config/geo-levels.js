export const geoLevels = {
  ctry: {
    label: "Countries",
    codes: ["K02", "E92", "N92", "S92", "W92"],
  },
  rgn: {
    label: "Regions",
    codes: ["E12", "N92", "S92", "W92"],
  },
  cauth: {
    label: "Combined authorities",
    codes: ["E47"],
  },
  utla: {
    label: "Local authorities (upper tier)",
    codes: ["E06", "E08", "E09", "E10", "N09", "S12", "W06"],
  },
  ltla: {
    label: "Local authorities (lower tier)",
    codes: ["E06", "E07", "E08", "E09", "N09", "S12", "W06"],
  },
};

export const geoLevelsOtherNamed = {
  wpc: {
    label: "parliamentary constituencies",
		codes: ["E14", "N05", "N06", "S14", "W07"]
  },
  wd: {
    label: "Electoral wards",
    codes: ["E05", "W05"]
  },
  par: {
    label: "Civil parish",
		codes: ["E04", "W04"]
  },
  sener: {
    label: "Senedd electoral regions",
		codes: ["W10"]
  },
  senc: {
    label: "Senedd constituencies",
		codes: ["W09"]
  }
};

export const geoLevelsOther = {
  msoa: {
    label: "Middle-layer super output areas",
		codes: ["E02", "W02"]
  },
  lsoa: {
    label: "Lower-layer super output areas",
		codes: ["E01", "W01"]
  },
  oa: {
    label: "Output areas",
		codes: ["E00", "W00"]
  }
};

export const geoLevelsNamed = {...geoLevels, ...geoLevelsOtherNamed};
export const geoLevelsAll = {...geoLevelsNamed, ...geoLevelsOther};

function makeArray(obj) {
  return Object.keys(obj).map((key) => ({
    key,
    ...obj[key],
  }));
}

function makeLookup(arr) {
  const lookup = {};
  for (const level of arr) {
    for (const code of level.codes) lookup[code] = level;
  }
  return lookup;
}

export const geoLevelsArray = makeArray(geoLevels);
export const geoLevelsLookup = makeLookup(geoLevelsArray);

export const geoLevelsAllArray = makeArray(geoLevelsAll);
export const geoLevelsAllLookup = makeLookup(geoLevelsAllArray);
