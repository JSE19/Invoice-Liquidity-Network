import React, { useState } from "react";
import { ILNSdk } from "./client";
import { createFreighterSigner, ILN_TESTNET } from "./signers";
export function CheckoutWidget({ orderId, amount, token, merchantAddress, sdkConfig, onSuccess, onError, }) {
    const [status, setStatus] = useState("idle");
    const [errorMsg, setErrorMsg] = useState(null);
    async function handlePay() {
        setStatus("connecting");
        setErrorMsg(null);
        try {
            const signer = createFreighterSigner();
            const funder = await signer.getPublicKey();
            setStatus("submitting");
            const sdk = new ILNSdk({
                ...ILN_TESTNET,
                ...sdkConfig,
                signer,
            });
            await sdk.fundInvoice({ funder, invoiceId: orderId });
            setStatus("success");
            onSuccess?.(orderId, funder);
        }
        catch (err) {
            const error = err instanceof Error ? err : new Error(String(err));
            setStatus("error");
            setErrorMsg(error.message);
            onError?.(error);
        }
    }
    return (React.createElement("div", { style: styles.container },
        React.createElement("p", { style: styles.summary },
            "Pay",
            " ",
            React.createElement("strong", null,
                amount,
                " ",
                token),
            " ",
            "to ",
            React.createElement("code", { style: styles.address },
                merchantAddress.slice(0, 8),
                "\u2026")),
        status === "error" && (React.createElement("p", { style: styles.error, role: "alert" }, errorMsg)),
        status === "success" ? (React.createElement("p", { style: styles.success }, "Payment submitted \u2713")) : (React.createElement("button", { style: styles.button, onClick: handlePay, disabled: status === "connecting" || status === "submitting", "aria-busy": status === "connecting" || status === "submitting" }, status === "connecting"
            ? "Connecting wallet…"
            : status === "submitting"
                ? "Submitting…"
                : `Pay ${amount} ${token}`))));
}
const styles = {
    container: {
        fontFamily: "sans-serif",
        border: "1px solid #e2e8f0",
        borderRadius: 8,
        padding: "1.25rem 1.5rem",
        maxWidth: 360,
        boxSizing: "border-box",
    },
    summary: { margin: "0 0 1rem", fontSize: 15 },
    address: { fontSize: 13, background: "#f1f5f9", padding: "1px 4px", borderRadius: 4 },
    button: {
        width: "100%",
        padding: "0.625rem 1rem",
        background: "#6366f1",
        color: "#fff",
        border: "none",
        borderRadius: 6,
        fontSize: 15,
        cursor: "pointer",
    },
    success: { margin: 0, color: "#16a34a", fontWeight: 600 },
    error: { margin: "0 0 0.75rem", color: "#dc2626", fontSize: 13 },
};
