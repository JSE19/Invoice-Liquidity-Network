"use client";

import React, { useState } from "react";
import QuickSubmitDrawer from "./QuickSubmitDrawer";

interface FloatingActionButtonProps {
  /** If false, the FAB is hidden (e.g. on the submit page itself) */
  visible?: boolean;
}

export default function FloatingActionButton({ visible = true }: FloatingActionButtonProps) {
  const [isOpen, setIsOpen] = useState(false);

  if (!visible) return null;

  return (
    <>
      {/* FAB trigger button */}
      <button
        id="fab-quick-submit"
        aria-label="Quick submit invoice"
        onClick={() => setIsOpen(true)}
        className={[
          "fixed bottom-8 right-8 z-[60]",
          "flex items-center gap-2 pl-5 pr-6 py-4",
          "bg-primary text-surface-container-lowest",
          "rounded-full shadow-2xl",
          "font-bold text-sm",
          "hover:bg-primary/90 active:scale-95",
          "transition-all duration-200",
          "focus:outline-none focus:ring-4 focus:ring-primary/40",
        ].join(" ")}
      >
        <span className="material-symbols-outlined text-[22px]" aria-hidden="true">
          add
        </span>
        New Invoice
      </button>

      {/* Slide-up drawer */}
      <QuickSubmitDrawer isOpen={isOpen} onClose={() => setIsOpen(false)} />
    </>
  );
}
