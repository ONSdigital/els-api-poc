# Explore Local Statistics API PoC

**NOTE: THIS DOCUMENT IS A WORK IN PROGRESS**

This repo contains a proof-of-concept (PoC) for a new data structure and internal API to serve the [Explore Local Statistics](https://www.ons.gov.uk/explore-local-statistics/) (ELS) app. It also includes sample data visualisations served by the API. The demo app can be [explored on Netlify](https://els-api-poc.netlify.app/).

## Background

### The primary challenge

ELS is currently (as of August 2025) served by a single monolithic dataset &mdash; all indicators for all geographies and all years &mdash; that must be loaded on many pages for them to correctly function. This allows for all kinds of data selections to be made performantly within these pages, but initial page load times are sub-optimal. Additionally, as the number of datasets, geographies and time periods continues to grow, the performance of the app can be expected to gradually decline unless the data structure is overhauled.

### An opportunity

This work also offers us an opportunity to make changes that will make the app more future-proof, tackling some of the following limitations:
- We are currently unable to properly handle sub-yearly data, eg. monthly or quarterly.
- We currently do not have a very good way of handling multi-variate data, like age-by-sex.
- We would like to be able to handle data for smaller geographies, like wards and MSOAs.

In addition, taking an API approach allows us to pilot and test some ideas for adoption in future strategic ONS APIs.

## Solution(s)

### Principles

We need a data structure that meets the following principles: 
- Providing exactly what data is needed to render the page (ideally no more, no less).
- Minimising the number of file requests to render the page or make updates.
- Deployable on our existing SvelteKit app (eg. flat file structure, no external database).

### Approach

Starting from the [data file](https://github.com/ONSdigital/explore-local-statistics-app/blob/develop/static/insights/column-oriented-data.json) and [metadata](https://github.com/ONSdigital/explore-local-statistics-app/blob/develop/static/insights/config.json) from the existing app, we explored various parameters in order to narrow in on the most performant way to serve data to the app, including the following considerations:
- The raw/internal formats for storing the data and metadata.
- Patterns for identifying the required data via the URL path and/or parameters.
- Performant ways to filter the data server-side.
- Efficient formats to return the data to the client.
- Overall performance/stability implications and how to address them.

### Exploration

#### Internal data formats

We explored a number of JSON-based formats capable of being held in memory within a SvelteKit server-side app. These included:
- Arrays of data in a row-oriented format (see [example of this kind of array](https://github.com/ONSdigital/dp-census-atlas/blob/develop/src/data/geoLookup2021.json)).
- Arrays of data in a column-oriented format (as [in our existing app](https://github.com/ONSdigital/explore-local-statistics-app/blob/develop/static/insights/column-oriented-data.json)).
- [JSON-Stat](https://json-stat.org/), a lightweight data cube structure (see [data file used in this PoC](https://github.com/ONSvisual/els-api-poc/blob/main/src/lib/json-stat.json)).

Of these, **JSON-stat** turned out to be the most compact format, and also had the following benefits:
- Tried and tested format for statistical data, capable of holding datasets with any number of dimensions.
- Capable of containing multiple datasets (ie. all ELS datasets) within in a single "collection" (see [simple example](https://json-stat.org/samples/oecd-canada-col.json)).
- The cube structure means that individual datasets and observations can be retrieved efficiently without having to filter every data point.
- Responses can easily be serialised to other formats, such as CSV (and CSVW).

#### URL patterns

Assuming that the URL should form a cacheable permalink for any request, we tried two fundamental URL patterns that could be used for GET requests:
- A path-based URL pattern ([see demo](https://els-api-poc.netlify.app/path/)).
- A query-based URL pattern ([see demo](https://els-api-poc.netlify.app/query/)).

---

The **path-based URL pattern** envisages a finite number of possible requests, with the possibility to pre-generate the data for each one (or at least the subset that the app uses). The format in this demo is as follows:

```
/data/{topic}/{geography}/{time_period}/{measure}.json
```

In this URL, ```{topic}``` can be either a topic or indicator; ```{geography}``` can be a geography type or individual GSS code; ```{time_period}``` can be a specific year, "earliest" or "latest"; and measure can be "value", "lci" or "uci" (for the main value, upper CI or lower CI). In addition, any parameter can be replaced with "all" to return unfiltered results.

For example, the following URL will return region-level data for all economic indicators, and will include all measures for 2023:

[/data/economy/rgn/2023/all.json](https://els-api-poc.netlify.app/data/economy/rgn/2023/all.json)

Whereas, the following URL requests all data available for Hartlepool (E06000001):

[/data/all/E06000001/all/all.json](https://els-api-poc.netlify.app/data/all/E06000001/all/all.json)

(Note: It would not be practical to pre-generate data files for all possible requests. In reality, either the response would need to remain dynamic, or a subset could be generated based on the actual requests expected from the app.)

---

The **query-based URL pattern** envisages a more flexible way to make requests, taking inspiration from the [Eurostat Statistics API](https://ec.europa.eu/eurostat/web/user-guides/data-browser/api-data-access/api-detailed-guidelines/api-statistics) and [Nomis API](https://www.nomisweb.co.uk/api/v01/help) in particular. This structure more easily accommodates things like date ranges and arbitrary lists of geographic areas (which better reflect the way selections are made within the ELS app). The basic structure of requests from this endpoint are:

```
/api.{format}?{query_parameters}
```

In the demo, ```{format}``` can be "json" (for column-oriented data arrays), "csv", "csvw" or "jsonstat". ```{query_params}``` can include values for any combination of **topic**, **indicator**, **geography**, **time** and **measure**, in the format ```?param1=value1&param2=value2``` etc. (For multi-variate datasets, these parameters could easily be extended.)

For example, the following URL will return region-level data for all economic indicators in a CSV format, from 2018 to the latest value, and will include all measures:

[/api.csv?topic=economy&geography=rgn&time=2018,latest](https://els-api-poc.netlify.app/api.csv?topic=economy&geography=rgn&time=2018,latest)

And this request would return an accompanying CSVW metadata file for the above request:

[/api.csvw?topic=economy&geography=rgn&time=2018,latest](https://els-api-poc.netlify.app/api.csvw?topic=economy&geography=rgn&time=2018,latest)

The original request could also be extended to include data for England (E92000001) and the United Kingdom (K02000001) by modifying the **geography** parameter:

[/api.csv?topic=economy&geography=rgn,E92000001,K02000001&time=2018,latest](https://els-api-poc.netlify.app/api.csv?topic=economy&geography=rgn,E92000001,K02000001&time=2018,latest)

#### Server-side filtering logic

On the server-side, the app uses a [SvelteKit server route](https://svelte.dev/docs/kit/routing#server) to handle the GET request. It is assumed that an instance of the app running on the server will hold the full data cube in memory* and handle each request as follows:
1. Filter datasets by topic and indicator (this does not require any observation-level filtering).
2. Parse the geography, time and measures query parameters to generate filters to be run on each dataset.
3. Filter the observation-level data (in the case of JSON-Stat, only the dimensions need to be filtered).
4. Serialise the observations into the requested output data format.**

*In the Netlify demo, the first in a sequence of requests is slower as "edge functions" do not continue to run across sessions.

**If the user only requests metadata (eg. CSVW), the observation filtering step is skipped.

#### Client-side formats

As noted above, the second demo API is currently able to return data and metadata in CSV, CSVW, JSON (columns) and JSON-Stat formats. More formats such as ODS or XLSX could quite easily be added.

### Performance

### Preferred approach

Due to its flexibility and extensibility, our preferred approach from this exercise is to develop a query-based API backed by a JSON-Stat data file.

## Architecture

### Data structure


### Query format

In this demo app, the GET query format is inspired by the Eurostat Statistics API and the Nomis API

### Response formats

## Front-end integration

SvelteKit caters for a number of ways of integrating 
