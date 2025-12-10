<script lang="ts">
    import { resolve } from "$app/paths";
    import { getName } from "@onsvisual/robo-utils";
    import { ONSpalette } from "$lib/config";
    import { makeCanonicalSlug } from "$lib/api/geo/helpers/areaSlugUtils";
    import { Details, Em } from "@onsvisual/svelte-components";
    import ClusterMap from "./ClusterMap.svelte";

    let { areaProps, selectedCluster } = $props();
</script>

<ClusterMap {selectedCluster} />
{#if selectedCluster.cluster}
    <p>
        <Em mode="badge" color={ONSpalette[0]}>
            {getName(areaProps)} is in {selectedCluster.key} cluster {selectedCluster
                .cluster.label}
        </Em>
    </p>
    <p>{selectedCluster.cluster.description}</p>
{/if}
<Details title="Show the 20 most similar areas to {getName(areaProps, 'the')}">
    <ol>
        {#each selectedCluster.similar as area}
            <li>
                <a
                    href={resolve(
                        `/app/areas/${makeCanonicalSlug(area)}/indicators`,
                    )}>{getName(area)}</a
                >
            </li>
        {/each}
    </ol>
</Details>
