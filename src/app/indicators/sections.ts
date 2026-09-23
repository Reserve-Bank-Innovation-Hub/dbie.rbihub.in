// The sections of the Indicators page, in the order it lists them: each names the curated pages under it.
// The page draws them and the crumbs on those pages lead back to them (src/components/tables/PageCrumbs.tsx).

export interface ListSection {
    title : string;
    items : { linkTo : string; label : string; description ? : string }[];
}

export const INDICATOR_SECTIONS : ListSection[] = [
    {
        title : "External sector",
        items : [
            {
                linkTo      : "/indicators/exchange-rates",
                label       : "Exchange rates",
                description : "Daily exchange rates of the Indian Rupee against major foreign currencies including US Dollar, Pound Sterling, Euro, and Japanese Yen.",
            },
            {
                linkTo      : "/indicators/forex-reserves",
                label       : "Forex reserves",
                description : "Weekly foreign exchange reserves data including total reserves, foreign currency assets, gold holdings, and SDRs",
            },
        ],
    },
];
