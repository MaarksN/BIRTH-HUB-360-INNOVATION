"use client";

export function RouteErrorView(input: {
  description: string;
  reset: () => void;
  title: string;
}) {
  return (
    <main className="dashboard-content">
      <section className="panel empty-state">
        <strong>{input.title}</strong>
        <p>{input.description}</p>
        <button className="action-button" onClick={input.reset} type="button">
          Tentar novamente
        </button>
      </section>
    </main>
  );
}

