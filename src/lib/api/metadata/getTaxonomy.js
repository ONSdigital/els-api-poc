import taxonomy from "$lib/data/taxonomy.json";

function flattenTaxonomy(taxonomy) {
  return taxonomy
    .map((topic) =>
      topic.children
        .map((subTopic) =>
          subTopic.children
            ? subTopic.children
                .map((ind) => ({
                  label: ind.label,
                  key: ind.key,
                  description: ind.description,
                  topic: topic.key,
                  subTopic: subTopic.key,
                }))
                .flat()
            : {
                label: subTopic.label,
                key: subTopic.key,
                description: subTopic.description,
                topic: topic.key,
                subTopic: topic.key,
              }
        )
        .flat()
    )
    .flat();
}

export default function getTaxonomy(params = {}) {
  return params.flat ? flattenTaxonomy(taxonomy) : taxonomy;
}
