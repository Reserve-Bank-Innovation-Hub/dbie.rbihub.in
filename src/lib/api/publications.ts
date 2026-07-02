// OTHER ===============================================================================================================
import { loadData } from "./loadData";

export interface OrganizationMetrics {
    noOfAccounts      : number;
    creditLimit       : number;
    amountOutstanding : number;
}

export interface CreditDataRow {
    period                    : string;
    occupation                : string;
    publicSector              : OrganizationMetrics;
    centralGovtDepartments    : OrganizationMetrics;
    generalStateGovt          : OrganizationMetrics;
    stateGovtDepartments      : OrganizationMetrics;
    localAndQuasiGovt         : OrganizationMetrics;
    publicFinancialCorps      : OrganizationMetrics;
    publicNonFinancialCorps   : OrganizationMetrics;
    cooperativeSector         : OrganizationMetrics;
    privateCorporateSector    : OrganizationMetrics;
    privateFinancialCorps     : OrganizationMetrics;
    privateNonFinancialCorps  : OrganizationMetrics;
    householdSector           : OrganizationMetrics;
    individuals               : OrganizationMetrics;
    male                      : OrganizationMetrics;
    female                    : OrganizationMetrics;
    householdSectorOthers     : OrganizationMetrics;
    proprietaryAndPartnership : OrganizationMetrics;
    jointLiabilityGroups      : OrganizationMetrics;
    microFinanceInstitutions  : OrganizationMetrics;
    nonProfitInstitutions     : OrganizationMetrics;
    nonResidents              : OrganizationMetrics;
    totalCredit               : OrganizationMetrics;
}

export interface OrganizationInfo {
    key         : string;
    displayName : string;
}

export interface ParsedCreditClassification {
    data          : CreditDataRow[];
    organizations : OrganizationInfo[];
    reportTitle   : string;
}

/**
 * Fetch credit classification data from the API
 */
export async function getCreditClassification() : Promise<ParsedCreditClassification> {
    return loadData<ParsedCreditClassification>("credit-classification");
}

// External Debt Types
export interface ExternalDebtRow {
    year                                    : string;
    // I. Multilateral
    multilateralTotal : number;
    multilateralGovtTotal                   : number;
    multilateralGovtConcessional            : number;
    multilateralGovtConcessionalIDA         : number;
    multilateralGovtConcessionalOthers      : number;
    multilateralGovtNonConcessional         : number;
    multilateralGovtNonConcessionalIBRD     : number;
    multilateralGovtNonConcessionalOthers   : number;
    multilateralNonGovtTotal                : number;
    multilateralNonGovtConcessional         : number;
    multilateralNonGovtNonConcessionalTotal : number;
    multilateralNonGovtPublicIBRD           : number;
    multilateralNonGovtPublicOthers         : number;
    multilateralNonGovtFinInstIBRD          : number;
    multilateralNonGovtFinInstOthers        : number;
    multilateralNonGovtPrivateIBRD          : number;
    multilateralNonGovtPrivateOthers        : number;
    // II. Bilateral
    bilateralTotal : number;
    bilateralGovtTotal                      : number;
    bilateralGovtConcessional               : number;
    bilateralGovtNonConcessional            : number;
    bilateralNonGovtTotal                   : number;
    bilateralNonGovtConcessionalPublic      : number;
    bilateralNonGovtConcessionalFinInst     : number;
    bilateralNonGovtConcessionalPrivate     : number;
    bilateralNonGovtNonConcessionalPublic   : number;
    bilateralNonGovtNonConcessionalFinInst  : number;
    bilateralNonGovtNonConcessionalPrivate  : number;
    // III-IX. Other categories
    imf : number;
    tradeCredit                             : number;
    tradeCreditBuyers                       : number;
    tradeCreditSuppliers                    : number;
    tradeCreditExportBilateral              : number;
    tradeCreditExportDefence                : number;
    commercialBorrowing                     : number;
    commercialBankLoans                     : number;
    securitizedBorrowings                   : number;
    loansWithGuarantee                      : number;
    selfLiquidatingLoans                    : number;
    nonResidentDeposits                     : number;
    rupeeDebt                               : number;
    rupeeDebtDefence                        : number;
    rupeeDebtCivilian                       : number;
    // Totals and Short-term
    totalLongTermDebt : number;
    shortTermDebt                           : number;
    shortTermNRD                            : number;
    shortTermTradeCredit                    : number;
    shortTermTradeAbove180                  : number;
    shortTermTradeUpTo180                   : number;
    shortTermFIITBills                      : number;
    shortTermForeignCentralBanks            : number;
    shortTermExtDebtLiabilities             : number;
    shortTermCentralBank                    : number;
    shortTermCommercialBanks                : number;
    // Totals and Ratios
    grossExternalDebt : number;
    concessionalDebtPercent                 : number;
    shortTermDebtPercent                    : number;
    debtToGDPRatio                          : number;
    debtServiceRatio                        : number;
}

export interface ParsedExternalDebt {
    data        : ExternalDebtRow[];
    reportTitle : string;
}

/**
 * Fetch external debt data from the API
 */
export async function getExternalDebt() : Promise<ParsedExternalDebt> {
    return loadData<ParsedExternalDebt>("external-debt");
}

/**
 * Fetch recent external debt data (last 10 years) for home page charts
 */
export async function getExternalDebtRecent() : Promise<ParsedExternalDebt> {
    return loadData<ParsedExternalDebt>("external-debt-recent");
}
