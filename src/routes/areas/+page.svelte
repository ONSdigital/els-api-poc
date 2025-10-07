<script>
  import { resolve } from "$app/paths";
  import { goto } from "$app/navigation";
  import throttle from "throttleit";
  import {
    PhaseBanner,
    Header,
    Breadcrumb,
    Section,
    Select,
    Button,
    Footer
  } from "@onsvisual/svelte-components";

  let selected = $state();

  async function loadOptionsFn(query, populateResults) {
    try {
      const url = resolve(`/api/v1/geo/search/${query.toLowerCase()}`);
      const raw = await (await fetch(url)).json();
      const results = raw.map(d => {
        d.group = 
      });
      populateResults(results);
    } catch {
      return populateResults([]);
    }
	}
  const loadOptions = throttle(loadOptionsFn, 1000);

  function gotoSelected(e) {
    e.preventDefault();
    if (selected) goto(resolve(`/areas/${selected.areacd}/`))
  }
</script>

<PhaseBanner phase="prototype"/>
<Header compact title="Explore areas demo" />
<Breadcrumb links={[{label: "ELS API experiments", href: resolve("/")}]}/>

<Section>
  <p style:margin="12px 0 32px">
    Find an area to get started, on start from the <a href={resolve("/areas/K02000001/")}>United Kingdom</a> (K02000001).
  </p>
  <form class="form-select" onsubmit={gotoSelected}>
    <Select {loadOptions} label="Type a place name" placeholder='Eg. "Fareham" or "Newport"' on:change={(e) => selected = e.detail} labelKey="areanm" mode="search" autoClear={false} clearable/>
    <Button type="submit" small disabled={!selected}>Select area</Button>
  </form>
</Section>

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
  .form-select {
    display: flex;
    flex-direction: row;
    flex-wrap: wrap;
    gap: 6px;
    align-items: flex-end;
  }
  .form-select :global(button) {
    margin-bottom: 4px;
  }
  .form-select :global(.ons-autocomplete-wrapper) {
    min-width: 300px;
  }
</style>