"use client";

import React, { createContext, useContext, useState, useCallback, ReactNode, useRef } from "react";
import Toast from "../components/Toast";

export type ToastType = "pending" | "success" | "error";

export interface ToastMessage {
  id: string;
  type: ToastType;
  title: string;
  message?: string;
  txHash?: string;
}

interface ToastContextType {
  addToast: (toast: Omit<ToastMessage, "id">) => string;
  updateToast: (id: string, updates: Partial<Omit<ToastMessage, "id">>) => void;
  removeToast: (id: string) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastMessage[]>([]);
  const timers = useRef<{ [key: string]: NodeJS.Timeout }>({});

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id));
    if (timers.current[id]) {
      clearTimeout(timers.current[id]);
      delete timers.current[id];
    }
  }, []);

  const addToast = useCallback((toast: Omit<ToastMessage, "id">) => {
    const id = Math.random().toString(36).substring(2, 9);
    setToasts((prev) => [...prev, { ...toast, id }]);
    
    // Only auto-dismiss if not pending
    if (toast.type !== "pending") {
      timers.current[id] = setTimeout(() => {
        removeToast(id);
      }, 6000);
    }
    
    return id;
  }, [removeToast]);

  const updateToast = useCallback((id: string, updates: Partial<Omit<ToastMessage, "id">>) => {
    setToasts((prev) =>
      prev.map((toast) => (toast.id === id ? { ...toast, ...updates } : toast))
    );

    // If updated to success or error, start the 6s timer
    if (updates.type && updates.type !== "pending") {
      if (timers.current[id]) clearTimeout(timers.current[id]);
      timers.current[id] = setTimeout(() => {
        removeToast(id);
      }, 6000);
    }
  }, [removeToast]);

  return (
    <ToastContext.Provider value={{ addToast, updateToast, removeToast }}>
      {children}
      <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2">
        {toasts.map((toast) => (
          <Toast key={toast.id} toast={toast} onClose={() => removeToast(toast.id)} />
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (context === undefined) {
    throw new Error("useToast must be used within a ToastProvider");
  }
  return context;
}
