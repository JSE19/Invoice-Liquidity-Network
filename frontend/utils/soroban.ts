import {
    Account,
    Address,
    BASE_FEE,
    nativeToScVal,
    Operation,
    rpc,
    scValToNative,
    Transaction,
    TransactionBuilder,
    xdr
} from "@stellar/stellar-sdk";
import { CONTRACT_ID, NETWORK_PASSPHRASE, RPC_URL, TESTNET_USDC_TOKEN_ID } from "../constants";

const server = new rpc.Server(RPC_URL);
const READ_ACCOUNT = "GAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAWHF";
const POLL_ATTEMPTS = 20;
const ACCEPTED_SEND_STATUSES = new Set(["PENDING", "DUPLICATE"]);

export interface Invoice {
  id: bigint;
  freelancer: string;
  payer: string;
  amount: bigint;
  due_date: bigint;
  discount_rate: number;
  status: string;
  funder?: string;
  funded_at?: bigint;
}

export interface SubmittedInvoiceResult {
  invoiceId: bigint;
  txHash: string;
}

function buildReadTransaction(method: string, params: xdr.ScVal[]) {
  return new TransactionBuilder(new Account(READ_ACCOUNT, "0"), {
    fee: BASE_FEE,
    networkPassphrase: NETWORK_PASSPHRASE,
  })
    .addOperation(
      Operation.invokeContractFunction({
        contract: CONTRACT_ID,
        function: method,
        args: params,
      })
    )
    .setTimeout(30)
    .build();
}

export async function getInvoiceCount(): Promise<bigint> {
  const result = await server.getHealth();
  if (result.status !== "healthy") {
    throw new Error("RPC server is not healthy");
  }

  const callResult = await server.simulateTransaction(buildReadTransaction("get_invoice_count", []));

  if (rpc.Api.isSimulationSuccess(callResult)) {
    return scValToNative(callResult.result!.retval);
  } else {
    throw new Error("Failed to get invoice count");
  }
}

export async function getInvoice(id: bigint): Promise<Invoice> {
  const params: xdr.ScVal[] = [nativeToScVal(id, { type: "u64" })];
  const callResult = await server.simulateTransaction(buildReadTransaction("get_invoice", params));

  if (rpc.Api.isSimulationSuccess(callResult)) {
    const native = scValToNative(callResult.result!.retval);
    return {
      id: native.id,
      freelancer: native.freelancer,
      payer: native.payer,
      amount: native.amount,
      due_date: native.due_date,
      discount_rate: native.discount_rate,
      status: parseStatus(native.status),
      funder: native.funder,
      funded_at: native.funded_at,
    };
  } else {
    throw new Error(`Failed to get invoice ${id}`);
  }
}

function parseStatus(status: any): string {
  if (typeof status === 'object') {
    return Object.keys(status)[0];
  }
  return status;
}

export async function getAllInvoices(): Promise<Invoice[]> {
  const invoices: Invoice[] = [];
  let i = BigInt(1);
  let consecutiveFailures = 0;
  
  // Attempt to fetch invoices until we hit a failure
  // In Soroban, persistent storage IDs are typically sequential if implemented as such
  // We'll stop after a single failure since get_invoice throws if not found
  while (consecutiveFailures < 1) {
    try {
      const invoice = await getInvoice(i);
      invoices.push(invoice);
      i++;
      consecutiveFailures = 0; // reset on success
    } catch (e) {
      // If i=1 and it fails, it might mean there are no invoices at all
      // or the contract doesn't have any data yet.
      consecutiveFailures++;
    }
    
    // Safety break to prevent infinite loop in case of weirdness
    if (i > BigInt(1000)) break; 
  }
  return invoices;
}

export async function fundInvoice(funder: string, invoice_id: bigint) {
  // This will be used with Freighter
  // For now, it just returns the transaction to be signed
  const contractAddress = CONTRACT_ID;
  const method = "fund_invoice";
  const params: xdr.ScVal[] = [
    Address.fromString(funder).toScVal(),
    nativeToScVal(invoice_id, { type: "u64" }),
  ];

  const funderAddress = Address.fromString(funder);
  const account = await server.getAccount(funder);
  
  const tx = new TransactionBuilder(account, {
    fee: "10000", // Default fee
    networkPassphrase: NETWORK_PASSPHRASE,
  })
    .addOperation(
      Operation.invokeHostFunction({
        func: xdr.HostFunction.hostFunctionTypeInvokeContract(
          new xdr.InvokeContractArgs({
            contractAddress: Address.fromString(contractAddress).toScAddress(),
            functionName: method,
            args: params,
          })
        ),
        auth: [], // This will be handled by Soroban simulation or manual auth
      })
    )
    .setTimeout(60 * 5)
    .build();

  // We need to simulate to get the auth and resource fees
  const sim = await server.simulateTransaction(tx);
  if (!rpc.Api.isSimulationSuccess(sim)) {
    throw new Error(`Simulation failed: ${sim.error}`);
  }

  const finalTx = rpc.assembleTransaction(tx, sim).build();
  return finalTx;
}

export async function markPaid(payer: string, invoice_id: bigint) {
  const contractAddress = CONTRACT_ID;
  const method = "mark_paid";
  const params: xdr.ScVal[] = [
    nativeToScVal(invoice_id, { type: "u64" }),
  ];

  const account = await server.getAccount(payer);

  const tx = new TransactionBuilder(account, {
    fee: "10000",
    networkPassphrase: NETWORK_PASSPHRASE,
  })
    .addOperation(
      Operation.invokeHostFunction({
        func: xdr.HostFunction.hostFunctionTypeInvokeContract(
          new xdr.InvokeContractArgs({
            contractAddress: Address.fromString(contractAddress).toScAddress(),
            functionName: method,
            args: params,
          })
        ),
        auth: [],
      })
    )
    .setTimeout(60 * 5)
    .build();

  const sim = await server.simulateTransaction(tx);
  if (!rpc.Api.isSimulationSuccess(sim)) {
    throw new Error(`Simulation failed: ${sim.error}`);
  }

  const finalTx = rpc.assembleTransaction(tx, sim).build();
  return finalTx;
}

export async function submitInvoiceTransaction({
  freelancer,
  payer,
  amount,
  dueDate,
  discountRate,
  signTx,
  token = TESTNET_USDC_TOKEN_ID,
}: {
  freelancer: string;
  payer: string;
  amount: bigint;
  dueDate: number;
  discountRate: number;
  signTx: (txXdr: string) => Promise<string>;
  token?: string;
}): Promise<SubmittedInvoiceResult> {
  const sourceAccount = await server.getAccount(freelancer);

  const tx = new TransactionBuilder(sourceAccount, {
    fee: BASE_FEE,
    networkPassphrase: NETWORK_PASSPHRASE,
  })
    .addOperation(
      Operation.invokeContractFunction({
        contract: CONTRACT_ID,
        function: "submit_invoice",
        args: [
          Address.fromString(freelancer).toScVal(),
          Address.fromString(payer).toScVal(),
          nativeToScVal(amount, { type: "i128" }),
          nativeToScVal(dueDate, { type: "u64" }),
          nativeToScVal(discountRate, { type: "u32" }),
          Address.fromString(token).toScVal(),
        ],
      })
    )
    .setTimeout(60)
    .build();

  const simulated = await server.simulateTransaction(tx);
  if (!rpc.Api.isSimulationSuccess(simulated) || !simulated.result?.retval) {
    const message = "error" in simulated ? simulated.error : "Unable to simulate invoice submission.";
    throw new Error(`Simulation failed: ${message}`);
  }

  const simulatedInvoiceId = BigInt(scValToNative(simulated.result.retval));
  const prepared = await server.prepareTransaction(tx);
  const signedXdr = await signTx(prepared.toXDR());
  const signedTx = TransactionBuilder.fromXDR(signedXdr, NETWORK_PASSPHRASE) as Transaction;
  const sent = await server.sendTransaction(signedTx);

  if (!sent.hash || !sent.status) {
    throw new Error("RPC server returned an invalid response for invoice submission.");
  }

  if (!ACCEPTED_SEND_STATUSES.has(sent.status)) {
    throw new Error(`Transaction submission failed with status ${sent.status}.`);
  }

  const finalResult = await server.pollTransaction(sent.hash, { attempts: POLL_ATTEMPTS });
  if (finalResult.status !== rpc.Api.GetTransactionStatus.SUCCESS) {
    throw new Error(`Transaction failed with status ${String(finalResult.status)}.`);
  }

  const confirmedInvoiceId = extractInvoiceIdFromTransaction(finalResult) ?? simulatedInvoiceId;

  return {
    invoiceId: confirmedInvoiceId,
    txHash: sent.hash,
  };
}

function extractInvoiceIdFromTransaction(result: unknown): bigint | null {
  if (!result || typeof result !== "object") {
    return null;
  }

  const maybe = result as {
    returnValue?: unknown;
    resultMetaXdr?: string;
  };

  if (maybe.returnValue instanceof xdr.ScVal) {
    return BigInt(scValToNative(maybe.returnValue));
  }

  if (typeof maybe.returnValue === "string") {
    try {
      const scVal = xdr.ScVal.fromXDR(maybe.returnValue, "base64");
      return BigInt(scValToNative(scVal));
    } catch {
      return null;
    }
  }

  if (maybe.resultMetaXdr) {
    try {
      const meta = xdr.TransactionMeta.fromXDR(maybe.resultMetaXdr, "base64");
      const sorobanMeta = meta.v3()?.sorobanMeta();
      const returnValue = sorobanMeta?.returnValue();

      if (returnValue) {
        return BigInt(scValToNative(returnValue));
      }
    } catch {
      return null;
    }
  }

  return null;
}
