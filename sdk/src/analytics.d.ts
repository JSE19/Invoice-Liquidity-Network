import type { ContractStats, InvoiceState, LPStats } from "@iln/shared";
export type ProtocolStats = ContractStats;
export interface FreelancerStats {
    submitted: number;
    funded: number;
    totalReceived: bigint;
    avgDiscount: number;
}
export interface AnalyticsInvoice {
    id: number;
    freelancer: string;
    payer: string;
    amount: bigint;
    due_date: number;
    discount_rate: number;
    status: InvoiceState;
    funder: string | null;
}
export interface LPStat {
    address: string;
    yield: bigint;
    invoiceCount: number;
}
export declare class AnalyticsSDK {
    private baseUrl;
    private cache;
    private defaultTtl;
    constructor(baseUrl?: string, defaultTtl?: number);
    private fetchWithCache;
    private parseBigInts;
    getProtocolStats(): Promise<ProtocolStats>;
    getLPStats(address: string): Promise<LPStats>;
    getFreelancerStats(address: string): Promise<FreelancerStats>;
    getInvoiceHistory(address: string, role: 'freelancer' | 'payer' | 'funder'): Promise<AnalyticsInvoice[]>;
    getTopLPs(limit?: number, period?: 'all' | 'week' | 'month'): Promise<LPStat[]>;
    clearCache(): void;
}
//# sourceMappingURL=analytics.d.ts.map