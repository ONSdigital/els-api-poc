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
    import MapLegend from "./MapLegend.svelte";

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

    const ukBounds = [-8.65, 49.867, 1.761, 60.856];
    const fitBoundsOptions = { padding: 10 };
    const features = makeMapFeatures(topo);
    const dispatch = createEventDispatcher();

    let map = $state();
    let breaks = $derived(valuesToBreaks(data.map((d) => d.value)));
    let { renderedFeatures, selectedAreas, bounds } = $derived(
        makeRenderedFeatures(features, data),
    );

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
            ft.properties = {
                ...ft.properties,
                ...d,
                color: valueToColor(d.value, breaks, colors),
            };
            const highlightColor = selected.includes(d.areacd)
                ? ONSpalette[selected.indexOf(d.areacd)]
                : null;
            if (highlightColor) {
                ft.properties.highlightColor = highlightColor;
                ft.properties.textColor = contrastColor(highlightColor);
                selectedAreas.push(ft.properties);
            }
            renderedFeatures.features.push(ft);
        }
        const bounds = bbox(renderedFeatures);
        return { renderedFeatures, selectedAreas, bounds };
    };

    function fitBounds(bounds) {
        map?.fitBounds?.(bounds, fitBoundsOptions);
    }
    $effect(() => fitBounds(bounds));
</script>

<div aria-hidden="true" class="map-outer">
    <div class="map-container">
        <Map
            bind:map
            style={resolve("/data/mapstyle.json")}
            location={{ bounds: bounds || ukBounds }}
            options={{
                fitBoundsOptions,
                maxBounds: [-19, 48, 12, 62],
                cooperativeGestures: true,
                preserveDrawingBuffer: true,
            }}
            controls
            {mapDescription}
        >
            {#if renderedFeatures}
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
                    >
                        <MapTooltip
                            content={features?.[hovered]?.properties?.areanm ||
                                ""}
                        />
                    </MapLayer>
                    <MapLayer
                        id="lines"
                        type="line"
                        paint={{
                            "line-color": "white",
                            "line-width": [
                                "case",
                                ["has", "highlightColor"],
                                5,
                                0.5,
                            ],
                        }}
                        order="place_other"
                    />
                    <MapLayer
                        id="highlighted"
                        type="line"
                        paint={{
                            "line-color": [
                                "case",
                                ["has", "highlightColor"],
                                ["get", "highlightColor"],
                                "rgba(0,0,0,0)",
                            ],
                            "line-width": 3,
                        }}
                        order="place_other"
                    />
                    <MapLayer
                        id="hovered"
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
            {/if}
        </Map>
    </div>
    <MapLegend
        data={data.map((d) => ({
            ...d,
            areanm: features[d.areacd]?.properties?.areanm,
        }))}
        {breaks}
        {hovered}
        {selectedAreas}
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
