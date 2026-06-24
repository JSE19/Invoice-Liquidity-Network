export interface YieldProjection {
    invoiceAmount: bigint;
    discountRate: number;
    daysUntilDue: number;
    annualizedYield: bigint;
    expectedReturn: bigint;
    effectiveApr: number;
}
export interface RiskFactors {
    amountScore: number;
    durationScore: number;
    discountScore: number;
    overallScore: number;
}
export interface PortfolioAllocation {
    totalDeployed: bigint;
    totalAvailable: bigint;
    utilizationRate: number;
    allocationByToken: Map<string, {
        deployed: bigint;
        count: number;
    }>;
    concentrationIndex: number;
}
export interface HistoricalPerformance {
    totalInvoices: number;
    fundedCount: number;
    paidCount: number;
    defaultedCount: number;
    defaultRate: number;
    totalVolume: bigint;
    totalYield: bigint;
    avgDiscountRate: number;
    avgDaysToSettlement: number;
}
export interface ComparisonResult {
    metric: string;
    valueA: number | bigint;
    valueB: number | bigint;
    difference: number;
    percentDifference: number;
}
export declare function calculateYieldProjection(invoiceAmount: bigint, discountRateBps: number, daysUntilDue: number): YieldProjection;
export declare function calculateRiskScore(amount: bigint, daysUntilDue: number, discountRateBps: number): RiskFactors;
export declare function calculatePortfolioAllocation(invoices: Array<{
    amount: bigint;
    status: string;
    token?: string;
}>): PortfolioAllocation;
export declare function calculateHistoricalPerformance(events: Array<{
    type: string;
    amount: bigint;
    discountRate?: number;
    createdAt: number;
    settledAt?: number;
}>): HistoricalPerformance;
export declare function compareMetrics(name: string, valueA: number | bigint, valueB: number | bigint): ComparisonResult;
//# sourceMappingURL=analytics-computations.d.ts.map