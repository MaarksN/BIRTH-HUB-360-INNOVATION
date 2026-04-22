"use client";

import { AlertTriangle, CheckCircle2, Info, X } from "lucide-react";

import { useToastStore, type ToastTone } from "../../stores/toast-store";

const toneIconMap: Record<ToastTone, typeof AlertTriangle> = {
  critical: AlertTriangle,
  info: Info,
  success: CheckCircle2
};

export function ToastViewport() {
  const items = useToastStore((state) => state.items);
  const dismiss = useToastStore((state) => state.dismiss);

  if (items.length === 0) {
    return null;
  }

  return (
    <div aria-atomic="true" aria-live="polite" className="toast-viewport" role="status">
      {items.map((item) => {
        const Icon = toneIconMap[item.tone];

        return (
          <article className="toast-card" data-tone={item.tone} key={item.id}>
            <div className="toast-card__icon">
              <Icon size={18} />
            </div>
            <div className="toast-card__copy">
              <strong>{item.title}</strong>
              {item.description ? <p>{item.description}</p> : null}
            </div>
            <button
              aria-label="Dismiss notification"
              className="toast-card__dismiss"
              onClick={() => dismiss(item.id)}
              type="button"
            >
              <X size={16} />
            </button>
          </article>
        );
      })}
    </div>
  );
}
