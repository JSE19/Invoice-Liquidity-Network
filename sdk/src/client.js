import { Account, Address, BASE_FEE, Operation, TransactionBuilder, rpc, scValToNative, nativeToScVal, } from "@stellar/stellar-sdk";
import { createLogger } from "./logger";
import { openSSE } from "./stream";
import { checkCompatibility } from "./compatibility";
import { GenericContractError, parseContractError, InsufficientBalanceError, NetworkError, TransactionFailedError, ValidationError, WalletNotConnectedError, ILNError, } from "./errors";
import { resolveRequestTimeouts, TimeoutError, withTimeout, } from "./timeouts";
const READ_ACCOUNT = "GAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAWHF";
const POLL_ATTEMPTS = 20;
const PROTOCOL_CONFIG_CACHE_MS = 5 * 60 * 1000;
export class ILNSdk {
    constructor(config) {
        this.protocolConfigCache = null;
        this.logger = createLogger("client");
        this.contractId = config.contractId;
        this.networkPassphrase = config.networkPassphrase;
        this.server = config.server ?? new rpc.Server(config.rpcUrl);
        this.rpcUrl = config.rpcUrl;
        this.signer = config.signer;
        this.requestTimeouts = resolveRequestTimeouts(config);
    }
    async wrapRpcCall(promise, operationName) {
        try {
            return await promise;
        }
        catch (error) {
            if (error instanceof ILNError) {
                throw error;
            }
            const errMsg = this.toErrorMessage(error);
            if (error instanceof TimeoutError) {
                throw error;
            }
            if (errMsg.toLowerCase().includes("insufficient balance") || errMsg.toLowerCase().includes("insufficient_balance") || errMsg.toLowerCase().includes("underfunded")) {
                throw new InsufficientBalanceError(`Insufficient balance for ${operationName}: ${errMsg}`);
            }
            if (error.status === 404 ||
                error.status === 502 ||
                error.status === 503 ||
                error.status === 504 ||
                errMsg.includes("fetch failed") ||
                errMsg.includes("NetworkError") ||
                errMsg.includes("ENOTFOUND") ||
                errMsg.includes("ECONNREFUSED") ||
                errMsg.includes("request failed")) {
                throw new NetworkError(`Network error during ${operationName}: ${errMsg}`);
            }
            throw new TransactionFailedError(`Transaction failed during ${operationName}: ${errMsg}`);
        }
    }
    buildSubmitInvoiceOperation(params) {
        return this.buildInvokeContractFunctionOperation(params.freelancer, "submit_invoice", [
            this.toAddress(params.freelancer),
            this.toAddress(params.payer),
            nativeToScVal(params.amount, { type: "i128" }),
            nativeToScVal(params.dueDate, { type: "u64" }),
            nativeToScVal(params.discountRate, { type: "u32" }),
        ]);
    }
    buildFundInvoiceOperation(params) {
        return this.buildInvokeContractFunctionOperation(params.funder, "fund_invoice", [
            this.toAddress(params.funder),
            nativeToScVal(params.invoiceId, { type: "u64" }),
        ]);
    }
    buildMarkPaidOperation(sourceAddress, params) {
        return this.buildInvokeContractFunctionOperation(sourceAddress, "mark_paid", [
            nativeToScVal(params.invoiceId, { type: "u64" }),
        ]);
    }
    buildClaimDefaultOperation(params) {
        return this.buildInvokeContractFunctionOperation(params.funder, "claim_default", [
            this.toAddress(params.funder),
            nativeToScVal(params.invoiceId, { type: "u64" }),
        ]);
    }
    async batch(operations) {
        if (operations.length === 0) {
            throw new ValidationError("Batch must contain at least one operation.");
        }
        if (operations.length > 100) {
            throw new ValidationError("Batch cannot contain more than 100 operations.");
        }
        const sourceAddress = await this.resolveBatchSourceAddress(operations);
        const sourceAccount = (await this.wrapRpcCall(this.server.getAccount(sourceAddress), "getAccount"));
        const transactionBuilder = new TransactionBuilder(sourceAccount, {
            fee: BASE_FEE,
            networkPassphrase: this.networkPassphrase,
        });
        for (const operation of operations) {
            transactionBuilder.addOperation(operation);
        }
        const transaction = transactionBuilder.setTimeout(30).build();
        const simulation = await this.wrapRpcCall(this.server.simulateTransaction(transaction), "simulateTransaction");
        this.validateBatchSimulation(simulation);
        return transaction;
    }
    buildInvokeContractFunctionOperation(sourceAddress, method, args) {
        return Operation.invokeContractFunction({
            source: sourceAddress,
            contract: this.contractId,
            function: method,
            args,
        });
    }
    async resolveBatchSourceAddress(operations) {
        const sources = operations
            .map((operation) => this.getOperationSourceAddress(operation))
            .filter((source) => source !== undefined && source !== null);
        if (sources.length > 0) {
            const uniqueSources = [...new Set(sources)];
            if (uniqueSources.length !== 1) {
                throw new ValidationError("All operations in a batch must originate from the same source account.");
            }
            return uniqueSources[0];
        }
        if (!this.signer) {
            throw new WalletNotConnectedError("Batch requires at least one operation source or a configured transaction signer.");
        }
        return this.signer.getPublicKey();
    }
    getOperationSourceAddress(operation) {
        if (operation.source) {
            return operation.source;
        }
        const sourceAccount = operation?._attributes?.sourceAccount;
        if (!sourceAccount || !sourceAccount._value) {
            return undefined;
        }
        try {
            return Address.account(sourceAccount._value).toString();
        }
        catch {
            return undefined;
        }
    }
    validateBatchSimulation(simulation) {
        const typedSimulation = simulation;
        if (typedSimulation.error) {
            const error = typedSimulation.error;
            throw new Error(`Batch simulation failed: ${error ? String(error) : "Unknown RPC error."}`);
        }
    }
    async checkCompatibility() {
        const invoke = async (method) => {
            const transaction = this.buildReadTransaction(method, []);
            const simulation = await this.wrapRpcCall(this.server.simulateTransaction(transaction), "simulateTransaction");
            return scValToNative(this.extractSimulationRetval(simulation, method));
        };
        return checkCompatibility(invoke);
    }
    /**
     * Subscribe to contract events for a specific invoice id. Returns an
     * unsubscribe function that terminates the stream.
     */
    subscribeToInvoice(id, callback) {
        const invoiceId = String(id);
        const base = this.rpcUrl.replace(/\/$/, "");
        const url = `${base}/contracts/${this.contractId}/events?limit=200&order=asc`;
        const handle = openSSE(url, (ev) => {
            try {
                // crude filtering: check topics or value for invoice id string
                const topics = (ev.topics ?? []);
                const value = ev.value ?? "";
                const foundInTopics = topics.some((t) => String(t).includes(invoiceId));
                const foundInValue = String(value).includes(invoiceId);
                if (foundInTopics || foundInValue) {
                    callback(ev);
                }
            }
            catch (err) {
                // swallow
            }
        }, (err) => {
            if (this.logger.enabled)
                this.logger("invoice SSE error", { err });
        });
        return () => handle.close();
    }
    /**
     * Subscribe to contract events related to a specific Stellar address.
     * Returns an unsubscribe function.
     */
    subscribeToAddress(address, callback) {
        const base = this.rpcUrl.replace(/\/$/, "");
        const url = `${base}/contracts/${this.contractId}/events?limit=200&order=asc`;
        const handle = openSSE(url, (ev) => {
            try {
                const topics = (ev.topics ?? []);
                const value = ev.value ?? "";
                const found = topics.some((t) => String(t).includes(address)) || String(value).includes(address);
                if (found)
                    callback(ev);
            }
            catch (err) {
                // swallow
            }
        }, (err) => {
            if (this.logger.enabled)
                this.logger("address SSE error", { err });
        });
        return () => handle.close();
    }
    async submitInvoice(params) {
        const signerAddress = await this.requireSignerAddress();
        if (signerAddress !== params.freelancer) {
            throw new ValidationError("submitInvoice must be signed by the freelancer address.");
        }
        const transaction = await this.buildWriteTransaction(params.freelancer, "submit_invoice", [
            this.toAddress(params.freelancer),
            this.toAddress(params.payer),
            nativeToScVal(params.amount, { type: "i128" }),
            nativeToScVal(params.dueDate, { type: "u64" }),
            nativeToScVal(params.discountRate, { type: "u32" }),
        ]);
        const simulation = await this.simulateWriteTransaction("submit_invoice", transaction);
        const invoiceId = this.extractBigIntResult(simulation, "submit_invoice");
        const preparedTransaction = await this.prepareTransaction(transaction);
        if (this.logger.enabled) {
            this.logger("submitInvoice prepared transaction", {
                xdr: this.toHex(preparedTransaction.toXDR()),
            });
        }
        await this.signAndSend(preparedTransaction, params.freelancer, "submitInvoice");
        return invoiceId;
    }
    async fundInvoice(params) {
        const signerAddress = await this.requireSignerAddress();
        if (signerAddress !== params.funder) {
            throw new ValidationError("fundInvoice must be signed by the funder address.");
        }
        const transaction = await this.buildWriteTransaction(params.funder, "fund_invoice", [
            this.toAddress(params.funder),
            nativeToScVal(params.invoiceId, { type: "u64" }),
        ]);
        if (this.logger.enabled) {
            this.logger("fundInvoice called", { params });
            this.logger("fundInvoice transaction", { xdr: this.toHex(transaction.toXDR()) });
        }
        const preparedTransaction = await this.prepareTransaction(transaction);
        if (this.logger.enabled) {
            this.logger("fundInvoice prepared transaction", {
                xdr: this.toHex(preparedTransaction.toXDR()),
            });
        }
        await this.signAndSend(preparedTransaction, params.funder, "fundInvoice");
    }
    async markPaid(params) {
        const payer = await this.requireSignerAddress();
        const transaction = await this.buildWriteTransaction(payer, "mark_paid", [
            nativeToScVal(params.invoiceId, { type: "u64" }),
        ]);
        if (this.logger.enabled) {
            this.logger("markPaid called", { params });
            this.logger("markPaid transaction", { xdr: this.toHex(transaction.toXDR()) });
        }
        const preparedTransaction = await this.prepareTransaction(transaction);
        if (this.logger.enabled) {
            this.logger("markPaid prepared transaction", {
                xdr: this.toHex(preparedTransaction.toXDR()),
            });
        }
        await this.signAndSend(preparedTransaction, payer, "markPaid");
    }
    async claimDefault(params) {
        const signerAddress = await this.requireSignerAddress();
        if (signerAddress !== params.funder) {
            throw new ValidationError("claimDefault must be signed by the funder address.");
        }
        const transaction = await this.buildWriteTransaction(params.funder, "claim_default", [
            this.toAddress(params.funder),
            nativeToScVal(params.invoiceId, { type: "u64" }),
        ]);
        if (this.logger.enabled) {
            this.logger("claimDefault called", { params });
            this.logger("claimDefault transaction", { xdr: this.toHex(transaction.toXDR()) });
        }
        const preparedTransaction = await this.prepareTransaction(transaction);
        if (this.logger.enabled) {
            this.logger("claimDefault prepared transaction", {
                xdr: this.toHex(preparedTransaction.toXDR()),
            });
        }
        await this.signAndSend(preparedTransaction, params.funder, "claimDefault");
    }
    async getInvoice(invoiceId) {
        const transaction = this.buildReadTransaction("get_invoice", [
            nativeToScVal(invoiceId, { type: "u64" }),
        ]);
        const simulation = await this.simulateReadTransaction("get_invoice", transaction);
        if (this.logger.enabled) {
            this.logger("getInvoice simulation result", this.summarizeSimulation(simulation));
        }
        return this.extractInvoiceResult(simulation);
    }
    /** Fetch reputation score for an address */
    async getReputation(address) {
        const transaction = this.buildReadTransaction("get_reputation", [
            this.toAddress(address),
        ]);
        const simulation = await this.simulateReadTransaction("get_reputation", transaction);
        const result = this.extractSimulationRetval(simulation, "get_reputation");
        const native = scValToNative(result);
        if (typeof native === "number")
            return native;
        if (typeof native === "bigint")
            return Number(native);
        throw new Error("Unexpected reputation result type");
    }
    /** Fetch contract-wide statistics */
    async getStats() {
        const transaction = this.buildReadTransaction("get_stats", []);
        const simulation = await this.simulateReadTransaction("get_stats", transaction);
        const result = this.extractSimulationRetval(simulation, "get_stats");
        return scValToNative(result);
    }
    /** Fetch governance proposal by id */
    async getProposal(id) {
        const transaction = this.buildReadTransaction("get_proposal", [
            nativeToScVal(id, { type: "u64" }),
        ]);
        const simulation = await this.simulateReadTransaction("get_proposal", transaction);
        const result = this.extractSimulationRetval(simulation, "get_proposal");
        return scValToNative(result);
    }
    async getProtocolConfig() {
        const now = Date.now();
        if (this.protocolConfigCache && this.protocolConfigCache.expiresAt > now) {
            return this.protocolConfigCache.value;
        }
        const transaction = this.buildReadTransaction("get_protocol_config", []);
        const simulation = await this.simulateReadTransaction("get_protocol_config", transaction);
        const result = this.extractSimulationRetval(simulation, "get_protocol_config");
        const config = this.parseProtocolConfig(this.unwrapContractResult(scValToNative(result), "get_protocol_config"));
        this.protocolConfigCache = {
            expiresAt: now + PROTOCOL_CONFIG_CACHE_MS,
            value: config,
        };
        return config;
    }
    /** Raw storage key lookup */
    async getStorage(key) {
        const transaction = this.buildReadTransaction("get_storage", [
            nativeToScVal(key, { type: "string" }),
        ]);
        const simulation = await this.simulateReadTransaction("get_storage", transaction);
        const result = this.extractSimulationRetval(simulation, "get_storage");
        const native = scValToNative(result);
        return typeof native === "string" ? native : String(native);
    }
    buildReadTransaction(method, args) {
        return new TransactionBuilder(new Account(READ_ACCOUNT, "0"), {
            fee: BASE_FEE,
            networkPassphrase: this.networkPassphrase,
        })
            .addOperation(Operation.invokeContractFunction({
            contract: this.contractId,
            function: method,
            args,
        }))
            .setTimeout(30)
            .build();
    }
    async buildWriteTransaction(sourceAddress, method, args) {
        const sourceAccount = (await withTimeout(`getAccount:${method}`, this.requestTimeouts.writeMs, this.server.getAccount(sourceAddress)));
        return new TransactionBuilder(sourceAccount, {
            fee: BASE_FEE,
            networkPassphrase: this.networkPassphrase,
        })
            .addOperation(Operation.invokeContractFunction({
            contract: this.contractId,
            function: method,
            args,
        }))
            .setTimeout(30)
            .build();
    }
    async requireSignerAddress() {
        if (!this.signer) {
            throw new WalletNotConnectedError("A transaction signer is required for state-changing contract calls.");
        }
        return this.signer.getPublicKey();
    }
    async prepareTransaction(transaction) {
        return this.wrapRpcCall(withTimeout("prepareTransaction", this.requestTimeouts.writeMs, this.server.prepareTransaction(transaction)), "prepareTransaction");
    }
    async signAndSend(preparedTransaction, sourceAddress, methodName) {
        const signer = this.signer;
        if (!signer) {
            throw new WalletNotConnectedError("A transaction signer is required for state-changing contract calls.");
        }
        const signedXdr = await signer.signTransaction(preparedTransaction.toXDR(), {
            address: sourceAddress,
            networkPassphrase: this.networkPassphrase,
        });
        const signedTransaction = TransactionBuilder.fromXDR(signedXdr, this.networkPassphrase);
        const response = (await this.wrapRpcCall(withTimeout("sendTransaction", this.requestTimeouts.writeMs, this.server.sendTransaction(signedTransaction)), "sendTransaction"));
        if (this.logger.enabled) {
            this.logger(`${methodName ?? "signAndSend"} transaction response`, {
                hash: response.hash,
                status: response.status,
                response,
            });
        }
        if (!response.hash || !response.status) {
            throw new TransactionFailedError("RPC server returned an invalid sendTransaction response.");
        }
        if (response.status !== "PENDING" && response.status !== "DUPLICATE") {
            throw new TransactionFailedError(`Transaction submission failed with status ${response.status}. ${response.errorResultXdr ?? ""}`.trim());
        }
        const finalStatus = (await this.wrapRpcCall(withTimeout("pollTransaction", this.requestTimeouts.writeMs, this.server.pollTransaction(response.hash, {
            attempts: POLL_ATTEMPTS,
        })), "pollTransaction"));
        if (this.logger.enabled) {
            this.logger(`${methodName ?? "signAndSend"} final status`, finalStatus);
        }
        if (finalStatus.status !== rpc.Api.GetTransactionStatus.SUCCESS) {
            throw new TransactionFailedError(`Transaction did not succeed. Final status: ${String(finalStatus.status)}.`);
        }
    }
    summarizeSimulation(simulation) {
        if (!simulation || typeof simulation !== "object") {
            return { simulation };
        }
        const data = simulation;
        const result = data.result;
        return {
            error: data.error,
            status: data.status,
            fee: result?.fee,
            resources: result?.resources,
            retval: result?.retval,
            result,
        };
    }
    toHex(xdrData) {
        if (typeof Buffer !== "undefined") {
            return Buffer.from(xdrData, "base64").toString("hex");
        }
        if (typeof atob !== "undefined") {
            const binary = atob(xdrData);
            let hex = "";
            for (let i = 0; i < binary.length; i += 1) {
                hex += binary.charCodeAt(i).toString(16).padStart(2, "0");
            }
            return hex;
        }
        return xdrData;
    }
    extractBigIntResult(simulation, method) {
        const result = this.extractSimulationRetval(simulation, method);
        return this.toBigInt(this.unwrapContractResult(scValToNative(result), method));
    }
    simulateReadTransaction(method, transaction) {
        return this.wrapRpcCall(withTimeout(`simulateTransaction:${method}`, this.requestTimeouts.readMs, this.server.simulateTransaction(transaction)), `simulateReadTransaction:${method}`);
    }
    simulateWriteTransaction(method, transaction) {
        return this.wrapRpcCall(withTimeout(`simulateTransaction:${method}`, this.requestTimeouts.simulationMs, this.server.simulateTransaction(transaction)), `simulateWriteTransaction:${method}`);
    }
    extractInvoiceResult(simulation) {
        const result = this.extractSimulationRetval(simulation, "get_invoice");
        const nativeInvoice = this.unwrapContractResult(scValToNative(result), "get_invoice");
        return {
            id: this.toBigInt(nativeInvoice.id),
            freelancer: this.toStringValue(nativeInvoice.freelancer, "freelancer"),
            payer: this.toStringValue(nativeInvoice.payer, "payer"),
            amount: this.toBigInt(nativeInvoice.amount),
            dueDate: this.toNumberValue(nativeInvoice.due_date ?? nativeInvoice.dueDate, "dueDate"),
            discountRate: this.toNumberValue(nativeInvoice.discount_rate ?? nativeInvoice.discountRate, "discountRate"),
            status: this.parseStatus(nativeInvoice.status),
            funder: nativeInvoice.funder == null ? null : this.toStringValue(nativeInvoice.funder, "funder"),
            fundedAt: nativeInvoice.funded_at == null && nativeInvoice.fundedAt == null
                ? null
                : this.toNumberValue(nativeInvoice.funded_at ?? nativeInvoice.fundedAt, "fundedAt"),
        };
    }
    parseProtocolConfig(value) {
        if (!value || typeof value !== "object") {
            throw new Error("Contract returned an invalid protocol config payload.");
        }
        const config = value;
        return {
            minInvoiceAmount: this.toBigInt(this.configValue(config, "minInvoiceAmount", "min_invoice_amount", "MIN_INVOICE_AMOUNT")),
            maxDiscountRate: this.toNumberValue(this.configValue(config, "maxDiscountRate", "max_discount_rate", "MAX_DISCOUNT_RATE"), "maxDiscountRate"),
            protocolFeeBps: this.toNumberValue(this.configValue(config, "protocolFeeBps", "protocol_fee_bps", "PROTOCOL_FEE_BPS"), "protocolFeeBps"),
            minPayerReputation: this.toNumberValue(this.configValue(config, "minPayerReputation", "min_payer_reputation", "MIN_PAYER_REPUTATION"), "minPayerReputation"),
            decayRateBps: this.toNumberValue(this.configValue(config, "decayRateBps", "decay_rate_bps", "DECAY_RATE_BPS"), "decayRateBps"),
            maxInvoiceDuration: this.optionalNumber(config, "maxInvoiceDuration", "max_invoice_duration", "MAX_INVOICE_DURATION"),
            minInvoiceDuration: this.optionalNumber(config, "minInvoiceDuration", "min_invoice_duration", "MIN_INVOICE_DURATION"),
            gracePeriodSeconds: this.optionalNumber(config, "gracePeriodSeconds", "grace_period_seconds", "GRACE_PERIOD_SECONDS"),
        };
    }
    configValue(config, ...keys) {
        for (const key of keys) {
            if (config[key] !== undefined) {
                return config[key];
            }
        }
        throw new Error(`Protocol config is missing ${keys[0]}.`);
    }
    optionalNumber(config, ...keys) {
        for (const key of keys) {
            if (config[key] !== undefined && config[key] !== null) {
                return this.toNumberValue(config[key], key);
            }
        }
        return undefined;
    }
    extractSimulationRetval(simulation, method) {
        const typedSimulation = simulation;
        if (typedSimulation.error) {
            const error = typedSimulation.error;
            throw new Error(`Simulation failed for ${method}: ${error ? String(error) : "Unknown RPC error."}`);
        }
        if (!typedSimulation.result?.retval) {
            throw new Error(`Simulation for ${method} did not return a contract result.`);
        }
        return typedSimulation.result.retval;
    }
    unwrapContractResult(value, method) {
        if (!value || typeof value !== "object") {
            return value;
        }
        if ("ok" in value) {
            return value.ok;
        }
        if ("Ok" in value) {
            return value.Ok;
        }
        if ("err" in value) {
            const error = value.err;
            const parsedError = parseContractError(error);
            if (parsedError instanceof GenericContractError) {
                throw new TransactionFailedError(`Contract method ${method} returned an error: ${this.formatContractError(error)}.`);
            }
            throw parsedError;
        }
        if ("Err" in value) {
            const error = value.Err;
            const parsedError = parseContractError(error);
            if (parsedError instanceof GenericContractError) {
                throw new TransactionFailedError(`Contract method ${method} returned an error: ${this.formatContractError(error)}.`);
            }
            throw parsedError;
        }
        return value;
    }
    formatContractError(error) {
        if (typeof error === "string") {
            return error;
        }
        if (typeof error === "number" || typeof error === "bigint" || typeof error === "boolean") {
            return String(error);
        }
        try {
            return JSON.stringify(error);
        }
        catch {
            return String(error);
        }
    }
    toAddress(address) {
        return Address.fromString(address).toScVal();
    }
    toBigInt(value) {
        if (typeof value === "bigint") {
            return value;
        }
        if (typeof value === "number") {
            return BigInt(value);
        }
        if (typeof value === "string") {
            return BigInt(value);
        }
        throw new Error(`Expected bigint-compatible value but received ${typeof value}.`);
    }
    toNumberValue(value, field) {
        if (typeof value === "number") {
            return value;
        }
        if (typeof value === "bigint") {
            return Number(value);
        }
        throw new Error(`Expected numeric ${field} value but received ${typeof value}.`);
    }
    toStringValue(value, field) {
        if (typeof value === "string") {
            return value;
        }
        throw new Error(`Expected string ${field} value but received ${typeof value}.`);
    }
    parseStatus(value) {
        if (typeof value === "string") {
            return this.normalizeStatus(value);
        }
        if (value && typeof value === "object") {
            const [key] = Object.keys(value);
            if (key) {
                return this.normalizeStatus(key);
            }
        }
        throw new Error("Unable to parse invoice status from contract response.");
    }
    normalizeStatus(value) {
        const normalized = value.slice(0, 1).toUpperCase() + value.slice(1).toLowerCase();
        switch (normalized) {
            case "Pending":
            case "Funded":
            case "Paid":
            case "Defaulted":
                return normalized;
            default:
                throw new Error(`Unknown invoice status "${value}".`);
        }
    }
    toErrorMessage(error) {
        if (error instanceof Error) {
            return error.message;
        }
        return String(error);
    }
}
