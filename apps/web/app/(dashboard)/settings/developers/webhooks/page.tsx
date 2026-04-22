"use client";

import { useMemo } from "react";

import { getStoredSession } from "../../../../../lib/auth-client";
import { useDeveloperWebhooksModel } from "./page.model";
import {
  UnauthenticatedState,
  WebhookDeliveryHistory,
  WebhookEndpointForm,
  WebhookEndpointList
} from "./page.sections";

export default function DeveloperWebhooksPage() {
  const session = useMemo(() => getStoredSession(), []);
  const model = useDeveloperWebhooksModel(Boolean(session));

  if (!session) {
    return <UnauthenticatedState />;
  }

  return (
    <main style={{ display: "grid", gap: "1rem", padding: "1.5rem" }}>
      <section className="hero-card">
        <span className="badge">Developer Settings</span>
        <h1>Webhooks outbound assinados</h1>
        <p style={{ marginBottom: 0 }}>
          Cadastre endpoints por tenant, acompanhe historico de entrega e reenvie cargas com o
          payload exato.
        </p>
      </section>

      <WebhookEndpointForm
        onCreate={() => {
          void model.createEndpoint();
        }}
        onReload={() => {
          void model.reloadEndpoints();
        }}
        onTopicsChange={model.setTopics}
        onUrlChange={model.setUrl}
        saving={model.saving}
        topics={model.topics}
        url={model.url}
      />

      <section
        style={{
          display: "grid",
          gap: "1rem",
          gridTemplateColumns: "minmax(320px, 1.1fr) minmax(340px, 1fr)"
        }}
      >
        <WebhookEndpointList
          endpoints={model.endpoints}
          loading={model.loading}
          onSelect={model.selectEndpoint}
          onToggleStatus={(endpoint) => {
            void model.toggleEndpointStatus(endpoint);
          }}
          selectedId={model.selectedId}
        />
        <WebhookDeliveryHistory
          deliveries={model.deliveries}
          onRetry={(delivery) => {
            void model.retryDelivery(delivery);
          }}
          selectedId={model.selectedId}
        />
      </section>

      {model.error ? <p style={{ color: "#9b2f2f", margin: 0 }}>{model.error}</p> : null}
    </main>
  );
}
