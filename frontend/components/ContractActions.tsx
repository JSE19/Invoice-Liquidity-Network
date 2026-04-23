"use client";

import React from "react";
import { useToast } from "../context/ToastContext";

export default function ContractActions() {
  const { addToast, updateToast } = useToast();

  const handleAction = async (action: string, title: string) => {
    const toastId = addToast({ type: "pending", title: `${title}...` });
    try {
      // Simulate transaction delay
      await new Promise((resolve) => setTimeout(resolve, 2000));
      
      // Randomly succeed or fail for demo purposes
      if (Math.random() > 0.1) {
        updateToast(toastId, {
          type: "success",
          title: `${title} Successful`,
          txHash: Math.random().toString(16).substring(2, 15),
        });
      } else {
        throw new Error("Transaction rejected by network");
      }
    } catch (error) {
      updateToast(toastId, {
        type: "error",
        title: `${title} Failed`,
        message: error instanceof Error ? error.message : "An unknown error occurred",
      });
    }
  };

  return (
    <section className="bg-surface-container-lowest py-24 px-8 border-t border-outline-variant/10">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-headline mb-4">Protocol Interactions</h2>
          <p className="text-on-surface-variant max-w-2xl mx-auto">
            Test the transaction feedback system by simulating different contract
            interactions available on the ILN protocol.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          <ActionCard
            title="Pay Invoice"
            description="Simulate a payer settling an outstanding invoice with USDC."
            icon="payments"
            onClick={() => handleAction("pay", "Paying Invoice")}
          />
          <ActionCard
            title="Cancel Listing"
            description="Freelancer cancelling an unfunded invoice listing from the network."
            icon="cancel"
            onClick={() => handleAction("cancel", "Cancelling Listing")}
          />
          <ActionCard
            title="Claim Default"
            description="LP claiming the underlying collateral or insurance after a manual default."
            icon="gavel"
            onClick={() => handleAction("claim", "Claiming Default")}
          />
        </div>
      </div>
    </section>
  );
}

function ActionCard({
  title,
  description,
  icon,
  onClick,
}: {
  title: string;
  description: string;
  icon: string;
  onClick: () => void;
}) {
  return (
    <div className="bg-surface-container-low p-8 rounded-2xl border border-outline-variant/10 hover:border-primary/30 transition-all group">
      <div className="w-12 h-12 bg-primary-container rounded-xl flex items-center justify-center text-on-primary-container mb-6 group-hover:scale-110 transition-transform">
        <span className="material-symbols-outlined">{icon}</span>
      </div>
      <h3 className="text-xl font-bold mb-3">{title}</h3>
      <p className="text-on-surface-variant text-sm mb-8 leading-relaxed">
        {description}
      </p>
      <button
        onClick={onClick}
        className="w-full py-3 px-6 rounded-lg bg-surface-container-highest font-bold text-sm hover:bg-primary hover:text-surface-container-lowest transition-colors active:scale-95 duration-150"
      >
        Simulate Transaction
      </button>
    </div>
  );
}
