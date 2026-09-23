// The schemes of the charts that depart from their kind, keyed by the chart's id and passed by its caller as the
// chart's `scheme`. An entry exists because an entity needs a stable identity across charts or because a chart's data
// has a polarity the base pair would misread, never because a bar looked nicer in another hue; each entry says which.
// Names are hues of the table in chartConfig.ts, so an entry cannot bring in a colour the site does not have, and the
// data-viz palette validator applies to any `series` list written here as it does to the base.

// OTHER ===============================================================================================================
import type { ChartSchemeLayer } from "./chartConfig";

export const SCHEMES : Record<string, ChartSchemeLayer> = {
    // The home page's lead chart: real growth draws in the site's accent rather than the column kind's blue, so the
    // page opens on the brand hue; a fall stays the warm pole (violet and coral pass the validator as a pair, ΔE 29),
    // and nominal growth, legend-only by default, stays the quiet line it was.
    gdp : {
        positive    : "teal",
        negative    : "red",
        seriesByKey : { nominal : "grey" },
    },
};
