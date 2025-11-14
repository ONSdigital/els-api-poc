<script lang="ts">
  // @ts-nocheck
  import { resolve } from "$app/paths";
  import { goto } from "$app/navigation";
  import { page } from '$app/stores';
  import throttle from "throttleit";
  import {
    Breadcrumb,
    Hero,
    Section,
    Divider,
    List,
    Grid,
    Card,
    Button,
    Header,
    PhaseBanner,
    Icon,
    Select,
    Footer,
  } from "@onsvisual/svelte-components";
  import UKMap from "$lib/components/UKMap.svelte";

 let selected = $state();

  async function loadOptionsFn(query, populateResults) {
    try {
      const url = resolve(`/api/v1/geo/search/${query.toLowerCase()}?searchPostcodes=true`);
      const results = await (await fetch(url)).json();
      populateResults(results.data.map((d) => {
        if (!d.areanm) d.areanm = d.areacd;
        return d;
      }));
    } catch {
      return populateResults([]);
    }
	}
  const loadOptions = throttle(loadOptionsFn, 500);

  function gotoSelected(e) {
    e.preventDefault();
    if (selected) goto(resolve(selected.lng ? `/app/areas/search?q=${selected.areacd}` : `/app/areas/${selected.areacd}/`))
  }
</script>

<PhaseBanner phase="prototype" />
<Header />
<Breadcrumb links={[{ label: "ELS API experiments", href: resolve("/") }]} />

<Hero title="Explore local statistics" background="#e9eff4">
  <UKMap />
  <p class="ons-hero__text">
    Find, compare and visualise statistics about places in the United Kingdom.
  </p>
</Hero>

<Grid marginTop id="nav-cards" colWidth="wide">
  <Card title="Find an area" mode="featured">
    <p style:margin-bottom="28px">
      <label for="search"
        >Search for a postcode, local authority, region, parliamentary
        constituency or other named area.</label
      >
    </p>
    <form class="form-select" onsubmit={gotoSelected}>
        <div class="select-wrapper">
            <Select
                {loadOptions}
                label=""
                placeholder='Eg. "Fareham" or "Newport"'
                on:change={(e) => (selected = e.detail)}
                labelKey="areanm"
                mode="search"
                autoClear={false}
                clearable
            />
      </div>
      <Button type="submit" text="Search" icon="search" small hideLabel disabled={!selected}>{"Search"}</Button>
    </form>
  </Card>

  <Card title="Local indicators" mode="featured">
    <p style:margin-bottom="28px">
      Explore {$page.data.taxonomyFlat.length} indicators, including
      <a
        href={resolve(`/app/indicators/gross-disposable-household-income-per-head`)}
        class="no-wrap">household income</a
      >,
      <a href={resolve(`/app/indicators/further-education-and-skills-participation`)}
        >further education participation</a
      >
      and
      <a href={resolve(`/app/indicators/wellbeing-satisfaction`)}>life satisfaction</a>.
    </p>
    <Button icon="arrow" iconPosition="after" href={resolve(`/app/indicators`)} small
      >Explore indicators</Button
    >
  </Card>
</Grid>

<Section>
  <p>
    You can also start your search from 
    <a href={resolve(`/areas/E92000001-england`)}
      >England</a
    >,
    <a href={resolve(`/areas/W92000004-wales`)}>Wales</a>,
    <a href={resolve(`/areas/S92000003-scotland`)}>Scotland</a>
    or <a href={resolve(`/areas/N92000002-northern-ireland`)}>Northern Ireland</a>.
  </p>
</Section>

<Divider hr="full" />

<Section title="Other sources of local statistics">
  <p>
    Wales, Scotland and Northern Ireland also have their own producers of
    official statistics (links open in a new tab).
  </p>

  <List mode="dash">
    <li>
      <a
        href="https://statswales.gov.wales/Catalogue"
        target="_blank"
        rel="noreferrer">StatsWales</a
      >
      <span class="inline-icon"><Icon type="launch" /></span>
      <span class="ons-external-link__new-window-description ons-u-vh"
        >(opens in a new tab)</span
      >
    </li>
    <li>
      <a
        href="https://statistics.gov.scot/home"
        target="_blank"
        rel="noreferrer">Statistics.gov.scot</a
      >
      <span class="inline-icon"><Icon type="launch" /></span>
      <span class="ons-external-link__new-window-description ons-u-vh"
        >(opens in a new tab)</span
      >
    </li>
    <li>
      <a href="https://data.nisra.gov.uk/" target="_blank" rel="noreferrer"
        >Northern Ireland Statistics and Research Agency</a
      >
      <span class="inline-icon"><Icon type="launch" /></span>
      <span class="ons-external-link__new-window-description ons-u-vh"
        >(opens in a new tab)</span
      >
    </li>
  </List>
</Section>
<Section title="About these pages">
  <p>
    These pages are part of the Explore Subnational Statistics (ESS) service.
  </p>

  <p>
    The vision for the ESS service was launched in the <a
      href="https://analysisfunction.civilservice.gov.uk/policy-store/gss-subnational-data-strategy/"
      >Government Statistical Service (GSS) subnational data strategy</a
    >, which provides a framework to guide the GSS in producing and
    disseminating subnational statistics in a more timely, granular and
    harmonised way.
  </p>
  <p>
    The ESS service aims to provide one place for users to find, visualise,
    compare and download subnational statistics by standardised geographies and
    customer-defined areas.
  </p>
  <p>
    Information on the strengths and limitations of the Explore Local Statistics
    (ELS) service and methods used is available in
    <a
      href="https://www.ons.gov.uk/peoplepopulationandcommunity/healthandsocialcare/healthandwellbeing/methodologies/explorelocalstatisticsserviceqmi"
      >ELS quality and methodology information (QMI) report</a
    >.
  </p>
  <p>
    We value your feedback on these statistics. If you would like to get in
    touch, please email <a href="mailto:explore.local.statistics@ons.gov.uk"
      >explore.local.statistics@ons.gov.uk</a
    >.
  </p>
</Section>
<Footer />

<style>
  .no-wrap {
    white-space: nowrap;
  }
  :global(#nav-cards .ons-btn__inner) {
    height: 40px;
  }
</style>
