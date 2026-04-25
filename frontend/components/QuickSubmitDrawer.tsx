"use client";

import React, { useEffect, useRef } from "react";
import SubmitInvoiceForm from "./SubmitInvoiceForm";

interface QuickSubmitDrawerProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function QuickSubmitDrawer({ isOpen, onClose }: QuickSubmitDrawerProps) {
  const drawerRef = useRef<HTMLDivElement>(null);

  // Close on Escape key
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) onClose();
    };
    document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, [isOpen, onClose]);

  // Lock body scroll while open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  // Focus trap: focus the drawer when opened
  useEffect(() => {
    if (isOpen && drawerRef.current) {
      drawerRef.current.focus();
    }
  }, [isOpen]);

  return (
    <>
      {/* Backdrop */}
      <div
        aria-hidden="true"
        onClick={onClose}
        className={[
          "fixed inset-0 z-[70] bg-black/60 backdrop-blur-sm",
          "transition-opacity duration-300",
          isOpen ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none",
        ].join(" ")}
      />

      {/* Drawer panel */}
      <div
        ref={drawerRef}
        role="dialog"
        aria-modal="true"
        aria-label="Quick Invoice Submission"
        tabIndex={-1}
        className={[
          "fixed bottom-0 left-0 right-0 z-[80]",
          "max-h-[90dvh] overflow-y-auto",
          "rounded-t-[28px] shadow-2xl",
          "bg-background",
          "outline-none",
          "transition-transform duration-300 ease-out",
          isOpen ? "translate-y-0" : "translate-y-full",
        ].join(" ")}
      >
        {/* Header */}
        <div className="sticky top-0 z-10 flex items-center justify-between bg-background/80 backdrop-blur-sm px-6 pt-5 pb-3 border-b border-outline-variant/10">
          <div className="flex items-center gap-3">
            <span className="material-symbols-outlined text-primary text-[22px]" aria-hidden="true">
              receipt_long
            </span>
            <h2 className="text-lg font-bold">Quick Submit Invoice</h2>
          </div>
          <button
            id="fab-drawer-close"
            onClick={onClose}
            aria-label="Close drawer"
            className="p-2 rounded-full hover:bg-surface-container-high transition-colors text-on-surface-variant"
          >
            <span className="material-symbols-outlined text-[22px]">close</span>
          </button>
        </div>

        {/* Form */}
        <div className="p-4 sm:p-6 max-w-4xl mx-auto">
          <SubmitInvoiceForm />
        </div>
      </div>
    </>
  );
}
