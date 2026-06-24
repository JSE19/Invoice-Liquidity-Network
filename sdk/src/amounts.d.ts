export interface AmountToken {
    decimals: number;
}
export declare function parseAmount(input: string, token: AmountToken): bigint;
export declare function formatAmount(amount: bigint, token: AmountToken): string;
//# sourceMappingURL=amounts.d.ts.map