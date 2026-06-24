import { TransactionBuilder, xdr } from "@stellar/stellar-sdk";
import { ProposalStatus } from "./governance-types";
import type { ProposalAction } from "./governance-types";
import type { RpcServerLike } from "./types";
export type BuiltTransaction = ReturnType<TransactionBuilder["build"]>;
export declare function buildReadContractTransaction(contractId: string, networkPassphrase: string, method: string, args: xdr.ScVal[]): BuiltTransaction;
export declare function buildWriteContractTransaction(server: RpcServerLike, contractId: string, networkPassphrase: string, sourceAddress: string, method: string, args: xdr.ScVal[]): Promise<BuiltTransaction>;
export declare function toAddressScVal(address: string): xdr.ScVal;
export declare function toBytesN32ScVal(value: Buffer | Uint8Array): xdr.ScVal;
export declare function toOptionalProposalStatusScVal(status?: ProposalStatus): xdr.ScVal;
export declare function encodeProposalAction(action: ProposalAction): xdr.ScVal;
export declare function extractSimulationRetval(simulation: unknown, method: string): xdr.ScVal;
export declare function unwrapContractResult(value: unknown, method: string): unknown;
export declare function extractContractCall(transaction: BuiltTransaction): {
    contractId: string;
    functionName: string;
    args: xdr.ScVal[];
};
export declare function scValToNativeValue(retval: xdr.ScVal): unknown;
//# sourceMappingURL=governance-utils.d.ts.map