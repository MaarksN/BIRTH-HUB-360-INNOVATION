"use client";

import { Play } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

import { runWorkflow } from "../../lib/product-api";

export function RunWorkflowButton({ workflowId }: Readonly<{ workflowId: string }>) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [isPending, startWorkflowTransition] = useTransition();

  return (
    <div style={{ display: "grid", gap: "0.4rem" }}>
      <button
        className="action-button"
        disabled={isPending}
        onClick={() => {
          setError(null);
          startWorkflowTransition(() => {
            void runWorkflow(workflowId)
              .then((payload) => {
                router.push(`/workflows/${workflowId}/runs?executionId=${encodeURIComponent(payload.executionId)}`);
              })
              .catch((workflowError) => {
                setError(
                  workflowError instanceof Error ? workflowError.message : "Falha ao disparar workflow."
                );
              });
          });
        }}
        type="button"
      >
        <Play size={14} />
        {isPending ? "Executando..." : "Executar agora"}
      </button>
      {error ? <small style={{ color: "#9d0208" }}>{error}</small> : null}
    </div>
  );
}

