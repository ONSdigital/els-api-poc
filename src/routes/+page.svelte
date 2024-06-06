<script>
    import { page } from "$app/stores"
    import { Header, PhaseBanner, Footer, Section, Accordion, AccordionItem, Input, Button, Checkboxes } from "@onsvisual/svelte-components";

    export let data;
    const { indicators, areas, areaTypes, years } = data;

    let indicatorsSelected = [];
    let areasSelected = [];
    let areaTypesSelected = [];
    let yearsSelected = [];

    function makeApiUrl(indicators, areaTypes, areas, years) {
        let filters = [];
        if (indicators[0]) filters.push(`indicator=${indicators.join()}`);
        if (areaTypes[0] || areas[0]) filters.push(`geography=${[...areaTypes, ...areas].join()}`);
        if (years[0]) filters.push(`year=${years.join()}`);
        return `${$page.url.origin}/api${filters[0] ? `?${filters.join('&')}` : ''}`;
    }
</script>

<Header title="Explore Local Statistics API Prototype" compact>
    <div slot="before">
        <PhaseBanner phase="prototype"/>
    </div>
</Header>

<Section marginTop>
    <p>Construct an API query by filtering indicators, areas and years.</p>
    <p>If you don't make a selection, the API will return all results (eg. selecting no years will return data for all years).</p>
</Section>

{#if indicators && areas && areaTypes && years}
<Section>
    <Accordion>
        <AccordionItem title="Select indicators">
            <Checkboxes items={indicators} bind:value={indicatorsSelected} label="Select one or more indicator" compact/>
        </AccordionItem>
        <AccordionItem title="Select areas">
            <Checkboxes items={areaTypes} bind:value={areaTypesSelected} label="Select one or more area types" compact/>
            <Checkboxes items={areas} bind:value={areasSelected} label="Select one or more individual areas" compact/>
        </AccordionItem>
        <AccordionItem title="Select years">
            <Checkboxes items={years} bind:value={yearsSelected} label="Select one or more years" compact/>
        </AccordionItem>
    </Accordion>
</Section>
<Section>
    <Input value="{makeApiUrl(indicatorsSelected, areaTypesSelected, areasSelected, yearsSelected)}" label="Permalink"/>
    <Button href="{makeApiUrl(indicatorsSelected, areaTypesSelected, areasSelected, yearsSelected)}">Get data</Button>
</Section>
{/if}

<Footer compact/>

<style>
    :global(input[type=text]) {
        margin-bottom: 24px;
    }
    :global(.ons-checkboxes__items) {
        margin-bottom: 24px;
    }
</style>