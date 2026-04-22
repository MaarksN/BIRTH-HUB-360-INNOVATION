import { getWebConfig } from "@birthub/config/web";
import Link from "next/link";

import {
  ProductEmptyState,
  ProductPageHeader
} from "../../../components/dashboard/page-fragments";
import { fetchProductJson } from "../../../lib/product-api.server";

type ExecutivePayload = {
  metrics: {
    arrCents: number;
    churnRate: number;
    mrrCents: number;
    trialConversionRate: number;
  };
};

type CohortPayload = {
  items: Array<{
    cohortMonth: string;
    cohortSize: number;
    retainedM1: number;
    retainedM2: number;
    retainedM3: number;
  }>;
};

type ActivePayload = {
  metrics: {
    dau: number;
    mau: number;
  };
};

type UsagePayload = {
  items: Array<{
    label?: string;
    metric?: string;
    value?: number;
  }>;
};

function toPercent(value: number): string {
  return `${(value * 100).toFixed(1)}%`;
}

function toCurrency(cents: number): string {
  return new Intl.NumberFormat("pt-BR", {
    currency: "USD",
    style: "currency"
  }).format(cents / 100);
}

export default async function AnalyticsPage() {
  const config = getWebConfig();
  const [executive, cohort, active, usage] = await Promise.all([
    fetchProductJson<ExecutivePayload>("/api/v1/analytics/executive"),
    fetchProductJson<CohortPayload>("/api/v1/analytics/cohort"),
    fetchProductJson<ActivePayload>("/api/v1/analytics/active-tenants"),
    fetchProductJson<UsagePayload>("/api/v1/analytics/usage")
  ]);

  const lineHeights =
    cohort.items.length === 0
      ? [20, 35, 30, 46, 40]
      : (() => {
          const max = Math.max(1, ...cohort.items.map((item) => item.cohortSize));
          return cohort.items.map((item) => Math.max(8, Math.round((item.cohortSize / max) * 100)));
        })();

  return (
    <main className="dashboard-content">
      <ProductPageHeader
        actions={
          <div className="hero-actions">
            <a href={`${config.NEXT_PUBLIC_API_URL}/api/v1/analytics/billing/export`}>Exportar CSV</a>
            <Link className="ghost-button" href="/reports">
              Ir para reports
            </Link>
          </div>
        }
        badge="Analytics"
        description="Leitura operacional de monetizacao, coortes e atividade para acompanhar uso real da plataforma."
        title="Metricas que ajudam a decidir"
      />

      <section className="stats-grid">
        <article>
          <span className="badge">MRR</span>
          <strong>{toCurrency(executive.metrics.mrrCents)}</strong>
        </article>
        <article>
          <span className="badge">ARR</span>
          <strong>{toCurrency(executive.metrics.arrCents)}</strong>
        </article>
        <article>
          <span className="badge">Churn</span>
          <strong>{toPercent(executive.metrics.churnRate)}</strong>
        </article>
        <article>
          <span className="badge">Trial conversion</span>
          <strong>{toPercent(executive.metrics.trialConversionRate)}</strong>
        </article>
        <article>
          <span className="badge">DAU / MAU</span>
          <strong>
            {active.metrics.dau.toLocaleString("pt-BR")} / {active.metrics.mau.toLocaleString("pt-BR")}
          </strong>
        </article>
      </section>

      <section
        style={{
          display: "grid",
          gap: "1rem",
          gridTemplateColumns: "minmax(0, 1fr) minmax(0, 1fr)"
        }}
      >
        <article className="panel">
          <h2>Tendencia por coorte</h2>
          <div className="trend-bars" aria-hidden="true">
            {lineHeights.map((height, index) => (
              <span key={index} style={{ height: `${height}%` }} />
            ))}
          </div>
        </article>

        <article className="panel">
          <h2>Uso agregado</h2>
          {usage.items.length === 0 ? (
            <ProductEmptyState
              description="Ainda nao ha metricas de uso disponiveis para o tenant ativo."
              title="Sem uso agregado"
            />
          ) : (
            <div style={{ display: "grid", gap: "0.75rem" }}>
              {usage.items.map((item, index) => (
                <div
                  key={`${item.metric ?? item.label ?? "usage"}-${index}`}
                  style={{
                    border: "1px solid var(--border)",
                    borderRadius: 18,
                    display: "grid",
                    gap: "0.25rem",
                    padding: "0.85rem"
                  }}
                >
                  <strong>{item.label ?? item.metric ?? "Metrica"}</strong>
                  <span style={{ color: "var(--muted)" }}>
                    {(item.value ?? 0).toLocaleString("pt-BR")}
                  </span>
                </div>
              ))}
            </div>
          )}
        </article>
      </section>

      <section className="panel">
        <h2>Retencao por coorte</h2>
        {cohort.items.length === 0 ? (
          <ProductEmptyState
            description="Assim que houver coortes suficientes, a tabela de retencao aparecera aqui."
            title="Sem coortes suficientes"
          />
        ) : (
          <div className="table-wrapper">
            <table className="table">
              <thead>
                <tr>
                  <th>Coorte</th>
                  <th>Tamanho</th>
                  <th>M+1</th>
                  <th>M+2</th>
                  <th>M+3</th>
                </tr>
              </thead>
              <tbody>
                {cohort.items.map((item) => (
                  <tr key={item.cohortMonth}>
                    <td>
                      {new Date(item.cohortMonth).toLocaleDateString("pt-BR", {
                        month: "short",
                        year: "numeric"
                      })}
                    </td>
                    <td>{item.cohortSize}</td>
                    <td>{item.retainedM1}</td>
                    <td>{item.retainedM2}</td>
                    <td>{item.retainedM3}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </main>
  );
}

