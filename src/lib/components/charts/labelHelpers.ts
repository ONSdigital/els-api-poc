import { tick } from "svelte";

export function labelPlacer(zs) {
  let batches = [];
  for (let z of zs) {
    batches.push({ size: 1, mean: z });
    while (batches.length > 1) {
      let b = batches[batches.length - 2];
      let c = batches[batches.length - 1];
      if (b.mean < c.mean) break;
      b.mean = (b.mean * b.size + c.mean * c.size) / (b.size + c.size);
      b.size = b.size + c.size;
      batches.pop();
    }
  }
  let xs = [];
  for (const batch of batches)
    for (let i = 0; i < batch.size; i++) xs.push(batch.mean);
  return xs;
}

export async function marginLabels(el, _selected, yScale, yKey, labelProximityThreshold = 1, elbowRoom = 6) {
    await tick();

    const divs = el.getElementsByTagName("div");
    const labelHeights = [...divs].map((d) => d.clientHeight);
    
    if (divs.length < 2) {
        lookup: []
        yLabelPositions: null;
        elbowOffset: [];
        console.log("fewer than 2 areas selected");
        return;
    }

    //////////////// Calculate dodged y positions for labels ///////////////
    let ys = _selected.map((s) => yScale(s[s.length - 1][yKey]));
    let ysIndexes = ys.map((y, i) => ({ y, i })).sort((a, b) => a.y - b.y);

    const cumulativeHeights = Array(_selected.length).fill(0);
    for (let j = 1; j < _selected.length; j++) {
      const current = ysIndexes[j].i;
      const previous = ysIndexes[j - 1].i;
      cumulativeHeights[current] =
        cumulativeHeights[previous] +
        (divs[previous].clientHeight + divs[current].clientHeight) / 2;
    }
    // subtract offsets
    let zs = ysIndexes.map(({ y, i }) => y - cumulativeHeights[i]);
    // run isotonic regression function to overwrite yLabelPositions
    let adj = labelPlacer(zs);
    // add offsets back on to the regressed values
    const yLabelPositions = Array(_selected.length).fill(0);
    ysIndexes.forEach(({ i }, j) => {
      yLabelPositions[i] = adj[j] + cumulativeHeights[i];
    });

    //////////////// Calculate elbow position for leader lines ///////////////
    
    // Group together proximate selected labels (after dodging)
    // to allow for elbow offsetting
    const leaderLineGroups = [];

    ysIndexes.forEach((arr, i) => {
      const y = yLabelPositions[i];
      let group = leaderLineGroups.find(
        (g) => Math.abs(g.y - y) < labelProximityThreshold
      );
      if (!group) {
        group = { y, items: [] };
        leaderLineGroups.push(group);
      }
      group.items.push(i);
    });

    const elbowOffsets = Array(_selected.length).fill(0);
    console.log({leaderLineGroups})

    leaderLineGroups.forEach((group) => {
      const indices = group.items;

      const middleElbowOffset = indices.length > 2 ? elbowRoom : elbowRoom / 2;

      const elbowGap =
        indices.length > 2
          ? middleElbowOffset / Math.floor((indices.length - 1) / 2)
          : 0;

      indices.forEach((labelIndex, groupIndex) => {
        const offset =
          middleElbowOffset -
          Math.floor(Math.abs(groupIndex - (indices.length - 1) / 2)) *
            elbowGap;

        elbowOffsets[labelIndex] = offset;
      });
    });

    const lookup = _selected.map((_, i) => ({ y: yLabelPositions[i], elbow: elbowOffsets[i] })); 
    return lookup;
  }
