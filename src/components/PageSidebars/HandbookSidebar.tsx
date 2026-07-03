"use client";

// UI ==================================================================================================================
import { BookOpen, LayoutDashboard, Table2 } from "lucide-react";
import { Divider } from "fictoan-react";

// OTHER ===============================================================================================================
import { PageSidebar, LinkGroup, LinkItem } from "./PageSidebar";

export const HandbookSidebar = () => {
    return (
        <PageSidebar
            id="handbook-sidebar"
            headerIcon={<BookOpen />}
            headerLabel="Handbook of Statistics"
        >
            <LinkGroup>
                <LinkItem
                    icon={<LayoutDashboard />}
                    linkTo="/handbook"
                    label="Dashboard"
                />
            </LinkGroup>

            <Divider />

            <LinkGroup title="Output and prices">
                <LinkItem
                    icon={<Table2 />}
                    linkTo="/handbook/agricultural-production-foodgrains"
                    label="Agricultural Production — Foodgrains"
                />

                <LinkItem
                    icon={<Table2 />}
                    linkTo="/handbook/agricultural-production-major-commercial-crops"
                    label="Agricultural Production — Major Commercial Crops"
                />

                <LinkItem
                    icon={<Table2 />}
                    linkTo="/handbook/annual-production-indices-of-select-items"
                    label="Annual Production Indices of Select Items"
                />

                <LinkItem
                    icon={<Table2 />}
                    linkTo="/handbook/annual-survey-of-industries-principal-characteristics"
                    label="Annual Survey of Industries — Principal Characteristics"
                />

                <LinkItem
                    icon={<Table2 />}
                    linkTo="/handbook/area-under-cultivation-foodgrains"
                    label="Area Under Cultivation — Foodgrains"
                />

                <LinkItem
                    icon={<Table2 />}
                    linkTo="/handbook/area-under-cultivation-major-commercial-crops"
                    label="Area Under Cultivation — Major Commercial Crops"
                />

                <LinkItem
                    icon={<Table2 />}
                    linkTo="/handbook/average-price-of-gold-and-silver-in-domestic-and-foreign-markets"
                    label="Average Price of Gold and Silver in Domestic and Foreign Markets"
                />

                <LinkItem
                    icon={<Table2 />}
                    linkTo="/handbook/consumer-price-index-annual-average"
                    label="Consumer Price Index — Annual Average"
                />

                <LinkItem
                    icon={<Table2 />}
                    linkTo="/handbook/implementation-of-central-sector-projects-status-end-march"
                    label="Implementation of Central Sector Projects — Status"
                />

                <LinkItem
                    icon={<Table2 />}
                    linkTo="/handbook/index-numbers-of-agricultural-production-major-crops"
                    label="Index Numbers of Agricultural Production — Major Crops"
                />

                <LinkItem
                    icon={<Table2 />}
                    linkTo="/handbook/index-numbers-of-area-production-and-yield-of-foodgrains-non-foodgrains"
                    label="Index Numbers of Area, Production and Yield of Foodgrains, Non — Foodgrains and All Crops in India"
                />

                <LinkItem
                    icon={<Table2 />}
                    linkTo="/handbook/index-numbers-of-industrial-production-use-based-classification"
                    label="Index Numbers of Industrial Production – Use — Based Classification"
                />

                <LinkItem
                    icon={<Table2 />}
                    linkTo="/handbook/index-numbers-of-industrial-production"
                    label="Index Numbers of Industrial Production"
                />

                <LinkItem
                    icon={<Table2 />}
                    linkTo="/handbook/index-numbers-of-infrastructure-industries"
                    label="Index Numbers of Infrastructure Industries"
                />

                <LinkItem
                    icon={<Table2 />}
                    linkTo="/handbook/index-numbers-of-twenty-three-major-industry-groups-of-manufacturing"
                    label="Index Numbers of Twenty Three Major Industry Groups of Manufacturing Sector"
                />

                <LinkItem
                    icon={<Table2 />}
                    linkTo="/handbook/minimum-support-price-for-foodgrains-according-to-crop-year-fair-average"
                    label="Minimum Support Price for Foodgrains According to Crop Year"
                />

                <LinkItem
                    icon={<Table2 />}
                    linkTo="/handbook/minimum-support-price-for-non-foodgrains-according-to-crop-year-fair"
                    label="Minimum Support Price for Non — Foodgrains According to Crop Year"
                />

                <LinkItem
                    icon={<Table2 />}
                    linkTo="/handbook/pattern-of-land-use-and-select-inputs-for-agricultural-production"
                    label="Pattern of Land Use and Select Inputs for Agricultural Production"
                />

                <LinkItem
                    icon={<Table2 />}
                    linkTo="/handbook/production-and-imports-of-crude-oil-and-petroleum-products"
                    label="Production and Imports of Crude Oil and Petroleum Products"
                />

                <LinkItem
                    icon={<Table2 />}
                    linkTo="/handbook/public-distribution-system-procurement-off-take-and-stocks"
                    label="Public Distribution System — Procurement, Off — Take and Stocks"
                />

                <LinkItem
                    icon={<Table2 />}
                    linkTo="/handbook/sector-wise-cost-overrun-of-delayed-central-sector-projects-end-march"
                    label="Sector — Wise Cost Overrun of Delayed Central Sector Projects"
                />

                <LinkItem
                    icon={<Table2 />}
                    linkTo="/handbook/wholesale-price-index-annual-average"
                    label="Wholesale Price Index — Annual Average"
                />

                <LinkItem
                    icon={<Table2 />}
                    linkTo="/handbook/yield-per-hectare-foodgrains"
                    label="Yield Per Hectare — Foodgrains"
                />

                <LinkItem
                    icon={<Table2 />}
                    linkTo="/handbook/yield-per-hectare-major-commercial-crops"
                    label="Yield Per Hectare — Major Commercial Crops"
                />
            </LinkGroup>

            <Divider />

            <LinkGroup title="National income, saving, employment">
                <LinkItem
                    icon={<Table2 />}
                    linkTo="/handbook/changes-in-financial-assets-liabilities-of-the-household-sector"
                    label="Changes in Financial Assets_Liabilities of the Household Sector"
                />

                <LinkItem
                    icon={<Table2 />}
                    linkTo="/handbook/components-of-gross-domestic-product"
                    label="Components of Gross Domestic Product"
                />

                <LinkItem
                    icon={<Table2 />}
                    linkTo="/handbook/components-of-gross-value-added-at-basic-prices"
                    label="Components of Gross Value Added At Basic Prices"
                />

                <LinkItem
                    icon={<Table2 />}
                    linkTo="/handbook/employment-in-public-and-organised-private-sectors"
                    label="Employment in Public and Organised Private Sectors"
                />

                <LinkItem
                    icon={<Table2 />}
                    linkTo="/handbook/institutional-sector-wise-gross-capital-formation-at-current-prices"
                    label="Institutional Sector — Wise Gross Capital Formation"
                />

                <LinkItem
                    icon={<Table2 />}
                    linkTo="/handbook/macro-economic-aggregates-at-constant-prices"
                    label="Macro — Economic Aggregates"
                />

                <LinkItem
                    icon={<Table2 />}
                    linkTo="/handbook/macro-economic-aggregates-at-current-prices"
                    label="Macro — Economic Aggregates"
                />

                <LinkItem
                    icon={<Table2 />}
                    linkTo="/handbook/net-state-domestic-product-state-wise-at-constant-prices"
                    label="Net State Domestic Product — State — wise"
                />

                <LinkItem
                    icon={<Table2 />}
                    linkTo="/handbook/net-state-domestic-product-state-wise-at-current-prices"
                    label="Net State Domestic Product — State — wise"
                />

                <LinkItem
                    icon={<Table2 />}
                    linkTo="/handbook/net-state-value-added-by-economic-activity-at-constant-prices"
                    label="Net State Value Added by Economic Activity"
                />

                <LinkItem
                    icon={<Table2 />}
                    linkTo="/handbook/net-state-value-added-by-economic-activity-at-current-prices"
                    label="Net State Value Added by Economic Activity"
                />

                <LinkItem
                    icon={<Table2 />}
                    linkTo="/handbook/per-capita-net-state-domestic-product-state-wise-at-constant-prices"
                    label="Per Capita Net State Domestic Product — State — wise"
                />

                <LinkItem
                    icon={<Table2 />}
                    linkTo="/handbook/per-capita-net-state-domestic-product-state-wise-at-current-prices"
                    label="Per Capita Net State Domestic Product — State — wise"
                />

                <LinkItem
                    icon={<Table2 />}
                    linkTo="/handbook/sector-wise-domestic-savings-at-current-prices"
                    label="Sector — Wise Domestic Savings"
                />
            </LinkGroup>
        </PageSidebar>
    );
};
