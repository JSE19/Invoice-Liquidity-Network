import React from "react";
import type { ILNSdkConfig } from "./types";
export interface CheckoutWidgetProps {
    /** The invoice ID to fund (the checkout order). */
    orderId: bigint;
    /** Human-readable display amount (e.g. "100.00"). */
    amount: string;
    /** Token symbol shown to the user (e.g. "USDC"). */
    token: string;
    /** The merchant's Stellar address that submitted the invoice. */
    merchantAddress: string;
    /** Optional SDK config override (defaults to ILN testnet). */
    sdkConfig?: Partial<ILNSdkConfig>;
    onSuccess?: (orderId: bigint, funder: string) => void;
    onError?: (error: Error) => void;
}
export declare function CheckoutWidget({ orderId, amount, token, merchantAddress, sdkConfig, onSuccess, onError, }: CheckoutWidgetProps): React.JSX.Element;
//# sourceMappingURL=CheckoutWidget.d.ts.map