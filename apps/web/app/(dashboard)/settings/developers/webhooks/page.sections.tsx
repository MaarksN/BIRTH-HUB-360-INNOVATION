import {
  defaultTopics,
  suggestedTopics,
  type WebhookDelivery,
  type WebhookEndpoint
} from "./page.data";

export function UnauthenticatedState() {
  return (
    <main style={{ padding: "1.5rem" }}>
      <div className="panel">
        <h1 style={{ marginTop: 0 }}>Webhooks outbound</h1>
        <p>Realize login como administrador para cadastrar endpoints assinados.</p>
      </div>
    </main>
  );
}

interface WebhookEndpointFormProps {
  onCreate: () => void;
  onReload: () => void;
  onTopicsChange: (value: string) => void;
  onUrlChange: (value: string) => void;
  saving: boolean;
  topics: string;
  url: string;
}

export function WebhookEndpointForm({
  onCreate,
  onReload,
  onTopicsChange,
  onUrlChange,
  saving,
  topics,
  url
}: Readonly<WebhookEndpointFormProps>) {
  return (
    <section className="panel">
      <div
        style={{
          alignItems: "center",
          display: "flex",
          flexWrap: "wrap",
          gap: "0.75rem",
          justifyContent: "space-between"
        }}
      >
        <div>
          <h2 style={{ marginTop: 0 }}>Novo endpoint</h2>
          <p style={{ color: "var(--muted)", marginBottom: 0 }}>
            Tente com {suggestedTopics.join(", ")} para cobrir eventos de engajamento.
          </p>
        </div>
        <button className="ghost-button" onClick={onReload} type="button">
          Recarregar
        </button>
      </div>

      <div
        style={{
          display: "grid",
          gap: "0.75rem",
          gridTemplateColumns: "2fr 1.4fr auto"
        }}
      >
        <input
          onChange={(event) => onUrlChange(event.target.value)}
          placeholder="https://cliente.example.com/webhooks/birthhub"
          type="url"
          value={url}
        />
        <input
          onChange={(event) => onTopicsChange(event.target.value)}
          placeholder={defaultTopics}
          type="text"
          value={topics}
        />
        <button
          className="action-button"
          disabled={saving || !url.trim()}
          onClick={onCreate}
          type="button"
        >
          Criar endpoint
        </button>
      </div>
    </section>
  );
}

interface WebhookEndpointListProps {
  endpoints: WebhookEndpoint[];
  loading: boolean;
  onSelect: (endpointId: string) => void;
  onToggleStatus: (endpoint: WebhookEndpoint) => void;
  selectedId: string | null;
}

export function WebhookEndpointList({
  endpoints,
  loading,
  onSelect,
  onToggleStatus,
  selectedId
}: Readonly<WebhookEndpointListProps>) {
  return (
    <div className="panel">
      <h2 style={{ marginTop: 0 }}>Endpoints cadastrados</h2>

      {loading ? <p>Carregando endpoints...</p> : null}

      <div style={{ display: "grid", gap: "0.75rem" }}>
        {endpoints.map((endpoint) => (
          <article
            key={endpoint.id}
            style={{
              background:
                selectedId === endpoint.id ? "rgba(30, 58, 138,0.08)" : "rgba(255,255,255,0.7)",
              border: "1px solid var(--border)",
              borderRadius: 18,
              display: "grid",
              gap: "0.45rem",
              padding: "0.9rem"
            }}
          >
            <div
              style={{
                alignItems: "center",
                display: "flex",
                gap: "0.65rem",
                justifyContent: "space-between"
              }}
            >
              <strong>{endpoint.url}</strong>
              <span
                className={`status-pill ${
                  endpoint.status === "ACTIVE" ? "status-green" : "status-red"
                }`}
              >
                {endpoint.status}
              </span>
            </div>
            <small style={{ color: "var(--muted)" }}>Topicos: {endpoint.topics.join(", ")}</small>
            <small style={{ color: "var(--muted)" }}>
              Secret: {endpoint.secret.slice(0, 6)}...{endpoint.secret.slice(-6)}
            </small>
            <small style={{ color: "var(--muted)" }}>
              Deliveries: {endpoint._count?.deliveries ?? 0}
            </small>
            <div style={{ display: "flex", flexWrap: "wrap", gap: "0.65rem" }}>
              <button className="ghost-button" onClick={() => onSelect(endpoint.id)} type="button">
                Ver historico
              </button>
              <button
                className={endpoint.status === "ACTIVE" ? "danger-button" : "action-button"}
                onClick={() => onToggleStatus(endpoint)}
                type="button"
              >
                {endpoint.status === "ACTIVE" ? "Desativar" : "Reativar"}
              </button>
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}

interface WebhookDeliveryHistoryProps {
  deliveries: WebhookDelivery[];
  onRetry: (delivery: WebhookDelivery) => void;
  selectedId: string | null;
}

export function WebhookDeliveryHistory({
  deliveries,
  onRetry,
  selectedId
}: Readonly<WebhookDeliveryHistoryProps>) {
  if (!selectedId) {
    return (
      <div className="panel">
        <h2 style={{ marginTop: 0 }}>Historico de entregas</h2>
        <p>Selecione um endpoint para ver o historico.</p>
      </div>
    );
  }

  return (
    <div className="panel">
      <h2 style={{ marginTop: 0 }}>Historico de entregas</h2>
      <div className="table-wrapper">
        <table className="table">
          <thead>
            <tr>
              <th>Quando</th>
              <th>Topico</th>
              <th>Status</th>
              <th>Tentativa</th>
              <th>Acao</th>
            </tr>
          </thead>
          <tbody>
            {deliveries.length === 0 ? (
              <tr>
                <td colSpan={5}>Nenhuma entrega registrada ainda.</td>
              </tr>
            ) : (
              deliveries.map((delivery) => (
                <tr key={delivery.id}>
                  <td>{new Date(delivery.createdAt).toLocaleString("pt-BR")}</td>
                  <td>{delivery.topic}</td>
                  <td>{delivery.responseStatus ?? "PENDENTE"}</td>
                  <td>{delivery.attempt}</td>
                  <td>
                    <button className="ghost-button" onClick={() => onRetry(delivery)} type="button">
                      Reenviar
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

