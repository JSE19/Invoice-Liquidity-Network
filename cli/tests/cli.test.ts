import { Keypair } from "@stellar/stellar-sdk";
import { Writable } from "node:stream";

import { describe, expect, it, vi, afterEach } from "vitest";

import * as sdk from "@invoice-liquidity/sdk";
import * as devSeedModule from "../src/dev-seed";
import { runCli } from "../src/cli";
import type { Invoice, ListedInvoice, ResolvedConfig } from "../src/types";

afterEach(() => {
  vi.restoreAllMocks();
});

const TEST_CONFIG: ResolvedConfig = {
  contractId: validAddress("C"),
  keypairPath: "/tmp/iln.secret",
  network: "testnet",
  networkPassphrase: "Test SDF Network ; September 2015",
  rpcUrl: "https://soroban-testnet.stellar.org",
  tokenId: validAddress("T"),
};

describe("runCli", () => {
  it("submits an invoice using config token fallback", async () => {
    const stdout = createMemoryStream();
    const stderr = createMemoryStream();
    const client = {
      submitInvoice: vi.fn().mockResolvedValue({ invoiceId: 42n, txHash: "abc123" }),
    };

    const exitCode = await runCli(
      ["submit", "--payer", validAddress(), "--amount", "100", "--due", "2025-12-31", "--rate", "300"],
      {
        createClient: () => client as any,
        loadConfig: () => TEST_CONFIG,
        stderr,
        stdout,
      },
    );

    expect(exitCode).toBe(0);
    expect(client.submitInvoice).toHaveBeenCalledWith(
      expect.objectContaining({
        amount: 1_000_000_000n,
        discountRate: 300,
        tokenId: TEST_CONFIG.tokenId,
      }),
    );
    expect(stdout.toString()).toContain("Submitted invoice 42");
    expect(stderr.toString()).toBe("");
  });

  it("auto-funds the remaining balance when amount is omitted", async () => {
    const stdout = createMemoryStream();
    const client = {
      fundInvoice: vi.fn().mockResolvedValue({ hash: "tx-hash" }),
    };

    const exitCode = await runCli(["fund", "--id", "7"], {
      createClient: () => client as any,
      loadConfig: () => TEST_CONFIG,
      stderr: createMemoryStream(),
      stdout,
    });

    expect(exitCode).toBe(0);
    expect(client.fundInvoice).toHaveBeenCalledWith(7n, undefined);
    expect(stdout.toString()).toContain("Funded invoice 7");
  });

  it("prints invoice status details", async () => {
    const stdout = createMemoryStream();
    const invoice: Invoice = {
      amount: 1_000_000_000n,
      amountFunded: 250_000_000n,
      discountRate: 300,
      dueDate: 1_767_225_599,
      freelancer: validAddress(),
      fundedAt: null,
      funder: null,
      id: 3n,
      payer: validAddress("B"),
      status: "Pending",
      token: "CTOKEN",
    };
    const client = {
      getInvoice: vi.fn().mockResolvedValue(invoice),
    };

    const exitCode = await runCli(["status", "--id", "3"], {
      createClient: () => client as any,
      loadConfig: () => TEST_CONFIG,
      stderr: createMemoryStream(),
      stdout,
    });

    expect(exitCode).toBe(0);
    expect(stdout.toString()).toContain("Status");
    expect(stdout.toString()).toContain("Pending");
  });

  it("lists invoices for an address", async () => {
    const stdout = createMemoryStream();
    const client = {
      listInvoicesByAddress: vi.fn().mockResolvedValue([
        createListedInvoice({ id: 1n, role: "freelancer", status: "Pending" }),
        createListedInvoice({ id: 2n, role: "payer", status: "Funded" }),
      ]),
    };

    const exitCode = await runCli(["list", "--address", validAddress()], {
      createClient: () => client as any,
      loadConfig: () => TEST_CONFIG,
      stderr: createMemoryStream(),
      stdout,
    });

    expect(exitCode).toBe(0);
    expect(stdout.toString()).toContain("ID");
    expect(stdout.toString()).toContain("freelancer");
    expect(stdout.toString()).toContain("Funded");
  });

  it("prints live protocol configuration", async () => {
    const stdout = createMemoryStream();
    const client = {
      getProtocolConfig: vi.fn().mockResolvedValue({
        minInvoiceAmount: 10_000_000n,
        maxDiscountRate: 2_000,
        protocolFeeBps: 250,
        minPayerReputation: 70,
        decayRateBps: 25,
      }),
    };

    const exitCode = await runCli(["protocol-config"], {
      createClient: () => client as any,
      loadConfig: () => TEST_CONFIG,
      stderr: createMemoryStream(),
      stdout,
    });

    expect(exitCode).toBe(0);
    expect(client.getProtocolConfig).toHaveBeenCalledTimes(1);
    expect(stdout.toString()).toContain("Min Amount");
    expect(stdout.toString()).toContain("10000000");
    expect(stdout.toString()).toContain("Fee");
  });

  it("prints actionable errors", async () => {
    const stderr = createMemoryStream();

    const exitCode = await runCli(["submit", "--payer", "not-a-key", "--amount", "100", "--due", "2025-12-31", "--rate", "300"], {
      createClient: () => ({}) as any,
      loadConfig: () => TEST_CONFIG,
      stderr,
      stdout: createMemoryStream(),
    });

    expect(exitCode).toBe(1);
    expect(stderr.toString()).toContain("Invalid payer address");
  });

  it("marks an invoice as paid", async () => {
    const stdout = createMemoryStream();
    const client = {
      markPaid: vi.fn().mockResolvedValue({ hash: "paid-hash" }),
    };

    const exitCode = await runCli(["pay", "--id", "42"], {
      createClient: () => client as any,
      loadConfig: () => TEST_CONFIG,
      stderr: createMemoryStream(),
      stdout,
    });

    expect(exitCode).toBe(0);
    expect(client.markPaid).toHaveBeenCalledWith(42n);
    expect(stdout.toString()).toContain("Marked invoice 42 as paid in transaction paid-hash.");
  });

  it("filters history by action, id, limit, and format json", async () => {
    const stdout = createMemoryStream();
    const invoices = [
      createListedInvoice({ id: 1n, role: "freelancer", status: "Pending" }),
      createListedInvoice({ id: 2n, role: "funder", status: "Funded" }),
      createListedInvoice({ id: 3n, role: "payer", status: "Paid" }),
    ];
    const client = {
      listInvoicesByAddress: vi.fn().mockResolvedValue(invoices),
    };

    const exitCode = await runCli(
      ["history", "--address", validAddress(), "--action", "pay", "--id", "3", "--limit", "1", "--format", "json"],
      {
        createClient: () => client as any,
        loadConfig: () => TEST_CONFIG,
        stderr: createMemoryStream(),
        stdout,
      },
    );

    expect(exitCode).toBe(0);
    expect(client.listInvoicesByAddress).toHaveBeenCalledWith(expect.any(String));
    const output = JSON.parse(stdout.toString());
    expect(output).toHaveLength(1);
    expect(output[0].id).toBe("3");
    expect(output[0].action).toBe("pay");
  });

  it("rejects invalid history limits and action values", async () => {
    const stderr = createMemoryStream();

    const invalidLimit = await runCli(["history", "--address", validAddress(), "--limit", "0"], {
      createClient: () => ({}) as any,
      loadConfig: () => TEST_CONFIG,
      stderr,
      stdout: createMemoryStream(),
    });

    expect(invalidLimit).toBe(1);
    expect(stderr.toString()).toContain("--limit must be a positive integer");

    const invalidAction = await runCli(["history", "--address", validAddress(), "--action", "unknown"], {
      createClient: () => ({ listInvoicesByAddress: vi.fn().mockResolvedValue([]) } as any),
      loadConfig: () => TEST_CONFIG,
      stderr: createMemoryStream(),
      stdout: createMemoryStream(),
    });

    expect(invalidAction).toBe(1);
    expect(stderr.toString()).toContain("--action must be one of");
  });

  it("fails submit when no token ID is configured and no token flag is provided", async () => {
    const stderr = createMemoryStream();

    const exitCode = await runCli(["submit", "--payer", validAddress(), "--amount", "100", "--due", "2025-12-31", "--rate", "300"], {
      createClient: () => ({ submitInvoice: vi.fn().mockResolvedValue({ invoiceId: 1n, txHash: "hash" }) } as any),
      loadConfig: () => ({ ...TEST_CONFIG, tokenId: undefined }),
      stderr,
      stdout: createMemoryStream(),
    });

    expect(exitCode).toBe(1);
    expect(stderr.toString()).toContain("Missing token ID");
  });

  it("runs dev start, stop, and reset using the provided environment helper", async () => {
    const start = vi.fn().mockResolvedValue(undefined);
    const stop = vi.fn().mockResolvedValue(undefined);
    const reset = vi.fn().mockResolvedValue(undefined);
    const status = vi.fn().mockResolvedValue(undefined);
    const createDevEnvironment = vi.fn(() => ({ start, stop, reset, status }));

    await expect(
      runCli(["dev", "start"], {
        createClient: () => ({}) as any,
        createDevEnvironment,
        loadConfig: () => TEST_CONFIG,
        stderr: createMemoryStream(),
        stdout: createMemoryStream(),
      }),
    ).resolves.toBe(0);

    await expect(
      runCli(["dev", "stop"], {
        createClient: () => ({}) as any,
        createDevEnvironment,
        loadConfig: () => TEST_CONFIG,
        stderr: createMemoryStream(),
        stdout: createMemoryStream(),
      }),
    ).resolves.toBe(0);

    await expect(
      runCli(["dev", "reset"], {
        createClient: () => ({}) as any,
        createDevEnvironment,
        loadConfig: () => TEST_CONFIG,
        stderr: createMemoryStream(),
        stdout: createMemoryStream(),
      }),
    ).resolves.toBe(0);

    expect(createDevEnvironment).toHaveBeenCalledTimes(3);
    expect(start).toHaveBeenCalledTimes(1);
    expect(stop).toHaveBeenCalledTimes(1);
    expect(reset).toHaveBeenCalledTimes(1);
  });

  it("runs local dev status without requiring ILN config", async () => {
    const stdout = createMemoryStream();
    const status = vi.fn().mockResolvedValue(undefined);
    const loadConfig = vi.fn(() => {
      throw new Error("config should not be loaded");
    });

    const exitCode = await runCli(["dev", "status"], {
      createClient: () => ({}) as any,
      createDevEnvironment: () => ({
        reset: vi.fn(),
        start: vi.fn(),
        status,
        stop: vi.fn(),
      }),
      loadConfig,
      stderr: createMemoryStream(),
      stdout,
    });

    expect(exitCode).toBe(0);
    expect(status).toHaveBeenCalledTimes(1);
    expect(loadConfig).not.toHaveBeenCalled();
  });

  it("decodes ScVal XDR without requiring ILN config", async () => {
    const stdout = createMemoryStream();
    const loadConfig = vi.fn(() => {
      throw new Error("config should not be loaded");
    });

    const exitCode = await runCli(
      [
        "xdr",
        "decode",
        "AAAAEQAAAAEAAAADAAAADgAAAAZhbW91bnQAAAAAAAUAAAAAO5rKAAAAAA4AAAACaWQAAAAAAAUAAAAAAAAAKgAAAA4AAAAGc3RhdHVzAAAAAAAOAAAABkZ1bmRlZAAA",
      ],
      {
        createClient: () => ({}) as any,
        loadConfig,
        stderr: createMemoryStream(),
        stdout,
      },
    );

    expect(exitCode).toBe(0);
    expect(loadConfig).not.toHaveBeenCalled();
    expect(stdout.toString()).toContain('"amount": "1000000000"');
    expect(stdout.toString()).toContain('"status": "Funded"');
  });

  it("checks SDK compatibility and passes when compatible", async () => {
    const stdout = createMemoryStream();
    const client = {
      getVersion: vi.fn().mockResolvedValue("1.0.0"),
    };
    vi.spyOn(sdk, "checkCompatibility").mockImplementation(async (fn: (method: string) => Promise<unknown>) => {
      const sdkVersion = "1.0.0";
      const contractVersion = (await fn("get_version")) as string;
      return { sdkVersion, contractVersion, compatible: true, issues: [] };
    });

    const exitCode = await runCli(["compat", "check"], {
      createClient: () => client as any,
      loadConfig: () => TEST_CONFIG,
      stderr: createMemoryStream(),
      stdout,
    });

    expect(exitCode).toBe(0);
    expect(stdout.toString()).toContain("SDK Version:      1.0.0");
    expect(stdout.toString()).toContain("Contract Version: 1.0.0");
    expect(stdout.toString()).toContain("success Compatibility check passed!");
  });

  it("fails compatibility check and prints issues", async () => {
    const stdout = createMemoryStream();
    const client = {
      getVersion: vi.fn().mockResolvedValue("2.0.0"),
    };
    vi.spyOn(sdk, "checkCompatibility").mockImplementation(async () => {
      return {
        sdkVersion: "1.0.0",
        contractVersion: "2.0.0",
        compatible: false,
        issues: ["Method mismatch", "Type mismatch"],
      };
    });

    const exitCode = await runCli(["compat", "check"], {
      createClient: () => client as any,
      loadConfig: () => TEST_CONFIG,
      stderr: createMemoryStream(),
      stdout,
    });

    expect(exitCode).toBe(1);
    expect(stdout.toString()).toContain("Compatibility check failed!");
    expect(stdout.toString()).toContain(" - Method mismatch");
    expect(stdout.toString()).toContain(" - Type mismatch");
  });

  it("rejects invalid dev seed count and token values", async () => {
    const stderr = createMemoryStream();

    const exitCode = await runCli(["dev", "seed", "--count", "0"], {
      createClient: () => ({}) as any,
      loadConfig: () => TEST_CONFIG,
      stderr,
      stdout: createMemoryStream(),
    });

    expect(exitCode).toBe(1);
    expect(stderr.toString()).toContain("--count must be a positive integer");

    const stderr2 = createMemoryStream();
    const exitCode2 = await runCli(["dev", "seed", "--token", "INVALID"], {
      createClient: () => ({}) as any,
      loadConfig: () => TEST_CONFIG,
      stderr: stderr2,
      stdout: createMemoryStream(),
    });

    expect(exitCode2).toBe(1);
    expect(stderr2.toString()).toContain("Invalid token");
  });
});

function createMemoryStream(): Writable & { toString(): string } {
  let output = "";
  return Object.assign(
    new Writable({
      write(chunk, _encoding, callback) {
        output += chunk.toString();
        callback();
      },
    }),
    {
      toString() {
        return output;
      },
    },
  );
}

function createListedInvoice(
  overrides: Partial<ListedInvoice> & Pick<ListedInvoice, "id" | "role" | "status">,
): ListedInvoice {
  const { id, role, status, ...rest } = overrides;
  return {
    amount: 1_000_000_000n,
    amountFunded: 0n,
    discountRate: 300,
    dueDate: 1_767_225_599,
    freelancer: validAddress(),
    fundedAt: null,
    funder: null,
    id,
    payer: validAddress("B"),
    role,
    status,
    token: "CTOKEN",
    ...rest,
  };
}

function validAddress(seed = "A"): string {
  return Keypair.random().publicKey();
}
