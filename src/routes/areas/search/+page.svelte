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
    Li
  } from "@onsvisual/svelte-components";

  let { data } = $props();
</script>

<PhaseBanner phase="prototype"/>
<Header compact title="Area search demo" />
<Breadcrumb links={[{label: "ELS API experiments", href: resolve("/")}, {label: "Explore areas demo", href: resolve("/areas/")}]}/>

<Section>
  <p style:margin="12px 0 32px">
    Areas matching <strong>"{data.query}"</strong>.
  </p>
</Section>

{#snippet list(areas)}
  <List>
    {#each areas as area}
      <Li><a href={resolve(`/areas/${area?.areacd}`)}>{area?.areanm || area?.areacd}</a> ({area?.areacd})</Li>
    {/each}
  </List>
{/snippet}

{#if data.areas.length > 0}
  <NavSections cls="nav-sections">
    {#each data.areas as geoLevel}
      <NavSection title={geoLevel.label}>
        {@render list(geoLevel.areas)}
      </NavSection>
    {/each}
  </NavSections>
{/if}

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