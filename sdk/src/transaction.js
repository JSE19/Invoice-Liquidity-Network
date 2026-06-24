import { TransactionBuilder, Networks } from '@stellar/stellar-sdk';
/**
 * ILN Transaction Builder with smart defaults + simulation
 */
export class ILNTransactionBuilder {
    constructor(rpcClient) {
        this.rpcClient = rpcClient;
    }
    /**
     * Build a transaction with simulation and fee optimization
     */
    async buildTransaction(operations, config) {
        const { baseFee = 100, maxFee = 1000, timeout = 30, networkPassphrase = Networks.TESTNET, sourceAccount, } = config;
        // Load account
        const account = await this.rpcClient.getAccount(sourceAccount);
        let txBuilder = new TransactionBuilder(account, {
            fee: baseFee.toString(),
            networkPassphrase,
        });
        // Add operations
        operations.forEach(op => txBuilder.addOperation(op));
        // Set timeout
        txBuilder.setTimeout(timeout);
        let transaction = txBuilder.build();
        // === Simulate Transaction ===
        const simulation = await this.simulateTransaction(transaction);
        // Adjust fee based on simulation
        if (simulation.success) {
            transaction = txBuilder
                .setFee(Math.max(baseFee, simulation.minResourceFee).toString())
                .build();
        }
        return { transaction, simulation };
    }
    async simulateTransaction(tx) {
        try {
            const result = await this.rpcClient.simulateTransaction(tx);
            return {
                success: result.success,
                fee: result.fee || 0,
                resources: {
                    cpu: result.resources?.cpu || 0,
                    memory: result.resources?.memory || 0,
                    readBytes: result.resources?.readBytes || 0,
                    writeBytes: result.resources?.writeBytes || 0,
                },
                minResourceFee: result.minResourceFee || 100,
            };
        }
        catch (error) {
            return {
                success: false,
                fee: 0,
                resources: { cpu: 0, memory: 0, readBytes: 0, writeBytes: 0 },
                minResourceFee: 100,
                error: error.message,
            };
        }
    }
}
// Helper function (as requested)
export const buildTransaction = async (operations, config, rpcClient) => {
    const builder = new ILNTransactionBuilder(rpcClient);
    return builder.buildTransaction(operations, config);
};
