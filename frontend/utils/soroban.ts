import {
  xdr,
  rpc,
  Address,
  scValToNative,
  nativeToScVal,
  TransactionBuilder,
  Networks,
  Operation,
  Account,
  BASE_FEE,
} from "@stellar/stellar-sdk";
import { CONTRACT_ID, NETWORK_PASSPHRASE, RPC_URL } from "../constants";

const server = new rpc.Server(RPC_URL);

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

export async function getInvoiceCount(): Promise<bigint> {
  const result = await server.getHealth();
  if (result.status !== "healthy") {
    throw new Error("RPC server is not healthy");
  }

  const contractAddress = CONTRACT_ID;
  const method = "get_invoice_count";
  const params: xdr.ScVal[] = [];

  const dummyAccount = new Account("GAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAWHF", "0");

  const callResult = await server.simulateTransaction(
    new TransactionBuilder(dummyAccount, { 
      fee: "100", 
      networkPassphrase: NETWORK_PASSPHRASE 
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
      .setTimeout(0)
      .build()
  );

  if (rpc.Api.isSimulationSuccess(callResult)) {
    return scValToNative(callResult.result!.retval);
  } else {
    throw new Error("Failed to get invoice count");
  }
}

export async function getInvoice(id: bigint): Promise<Invoice> {
  const contractAddress = CONTRACT_ID;
  const method = "get_invoice";
  const params: xdr.ScVal[] = [nativeToScVal(id, { type: "u64" })];

  const dummyAccount = new Account("GAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAWHF", "0");

  const callResult = await server.simulateTransaction(
    new TransactionBuilder(dummyAccount, { 
      fee: "100", 
      networkPassphrase: NETWORK_PASSPHRASE 
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
      .setTimeout(0)
      .build()
  );

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

export interface SubmitInvoiceArgs {
  freelancer: string;
  payer: string;
  /** Amount in stroops (1 USDC = 10_000_000) */
  amount: bigint;
  /** Unix timestamp (seconds) */
  dueDate: number;
  /** Basis points * 100 — e.g. 500 = 5.00% */
  discountRate: number;
}

/**
 * Builds, simulates and assembles a submit_invoice transaction.
 * Returns the final Transaction (ready for Freighter to sign) and the
 * invoice ID predicted by the simulation.
 */
export async function submitInvoice(
  args: SubmitInvoiceArgs
): Promise<{ tx: ReturnType<typeof rpc.assembleTransaction>["build"] extends () => infer R ? R : never; invoiceId: bigint }> {
  const contractAddress = CONTRACT_ID;
  const method = "submit_invoice";

  const params: xdr.ScVal[] = [
    Address.fromString(args.freelancer).toScVal(),
    Address.fromString(args.payer).toScVal(),
    nativeToScVal(args.amount, { type: "i128" }),
    nativeToScVal(BigInt(args.dueDate), { type: "u64" }),
    nativeToScVal(args.discountRate, { type: "u32" }),
  ];

  const account = await server.getAccount(args.freelancer);

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
    throw new Error(`Simulation failed: ${(sim as any).error}`);
  }

  // Extract the predicted invoice ID from simulation retval
  let invoiceId = BigInt(0);
  try {
    const raw = scValToNative(sim.result!.retval);
    // Contract returns Result<u64, Error> — unwrap Ok variant
    if (raw && typeof raw === "object" && "ok" in raw) {
      invoiceId = BigInt((raw as any).ok);
    } else if (raw && typeof raw === "object" && "Ok" in raw) {
      invoiceId = BigInt((raw as any).Ok);
    } else {
      invoiceId = BigInt(raw as any);
    }
  } catch (_) {
    // If we can't parse it, proceed without the ID — it'll be shown after poll
  }

  const finalTx = rpc.assembleTransaction(tx, sim).build();
  return { tx: finalTx as any, invoiceId };
}
