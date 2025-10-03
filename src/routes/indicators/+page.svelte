<script>
  import { resolve } from "$app/paths";
  import {
    PhaseBanner,
    Header,
    Breadcrumb,
    Section,
    NavSections,
    NavSection,
    Footer,
  } from "@onsvisual/svelte-components";

  export let data;
</script>

<PhaseBanner phase="prototype"/>
<Header compact title="Explore indicators demo" />
<Breadcrumb links={[{label: "ELS API experiments", href: resolve("/")}]}/>

<Section>
  <p style:margin="12px 0 32px">
    Explore our 90 local indicators, including disposable household income, participation in further education and life satisfaction.
  </p>
</Section>

{#snippet indicator(ind)}
  <p>
    <a href="{resolve(`/indicators/${ind.key}`)}">{ind.label}</a><br/>
    {ind.description}
  </p>
{/snippet}

<NavSections>
  {#each data.taxonomy as theme}
    <NavSection title={theme.label} id={theme.key}>
      {#each theme.children as child}
        {#if child.description}
          {@render indicator(child)}
        {:else}
          <h3>{child.label}</h3>
          {#each child.children as ind}
            {@render indicator(ind)}
          {/each}
        {/if}
      {/each}
    </NavSection>
  {/each}
</NavSections>

<Footer compact />

<style>
  :global(.ons-input) {
    color: #707070;
    margin-bottom: 10px;
  }
</style>