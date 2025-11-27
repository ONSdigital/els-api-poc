<script lang="ts">
  // @ts-nocheck
  import { resolve } from "$app/paths";
  import { goto, afterNavigate } from "$app/navigation";
  import { getName, capitalise } from "@onsvisual/robo-utils";
  import { makeCanonicalSlug } from "$lib/api/geo/helpers/areaSlugUtils";
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
  import AreaNavMap from "./AreaNavMap.svelte";
  import AreaSearch from "$lib/components/nav/AreaSearch.svelte";

  let { data } = $props();
  let areaProps = $derived(data.area.properties);

  let clientWidth = $state();
  let selectedChildGroupKey = $derived(areaProps.children[0]?.key || null);
  let selectedChildGroup = $derived(
    areaProps.children.find((c) => c.key === selectedChildGroupKey)
  );

  function handleSelect(area) {
    goto(resolve(`/app/areas/${makeCanonicalSlug(area.areacd, area.areanm)}`), {
      noScroll: true,
    });
  }
</script>

<Hero
  title={areaProps.areanm}
  titleBadge={{
    label: areaProps.areacd,
    ariaLabel: `Area code: ${areaProps.areacd}`,
    color: "#003c57",
  }}
  width="medium"
  background="#eaeaea"
  cls="titleblock-transparent"
>
  <p class="ons-hero__text">
    {#if areaProps.areacd === "K02000001"}
      Explore areas within the United Kingdom.
    {:else}
      {@const parent = areaProps.parents[0]}
      {capitalise(areaProps.typenm)}
      in
      {capitalise(areaProps.typenm)}
      <a
        href={resolve(
          `/app/areas/${makeCanonicalSlug(parent.areacd, parent.areanm)}`
        )}
        data-sveltekit-noscroll
      >
        {getName(parent, "the")}</a
      >
    {/if}
  </p>
</Hero>

<Grid marginTop>
  <GridCell colspan={2}>
    <AreaNavMap
      area={data.area}
      children={selectedChildGroup}
      onSelect={handleSelect}
      mapDescription={"Map of " + getName(areaProps, "the")}
    />
  </GridCell>
  <div class="ons-grid__col ons-col-4@l grid-cell-flex">
    {#if areaProps.areacd !== "K02000001"}
      <div class="local-indicators-card">
        <h2 class="ons-card__title ons-u-fs-m" style:margin-bottom="12px">
          Local indicators for {areaProps.areanm}
        </h2>
        <p style:margin-bottom="20px">
          Health, education, economy, life satisfaction and more.
        </p>
        <Button
          icon="arrow"
          iconPosition="after"
          variant="ghost"
          href={resolve(
            `/app/areas/${makeCanonicalSlug(areaProps.areacd)}/indicators`
          )}
          small>Explore local indicators</Button
        >
      </div>
    {/if}
    <div class="area-search-card">
      <h2 class="ons-card__title ons-u-fs-m">Find another area</h2>
      <label for="search" style:display="block" style:margin-bottom="8px"
        >Search for a place name or postcode</label
      >
      <AreaSearch id="search" onSelect={handleSelect} />
    </div>
  </div>
  {#if areaProps.children[0]}
    <GridCell colspan={3}>
      {#key areaProps}
        <Tabs bind:selected={selectedChildGroupKey} compact>
          {#each areaProps.children as childGroup, i}
            <Tab
              title={capitalise(childGroup.label)}
              id={childGroup.key}
              hideTitle
            >
              <ul class="list-columns">
                {#each childGroup.areas as child}
                  <li>
                    <a
                      href={resolve(
                        `/app/areas/${makeCanonicalSlug(child.areacd)}`
                      )}
                      data-sveltekit-noscroll>{getName(child)}</a
                    >
                  </li>
                {/each}
              </ul>
            </Tab>
          {/each}
        </Tabs>
      {/key}
    </GridCell>
  {/if}
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
