"use client";

import { useState, useTransition } from "react";

import { fetchWithSession } from "../../lib/auth-client";

type ManifestPolicy = {
  actions: string[];
  effect: string;
  id: string;
  name: string;
};

const POLICY_REQUEST_TIMEOUT_MS = 8_000;
const POLICY_TEMPLATES = ["standard", "readonly", "admin"] as const;

type ManagedPolicy = {
  actions: string[];
  effect: "allow" | "deny";
  enabled?: boolean;
  id: string;
  name: string;
  reason?: string;
};

export function PolicyManager({
  agentId,
  apiUrl,
  initialManagedPolicies,
  initialManifestPolicies,
  runtimeProvider
}: Readonly<{
  agentId: string;
  apiUrl: string;
  initialManagedPolicies: ManagedPolicy[];
  initialManifestPolicies: ManifestPolicy[];
  runtimeProvider: string;
}>) {
  const [managedPolicies, setManagedPolicies] = useState(initialManagedPolicies);
  const [name, setName] = useState("");
  const [actions, setActions] = useState("tool:execute");
  const [effect, setEffect] = useState<"allow" | "deny">("allow");
  const [reason, setReason] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  async function postJson<T>(path: string, method: "PATCH" | "POST", body: Record<string, unknown>): Promise<T> {
    const response = await fetchWithSession(`${apiUrl}${path}`, {
      body: JSON.stringify(body),
      headers: {
        "content-type": "application/json"
      },
      method,
      timeoutMessage: `Falha ao salvar policy dentro do limite de ${POLICY_REQUEST_TIMEOUT_MS}ms.`,
      timeoutMs: POLICY_REQUEST_TIMEOUT_MS
    });

    if (!response.ok) {
      throw new Error(`Falha ao salvar policy (${response.status}).`);
    }

    return (await response.json()) as T;
  }

  return (
    <section className="agent-stack">
      <div className="agent-panel">
        <div>
          <h2 className="agent-body-copy">Policies</h2>
          <p className="agent-muted">
            Runtime ativo: <strong>{runtimeProvider}</strong>. Policies do manifesto continuam visiveis e as managed policies abaixo passam a governar o runtime instalado.
          </p>
        </div>

        <div className="agent-toolbar">
          {POLICY_TEMPLATES.map((template) => (
            <button
              className="ghost-button"
              key={template}
              disabled={isPending}
              onClick={() => {
                setError(null);
                startTransition(() => {
                  void (async () => {
                    try {
                      const payload = await postJson<{ managedPolicies: ManagedPolicy[] }>(
                        `/api/v1/agents/installed/${agentId}/policies/templates`,
                        "POST",
                        {
                          replaceExisting: false,
                          template
                        }
                      );
                      setManagedPolicies(payload.managedPolicies);
                    } catch (templateError) {
                      setError(
                        templateError instanceof Error
                          ? templateError.message
                          : "Falha ao aplicar template."
                      );
                    }
                  })();
                });
              }}
              type="button"
            >
              Aplicar template {template}
            </button>
          ))}
        </div>
      </div>

      <div className="agent-panel">
        <h3 className="agent-body-copy">Managed Policies</h3>
        {managedPolicies.length === 0 ? (
          <p className="agent-empty-state agent-muted">
            Nenhuma managed policy criada ainda.
          </p>
        ) : null}
        {managedPolicies.map((policy) => (
          <article className="agent-panel agent-panel--compact" key={policy.id}>
            <div className="agent-panel__header">
              <strong>{policy.name}</strong>
              <button
                className="ghost-button"
                disabled={isPending}
                onClick={() => {
                  setError(null);
                  startTransition(() => {
                    void (async () => {
                      try {
                        const payload = await postJson<{ policy: ManagedPolicy }>(
                          `/api/v1/agents/installed/${agentId}/policies/${policy.id}`,
                          "PATCH",
                          {
                            enabled: !(policy.enabled ?? true)
                          }
                        );
                        setManagedPolicies((current) =>
                          current.map((item) => (item.id === policy.id ? payload.policy : item))
                        );
                      } catch (toggleError) {
                        setError(
                          toggleError instanceof Error
                            ? toggleError.message
                            : "Falha ao atualizar policy."
                        );
                      }
                    })();
                  });
                }}
                type="button"
              >
                {(policy.enabled ?? true) ? "Desativar" : "Ativar"}
              </button>
            </div>
            <small className="agent-muted">{policy.id}</small>
            <p className="agent-body-copy">
              <strong>{policy.effect}</strong> · {policy.actions.join(", ")}
            </p>
            {policy.reason ? <p className="agent-body-copy">{policy.reason}</p> : null}
          </article>
        ))}
      </div>

      <div className="agent-panel">
        <h3 className="agent-body-copy">Nova Managed Policy</h3>
        <label className="agent-field">
          <span>Nome</span>
          <input
            className="agent-input"
            onChange={(event) => setName(event.target.value)}
            value={name}
          />
        </label>
        <label className="agent-field">
          <span>Acoes (separadas por virgula)</span>
          <input
            className="agent-input"
            onChange={(event) => setActions(event.target.value)}
            value={actions}
          />
        </label>
        <label className="agent-field">
          <span>Efeito</span>
          <select
            className="agent-select"
            onChange={(event) => setEffect(event.target.value as "allow" | "deny")}
            value={effect}
          >
            <option value="allow">allow</option>
            <option value="deny">deny</option>
          </select>
        </label>
        <label className="agent-field">
          <span>Motivo</span>
          <textarea
            className="agent-textarea"
            onChange={(event) => setReason(event.target.value)}
            rows={4}
            value={reason}
          />
        </label>
        <button
          className="action-button"
          disabled={isPending || name.trim().length === 0}
          onClick={() => {
            setError(null);
            startTransition(() => {
              void (async () => {
                try {
                  const payload = await postJson<{ policy: ManagedPolicy }>(
                    `/api/v1/agents/installed/${agentId}/policies`,
                    "POST",
                    {
                      actions: actions
                        .split(",")
                        .map((item) => item.trim())
                        .filter(Boolean),
                      effect,
                      name,
                      ...(reason.trim() ? { reason } : {})
                    }
                  );
                  setManagedPolicies((current) => [...current, payload.policy]);
                  setName("");
                  setActions("tool:execute");
                  setEffect("allow");
                  setReason("");
                } catch (createError) {
                  setError(
                    createError instanceof Error
                      ? createError.message
                      : "Falha ao criar policy."
                  );
                }
              })();
            });
          }}
          type="button"
        >
          {isPending ? "Salvando..." : "Criar policy"}
        </button>
        {error ? <small className="agent-error-text">{error}</small> : null}
      </div>

      <div className="agent-panel">
        <h3 className="agent-body-copy">Policies do Manifesto</h3>
        {initialManifestPolicies.map((policy) => (
          <article className="agent-panel agent-panel--compact" key={policy.id}>
            <div className="agent-panel__header">
              <strong>{policy.name}</strong>
              <span>{policy.effect}</span>
            </div>
            <small className="agent-muted">{policy.id}</small>
            <p className="agent-body-copy">Acoes permitidas: {policy.actions.join(", ")}</p>
          </article>
        ))}
      </div>
    </section>
  );
}
