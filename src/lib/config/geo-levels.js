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

export const geoLevelsArray = Object.keys(geoLevels).map((key) => ({
  key,
  ...geoLevels[key],
}));

export const geoLevelsLookup = (() => {
  const lookup = {};
  for (const level of geoLevelsArray) {
    for (const code of level.codes) lookup[code] = level;
  }
  return lookup;
})();
