"use client";

// UI ==================================================================================================================
import { Building2, LayoutDashboard, Building, TrendingUp, Landmark, Users, FileText, BarChart3 } from "lucide-react";
import { Divider } from "fictoan-react";

// OTHER ===============================================================================================================
import { PageSidebar, LinkGroup, LinkItem } from "./PageSidebar";

export const StatisticsSidebar = () => {
    return (
        <PageSidebar
            id="statistics-sidebar"
            headerIcon={<BarChart3 />}
            headerLabel="Statistics"
        >
            <LinkGroup>
                <LinkItem
                    icon={<LayoutDashboard />}
                    linkTo="/statistics"
                    label="Dashboard"
                />
            </LinkGroup>

            <Divider />

            <LinkGroup title="Corporate Sector">
                <LinkItem
                    icon={<Building />}
                    linkTo="/statistics/finances-of-fdi-companies"
                    label="FDI finances"
                />
                <LinkItem
                    icon={<Building />}
                    linkTo="/statistics/listed-non-government-non-financial-companies"
                    label="Listed NG-NF cos"
                />
                <LinkItem
                    icon={<Building />}
                    linkTo="/statistics/non-government-non-banking-financial-and-investment-companies"
                    label="NG-NB financial and investment cos"
                />
                <LinkItem
                    icon={<Building />}
                    linkTo="/statistics/non-government-non-financial-private-limited-companies"
                    label="NG-NF private limited cos"
                />
                <LinkItem
                    icon={<Building />}
                    linkTo="/statistics/non-government-non-financial-public-limited-companies"
                    label="NG-NF public limited cos"
                />
            </LinkGroup>

            <Divider />

            <LinkGroup title="External Sector">
                <LinkItem
                    icon={<TrendingUp />}
                    linkTo="/statistics/external-debt"
                    label="External debt"
                />
                <LinkItem
                    icon={<TrendingUp />}
                    linkTo="/statistics/external-sector-indices"
                    label="External sector indices"
                />
                <LinkItem
                    icon={<TrendingUp />}
                    linkTo="/statistics/forex-reserves"
                    label="Forex reserves"
                />
                <LinkItem
                    icon={<TrendingUp />}
                    linkTo="/statistics/international-finance"
                    label="International finance"
                />
                <LinkItem
                    icon={<TrendingUp />}
                    linkTo="/statistics/international-trade"
                    label="International trade"
                />
            </LinkGroup>

            <Divider />

            <LinkGroup title="Financial Market">
                <LinkItem
                    icon={<TrendingUp />}
                    linkTo="/statistics/equity-and-corporate-debt-market"
                    label="Equity and corporate debt market"
                />
                <LinkItem
                    icon={<TrendingUp />}
                    linkTo="/statistics/forex-market"
                    label="Forex market"
                />
                <LinkItem
                    icon={<TrendingUp />}
                    linkTo="/statistics/government-securities-market"
                    label="G-Sec market"
                />
                <LinkItem
                    icon={<TrendingUp />}
                    linkTo="/statistics/money-market"
                    label="Money market"
                />
            </LinkGroup>

            <Divider />

            <LinkGroup title="Financial Sector">
                <LinkItem
                    icon={<Landmark />}
                    linkTo="/statistics/banking-assets-and-liabilities"
                    label="Banking assets & liabilities"
                />
                <LinkItem
                    icon={<Landmark />}
                    linkTo="/statistics/banking-performance-indicators"
                    label="Banking perf indicators"
                />
                <LinkItem
                    icon={<Landmark />}
                    linkTo="/statistics/banking-sectoral-statistics"
                    label="Banking sectoral statistics"
                />
                <LinkItem
                    icon={<Landmark />}
                    linkTo="/statistics/financial-institutions"
                    label="FIs"
                />
                <LinkItem
                    icon={<Landmark />}
                    linkTo="/statistics/key-rates"
                    label="Key rates"
                />
                <LinkItem
                    icon={<Landmark />}
                    linkTo="/statistics/monetary-statistics"
                    label="Monetary statistics"
                />
                <LinkItem
                    icon={<Landmark />}
                    linkTo="/statistics/non-banking-financial-companies"
                    label="NBFCs"
                />
                <LinkItem
                    icon={<Landmark />}
                    linkTo="/statistics/payment-systems"
                    label="Payment systems"
                />
            </LinkGroup>

            <Divider />

            <LinkGroup title="Public Finance">
                <LinkItem
                    icon={<FileText />}
                    linkTo="/statistics/central-govt-finance"
                    label="Central govt. finance"
                />
                <LinkItem
                    icon={<FileText />}
                    linkTo="/statistics/state-govt-finance"
                    label="State govt. finance"
                />
                <LinkItem
                    icon={<FileText />}
                    linkTo="/statistics/central-and-state-govt-finance-combined"
                    label="Combined"
                />
            </LinkGroup>

            <Divider />

            <LinkGroup title="Real Sector">
                <LinkItem
                    icon={<Users />}
                    linkTo="/statistics/agriculture"
                    label="Agriculture"
                />
                <LinkItem
                    icon={<Users />}
                    linkTo="/statistics/industrial-statistics"
                    label="Industrial statistics"
                />
                <LinkItem
                    icon={<Users />}
                    linkTo="/statistics/national-income"
                    label="National income"
                />
                <LinkItem
                    icon={<Users />}
                    linkTo="/statistics/prices-and-wages"
                    label="Prices & wages"
                />
            </LinkGroup>

            <Divider />

            <LinkGroup title="Socio-economic Indicators">
                <LinkItem
                    icon={<Users />}
                    linkTo="/statistics/socio-economic-indicators"
                    label="Socio-economic indicators"
                />
            </LinkGroup>

            <Divider />

            <LinkGroup title="Surveys - Aggregated Data">
                <LinkItem
                    icon={<FileText />}
                    linkTo="/statistics/professional-forecaster-survey"
                    label="Professional forecaster survey"
                />
            </LinkGroup>
        </PageSidebar>
    );
};
