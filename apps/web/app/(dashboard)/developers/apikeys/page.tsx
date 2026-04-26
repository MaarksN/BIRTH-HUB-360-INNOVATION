"use client";

import { useEffect, useState } from "react";

import { fetchWithSession } from "../../../../lib/auth-client";

type ApiKeyScope = "agents:read" | "agents:write" | "workflows:trigger" | "webhooks:receive";

interface ApiKeyItem {
  createdAt: string;
  id: string;
  label: string;
  last4: string;
  scopes: ApiKeyScope[];
  status: "ACTIVE" | "REVOKED";
}

interface ApiKeyMutationResponse {
  apiKey: string;
  id: string;
}

const allScopes: ApiKeyScope[] = [
  "agents:read",
  "agents:write",
  "workflows:trigger",
  "webhooks:receive"
];

export default function ApiKeysPage() {
  const [items, setItems] = useState<ApiKeyItem[]>([]);
  const [label, setLabel] = useState("Integration Key");
  const [scopes, setScopes] = useState<ApiKeyScope[]>(["agents:read"]);
  const [createdKey, setCreatedKey] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);
  const [activeItemId, setActiveItemId] = useState<string | null>(null);

  const load = async () => {
    setError(null);
    setIsLoading(true);

    try {
      const response = await fetchWithSession("/api/v1/apikeys", {
        cache: "no-store"
      });

      if (!response.ok) {
        throw new Error(`Falha ao carregar API keys (${response.status})`);
      }

      const payload = (await response.json()) as { items: ApiKeyItem[] };
      setItems(payload.items);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "Falha ao carregar API keys.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    void load();
  }, []);

  const createKey = async () => {
    setError(null);
    setNotice(null);
    setIsCreating(true);

    try {
      const response = await fetchWithSession("/api/v1/apikeys", {
        body: JSON.stringify({ label, scopes }),
        headers: {
          "content-type": "application/json"
        },
        method: "POST"
      });

      if (!response.ok) {
        throw new Error(`Falha ao criar key (${response.status})`);
      }

      const payload = (await response.json()) as ApiKeyMutationResponse;
      setCreatedKey(payload.apiKey);
      setNotice("API key criada. Ela so sera exibida uma vez.");
      await load();
    } catch (createError) {
      setError(createError instanceof Error ? createError.message : "Falha ao criar API key.");
    } finally {
      setIsCreating(false);
    }
  };

  const rotateKey = async (id: string) => {
    setError(null);
    setNotice(null);
    setActiveItemId(id);

    try {
      const response = await fetchWithSession(`/api/v1/apikeys/${id}/rotate`, {
        method: "POST"
      });

      if (!response.ok) {
        throw new Error(`Falha ao rotacionar key (${response.status})`);
      }

      const payload = (await response.json()) as ApiKeyMutationResponse;
      setCreatedKey(payload.apiKey);
      setNotice("API key rotacionada. Guarde a nova chave imediatamente.");
      await load();
    } catch (rotateError) {
      setError(rotateError instanceof Error ? rotateError.message : "Falha ao rotacionar API key.");
    } finally {
      setActiveItemId(null);
    }
  };

  const revokeKey = async (id: string) => {
    if (!window.confirm("Revogar esta API key imediatamente?")) {
      return;
    }

    setError(null);
    setNotice(null);
    setActiveItemId(id);

    try {
      const response = await fetchWithSession(`/api/v1/apikeys/${id}`, {
        method: "DELETE"
      });

      if (!response.ok) {
        throw new Error(`Falha ao revogar key (${response.status})`);
      }

      setNotice("API key revogada.");
      await load();
    } catch (revokeError) {
      setError(revokeError instanceof Error ? revokeError.message : "Falha ao revogar API key.");
    } finally {
      setActiveItemId(null);
    }
  };

  return (
    <section style={{ display: "grid", gap: "1rem" }}>
      <header>
        <h1 style={{ margin: 0 }}>API Keys</h1>
        <p style={{ color: "var(--muted)", margin: "0.35rem 0 0" }}>
          Chaves prefixadas `bh360_live_` com criação, rotação (grace 24h) e revogação imediata.
        </p>
      </header>

      <article
        style={{
          background: "var(--card)",
          border: "1px solid var(--border)",
          borderRadius: "1rem",
          display: "grid",
          gap: "0.75rem",
          padding: "1rem"
        }}
      >
        <strong>Criar nova API key</strong>
        <input aria-label="Nome da API key" onChange={(event) => setLabel(event.target.value)} value={label} />
        <div style={{ display: "flex", flexWrap: "wrap", gap: "0.5rem" }}>
          {allScopes.map((scope) => (
            <label key={scope} style={{ alignItems: "center", display: "flex", gap: "0.35rem" }}>
              <input
                checked={scopes.includes(scope)}
                onChange={(event) =>
                  setScopes((current) =>
                    event.target.checked
                      ? [...new Set([...current, scope])]
                      : current.filter((currentScope) => currentScope !== scope)
                  )
                }
                type="checkbox"
              />
              {scope}
            </label>
          ))}
        </div>
        <button disabled={isCreating || isLoading} onClick={() => void createKey()} type="button">
          {isCreating ? "Criando..." : "Criar key"}
        </button>
        {createdKey ? (
          <p style={{ margin: 0 }}>
            <strong>Exibida uma unica vez:</strong> <code>{createdKey}</code>
          </p>
        ) : null}
      </article>

      {notice ? <p style={{ color: "var(--accent-strong)", margin: 0 }}>{notice}</p> : null}
      {error ? <p style={{ color: "#a11d2d", margin: 0 }}>{error}</p> : null}
      {isLoading ? <p>Carregando...</p> : null}

      <div style={{ border: "1px solid var(--border)", borderRadius: "1rem", overflow: "hidden" }}>
        <table style={{ borderCollapse: "collapse", width: "100%" }}>
          <thead>
            <tr>
              <th align="left" style={{ padding: "0.75rem" }}>
                Label
              </th>
              <th align="left" style={{ padding: "0.75rem" }}>
                Ultimos 4
              </th>
              <th align="left" style={{ padding: "0.75rem" }}>
                Scopes
              </th>
              <th align="left" style={{ padding: "0.75rem" }}>
                Status
              </th>
              <th align="left" style={{ padding: "0.75rem" }}>
                Acoes
              </th>
            </tr>
          </thead>
          <tbody>
            {!isLoading && items.length === 0 ? (
              <tr>
                <td colSpan={5} style={{ borderTop: "1px solid var(--border)", padding: "0.75rem" }}>
                  Nenhuma API key cadastrada para este tenant.
                </td>
              </tr>
            ) : null}
            {items.map((item) => {
              const isMutating = activeItemId === item.id;

              return (
                <tr key={item.id}>
                  <td style={{ borderTop: "1px solid var(--border)", padding: "0.75rem" }}>{item.label}</td>
                  <td style={{ borderTop: "1px solid var(--border)", padding: "0.75rem" }}>{item.last4}</td>
                  <td style={{ borderTop: "1px solid var(--border)", padding: "0.75rem" }}>
                    {item.scopes.join(", ")}
                  </td>
                  <td style={{ borderTop: "1px solid var(--border)", padding: "0.75rem" }}>{item.status}</td>
                  <td style={{ borderTop: "1px solid var(--border)", padding: "0.75rem" }}>
                    <div style={{ display: "flex", gap: "0.5rem" }}>
                      <button disabled={isMutating || isCreating} onClick={() => void rotateKey(item.id)} type="button">
                        {isMutating ? "Processando..." : "Rotate"}
                      </button>
                      <button disabled={isMutating || isCreating} onClick={() => void revokeKey(item.id)} type="button">
                        {isMutating ? "Processando..." : "Revoke"}
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </section>
  );
}
