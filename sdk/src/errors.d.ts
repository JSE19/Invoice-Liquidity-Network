export declare class ILNError extends Error {
    code: string;
    remediation: string;
    constructor(message: string, code: string, remediation: string);
}
export declare class InvalidDiscountRateError extends ILNError {
    constructor();
}
export declare class TokenMismatchError extends ILNError {
    constructor();
}
export declare class PayerReputationTooLowError extends ILNError {
    constructor();
}
export declare class InsufficientBalanceError extends ILNError {
    constructor(message?: string, remediation?: string);
}
export declare class NetworkError extends ILNError {
    constructor(message?: string, remediation?: string);
}
export declare class TransactionFailedError extends ILNError {
    constructor(message?: string, remediation?: string);
}
export declare class ValidationError extends ILNError {
    constructor(message?: string, remediation?: string);
}
export declare class WalletNotConnectedError extends ILNError {
    constructor(message?: string, remediation?: string);
}
export declare class GenericContractError extends ILNError {
    constructor(rawError: string);
}
export declare function parseContractError(xdrError: unknown): ILNError;
//# sourceMappingURL=errors.d.ts.map