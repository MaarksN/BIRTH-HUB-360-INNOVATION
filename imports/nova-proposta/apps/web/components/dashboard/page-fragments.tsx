import type { ReactNode } from "react";

export function ProductPageHeader(input: {
  actions?: ReactNode;
  badge: string;
  description: string;
  title: string;
}) {
  return (
    <section className="hero-card product-header">
      <div className="product-header__copy">
        <span className="badge">{input.badge}</span>
        <h1>{input.title}</h1>
        <p>{input.description}</p>
      </div>
      {input.actions ? <div className="product-header__actions">{input.actions}</div> : null}
    </section>
  );
}

export function ProductEmptyState(input: {
  action?: ReactNode;
  description: string;
  title: string;
}) {
  return (
    <section className="panel empty-state">
      <strong>{input.title}</strong>
      <p>{input.description}</p>
      {input.action}
    </section>
  );
}

export function ProductLoadingShell(input: {
  badge?: string;
  description: string;
  title: string;
}) {
  return (
    <main className="dashboard-content">
      <section className="hero-card product-header">
        <div className="product-header__copy">
          <span className="badge">{input.badge ?? "Carregando"}</span>
          <h1>{input.title}</h1>
          <p>{input.description}</p>
        </div>
      </section>
      <section className="panel product-skeleton-grid" aria-hidden="true">
        <span className="product-skeleton-card" />
        <span className="product-skeleton-card" />
        <span className="product-skeleton-card" />
      </section>
      <section className="panel product-skeleton-stack" aria-hidden="true">
        <span className="product-skeleton-line" />
        <span className="product-skeleton-line product-skeleton-line--short" />
        <span className="product-skeleton-line" />
      </section>
    </main>
  );
}

