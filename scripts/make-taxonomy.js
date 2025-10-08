import { readFileSync, writeFileSync } from "fs";

const input_path = "./src/lib/data/json-stat.json";
const output_path = "./src/lib/data/taxonomy.json";

const cube = JSON.parse(readFileSync(input_path));
const indicators = cube.link.item.map(ds => ({
  label: ds.label,
  key: ds.extension.slug,
  topic: ds.extension.topic,
  subTopic: ds.extension.subTopic,
  description: ds.extension.subtitle
}));

const topicsIndex = {};

for (const ind of indicators) {
  const indicator = {
    label: ind.label,
    key: ind.key,
    description: ind.description
  };
  if (!topicsIndex[ind.topic]) topicsIndex[ind.topic] = {
    label: ind.topic[0].toUpperCase() + ind.topic.slice(1),
    key: ind.topic,
    children: {}
  };
  if (ind.topic === ind.subTopic) {
    topicsIndex[ind.topic].children[ind.key] = indicator;
  } else {
    if (!topicsIndex[ind.topic].children[ind.subTopic])
      topicsIndex[ind.topic].children[ind.subTopic] = {
        label: ind.subTopic[0].toUpperCase() + ind.subTopic.slice(1),
        key: ind.subTopic,
        children: {}
    };
    topicsIndex[ind.topic].children[ind.subTopic].children[ind.key] = indicator;
  }
}

const topics = Object.values(topicsIndex);
for (const topic of topics) {
  topic.children = Object.values(topic.children);
  if (topic.children[0].children) {
    for (const subTopic of topic.children) subTopic.children = Object.values(subTopic.children);
  }
}

writeFileSync(output_path, JSON.stringify(topics));
console.log(`Wrote ${output_path}`);
