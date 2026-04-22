"use client";

import { Plus } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

import { createStarterWorkflow } from "../../lib/product-api";

export function CreateWorkflowButton() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [isPending, startCreationTransition] = useTransition();

  return (
    <div style={{ display: "grid", gap: "0.4rem" }}>
      <button
        className="action-button"
        disabled={isPending}
        onClick={() => {
          setError(null);
          startCreationTransition(() => {
            void createStarterWorkflow()
              .then((payload) => {
                router.push(`/workflows/${payload.workflow.id}/edit`);
              })
              .catch((creationError) => {
                setError(
                  creationError instanceof Error
                    ? creationError.message
                    : "Falha ao criar workflow inicial."
                );
              });
          });
        }}
        type="button"
      >
        <Plus size={14} />
        {isPending ? "Criando..." : "Novo workflow"}
      </button>
      {error ? <small style={{ color: "#9d0208" }}>{error}</small> : null}
    </div>
  );
}

