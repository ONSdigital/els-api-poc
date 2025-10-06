<script>
  import { resolve } from '$app/paths';
  import {
    PhaseBanner,
    Header,
    Breadcrumb,
    Section,
    NavSections,
    NavSection,
    Footer,
    List,
    Li,
    Icon
  } from "@onsvisual/svelte-components";
  import groupAreasByLevel from "$lib/api/geo/helpers/groupAreasByLevel.js";
  import { fetchChartData } from "$lib/utils.js";

  export let data;
</script>

<PhaseBanner phase="prototype"/>
<Header compact title="{data.area.properties.areanm}" />
<Breadcrumb links={[{label: "ELS API experiments", href: resolve("/")}]}/>

<Section>
  {#await fetchChartData("population-indicators-Population count", data.area.properties.areacd)}
    <!-- Loading -->
  {:then chartData}
    {#if chartData?.[0]?.value}
      <p>
        <strong>{data.area.properties.areanm}</strong> ({data.area.properties.areacd}) had a population of <strong>{chartData[0].value.toLocaleString()}</strong> in {chartData[0].period.slice(0, 4)}.
        <!-- <a href={resolve(`/areas/${data.area.properties.areacd}/indicators`)}>More data <Icon type="arrow"/></a> -->
      </p>
    {/if}
  {:catch}
    <!-- Population not available -->
  {/await}
  <p style:margin="12px 0 32px">
    Explore areas related to {data.area.properties.areanm} below.
  </p>
</Section>

{#snippet list(areas)}
  <List>
    {#each areas as area}
      <Li><a href={resolve(`/areas/${area?.areacd}`)}>{area?.areanm || area?.areacd}</a> ({area?.areacd})</Li>
    {/each}
  </List>
{/snippet}

<NavSections cls="nav-sections">
  {#if data.area.properties.parents[0]}
    <NavSection title="Parent areas">
      {@render list([...data.area.properties.parents].reverse())}
    </NavSection>
  {/if}
  {#if data.area.properties.children[0]}
    <NavSection title="Child areas">
      {#each groupAreasByLevel(data.area.properties.children) as level}
        <h3>{level.label}</h3>
        {@render list(level.areas)}
      {/each}
      <!-- {@render list([...data.area.properties.children].sort((a, b) => a?.areanm?.localeCompare(b?.areanm)))} -->
    </NavSection>
  {/if}
  {#if data.related.similar[0]}
    <NavSection title="Similar areas">
      {#each data.related.similar as cluster}
        <h3>{cluster.label}</h3>
        {@render list(cluster.similar.slice(0, 10).map(cd => data.areaLookup[cd]))}
      {/each}
      <!-- {@render list([...data.area.properties.children].sort((a, b) => a?.areanm?.localeCompare(b?.areanm)))} -->
    </NavSection>
  {/if}
</NavSections>

<Footer compact />

<style>
  :global(.nav-sections section + section) {
    border-top: 1px solid #ddd;
    margin-top: 1.5em;
    padding-top: 1em;
  }
  :global(ul.ons-list) {
    margin-bottom: 1em;
  }
</style>