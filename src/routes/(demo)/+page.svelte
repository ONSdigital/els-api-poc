<script lang="ts">
  import { base } from "$app/paths";
  import {
    PhaseBanner,
    Header,
    Section,
    Footer,
    Grid,
    Card,
  } from "@onsvisual/svelte-components";
</script>

<PhaseBanner phase="prototype" />
<Header compact title="Explore local statistics app rebuild" />

<Section marginTop={true}>
  <p>
    This preview includes ongoing work on the rebuild of the <a
      href="https://www.ons.gov.uk/explore-local-statistics"
      target="_blank">Explore Local Statistics</a
    > (ELS) app along with various proof-of-concept pages for demonstrating and testing
    the performance new internal API.
  </p>
</Section>

<Grid colWidth="medium" title="App rebuild">
  <Card title="ELS app rebuild" mode="featured" href="{base}/home">
    Rebuilding the ELS app using the API (in progress).
  </Card>
</Grid>
<Grid colWidth="medium" title="Demos and tests">
  <Card title="Query builder" mode="featured" href="{base}/query">
    Build a query to download data from the API.
  </Card>
  <Card title="Area charts demo" mode="featured" href="{base}/area">
    Load all data for a selected area and then render charts.
  </Card>
  <Card title="Lazy charts demo" mode="featured" href="{base}/charts">
    Same as charts demo, but with data lazy loaded per chart.
  </Card>
  <!-- <Card title="Explore areas demo" mode="featured" href="{base}/areas">
    API-driven navigation through areas within the UK.
  </Card>
  <Card title="Explore indicators demo" mode="featured" href="{base}/indicators">
    API-driven navigation through indicators within the taxonomy.
  </Card>
  <Card title="Single indicator demo" mode="featured" href="{base}/indicator">
    Indicator page demo, with data lazy loaded per chart/map.
  </Card> -->
  <Card title="Formats and units" mode="featured" href="{base}/formats">
    Adding automatic units, dates and descriptions to data.
  </Card>
  <Card title="Population pyramids" mode="featured" href="{base}/pyramid">
    Options for displaying population by age and sex data.
  </Card>
  <Card title="Selection modals" mode="featured" href="{base}/modals">
    Example modals for making selections on pages.
  </Card>
</Grid>

<Footer compact />

<style>
  :global(.ons-input) {
    color: #707070;
    margin-bottom: 10px;
  }
</style>
