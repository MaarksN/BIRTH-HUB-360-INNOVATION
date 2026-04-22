"use client";

import React, { useEffect, useRef, useState, useTransition, type FormEvent } from "react";

import { fetchWithTimeout } from "@birthub/utils/fetch";
import { persistStoredSession } from "../lib/auth-client";
import { useUserPreferencesStore } from "../stores/user-preferences-store";

export interface LoginFormProps {
  initialRequestId: string;
  navigate?: (href: string) => void;
}

type LoginFormContentProps = Readonly<{
  initialRequestId: string;
  navigate: (href: string) => void;
}>;

const LOGIN_REQUEST_TIMEOUT_MS = 8_000;

interface AuthenticatedSessionPayload {
  csrfToken: string;
  refreshToken: string;
  tenantId: string;
  token: string;
  userId: string;
}

interface AuthProxyPayload {
  challengeExpiresAt?: string;
  challengeToken?: string;
  mfaRequired: boolean;
  session?: AuthenticatedSessionPayload;
}

interface MfaChallengeState {
  challengeExpiresAt: string | null;
  challengeToken: string;
}

function LoginFormContent({ initialRequestId, navigate }: LoginFormContentProps) {
  const [error, setError] = useState<string | null>(null);
  const [requestId] = useState(initialRequestId);
  const [result, setResult] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const submitControllerRef = useRef<AbortController | null>(null);
  const [formValues, setFormValues] = useState({
    email: "",
    password: "",
    tenantId: ""
  });
  const [mfaChallenge, setMfaChallenge] = useState<MfaChallengeState | null>(null);
  const [mfaValues, setMfaValues] = useState({
    recoveryCode: "",
    totpCode: ""
  });

  useEffect(() => {
    return () => {
      submitControllerRef.current?.abort();
    };
  }, []);

  async function finalizeAuthenticatedSession(session: AuthenticatedSessionPayload) {
    persistStoredSession({
      tenantId: session.tenantId,
      userId: session.userId
    });

    setMfaChallenge(null);
    setMfaValues({
      recoveryCode: "",
      totpCode: ""
    });
    await useUserPreferencesStore.getState().hydrate();
    setResult(`Sessao criada para ${session.userId}`);
    navigate("/dashboard");
  }

  function buildMfaBody(challenge: MfaChallengeState): string {
    const recoveryCode = mfaValues.recoveryCode.trim();
    const totpCode = mfaValues.totpCode.trim();

    if (!recoveryCode && !totpCode) {
      throw new Error("Informe um codigo TOTP ou um recovery code.");
    }

    return JSON.stringify({
      challengeToken: challenge.challengeToken,
      ...(recoveryCode ? { recoveryCode } : {}),
      ...(totpCode ? { totpCode } : {})
    });
  }

  function resetMfaChallenge(): void {
    setMfaChallenge(null);
    setMfaValues({
      recoveryCode: "",
      totpCode: ""
    });
    setResult(null);
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setResult(null);

    const submit = async () => {
      submitControllerRef.current?.abort();
      const controller = new AbortController();
      submitControllerRef.current = controller;

      try {
        const response = await fetchWithTimeout(
          mfaChallenge ? "/api/auth/mfa" : "/api/auth/signin",
          {
            body: mfaChallenge ? buildMfaBody(mfaChallenge) : JSON.stringify(formValues),
            credentials: "include",
            headers: {
              "content-type": "application/json",
              "x-request-id": requestId
            },
            method: "POST",
            signal: controller.signal,
            timeoutMessage: `Falha ao autenticar dentro do limite de ${LOGIN_REQUEST_TIMEOUT_MS}ms.`,
            timeoutMs: LOGIN_REQUEST_TIMEOUT_MS
          }
        );

        if (!response.ok) {
          throw new Error(`Falha ao autenticar (${response.status})`);
        }

        const payload = (await response.json()) as AuthProxyPayload;

        if (payload.mfaRequired) {
          if (!payload.challengeToken) {
            throw new Error("A API exigiu MFA, mas nao retornou challengeToken.");
          }

          setMfaChallenge({
            challengeExpiresAt: payload.challengeExpiresAt ?? null,
            challengeToken: payload.challengeToken
          });
          setResult("MFA requerido. Informe um codigo TOTP ou um recovery code.");
          return;
        }

        if (!payload.session) {
          throw new Error("Sessao nao retornada pela API.");
        }

        await finalizeAuthenticatedSession(payload.session);
      } catch (submitError) {
        if (controller.signal.aborted) {
          return;
        }
        setError(submitError instanceof Error ? submitError.message : "Falha desconhecida.");
      } finally {
        if (submitControllerRef.current === controller) {
          submitControllerRef.current = null;
        }
      }
    };

    startTransition(() => {
      void submit();
    });
  }

  return (
    <section
      style={{
        display: "grid",
        gap: "1.5rem"
      }}
    >
      <header style={{ display: "grid", gap: "0.5rem" }}>
        <span
          style={{
            color: "var(--accent)",
            fontSize: "0.85rem",
            fontWeight: 700,
            letterSpacing: "0.08em",
            textTransform: "uppercase"
          }}
        >
          BirthHub360
        </span>
        <h1 style={{ fontSize: "clamp(2rem, 5vw, 3.5rem)", margin: 0 }}>Entrar na plataforma</h1>
        <p style={{ color: "var(--muted)", margin: 0 }}>
          O request ID desta sessao e propagado do browser para a API e o worker.
        </p>
      </header>

      <form
        onSubmit={handleSubmit}
        style={{
          background: "var(--card)",
          backdropFilter: "blur(12px)",
          border: "1px solid var(--border)",
          borderRadius: "1.5rem",
          boxShadow: "0 24px 80px rgba(19, 93, 102, 0.08)",
          display: "grid",
          gap: "1rem",
          padding: "1.5rem"
        }}
      >
        {mfaChallenge ? (
          <>
            <div
              style={{
                background: "rgba(19, 93, 102, 0.08)",
                border: "1px solid var(--border)",
                borderRadius: "1rem",
                display: "grid",
                gap: "0.35rem",
                padding: "0.9rem"
              }}
            >
              <strong>Validacao MFA em andamento</strong>
              <span style={{ color: "var(--muted)" }}>
                Use um codigo de 6 digitos do autenticador ou um recovery code.
              </span>
              {mfaChallenge.challengeExpiresAt ? (
                <small style={{ color: "var(--muted)" }}>
                  Expira em {new Date(mfaChallenge.challengeExpiresAt).toLocaleString("pt-BR")}.
                </small>
              ) : null}
            </div>
            <label style={{ display: "grid", gap: "0.35rem" }}>
              <span>Codigo TOTP</span>
              <input
                autoComplete="one-time-code"
                inputMode="numeric"
                maxLength={6}
                onChange={(event) =>
                  setMfaValues((current) => ({ ...current, totpCode: event.target.value }))
                }
                pattern="[0-9]{6}"
                placeholder="123456"
                type="text"
                value={mfaValues.totpCode}
              />
            </label>
            <label style={{ display: "grid", gap: "0.35rem" }}>
              <span>Recovery code</span>
              <input
                onChange={(event) =>
                  setMfaValues((current) => ({ ...current, recoveryCode: event.target.value }))
                }
                placeholder="Informe o recovery code se necessario"
                type="text"
                value={mfaValues.recoveryCode}
              />
            </label>
          </>
        ) : (
          <>
            <label style={{ display: "grid", gap: "0.35rem" }}>
              <span>Email</span>
              <input
                autoComplete="username"
                onChange={(event) =>
                  setFormValues((current) => ({ ...current, email: event.target.value }))
                }
                placeholder="voce@empresa.com"
                type="email"
                value={formValues.email}
              />
            </label>
            <label style={{ display: "grid", gap: "0.35rem" }}>
              <span>Senha</span>
              <input
                autoComplete="current-password"
                onChange={(event) =>
                  setFormValues((current) => ({ ...current, password: event.target.value }))
                }
                placeholder="Sua senha"
                type="password"
                value={formValues.password}
              />
            </label>
            <label style={{ display: "grid", gap: "0.35rem" }}>
              <span>Tenant</span>
              <input
                onChange={(event) =>
                  setFormValues((current) => ({ ...current, tenantId: event.target.value }))
                }
                placeholder="slug, tenantId ou organizationId"
                type="text"
                value={formValues.tenantId}
              />
            </label>
          </>
        )}
        <div
          style={{
            alignItems: "center",
            display: "flex",
            gap: "0.75rem",
            justifyContent: "space-between"
          }}
        >
          <code>{requestId}</code>
          <div style={{ display: "flex", gap: "0.75rem" }}>
            {mfaChallenge ? (
              <button onClick={resetMfaChallenge} type="button">
                Voltar
              </button>
            ) : null}
            <button
              disabled={isPending}
              style={{
                background: "var(--accent)",
                border: "none",
                borderRadius: "999px",
                color: "white",
                cursor: "pointer",
                fontWeight: 700,
                padding: "0.9rem 1.4rem"
              }}
              type="submit"
            >
              {isPending ? "Entrando..." : mfaChallenge ? "Validar MFA" : "Entrar"}
            </button>
          </div>
        </div>
        {error ? <p style={{ color: "#a11d2d", margin: 0 }}>{error}</p> : null}
        {result ? <p style={{ color: "var(--accent-strong)", margin: 0 }}>{result}</p> : null}
      </form>
    </section>
  );
}

export function LoginForm({ initialRequestId, navigate }: Readonly<LoginFormProps>) {
  if (navigate) {
    return (
      <LoginFormContent
        initialRequestId={initialRequestId}
        navigate={navigate}
      />
    );
  }

  return (
    <LoginFormContent
      initialRequestId={initialRequestId}
      navigate={(href) => {
        if (typeof window !== "undefined") {
          window.location.assign(href);
        }
      }}
    />
  );
}
