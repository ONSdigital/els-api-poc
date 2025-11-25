import getIndicators from "./getIndicators.js";
import summaryData from "$lib/data/json-stat-summary.json";
import { capitalise } from "$lib/utils";

function makeItem(slug, label = null, description = null) {
  const item = { label: label || capitalise(slug), slug };
  if (description) return { ...item, description };
  return { ...item, children: {} };
}

function nestTaxonomy(taxonomy) {
  const topicsIndex = {};

  for (const ind of taxonomy) {
    const indicator = makeItem(ind.slug, ind.label, ind.description);
    if (!topicsIndex[ind.topic]) topicsIndex[ind.topic] = makeItem(ind.topic);
    if (ind.topic === ind.subTopic) {
      topicsIndex[ind.topic].children[ind.slug] = indicator;
    } else {
      if (!topicsIndex[ind.topic].children[ind.subTopic])
        topicsIndex[ind.topic].children[ind.subTopic] = makeItem(ind.subTopic);
      topicsIndex[ind.topic].children[ind.subTopic].children[ind.slug] =
        indicator;
    }
  }

  const topics = Object.values(topicsIndex);
  for (const topic of topics) {
    topic.children = Object.values(topic.children);
    if (topic.children[0].children) {
      for (const subTopic of topic.children)
        subTopic.children = Object.values(subTopic.children);
    }
  }
  return topics;
}

export default function getTaxonomy(params = {}) {
  const taxonomy = getIndicators({ ...params, minimalMetadata: true });
  const meta = { count: taxonomy.length, total: summaryData.count };
  const data = params.flat ? taxonomy : nestTaxonomy(taxonomy);
  return { meta, data };
}
