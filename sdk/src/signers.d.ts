import type { NetworkConfig, TransactionSigner } from "./types";
export declare const ILN_TESTNET: NetworkConfig;
export declare function createKeypairSigner(secretKey: string): TransactionSigner;
export declare function createFreighterSigner(address?: string): TransactionSigner;
//# sourceMappingURL=signers.d.ts.map