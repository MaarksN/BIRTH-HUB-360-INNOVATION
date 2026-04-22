import Link from "next/link";

import {
  EXECUTIVE_PREMIUM_SHARED_LAYER_COUNT,
  type ExecutivePremiumResultLike
} from "../../lib/executive-premium";

type ExecutivePremiumMetric = {
  description?: string;
  label: string;
  value: string;
};

type ExecutivePremiumAction = {
  href: string;
  label: string;
  tone?: "ghost" | "primary";
};

type ExecutivePremiumCardAction = {
  href: (item: ExecutivePremiumResultLike) => string;
  label: string;
  tone?: "accent" | "primary";
};

export function ExecutivePremiumSpotlight(props: {
  badge?: string;
  cardAction: ExecutivePremiumCardAction;
  cardBadge?: string;
  cardMeta: (item: ExecutivePremiumResultLike) => string;
  cardSecondaryAction?: ExecutivePremiumCardAction;
  cardSubhead?: (item: ExecutivePremiumResultLike) => string | null;
  description: string;
  eyebrow?: string;
  metrics?: ExecutivePremiumMetric[];
  primaryAction?: ExecutivePremiumAction;
  results: ExecutivePremiumResultLike[];
  secondaryAction?: ExecutivePremiumAction;
  summaryItems?: string[];
  title: string;
}) {
  if (props.results.length === 0) {
    return null;
  }

  return (
    <section
      style={{
        background: "linear-gradient(135deg, rgba(15,23,42,0.96), rgba(30,58,138,0.92))",
        border: "1px solid rgba(148, 163, 184, 0.26)",
        borderRadius: 20,
        color: "#f8fafc",
        display: "grid",
        gap: "1rem",
        padding: "1.1rem"
      }}
    >
      <div className="dashboard-panel__header">
        <div className="dashboard-panel__copy" style={{ gap: "0.35rem" }}>
          {props.eyebrow ? (
            <small style={{ letterSpacing: "0.08em", opacity: 0.8, textTransform: "uppercase" }}>
              {props.eyebrow}
            </small>
          ) : null}
          {props.badge ? (
            <span
              className="badge"
              style={{
                background: "rgba(255,255,255,0.12)",
                borderColor: "rgba(255,255,255,0.18)",
                color: "#f8fafc"
              }}
            >
              {props.badge}
            </span>
          ) : null}
          <h2 style={{ margin: 0 }}>{props.title}</h2>
          <p style={{ color: "rgba(248,250,252,0.86)", margin: 0 }}>{props.description}</p>
        </div>

        {props.primaryAction || props.secondaryAction ? (
          <div className="hero-actions">
            {props.primaryAction ? (
              <Link href={props.primaryAction.href}>{props.primaryAction.label}</Link>
            ) : null}
            {props.secondaryAction ? (
              <Link
                className={props.secondaryAction.tone === "ghost" ? "ghost-button" : undefined}
                href={props.secondaryAction.href}
              >
                {props.secondaryAction.label}
              </Link>
            ) : null}
          </div>
        ) : null}
      </div>

      {props.metrics?.length ? (
        <section className="stats-grid dashboard-stats-grid">
          {props.metrics.map((metric) => (
            <article key={metric.label}>
              <span className="badge">{metric.label}</span>
              <strong>{metric.value}</strong>
              {metric.description ? (
                <p
                  className="dashboard-muted dashboard-muted--compact"
                  style={{ color: "rgba(248,250,252,0.72)" }}
                >
                  {metric.description}
                </p>
              ) : null}
            </article>
          ))}
        </section>
      ) : (
        <div style={{ display: "flex", flexWrap: "wrap", gap: "0.6rem" }}>
          {(props.summaryItems ?? [`${props.results.length} agentes premium`, `${EXECUTIVE_PREMIUM_SHARED_LAYER_COUNT} camadas premium`]).map(
            (item) => (
              <span
                key={item}
                style={{
                  background: "rgba(255,255,255,0.12)",
                  border: "1px solid rgba(255,255,255,0.18)",
                  borderRadius: 999,
                  padding: "0.35rem 0.75rem"
                }}
              >
                {item}
              </span>
            )
          )}
        </div>
      )}

      <div
        style={{
          display: "grid",
          gap: "0.8rem",
          gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))"
        }}
      >
        {props.results.map((item) => {
          const subhead = props.cardSubhead?.(item) ?? null;

          return (
            <article
              key={item.agent.id}
              style={{
                background: "rgba(255,255,255,0.12)",
                border: "1px solid rgba(255,255,255,0.14)",
                borderRadius: 16,
                display: "grid",
                gap: "0.45rem",
                padding: "0.95rem"
              }}
            >
              <strong>{item.agent.name}</strong>
              {props.cardBadge ? (
                <small
                  style={{
                    color: "#bfdbfe",
                    fontWeight: 700,
                    letterSpacing: "0.05em",
                    textTransform: "uppercase"
                  }}
                >
                  {props.cardBadge}
                </small>
              ) : null}
              {subhead ? <small style={{ opacity: 0.8 }}>{subhead}</small> : null}
              <p style={{ margin: 0, opacity: 0.92 }}>{item.agent.description}</p>
              <small style={{ opacity: 0.76 }}>{props.cardMeta(item)}</small>
              <div style={{ display: "flex", flexWrap: "wrap", gap: "0.5rem" }}>
                <Link href={props.cardAction.href(item)}>{props.cardAction.label}</Link>
                {props.cardSecondaryAction ? (
                  <Link
                    href={props.cardSecondaryAction.href(item)}
                    style={{
                      color:
                        props.cardSecondaryAction.tone === "accent" ? "#bfdbfe" : "#f8fafc"
                    }}
                  >
                    {props.cardSecondaryAction.label}
                  </Link>
                ) : null}
              </div>
            </article>
          );
        })}
      </div>
    </section>
  );
}
