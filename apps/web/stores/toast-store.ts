"use client";

import { create } from "zustand";

export type ToastTone = "critical" | "info" | "success";

export type ToastItem = {
  createdAt: number;
  description?: string;
  id: string;
  title: string;
  tone: ToastTone;
};

type ToastInput = {
  description?: string;
  durationMs?: number;
  title: string;
  tone?: ToastTone;
};

interface ToastState {
  clear: () => void;
  dismiss: (id: string) => void;
  items: ToastItem[];
  push: (input: ToastInput) => string;
}

function buildToastId(): string {
  return `toast_${Date.now()}_${Math.random().toString(16).slice(2, 8)}`;
}

export const useToastStore = create<ToastState>((set) => ({
  clear() {
    set({
      items: []
    });
  },
  dismiss(id) {
    set((state) => ({
      items: state.items.filter((item) => item.id !== id)
    }));
  },
  items: [],
  push(input) {
    const id = buildToastId();
    const item: ToastItem = {
      createdAt: Date.now(),
      id,
      ...(input.description === undefined ? {} : { description: input.description }),
      title: input.title,
      tone: input.tone ?? "info"
    };

    set((state) => ({
      items: [...state.items, item].slice(-5)
    }));

    if (typeof window !== "undefined") {
      const duration = input.durationMs ?? 4_800;
      window.setTimeout(() => {
        set((state) => ({
          items: state.items.filter((current) => current.id !== id)
        }));
      }, duration);
    }

    return id;
  }
}));
