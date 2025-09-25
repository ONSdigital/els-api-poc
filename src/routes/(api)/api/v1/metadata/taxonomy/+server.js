import { json } from "@sveltejs/kit";
import { getParam } from "$lib/api/utils.js";
import taxonomy from "$lib/taxonomy.json";

export function GET({url}) {
  const flat = getParam(url, "flat", false);

  const data = flat ? taxonomy.map(topic => 
    topic.children.map(subTopic => 
      subTopic.children ? 
        subTopic.children.map(ind => ({
          label: ind.label,
          key: ind.key,
          description: ind.description,
          topic: topic.key,
          subTopic: subTopic.key
        })).flat() :
        ({
          label: subTopic.label,
          key: subTopic.key,
          description: subTopic.description,
          topic: topic.key,
          subTopic: topic.key
        })).flat()
      ).flat() : taxonomy;
  return json(data);
}