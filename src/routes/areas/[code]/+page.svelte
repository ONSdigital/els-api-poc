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

  export let data;
</script>

<PhaseBanner phase="prototype"/>
<Header compact title="{data.area.properties.areanm}" />
<Breadcrumb links={[{label: "ELS API experiments", href: resolve("/")}]}/>

<Section>
  <p style:margin="12px 0 32px">
    Navigate areas related to {data.area.properties.areanm} ({data.area.properties.areacd}).
  </p>
</Section>

{#snippet list(areas)}
  <List>
    {#each areas as area}
      <Li><a href={resolve(`/areas/${area.areacd}`)}>{area.areanm || area.areacd}</a> ({area.areacd})</Li>
    {/each}
  </List>
{/snippet}

<NavSections cls="nav-sections">
  {#if data.area.properties.parents[0]}
    <NavSection title="Parents">
      {@render list([...data.area.properties.parents].reverse())}
    </NavSection>
  {/if}
  {#if data.area.properties.children[0]}
    <NavSection title="Children">
      {@render list([...data.area.properties.children].sort((a, b) => a?.areanm?.localeCompare(b?.areanm)))}
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
</style>