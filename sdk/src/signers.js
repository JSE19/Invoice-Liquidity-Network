import { Keypair, Networks, TransactionBuilder } from "@stellar/stellar-sdk";
const TESTNET_CONTRACT_ID = "CD3TE3IAHM737P236XZL2OYU275ZKD6MN7YH7PYYAXYIGEH55OPEWYJC";
const TESTNET_RPC_URL = "https://soroban-testnet.stellar.org";
export const ILN_TESTNET = {
    contractId: TESTNET_CONTRACT_ID,
    rpcUrl: TESTNET_RPC_URL,
    networkPassphrase: Networks.TESTNET,
};
export function createKeypairSigner(secretKey) {
    const keypair = Keypair.fromSecret(secretKey);
    return {
        async getPublicKey() {
            return keypair.publicKey();
        },
        async signTransaction(transactionXdr, options) {
            const transaction = TransactionBuilder.fromXDR(transactionXdr, options.networkPassphrase);
            transaction.sign(keypair);
            return transaction.toXDR();
        },
    };
}
export function createFreighterSigner(address) {
    return {
        async getPublicKey() {
            const freighter = await loadFreighter();
            return address ?? (await resolveFreighterAddress(freighter));
        },
        async signTransaction(transactionXdr, options) {
            const freighter = await loadFreighter();
            const selected = options.address ?? address ?? (await resolveFreighterAddress(freighter));
            await assertFreighterNetwork(freighter, options.networkPassphrase);
            const result = await freighter.signTransaction(transactionXdr, {
                address: selected,
                networkPassphrase: options.networkPassphrase,
            });
            if (result.error || !result.signedTxXdr) {
                throw new Error(result.error ? String(result.error) : "Freighter did not return a signed transaction.");
            }
            return result.signedTxXdr;
        },
    };
}
async function loadFreighter() {
    if (typeof window === "undefined") {
        throw new Error("Freighter signing is only available in browser environments.");
    }
    const freighter = await import("@stellar/freighter-api");
    const connected = freighter.isConnected ? await freighter.isConnected() : undefined;
    if (connected?.error) {
        throw new Error(String(connected.error));
    }
    if (connected && !connected.isConnected) {
        throw new Error("Freighter extension is not installed or not available.");
    }
    return freighter;
}
async function resolveFreighterAddress(freighter) {
    const current = await freighter.getAddress();
    if (current.error) {
        throw new Error(String(current.error));
    }
    if (current.address) {
        return current.address;
    }
    const requested = await freighter.requestAccess();
    if (requested.error || !requested.address) {
        throw new Error(requested.error ? String(requested.error) : "Freighter did not provide an account address.");
    }
    return requested.address;
}
async function assertFreighterNetwork(freighter, expectedPassphrase = Networks.TESTNET) {
    if (!freighter.getNetworkDetails) {
        return;
    }
    const network = await freighter.getNetworkDetails();
    if (network.error) {
        throw new Error(String(network.error));
    }
    if (network.networkPassphrase &&
        expectedPassphrase &&
        network.networkPassphrase !== expectedPassphrase) {
        throw new Error("Freighter is connected to a different Stellar network.");
    }
}
