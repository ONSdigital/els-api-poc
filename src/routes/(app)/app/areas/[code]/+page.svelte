<script lang="ts">
  // @ts-nocheck
  import { resolve } from "$app/paths";
  import {
    analyticsEvent,
    Hero,
    Grid,
    GridCell,
    Button,
    Select,
    Card,
    PhaseBanner,
    Header,
    Breadcrumb,
    Tabs,
    Tab,
  } from "@onsvisual/svelte-components";
  import { getName, capitalise } from "@onsvisual/robo-utils";
  import topojson from "$lib/data/topo.json";
  import { base } from "$app/paths";
  import { makeCanonicalSlug } from "$lib/utils.ts";
  import throttle from "throttleit";
  import { goto } from "$app/navigation";
  let { data } = $props();
  let selected = $state();
  let clientWidth = $state();
  $inspect(data);

  async function loadOptionsFn(query, populateResults) {
    try {
      const url = resolve(
        `/api/v1/geo/search/${query.toLowerCase()}?searchPostcodes=true`
      );
      const results = await (await fetch(url)).json();
      populateResults(
        results.data.map((d) => {
          if (!d.areanm) d.areanm = d.areacd;
          return d;
        })
      );
    } catch {
      return populateResults([]);
    }
  }
  const loadOptions = throttle(loadOptionsFn, 500);

  function gotoSelected(e) {
    e.preventDefault();
    if (selected)
      goto(
        resolve(
          selected.lng
            ? `/app/areas/search?q=${selected.areacd}`
            : `/app/areas/${selected.areacd}/`
        )
      );
  }
  $inspect(selected);

  let childTypes = $derived(data.area.properties.child_typecds);
  let childType = $derived(data.area.properties.child_typecds[0]);
  console.log("Child types:");
  $inspect(childTypes);
  console.log("Current child type:");
  $inspect(childType);

  let grouped = {};
  for (const child of data.area.properties.children) {
    const type = child.areacd.slice(0, 3);
    if (!grouped[type]) grouped[type] = [];
    grouped[type].push(child);
  }
  $inspect(grouped);
</script>

<Hero
  title={data.area.properties.areanm}
  titleBadge={{
    label: data.area.properties.areacd,
    ariaLabel: `Area code: ${data.area.properties.areacd}`,
    color: "#003c57",
  }}
  width="medium"
  background="#eaeaea"
  cls="titleblock-transparent"
>
  <p class="ons-hero__text">
    {#if data.area.properties.areacd === "K02000001"}
      Explore areas within the United Kingdom.
    {:else}
      {capitalise(data.area.properties.typenm)}
      in
      <!-- {data.related.parents[0].areanm} -->
      <a
        href="{base}/app/areas/{makeCanonicalSlug(
          data.area.properties.parents[0].areacd
        )}"
        data-sveltekit-noscroll
      >
        {getName(data.area.properties.parents[0])}</a
      >
      <!-- do we want the URLS to be just the code or the code-name? -->
    {/if}
  </p>
</Hero>

<Grid>
  <GridCell colspan={2}>
    <h2>Area nav map here for {data.area.properties.areanm}</h2>
  </GridCell>

  <div class="ons-grid__col ons-col-4@l grid-cell-flex">
    {#if data.area.properties.areacd !== "K02000001"}
      <div class="local-indicators-card">
        <h2 class="ons-card__title ons-u-fs-m" style:margin-bottom="12px">
          Local indicators for {data.area.properties.areanm}
        </h2>
        <p style:margin-bottom="20px">
          Health, education, economy, life satisfaction and more.
        </p>
        <Button
          icon="arrow"
          iconPosition="after"
          variant="ghost"
          href="{base}/app/areas/{makeCanonicalSlug(
            data.area.properties.areacd
          )}/indicators"
          small>Explore local indicators</Button
        >
      </div>
    {/if}
    <div class="area-search-card">
      <h2 class="ons-card__title ons-u-fs-m">Find another area</h2>
      <label for="search" style:display="block" style:margin-bottom="8px"
        >Search for a place name or postcode</label
      >
      <form class="form-select" onsubmit={gotoSelected}>
        <div class="select-wrapper">
          <Select
            {loadOptions}
            label=""
            placeholder="Eg. `Fareham` or `Newport`"
            on:change={(e) => (selected = e.detail)}
            labelKey="areanm"
            mode="search"
            autoClear={false}
            clearable
          />
        </div>
        <Button
          type="submit"
          text="Search"
          icon="search"
          small
          hideLabel
          disabled={!selected}>{"Search"}</Button
        >
      </form>
    </div>
  </div>
  <GridCell colspan={3}>
    <!-- <div style:margin-top="10px" class="ons-u-d-b@s" bind:clientWidth={tabsWidth}></div> -->
    <!-- {#key childType} -->
    <Tabs selected={childType} compact>
      {#each childTypes as type, i}
        <Tab title={capitalise(type)} id={type} hideTitle>
          <ul class="list-columns">
            {#each grouped[type] as child}
              <li>
                <a
                  href="{base}/app/areas/{makeCanonicalSlug(child.areacd)}"
                  data-sveltekit-noscroll>{getName(child)}</a
                >
              </li>
            {/each}
          </ul>
        </Tab>
      {/each}
    </Tabs>
    <!-- {/key} -->
  </GridCell>
</Grid>

<style>
  .link-parent {
    display: block;
  }
  ul.list-columns {
    list-style: none;
    margin: 4px 0 8px;
    padding: 0;
    column-width: 220px;
    overflow-x: none;
    position: relative;
  }
  ul.list-columns > li {
    font-size: 16px !important;
    margin: 0;
    padding: 0;
  }
  /* :global(#related-areas .ons-tab[aria-selected='true']:not(:focus)) {
		background: #f3f3f3 !important;
	}
	:global(#related-areas .ons-tab[aria-selected='true']:focus) {
		box-shadow:
			inset 0 0 0 4px #f3f3f3,
			inset 12px 0 0 0 #f3f3f3,
			inset -12px 0 0 0 #f3f3f3,
			inset 0 -8px 0 0 #222 !important;
	} */
  :global(.select-wrapper label.ons-label) {
    font-weight: normal;
  }
  :global(h1 > span.title-subscript) {
    display: inline-block;
    font-size: 22px;
    font-weight: normal;
    margin: 0 -2px 0 -5px;
    transform: translateY(-3px);
  }
  :global(a.ons-card__link) {
    width: 100%;
    display: flex;
    flex-direction: column;
  }
  :global(a.ons-card__link > h3) {
    padding-top: 0 !important;
  }
  .grid-cell-flex {
    display: inline-flex;
    flex-direction: row;
    flex-wrap: wrap;
    gap: 1rem;
  }
  .grid-cell-flex > div {
    flex-basis: 0;
    flex-grow: 1;
    min-width: 300px;
    padding: 1rem;
  }
  .local-indicators-card {
    color: var(--ons-color-page-light);
    background-color: var(--ons-color-branded-secondary);
  }
  .area-search-card {
    background: var(--ons-color-banner-bg);
  }
  .additional-area-info {
    margin-top: 12px;
    margin-bottom: 0;
  }
  .active-badge {
    font-weight: bold;
    color: white;
    padding: 0 8px 2px 8px;
    border-radius: 4px;
    background-color: #003c57;
    margin-right: 2px;
  }
  .inactive-badge {
    font-weight: bold;
    color: white;
    padding: 0 8px 2px 8px;
    border-radius: 4px;
    background-color: #fa6401;
    margin-right: 2px;
  }
</style>
