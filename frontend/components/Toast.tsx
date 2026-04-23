"use client";

import React from "react";
import type { ToastMessage } from "../context/ToastContext";

interface ToastProps {
  toast: ToastMessage;
  onClose: () => void;
}

export default function Toast({ toast, onClose }: ToastProps) {
  const { type, title, message, txHash } = toast;

  const isPending = type === "pending";
  const isSuccess = type === "success";
  const isError = type === "error";

  return (
    <div
      className={`min-w-[300px] p-4 rounded-lg shadow-lg border flex items-start gap-3 transition-all duration-300 transform translate-y-0 opacity-100 ${
        isSuccess
          ? "bg-[#e8f5e9] border-[#c8e6c9] text-[#2e7d32] dark:bg-[#1b5e20]/20 dark:border-[#2e7d32]/30 dark:text-[#81c784]"
          : isError
          ? "bg-[#ffebee] border-[#ffcdd2] text-[#c62828] dark:bg-[#b71c1c]/20 dark:border-[#c62828]/30 dark:text-[#e57373]"
          : "bg-surface-container-highest border-outline-variant/30 text-on-surface"
      }`}
    >
      <div className="mt-0.5 min-w-[24px]">
        {isPending && (
          <span className="material-symbols-outlined animate-spin text-primary">
            sync
          </span>
        )}
        {isSuccess && (
          <span className="material-symbols-outlined text-[#2e7d32] dark:text-[#81c784]">
            check_circle
          </span>
        )}
        {isError && (
          <span className="material-symbols-outlined text-[#c62828] dark:text-[#e57373]">
            error
          </span>
        )}
      </div>

      <div className="flex-1">
        <h4 className="font-bold text-sm tracking-wide">{title}</h4>
        {message && <p className="text-xs mt-1 opacity-90">{message}</p>}
        {txHash && (
          <a
            href={`https://stellar.expert/explorer/testnet/tx/${txHash}`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-[10px] underline mt-2 block opacity-80 hover:opacity-100 uppercase tracking-widest"
          >
            <span className="flex items-center gap-1">
              View on Stellar Expert
              <span className="material-symbols-outlined text-[10px]">open_in_new</span>
            </span>
          </a>
        )}
      </div>

      <button
        onClick={onClose}
        className="opacity-50 hover:opacity-100 transition-opacity ml-2"
        aria-label="Close toast"
      >
        <span className="material-symbols-outlined text-sm">close</span>
      </button>
    </div>
  );
}
