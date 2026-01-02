<script lang="ts">
    //@ts-nocheck
    import { onMount, createEventDispatcher } from "svelte";
    import { resolve } from "$app/paths";
    import bbox from "@turf/bbox";
    import { makeMapFeatures, valuesToBreaks } from "$lib/utils";
    import { ONSpalette } from "$lib/config";
    import { contrastColor } from "./chartHelpers";
    import topo from "$lib/data/topo.json";
    import {
        Map,
        MapSource,
        MapLayer,
        MapTooltip,
    } from "@onsvisual/svelte-maps";
    import BreaksChart from "./BreaksChart.svelte";

    let {
        mapDescription,
        data,
        metadata,
        selected = [],
        hovered = null,
        colors = [
            "rgb(234, 236, 177)",
            "rgb(169, 216, 145)",
            "rgb(0, 167, 186)",
            "rgb(0, 78, 166)",
            "rgb(0, 13, 84)",
        ],
        topoPath = resolve("/data/topo.json"),
    } = $props();

    const features = makeMapFeatures(topo);
    const dispatch = createEventDispatcher();

    let breaks = $derived(valuesToBreaks(data.map((d) => d.value)));
    let { renderedFeatures, selectedAreas, bounds } = $derived(
        makeRenderedFeatures(features, data),
    );
    $inspect({ selected, selectedAreas });

    function doHover(e) {
        const area = e.detail?.feature?.properties || e.detail?.d;
        hovered = area?.areacd;
        dispatch("hover", { id: hovered, area, e });
    }

    function valueToColor(value, breaks, colors) {
        for (let i = 0; i < breaks.length - 1; i++) {
            if (value < breaks[i + 1]) return colors[i];
        }
        return colors[breaks.length - 2];
    }

    const makeRenderedFeatures = (features, data) => {
        if (!data)
            return {
                renderedFeatures: null,
                selectedAreas: [],
                bounds: null,
            };
        const renderedFeatures = { type: "FeatureCollection", features: [] };
        const selectedAreas = [];

        for (const d of data) {
            const ft = features[d.areacd] ? { ...features[d.areacd] } : null;
            if (!ft) continue;
            const highlightColor = selected.includes(d.areacd)
                ? ONSpalette[selected.indexOf(d.areacd)]
                : null;
            ft.properties = {
                ...ft.properties,
                ...d,
                color: valueToColor(d.value, breaks, colors),
                highlightColor,
                textColor: highlightColor
                    ? contrastColor(highlightColor)
                    : null,
            };
            renderedFeatures.features.push(ft);
            if (highlightColor) selectedAreas.push(ft.properties);
        }
        const bounds = bbox(renderedFeatures);
        return { renderedFeatures, selectedAreas, bounds };
    };
</script>

<div aria-hidden="true" class="map-outer">
    <div class="map-container">
        {#if features && bounds}
            <Map
                style={resolve("/data/mapstyle.json")}
                location={{ bounds }}
                options={{
                    fitBoundsOptions: { padding: 10 },
                    maxBounds: [-19, 48, 12, 62],
                    cooperativeGestures: true,
                    preserveDrawingBuffer: true,
                }}
                controls
                {mapDescription}
            >
                <MapSource
                    id="features"
                    type="geojson"
                    data={renderedFeatures}
                    promoteId="areacd"
                >
                    <MapLayer
                        id="fills"
                        type="fill"
                        paint={{
                            "fill-color": ["get", "color"],
                            "fill-opacity": 0.7,
                        }}
                        order="place_other"
                        hover
                        {hovered}
                        let:hovered
                        on:hover={doHover}
                        highlight
                        highlighted={selected}
                    >
                        <MapTooltip
                            content={features?.[hovered]?.properties?.areanm ||
                                ""}
                        />
                    </MapLayer>
                    <MapLayer
                        id="lines"
                        type="line"
                        paint={{ "line-color": "white", "line-width": 0.5 }}
                        order="place_other"
                    />
                    <MapLayer
                        id="highlight"
                        type="line"
                        paint={{
                            "line-color": [
                                "case",
                                ["==", ["feature-state", "hovered"], true],
                                "orange",
                                "rgba(255,255,255,0)",
                            ],
                            "line-width": 2,
                        }}
                        order="place_suburb"
                    />
                </MapSource>
            </Map>
        {/if}
    </div>
    <BreaksChart
        data={data.map((d) => ({
            ...d,
            areanm: features[d.areacd]?.properties?.areanm,
        }))}
        {breaks}
        {hovered}
        selected={selectedAreas}
        prefix={metadata.prefix}
        suffix={metadata.suffix}
        format={(d) =>
            d.toLocaleString("en-GB", {
                minimumFractionDigits: metadata.decimalPlaces,
                maximumFractionDigits: metadata.decimalPlaces,
            })}
        on:select={doSelect}
        on:hover={doHover}
    />
</div>

<style>
    .map-container {
        display: block;
        width: 100%;
        height: 500px;
    }
</style>
