"use client";

import { useEffect, useState } from "react";

import { fetchWithSession } from "../../../../lib/auth-client";
import { useThemeMode } from "../../../../providers/ThemeProvider";

interface SessionItem {
  id: string;
  ipAddress: string | null;
  lastActivityAt: string;
  userAgent: string | null;
}

export default function SecuritySessionsPage() {
  const [sessions, setSessions] = useState<SessionItem[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { mode, setMode } = useThemeMode();

  const loadSessions = async () => {
    try {
      setError(null);
      setIsLoading(true);

      const response = await fetchWithSession("/api/bff/api/v1/sessions");

      if (!response.ok) {
        throw new Error(`Falha ao carregar sessoes (${response.status})`);
      }

      const payload = (await response.json()) as { items: SessionItem[] };
      setSessions(payload.items);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "Falha ao carregar sessoes.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    void loadSessions();
  }, []);

  const revokeSession = async (sessionId: string) => {
    await fetchWithSession(`/api/bff/api/v1/sessions/${sessionId}`, {
      method: "DELETE"
    });
    await loadSessions();
  };

  const logoutAll = async () => {
    await fetchWithSession("/api/bff/api/v1/sessions/logout-all", {
      method: "POST"
    });
    await loadSessions();
  };

  return (
    <section style={{ display: "grid", gap: "1rem" }}>
      <div
        style={{
          background:
            "radial-gradient(circle at top right, rgba(125, 215, 194, 0.18), transparent 36%), var(--surface-panel-strong)",
          border: "1px solid var(--border)",
          borderRadius: "1.25rem",
          display: "grid",
          gap: "1rem",
          padding: "1rem"
        }}
      >
        <div>
          <h2 style={{ margin: 0 }}>Tema do painel</h2>
          <p style={{ color: "var(--muted)", margin: "0.35rem 0 0" }}>
            Alterne entre o visual claro e escuro com o mesmo estilo glass grow aplicado ao dashboard.
          </p>
        </div>

        <div
          style={{
            display: "grid",
            gap: "0.9rem",
            gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))"
          }}
        >
          {[
            {
              description: "Mais luminosidade para leitura executiva e contexto comercial.",
              label: "Tema claro",
              mode: "light" as const,
              preview:
                "linear-gradient(145deg, rgba(255,255,255,0.96), rgba(224, 245, 240, 0.88))"
            },
            {
              description: "Mais contraste para analise densa e operacao continua.",
              label: "Tema escuro",
              mode: "dark" as const,
              preview:
                "linear-gradient(145deg, rgba(6, 18, 25, 0.96), rgba(14, 38, 50, 0.88))"
            }
          ].map((option) => (
            <button
              key={option.mode}
              onClick={() => setMode(option.mode)}
              style={{
                background: "var(--surface-panel)",
                border: mode === option.mode ? "1px solid var(--accent)" : "1px solid var(--border)",
                borderRadius: "1.25rem",
                cursor: "pointer",
                display: "grid",
                gap: "0.75rem",
                padding: "1rem",
                textAlign: "left"
              }}
              type="button"
            >
              <div
                style={{
                  background: option.preview,
                  border: "1px solid rgba(255,255,255,0.12)",
                  borderRadius: "1rem",
                  display: "grid",
                  gap: "0.55rem",
                  minHeight: 120,
                  padding: "0.85rem"
                }}
              >
                <span
                  style={{
                    background: option.mode === "dark" ? "rgba(255,255,255,0.1)" : "rgba(24,122,115,0.1)",
                    borderRadius: 999,
                    height: 12,
                    width: "42%"
                  }}
                />
                <span
                  style={{
                    background: option.mode === "dark" ? "rgba(255,255,255,0.08)" : "rgba(24,122,115,0.08)",
                    borderRadius: 20,
                    flex: 1
                  }}
                />
                <div style={{ display: "grid", gap: "0.45rem", gridTemplateColumns: "repeat(3, 1fr)" }}>
                  <span
                    style={{
                      background:
                        option.mode === "dark" ? "rgba(103, 215, 192, 0.14)" : "rgba(24,122,115,0.12)",
                      borderRadius: 16,
                      minHeight: 32
                    }}
                  />
                  <span
                    style={{
                      background:
                        option.mode === "dark" ? "rgba(14, 165, 233, 0.16)" : "rgba(14,165,233,0.1)",
                      borderRadius: 16,
                      minHeight: 32
                    }}
                  />
                  <span
                    style={{
                      background:
                        option.mode === "dark" ? "rgba(249, 115, 22, 0.16)" : "rgba(249,115,22,0.12)",
                      borderRadius: 16,
                      minHeight: 32
                    }}
                  />
                </div>
              </div>

              <div style={{ display: "grid", gap: "0.25rem" }}>
                <strong>{option.label}</strong>
                <span style={{ color: "var(--muted)" }}>{option.description}</span>
              </div>
            </button>
          ))}
        </div>
      </div>

      <header style={{ alignItems: "center", display: "flex", justifyContent: "space-between" }}>
        <div>
          <h1 style={{ margin: 0 }}>Sessoes ativas</h1>
          <p style={{ color: "var(--muted)", margin: "0.35rem 0 0" }}>
            Device, IP e ultima atividade com revogacao individual e global.
          </p>
        </div>
        <button onClick={() => void logoutAll()} type="button">
          Sign out from all devices
        </button>
      </header>

      {error ? <p style={{ color: "#a11d2d", margin: 0 }}>{error}</p> : null}
      {isLoading ? <p>Carregando...</p> : null}

      {!isLoading ? (
        <div style={{ border: "1px solid var(--border)", borderRadius: "1rem", overflow: "hidden" }}>
          <table style={{ borderCollapse: "collapse", width: "100%" }}>
            <thead>
              <tr>
                <th align="left" style={{ padding: "0.75rem" }}>
                  Device
                </th>
                <th align="left" style={{ padding: "0.75rem" }}>
                  IP
                </th>
                <th align="left" style={{ padding: "0.75rem" }}>
                  Ultima atividade
                </th>
                <th align="left" style={{ padding: "0.75rem" }}>
                  Acao
                </th>
              </tr>
            </thead>
            <tbody>
              {sessions.map((session) => (
                <tr key={session.id}>
                  <td style={{ borderTop: "1px solid var(--border)", padding: "0.75rem" }}>
                    {session.userAgent ?? "Desconhecido"}
                  </td>
                  <td style={{ borderTop: "1px solid var(--border)", padding: "0.75rem" }}>
                    {session.ipAddress ?? "N/A"}
                  </td>
                  <td style={{ borderTop: "1px solid var(--border)", padding: "0.75rem" }}>
                    {new Date(session.lastActivityAt).toLocaleString("pt-BR")}
                  </td>
                  <td style={{ borderTop: "1px solid var(--border)", padding: "0.75rem" }}>
                    <button onClick={() => void revokeSession(session.id)} type="button">
                      Revogar
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : null}
    </section>
  );
}
