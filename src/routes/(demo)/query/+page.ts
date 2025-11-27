import { resolve } from "$app/paths";
import { geoLevels as geoLevelsLookup } from "$lib/config/geoLevels";

function getParamVals(url, param, fallback = null) {
  const val = url.searchParams.get(param);
  if (!val) return fallback || [];
  return val.split(",");
}

export const load = async ({ fetch, url }) => {
  const topic = getParamVals(url, "topic");
  const indicator = getParamVals(url, "indicator");
  const geo = getParamVals(url, "geo");
  const geoLevel = getParamVals(url, "geoLevel");
  const time = getParamVals(url, "time");
  const measure = getParamVals(url, "measure");
  const step = +getParamVals(url, "step", [1])[0];

	const areaList = await(await fetch(`/api/v1/geo/list`)).json();
  areaList.sort((a, b) => a.areanm.localeCompare(b.areanm));

  const taxonomy = (await (
    await fetch(resolve("/api/v1/metadata/taxonomy?flat=true"))
  ).json()).data;

  const topics = Array.from(new Set(taxonomy.map((t) => t.topic))).map((t) => ({
    slug: t,
    label: t[0].toUpperCase() + t.slice(1),
  }));

  const indicators =
    indicator || topic
      ? await (
          await fetch(
            resolve(
              `/api/v1/metadata/indicators?${
                topic ? `topic=${[topic].flat().join(",")}&` : ""
              }${
                indicator ? `indicator=${[indicator].flat().join(",")}&` : ""
              }fullDims=true`
            )
          )
        ).json()
      : null;

  const geoLevels = indicators
    ? Array.from(new Set(indicators.map((ind) => ind.geography.levels).flat()))
        .filter((key) => key !== "uk")
        .map((key) => ({ key, ...geoLevelsLookup[key] }))
    : null;

  const years = indicators
    ? Array.from(
        new Set(
          indicators
            .map((ind) =>
              Object.keys(ind.dimensions.period.category.index).map(
                (p) => +p.slice(0, 4)
              )
            )
            .flat()
        )
      ).sort((a, b) => a - b)
    : null;

  const measures = indicators
    ? indicators
        .map((ind) =>
          Object.keys(ind.dimensions.measure.category.index).map((key) => ({
            key,
            label: ind.dimensions.measure.category.label[key],
          }))
        )
        .flat()
        .filter(
          (d, i, arr) => i === arr.findIndex((item) => item.key === d.key)
        )
        .sort((a, b) => a.label.localeCompare(b.label))
    : null;

  return {
    // Params
    topic,
    indicator,
    geo,
    geoLevel,
    time,
    measure,
    step,
    // Loaded data
    areaList,
    taxonomy,
    indicators,
    topics,
    geoLevels,
    years,
    measures,
  };
};
