<script>
  import { base } from "$app/paths";
  import {
    PhaseBanner,
    Header,
    Section,
    Footer,
    Grid,
    Card
  } from "@onsvisual/svelte-components";
</script>

<PhaseBanner phase="prototype"/>
<Header compact title="ELS API experiments" />

<Section marginTop="{true}">
  <p>
    This prototype is being developed as a sandbox for exploring and testing new ways to serve data to the Explore Local Statistics (ELS) service.
  </p>
</Section>

<Grid colWidth="medium">
  <Card title="Path-based API" mode="featured" href="{base}/path">
    Request data based on a URL path.
  </Card>
  <Card title="Query-based API" mode="featured" href="{base}/query">
    Request data based on URL query parameters.
  </Card>
  <Card title="Area charts demo" mode="featured" href="{base}/area">
    Load all data for a selected area and then render charts.
  </Card>
  <Card title="Lazy charts demo" mode="featured" href="{base}/charts">
    Same as charts demo, but with data lazy loaded per chart.
  </Card>
  <Card title="Single indicator demo" mode="featured" href="{base}/indicator">
    Indicator page demo, with data lazy loaded per chart/map.
  </Card>
</Grid>

<Footer compact />

<style>
  :global(.ons-input) {
    color: #707070;
    margin-bottom: 10px;
  }
</style>