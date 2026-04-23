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
    <section className="executive-premium">
      <div className="dashboard-panel__header executive-premium__header">
        <div className="dashboard-panel__copy executive-premium__copy">
          {props.eyebrow ? (
            <small className="executive-premium__eyebrow">{props.eyebrow}</small>
          ) : null}
          {props.badge ? <span className="badge">{props.badge}</span> : null}
          <h2>{props.title}</h2>
          <p>{props.description}</p>
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
        <section className="stats-grid dashboard-stats-grid executive-premium__metrics">
          {props.metrics.map((metric) => (
            <article key={metric.label}>
              <span className="badge">{metric.label}</span>
              <strong>{metric.value}</strong>
              {metric.description ? <p className="dashboard-muted dashboard-muted--compact">{metric.description}</p> : null}
            </article>
          ))}
        </section>
      ) : (
        <div className="executive-premium__summary">
          {(props.summaryItems ?? [`${props.results.length} agentes premium`, `${EXECUTIVE_PREMIUM_SHARED_LAYER_COUNT} camadas premium`]).map(
            (item) => (
              <span className="executive-premium__summary-chip" key={item}>
                {item}
              </span>
            )
          )}
        </div>
      )}

      <div className="executive-premium__grid">
        {props.results.map((item) => {
          const subhead = props.cardSubhead?.(item) ?? null;

          return (
            <article className="executive-premium__card" key={item.agent.id}>
              <strong>{item.agent.name}</strong>
              {props.cardBadge ? (
                <small className="executive-premium__card-badge">{props.cardBadge}</small>
              ) : null}
              {subhead ? <small className="executive-premium__card-subhead">{subhead}</small> : null}
              <p>{item.agent.description}</p>
              <small className="executive-premium__card-meta">{props.cardMeta(item)}</small>
              <div className="executive-premium__card-actions">
                <Link href={props.cardAction.href(item)}>{props.cardAction.label}</Link>
                {props.cardSecondaryAction ? (
                  <Link
                    className={props.cardSecondaryAction.tone === "accent" ? "executive-premium__link--accent" : undefined}
                    href={props.cardSecondaryAction.href(item)}
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
