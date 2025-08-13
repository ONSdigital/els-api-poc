# Explore Local Statistics data API PoC

This repo contains a proof-of-concept (PoC) for a new data structure and internal API to serve the [Explore Local Statistics](https://www.ons.gov.uk/explore-local-statistics/) (ELS) app. It also includes sample data visualisations served by the API. The demo app can be [explored on Netlify](https://els-api-poc.netlify.app/).

## Background

### The primary challenge

ELS is currently (as of August 2025) served by a single monolithic dataset file &mdash; all indicators for all geographies and all years &mdash; that must be loaded on many pages for them to correctly function. This allows for all kinds of data selections to be made performantly within these pages, but initial page load times are sub-optimal. Additionally, as the number of datasets, geographies and time periods continues to grow, the performance of the app can be expected to gradually decline unless the data structure is overhauled.

### An opportunity

Developing an improved way to serve ELS data also offers us an opportunity to make changes that will make the app more future-proof, including:
- Handling sub-yearly data, eg. quarterly, monthly or weekly.
- Handling multi-variate data, like age-by-sex.
- Handling data for smaller geographies, like wards and MSOAs.
- Serving data to users in multiple standard formats (incl. CSVW).

In addition, taking an API-based approach (rather than static data files) allows us to pilot and test some ideas intended for adoption in future ONS APIs.

## Exploring solutions

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

### Implementations tested

#### Internal data formats

We explored a number of JSON-based formats capable of being held in memory within a SvelteKit server-side app. These included:
- Arrays of data in a row-oriented format (see [example of this kind of array](https://github.com/ONSdigital/dp-census-atlas/blob/develop/src/data/geoLookup2021.json)).
- Arrays of data in a column-oriented format (as [in our existing app](https://github.com/ONSdigital/explore-local-statistics-app/blob/develop/static/insights/column-oriented-data.json)).
- [JSON-Stat](https://json-stat.org/), a lightweight data cube structure (see [data file used in this PoC](https://github.com/ONSvisual/els-api-poc/blob/main/src/lib/json-stat.json)).

Of these, **JSON-Stat** turned out to be the most compact format in terms of filesize, and also had the following benefits:
- Tried and tested format for statistical data, capable of holding datasets with any number of dimensions.
- Capable of containing multiple datasets (ie. all ELS datasets) within in a single "collection" (see [simple example](https://json-stat.org/samples/oecd-canada-col.json)).
- The cube structure means that individual datasets and observations can be retrieved efficiently without having to filter every data point.
- Responses can easily be serialised to other formats, such as CSV (and CSVW).

#### URL patterns

Assuming that the URL should form a cacheable permalink for any request, we explored two fundamental URL patterns that could be adopted:
- A path-based URL pattern ([see demo](https://els-api-poc.netlify.app/path/)).
- A query-based URL pattern ([see demo](https://els-api-poc.netlify.app/query/)).

---

The **path-based URL pattern** envisages a finite number of possible requests, with the possibility to pre-generate the data for each one (or at least the subset that the app uses). The format in this demo is as follows (see [query builder demo](https://els-api-poc.netlify.app/path/)):

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

The **query-based URL pattern** envisages a more flexible way to make requests, taking inspiration from the [Eurostat Statistics API](https://ec.europa.eu/eurostat/web/user-guides/data-browser/api-data-access/api-detailed-guidelines/api-statistics) and [Nomis API](https://www.nomisweb.co.uk/api/v01/help) in particular.* This structure more easily accommodates things like date ranges and arbitrary lists of geographic areas (which better reflect the way selections are made within the ELS app). The basic structure of requests from this endpoint is as follows (see [query builder demo]([https://els-api-poc.netlify.app/path/](https://els-api-poc.netlify.app/query/)):

```
/api.{format}?{query_parameters}
```

*Unlike the case of the Eurostat and Nomis APIs, queries can be made across multiple datasets at once.

In the demo, ```{format}``` can be "json" (for column-oriented data arrays), "csv", "csvw" or "jsonstat". ```{query_params}``` can include values for any combination of **topic**, **indicator**, **geography**, **time** and **measure**, in the format ```?param1=value1&param2=value2``` etc. (For multi-variate datasets, these parameters could easily be extended.)

For example, the following URL will return region-level data for all economic indicators in a CSV format, from 2018 to the latest value, including all measures:

[/api.csv?topic=economy&geography=rgn&time=latest](https://els-api-poc.netlify.app/api.csv?topic=economy&geography=rgn&time=latest)

And this request would return an accompanying CSVW metadata file for the above request:

[/api.csvw?topic=economy&geography=rgn&time=latest](https://els-api-poc.netlify.app/api.csvw?topic=economy&geography=rgn&time=latest)

The original request could also be extended to include data for England (E92000001) and the United Kingdom (K02000001) by modifying the **geography** parameter, and to include observations covering a time period from 2018 to the latest available by modifying the **time** parameter:

[/api.csv?topic=economy&geography=rgn,E92000001,K02000001&time=2018,latest](https://els-api-poc.netlify.app/api.csv?topic=economy&geography=rgn,E92000001,K02000001&time=2018,latest)

#### Server-side filtering logic

On the server-side, the app uses a [SvelteKit server route](https://svelte.dev/docs/kit/routing#server) to handle the GET request. It is assumed that an instance of the app running on AWS will hold the full data cube in memory* and handle each request as follows:
1. Filter datasets by topic and indicator (this does not require any observation-level filtering).
2. Parse the geography, time and measures query parameters to generate filters to be run on each dataset.
3. Filter the observation-level data (in the case of JSON-Stat, only the dimensions need to be filtered).
4. Serialise the observations into the requested output data format.**

*In the Netlify demo, the first in a sequence of requests is slower as "edge functions" do not continue to run across user sessions.

**If the user only requests metadata (eg. CSVW), the observation filtering step is skipped.

#### Client-side formats

As noted above, the second demo API is currently able to return data and metadata in **CSV**, **CSVW**, **JSON** (columns) and **JSON-Stat** formats. Additional formats such as **ODS** or **XLSX** spreadsheets could easily be generated.

Being able to serve these formats from an API would allow us to offer our users data downloads for any chart/visualisation in a format suitable to their use case.

### Performance

#### Response time

In terms of query performance (response time), there is no meaningful difference between the path-based or query-based requests, since the underlying data store and filtering would be identical.

With regards to the choice of underlying file format for the data store, the use of JSON-Stat and column-oriented JSON data produced fairly similar results, with JSON-Stat out-performing the alternative when querying for smaller chunks of data. However, the cube-based JSON-Stat format also offers benefits in terms of extensibility (particularly for multi-variate datasets), and in terms of potential for further performance optimisation.

Running locally on a 2018 Macbook Pro, response times are in the range of 10-100ms, depending mostly on the volume of data being requested (also, more verbose formats like CSV take longer for the same requests, suggesting that serialising the response may be more expensive than running the filters). Running on Netlify, response times are typically in the 200-300ms range, but can be up to 2 seconds when making the first in a series of requests.*

*This lag seems to be related to the nature of initialising "edge functions", whereas the live ELS app runs continuously on AWS and so should not have an initialisation cost.

#### Small vs large requests

As part of this proof of concept, we wanted to investigate whether it is preferable to make a few large requests covering all of the data needed for a given page (see [this demo](https://els-api-poc.netlify.app/area/)), or if it is preferable to "lazy load" data for individual charts (see [this alternative demo](https://els-api-poc.netlify.app/charts/)) as they appear on the page (this second approach is used, for example, by the [Data USA](https://datausa.io/) platform).

In the Netlify demo, the single large data request seems to perform significantly better than the lazy loading approach in terms of the aggregate response time (ie. total response time across all requests). However, the lazy loading approach would have the benefit of not serving data for charts that are not viewed, so it would seem worth continuing to investigate the performance trade-offs in real world scenarios.

#### Caching

Our current deployment of the live ELS app offers a significant performance advantage for any URL-based API since all public URLs (including API paths) are automatically cached by Cloudflare. Changes to the data always coincide with a fresh deployment of the app, at which point the entire cache is purged, meaning that the cache for the API would always be aligned with changes to other parts of the app.

The performance would need to be assessed in the sandbox or staging environment to assess the true benefits of the Cloudflare cache, and whether there are any possible downsides.

## Preferred approach

### Implementation in SvelteKit

This proof-of-concept exercise has demonstrated the feasibility of adopting an API-based approach to serving data within the existing ELS app as it is currently implemented and deployed in SvelteKit.

### A query-based API backed by JSON-Stat

Due to its flexibility and extensibility, our preferred approach based on this exercise is to develop a **query-based URL structure** backed by a **JSON-Stat data file**.

### A public (cacheable) endpoint

To benefit from the existing caching on the ELS app, and the ability to offer users data downloads in thir preferred format(s) within the app, our preference would be to have **publicly exposed API endpoint** where the responses would be cached by Cloudflare.

## Next steps

### Testing on ELS intrastructure

Before proceeding further, we will look to test the PoC API in a sandbox/staging version of our current infrastructure to ensure that our current assumptions are correct vis-a-vis performance in our live environment, and to ensure that there are no unexpected "show stopper" issues that would prevent a data API from being implemented and deployed.

### Assuring the design

Our next step is to reach out to the relevant teams and working groups across ONS (including in DS, DGO and MQD) to ensure that our API design is robust, implementable and follows current data standards and best practices.

### Testing and optimising performance

Before moving into production on any public-facing API, we would want to have an independent review of our API implementation, and to work with penetration testing experts to assure that the API would be secure and performant in a production environment.

### Considering alternative implementations

If a publicly exposed API is not considered advisable due to performance, security or other considerations, we would look at alternative ways to implement a more performant way to serve data to the ELS app. These include:
- A private API that cannot be accessed directly by external users.
- An alternative internal data querying system, potentially leveraging SvelteKit's "server functions".
- Pre-generated data files that could serve relevant chunks of data to the app when the user makes selections.
