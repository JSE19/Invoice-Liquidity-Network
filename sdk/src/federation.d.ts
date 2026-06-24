export declare class FederationResolutionError extends Error {
    constructor(message: string);
}
export declare function resolveFederationAddress(fedAddress: string): Promise<string>;
export declare function lookupFederationAddress(gAddress: string): Promise<string | null>;
//# sourceMappingURL=federation.d.ts.map