import React from "react";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, act, fireEvent } from "@testing-library/react";
import { ToastProvider, useToast } from "../context/ToastContext";

function TestComponent() {
  const { addToast, updateToast } = useToast();
  
  return (
    <div>
      <button
        onClick={() => {
          const id = addToast({ type: "pending", title: "Submitting tx..." });
          setTimeout(() => {
            updateToast(id, { type: "success", title: "Tx Confirmed", txHash: "0x123abc" });
          }, 1000);
        }}
      >
        Submit Tx
      </button>
      <button
        onClick={() => addToast({ type: "error", title: "Tx Failed", message: "User rejected" })}
      >
        Fail Tx
      </button>
    </div>
  );
}

describe("Toast System", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.clearAllTimers();
  });

  it("should render a pending toast and transition to success", () => {
    render(
      <ToastProvider>
        <TestComponent />
      </ToastProvider>
    );

    fireEvent.click(screen.getByText("Submit Tx"));
    
    expect(screen.getByText("Submitting tx...")).toBeInTheDocument();
    
    // Fast-forward 1 second for the update
    act(() => {
      vi.advanceTimersByTime(1000);
    });
    
    expect(screen.getByText("Tx Confirmed")).toBeInTheDocument();
    expect(screen.getByText(/View on Stellar Expert/)).toBeInTheDocument();
  });

  it("should render an error toast with a message", () => {
    render(
      <ToastProvider>
        <TestComponent />
      </ToastProvider>
    );

    fireEvent.click(screen.getByText("Fail Tx"));
    
    expect(screen.getByText("Tx Failed")).toBeInTheDocument();
    expect(screen.getByText("User rejected")).toBeInTheDocument();
  });

  it("should auto-dismiss toasts after 6 seconds", () => {
    render(
      <ToastProvider>
        <TestComponent />
      </ToastProvider>
    );

    fireEvent.click(screen.getByText("Fail Tx"));
    expect(screen.getByText("Tx Failed")).toBeInTheDocument();
    
    // Fast-forward 6 seconds
    act(() => {
      vi.advanceTimersByTime(6000);
    });
    
    expect(screen.queryByText("Tx Failed")).not.toBeInTheDocument();
  });
});
