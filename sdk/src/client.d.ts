import { TransactionBuilder } from "@stellar/stellar-sdk";
import type { Invoice } from "@iln/shared";
import type { ClaimDefaultParams, FundInvoiceParams, ILNSdkConfig, MarkPaidParams, ProtocolConfig, SubmitInvoiceParams, CompatibilityResult, ContractEvent } from "./types";
export type EventCallback = (event: ContractEvent) => void | Promise<void>;
export type Unsubscribe = () => void;
type BuiltTransaction = ReturnType<TransactionBuilder["build"]>;
type TransactionOperation = Parameters<TransactionBuilder["addOperation"]>[0];
export declare class ILNSdk {
    private readonly contractId;
    private readonly networkPassphrase;
    private readonly server;
    private readonly rpcUrl;
    private readonly signer?;
    private readonly requestTimeouts;
    private protocolConfigCache;
    private readonly logger;
    constructor(config: ILNSdkConfig);
    private wrapRpcCall;
    buildSubmitInvoiceOperation(params: SubmitInvoiceParams): TransactionOperation;
    buildFundInvoiceOperation(params: FundInvoiceParams): TransactionOperation;
    buildMarkPaidOperation(sourceAddress: string, params: MarkPaidParams): TransactionOperation;
    buildClaimDefaultOperation(params: ClaimDefaultParams): TransactionOperation;
    batch(operations: TransactionOperation[]): Promise<BuiltTransaction>;
    private buildInvokeContractFunctionOperation;
    private resolveBatchSourceAddress;
    private getOperationSourceAddress;
    private validateBatchSimulation;
    checkCompatibility(): Promise<CompatibilityResult>;
    /**
     * Subscribe to contract events for a specific invoice id. Returns an
     * unsubscribe function that terminates the stream.
     */
    subscribeToInvoice(id: bigint | string, callback: EventCallback): Unsubscribe;
    /**
     * Subscribe to contract events related to a specific Stellar address.
     * Returns an unsubscribe function.
     */
    subscribeToAddress(address: string, callback: EventCallback): Unsubscribe;
    submitInvoice(params: SubmitInvoiceParams): Promise<bigint>;
    fundInvoice(params: FundInvoiceParams): Promise<void>;
    markPaid(params: MarkPaidParams): Promise<void>;
    claimDefault(params: ClaimDefaultParams): Promise<void>;
    getInvoice(invoiceId: bigint): Promise<Invoice>;
    /** Fetch reputation score for an address */
    getReputation(address: string): Promise<number>;
    /** Fetch contract-wide statistics */
    getStats(): Promise<unknown>;
    /** Fetch governance proposal by id */
    getProposal(id: bigint): Promise<unknown>;
    getProtocolConfig(): Promise<ProtocolConfig>;
    /** Raw storage key lookup */
    getStorage(key: string): Promise<string>;
    private buildReadTransaction;
    private buildWriteTransaction;
    private requireSignerAddress;
    private prepareTransaction;
    private signAndSend;
    private summarizeSimulation;
    private toHex;
    private extractBigIntResult;
    private simulateReadTransaction;
    private simulateWriteTransaction;
    private extractInvoiceResult;
    private parseProtocolConfig;
    private configValue;
    private optionalNumber;
    private extractSimulationRetval;
    private unwrapContractResult;
    private formatContractError;
    private toAddress;
    private toBigInt;
    private toNumberValue;
    private toStringValue;
    private parseStatus;
    private normalizeStatus;
    private toErrorMessage;
}
export {};
//# sourceMappingURL=client.d.ts.map