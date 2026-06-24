import type { CompatibilityResult } from "./types";
export declare const SDK_VERSION = "0.1.0";
export declare const MIN_CONTRACT_VERSION = "0.1.0";
/**
 * Parses a semantic version string into a tuple of [major, minor, patch].
 * Tolerates leading "v" or pre-release suffixes (e.g. "v1.2.3-beta.1" -> [1, 2, 3]).
 */
export declare function parseVersion(version: string): [number, number, number];
/**
 * Checks compatibility between the SDK and a deployed contract.
 * Calls `get_version` using the provided invoke function.
 *
 * @param invoke The function used to call the contract methods (e.g. invoke("get_version"))
 */
export declare function checkCompatibility(invoke: (method: string) => Promise<any>): Promise<CompatibilityResult>;
//# sourceMappingURL=compatibility.d.ts.map