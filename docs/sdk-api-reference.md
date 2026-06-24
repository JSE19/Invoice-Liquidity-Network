# SDK API Reference

## Overview

This page contains the auto-generated API reference for the `@iln/sdk` package. The documentation is generated from TypeScript source code using [TypeDoc](https://typedoc.org/).

## Generating the API Reference

To regenerate the API reference documentation:

```bash
cd sdk
pnpm docs:generate
```

This outputs the generated documentation to `docs/sdk-api/`.

## Included Modules

### Types
Core TypeScript interfaces and types used throughout the SDK, including invoice parameters, protocol configuration, and signer interfaces.

### Client
The main `ILNSdk` class for interacting with the Invoice Liquidity Network contract. Includes methods for submitting, funding, paying, and querying invoices.

### Analytics
The `AnalyticsSDK` class for protocol statistics and analytics, plus computational utilities for yield projections, risk assessment, portfolio allocation, and historical performance analysis.

### Notifications
SDK utilities for notification subscription management.

## Key Exports

| Export | Description |
|--------|-------------|
| `ILNSdk` | Main SDK client for contract interactions |
| `AnalyticsSDK` | Analytics and protocol statistics client |
| `calculateYieldProjection` | Yield projection calculator |
| `calculateRiskScore` | Risk score calculator |
| `calculatePortfolioAllocation` | Portfolio allocation analyzer |
| `calculateHistoricalPerformance` | Historical performance tracker |
| `compareMetrics` | Comparison utilities |

## Usage

```typescript
import {
  ILNSdk,
  AnalyticsSDK,
  calculateYieldProjection,
  calculateRiskScore,
  calculatePortfolioAllocation,
  calculateHistoricalPerformance,
  compareMetrics,
} from "@iln/sdk";
```

## Notes

- API documentation is auto-generated from JSDoc comments and TypeScript type annotations
- The generation process excludes test files and internal modules
- Run `pnpm docs:generate` in the `sdk/` directory after any source changes
