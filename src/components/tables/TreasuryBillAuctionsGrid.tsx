"use client";

// REACT CORE ==========================================================================================================
import React, { useMemo } from "react";

// DATA VIZ ============================================================================================================
import { AgGridReact } from "ag-grid-react";
import { ColDef, ModuleRegistry, AllCommunityModule, themeQuartz } from "ag-grid-community";

// LIB =================================================================================================================
import { TreasuryBillAuctionRow } from "@/lib/api/tables/treasury-bill-auctions";

// Register AG Grid modules
ModuleRegistry.registerModules([AllCommunityModule]);

// Create custom theme
const customTheme = themeQuartz.withParams({
    fontFamily          : "inherit",
    fontSize            : 14,
    rowHeight           : 32,
    borderRadius        : 0,
    wrapperBorderRadius : 0,
    wrapperBorder       : false,
});

interface TreasuryBillAuctionsGridProps {
    data  : TreasuryBillAuctionRow[];
    notes : string[];
}

const TreasuryBillAuctionsGrid : React.FC<TreasuryBillAuctionsGridProps> = ({ data, notes }) => {
    // Format amounts to up to 3 decimal places; dash for nulls.
    const amountFormatter = (params : { value : number | null | undefined }) : string => {
        if (params.value == null) return "—";
        return Number(params.value).toLocaleString("en-IN", {
            maximumFractionDigits : 3,
        });
    };

    // Format price/yield to exactly 4 decimal places; dash for nulls.
    const priceFormatter = (params : { value : number | null | undefined }) : string => {
        if (params.value == null) return "—";
        return Number(params.value).toFixed(4);
    };

    // Format integer-like counts; dash for nulls.
    const intFormatter = (params : { value : number | null | undefined }) : string => {
        if (params.value == null) return "—";
        return Number(params.value).toLocaleString("en-IN");
    };

    // Column definitions
    const columnDefs = useMemo(() => {
        const cols : ColDef[] = [
            {
                field      : "tenor",
                headerName : "Tenor",
                pinned     : "left",
                width      : 110,
                filter     : true,
                cellStyle  : { fontWeight: "500" },
            },
            {
                field      : "auction_date",
                headerName : "Auction date",
                pinned     : "left",
                width      : 130,
                filter     : true,
            },
            {
                field      : "issue_date",
                headerName : "Issue date",
                width      : 120,
            },
            {
                field          : "notified",
                headerName     : "Notified (₹ cr)",
                width          : 140,
                type           : "numericColumn",
                valueFormatter : amountFormatter,
                cellStyle      : { textAlign: "right" },
            },
            {
                field          : "bids_recd_num",
                headerName     : "Bids received (no.)",
                width          : 160,
                type           : "numericColumn",
                valueFormatter : intFormatter,
                cellStyle      : { textAlign: "right" },
            },
            {
                field          : "bids_recd_comp",
                headerName     : "Competitive bids recd (₹ cr)",
                width          : 215,
                type           : "numericColumn",
                valueFormatter : amountFormatter,
                cellStyle      : { textAlign: "right" },
            },
            {
                field          : "bids_recd_noncomp",
                headerName     : "Non-comp bids recd (₹ cr)",
                width          : 205,
                type           : "numericColumn",
                valueFormatter : amountFormatter,
                cellStyle      : { textAlign: "right" },
            },
            {
                field          : "bids_acc_num",
                headerName     : "Bids accepted (no.)",
                width          : 160,
                type           : "numericColumn",
                valueFormatter : intFormatter,
                cellStyle      : { textAlign: "right" },
            },
            {
                field          : "bids_acc_comp",
                headerName     : "Competitive accepted (₹ cr)",
                width          : 210,
                type           : "numericColumn",
                valueFormatter : amountFormatter,
                cellStyle      : { textAlign: "right" },
            },
            {
                field          : "bids_acc_noncomp",
                headerName     : "Non-comp accepted (₹ cr)",
                width          : 200,
                type           : "numericColumn",
                valueFormatter : amountFormatter,
                cellStyle      : { textAlign: "right" },
            },
            {
                field          : "total_issue",
                headerName     : "Total issue (₹ cr)",
                width          : 155,
                type           : "numericColumn",
                valueFormatter : amountFormatter,
                cellStyle      : { textAlign: "right" },
            },
            {
                field          : "cutoff_price",
                headerName     : "Cut-off price (₹)",
                width          : 150,
                type           : "numericColumn",
                valueFormatter : priceFormatter,
                cellStyle      : { textAlign: "right" },
            },
            {
                field          : "implicit_yield",
                headerName     : "Implicit yield %",
                width          : 145,
                type           : "numericColumn",
                valueFormatter : priceFormatter,
                cellStyle      : { textAlign: "right" },
            },
            {
                field          : "wavg_price",
                headerName     : "Wtd avg price (₹)",
                width          : 155,
                type           : "numericColumn",
                valueFormatter : priceFormatter,
                cellStyle      : { textAlign: "right" },
            },
        ];
        return cols;
    }, []);

    const defaultColDef = useMemo<ColDef>(() => ({
        sortable        : true,
        filter          : true,
        resizable       : true,
        suppressMovable : true,
    }), []);

    return (
        <div className="treasury-bill-auctions-grid-wrapper">
            <AgGridReact
                rowData={data}
                columnDefs={columnDefs}
                defaultColDef={defaultColDef}
                theme={customTheme}
                animateRows={true}
                pagination={true}
                paginationPageSize={50}
                paginationPageSizeSelector={[25, 50, 100, 200]}
                domLayout="normal"
                suppressCellFocus={true}
                rowSelection="multiple"
                enableCellTextSelection={true}
                alwaysShowVerticalScroll={true}
            />

            {/* FOOTNOTES /////////////////////////////////////////////////////////////////////////////////////////// */}
            {notes.length > 0 && (
                <div className="treasury-bill-auctions-notes">
                    {notes.map((note, i) => (
                        <p key={i}>{note}</p>
                    ))}
                </div>
            )}
        </div>
    );
};

export default TreasuryBillAuctionsGrid;
