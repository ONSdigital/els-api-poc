import { readFileSync, writeFileSync } from "fs";

const input_path = "./src/lib/data/metadata.json";
const output_path = "./src/lib/data/taxonomy.json";

const metadata = JSON.parse(readFileSync(input_path));
const indicators = Object.values(metadata).map(ind => ({
  label: ind.metadata.label,
  key: ind.metadata.slug,
  topic: ind.topic,
  subTopic: ind.subTopic,
  description: ind.metadata.subtitle
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
