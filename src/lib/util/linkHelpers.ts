import { geoLevelsAllLookup } from "$lib/config/geoLevels";
import { getName } from '@onsvisual/robo-utils';
import { makeCanonicalSlug } from '$lib/api/geo/helpers/areaSlugUtils';
import productLinks from "$lib/data/product-links.json";
import { render } from "svelte/server";

const validYear = (area, year) =>
    !year || ((!area.start || year > area.start) && (!area.end || year <= area.end));

function getParent(area, geocodes, year = null) {
    const parents = [...area.parents];
    if (['E', 'W'].includes(area.areacd[0]))
        parents.push({
            areacd: 'K04000001',
            areanm: 'England and Wales'
        });
    for (const parent of parents) {
        const typecd = parent.areacd.slice(0, 3);
        if (geocodes.includes(typecd) && validYear(parent, year)) {
            parent.groupcd = geoLevelsAllLookup[typecd]?.key ? geoLevelsAllLookup[typecd].key : 'ew';
            return parent;
        }
    }
    return null;
}

function renderTemplate(template, area) {
    const getProp = (key) => {
        const val = area[key];
        if (key === 'groupcd' && val === 'ltla') return 'lad'; // Hack for LTLA issue on Census Maps links
        return val;
    };

    let output = template;
    const strs = template.match(new RegExp(/\{(.*?)\}/g));

    if (Array.isArray(strs)) {
        strs.forEach((s) => {
            if (s.includes('name')) {
                const context = s.slice(1, -1).split(',')[1];
                output = output.replace(
                    s,
                    `${getName(area, context, 'prefix')} <strong>${getName(area)}</strong>`
                );
            } else if (s.includes('slug')) {
                output = output.replace(s, makeCanonicalSlug(area));
            } else {
                output = output.replace(s, getProp(s.slice(1, -1)));
            }
        });
    }

    return output;
}

function formatLink(link, area) {
    const formattedLink = { ...link };
    formattedLink.description = renderTemplate(link.description, area);
    formattedLink.href = renderTemplate(link.href, area);
    return formattedLink;
}

function filterProductLinks(links: object[], area: object) {
    const areaLinks = [];
    const parentLinks = [];
    for (const l of links) {
        const parent = getParent(area, l.geocodes, l.year);
        if (l.geocodes.includes(area.typecd) && validYear(area, l.year)) {
            areaLinks.push(formatLink(l, area));
        } else if (parent) {
            parentLinks.push(formatLink(l, parent));
        }
    }
    return [...areaLinks, ...parentLinks];
}

export function getProductLinks(area) {
    return filterProductLinks(productLinks, area);
}
