import http from "k6/http";
import { check, sleep } from "k6";
import { textSummary } from "https://jslib.k6.io/k6-summary/0.0.2/index.js";

/**
 * Load test for the ILN Indexer API.
 * Closes #47
 */

const BASE_URL = __ENV.BASE_URL || "http://localhost:8080";

export const options = {
  scenarios: {
    // Scenario 1: 50 concurrent users hitting pending invoices for 30s
    pending_invoices: {
      executor: "constant-vus",
      vus: 50,
      duration: "30s",
      exec: "getPendingInvoices",
    },
    // Scenario 2: 100 concurrent users hitting a single invoice for 30s
    single_invoice: {
      executor: "constant-vus",
      vus: 100,
      duration: "30s",
      exec: "getSingleInvoice",
    },
    // Scenario 3: Ramp up from 1 to 200 users over 60 seconds
    ramp_up: {
      executor: "ramping-vus",
      startVUs: 1,
      stages: [{ duration: "60s", target: 200 }],
      exec: "getSingleInvoice",
    },
  },
  thresholds: {
    // p95 response time under 200ms
    http_req_duration: ["p(95)<200"],
    // error rate under 1%
    http_req_failed: ["rate<0.01"],
  },
};

export function getPendingInvoices() {
  const res = http.get(`${BASE_URL}/invoices?status=Pending`);
  check(res, {
    "status is 200": (r) => r.status === 200,
  });
  sleep(1);
}

export function getSingleInvoice() {
  // Using invoice ID 1 as a placeholder for testing
  const res = http.get(`${BASE_URL}/invoice/1`);
  check(res, {
    "status is 200": (r) => r.status === 200,
  });
  sleep(1);
}

/**
 * Generates a summary report in JSON format saved to tests/load/results/
 */
export function handleSummary(data) {
  return {
    stdout: textSummary(data, { indent: " ", enableColors: true }),
    "tests/load/results/summary.json": JSON.stringify(data),
  };
}
