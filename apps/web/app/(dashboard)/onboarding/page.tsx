"use client";

import { useEffect, useState, useTransition } from "react";
import Link from "next/link";

import {
  ProductEmptyState,
  ProductPageHeader
} from "../../../components/dashboard/page-fragments";
import { fetchWithSession } from "../../../lib/auth-client";
import { updateOnboardingState } from "../../../lib/product-api";

type OnboardingPayload = {
  enabled: boolean;
  items: Array<{
    complete: boolean;
    ctaHref: string;
    ctaLabel: string;
    description: string;
    id: string;
    title: string;
  }>;
  nextHref: string;
  progress: number;
};

export default function OnboardingPage() {
  const [state, setState] = useState<OnboardingPayload | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    void fetchWithSession("/api/v1/dashboard/onboarding", {
      cache: "no-store"
    })
      .then(async (response) => {
        if (!response.ok) {
          throw new Error(`Falha ao carregar onboarding (${response.status}).`);
        }

        setState((await response.json()) as OnboardingPayload);
      })
      .catch((loadError) => {
        setError(loadError instanceof Error ? loadError.message : "Falha ao carregar onboarding.");
      });
  }, []);

  if (!state && !error) {
    return (
      <main className="dashboard-content">
        <section className="panel">
          <p style={{ color: "var(--muted)", margin: 0 }}>Montando checklist inicial...</p>
        </section>
      </main>
    );
  }

  return (
    <main className="dashboard-content">
      <ProductPageHeader
        actions={
          <div className="hero-actions">
            {state?.enabled ? (
              <button
                className="ghost-button"
                disabled={isPending}
                onClick={() => {
                  startTransition(() => {
                    void updateOnboardingState(false)
                      .then(() => {
                        setState((current) => (current ? { ...current, enabled: false } : current));
                      })
                      .catch((mutationError) => {
                        setError(
                          mutationError instanceof Error
                            ? mutationError.message
                            : "Falha ao ocultar onboarding."
                        );
                      });
                  });
                }}
                type="button"
              >
                {isPending ? "Salvando..." : "Ocultar onboarding"}
              </button>
            ) : (
              <button
                className="action-button"
                disabled={isPending}
                onClick={() => {
                  startTransition(() => {
                    void updateOnboardingState(true)
                      .then(() => {
                        setState((current) => (current ? { ...current, enabled: true } : current));
                      })
                      .catch((mutationError) => {
                        setError(
                          mutationError instanceof Error
                            ? mutationError.message
                            : "Falha ao reativar onboarding."
                        );
                      });
                  });
                }}
                type="button"
              >
                {isPending ? "Salvando..." : "Reativar onboarding"}
              </button>
            )}
            {state ? (
              <Link className="ghost-button" href={state.nextHref}>
                Ir para proximo passo
              </Link>
            ) : null}
          </div>
        }
        badge="Onboarding"
        description="Checklist guiado, persistido por organizacao, para acompanhar a ativacao das jornadas principais do produto."
        title="Primeiros passos sem improviso"
      />

      {error ? (
        <section className="panel empty-state">
          <strong>Falha ao carregar onboarding</strong>
          <p>{error}</p>
        </section>
      ) : null}

      {state && !state.enabled ? (
        <ProductEmptyState
          description="O onboarding desta organizacao foi ocultado. Voce pode reativar quando quiser."
          title="Onboarding pausado"
        />
      ) : null}

      {state?.enabled ? (
        <>
          <section className="stats-grid">
            <article>
              <span className="badge">Progresso</span>
              <strong>{state.progress}%</strong>
            </article>
            <article>
              <span className="badge">Passos concluidos</span>
              <strong>{state.items.filter((item) => item.complete).length}</strong>
            </article>
            <article>
              <span className="badge">Restantes</span>
              <strong>{state.items.filter((item) => !item.complete).length}</strong>
            </article>
          </section>

          <section
            style={{
              display: "grid",
              gap: "1rem",
              gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))"
            }}
          >
            {state.items.map((item) => (
              <article className="panel" key={item.id}>
                <span className="badge">{item.complete ? "Concluido" : "Pendente"}</span>
                <h2>{item.title}</h2>
                <p style={{ color: "var(--muted)" }}>{item.description}</p>
                <Link className={item.complete ? "ghost-button" : "action-button"} href={item.ctaHref}>
                  {item.ctaLabel}
                </Link>
              </article>
            ))}
          </section>
        </>
      ) : null}
    </main>
  );
}

