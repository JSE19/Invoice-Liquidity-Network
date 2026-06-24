import { Operation, Transaction } from '@stellar/stellar-sdk';
import { RpcClient } from './rpc.js';
export interface TransactionConfig {
    baseFee?: number;
    maxFee?: number;
    timeout?: number;
    networkPassphrase?: string;
    sourceAccount: string;
}
export interface SimulationResult {
    success: boolean;
    fee: number;
    resources: {
        cpu: number;
        memory: number;
        readBytes: number;
        writeBytes: number;
    };
    minResourceFee: number;
    error?: string;
}
/**
 * ILN Transaction Builder with smart defaults + simulation
 */
export declare class ILNTransactionBuilder {
    private rpcClient;
    constructor(rpcClient: RpcClient);
    /**
     * Build a transaction with simulation and fee optimization
     */
    buildTransaction(operations: Operation[], config: TransactionConfig): Promise<{
        transaction: Transaction;
        simulation: SimulationResult;
    }>;
    private simulateTransaction;
}
export declare const buildTransaction: (operations: Operation[], config: TransactionConfig, rpcClient: RpcClient) => Promise<{
    transaction: Transaction;
    simulation: SimulationResult;
}>;
//# sourceMappingURL=transaction.d.ts.map