import {
  ProductEmptyState
} from "../../../components/dashboard/page-fragments";
import type {
  ConversationDetail,
  ConversationFiltersState,
  ConversationListItem
} from "./conversation.types";

type ConversationListProps = {
  error: string | null;
  filters: ConversationFiltersState;
  loadingList: boolean;
  newConversation: { initialMessage: string; subject: string };
  items: ConversationListItem[];
  onFilterChange: (field: keyof ConversationFiltersState, value: string) => void;
  onNewConversationChange: (field: "subject" | "initialMessage", value: string) => void;
  onSelectThread: (id: string) => void;
  selectedId: string;
};

export function ConversationListPanel(props: ConversationListProps) {
  const {
    error,
    filters,
    loadingList,
    newConversation,
    items,
    onFilterChange,
    onNewConversationChange,
    onSelectThread,
    selectedId
  } = props;

  return (
    <aside className="panel" style={{ display: "grid", gap: "0.85rem", alignContent: "start" }}>
      <div style={{ display: "grid", gap: "0.6rem" }}>
        <input
          onChange={(event) => onFilterChange("q", event.target.value)}
          placeholder="Buscar por assunto ou mensagem"
          value={filters.q}
        />
        <select
          onChange={(event) => onFilterChange("status", event.target.value)}
          value={filters.status}
        >
          <option value="">Todos os status</option>
          <option value="open">open</option>
          <option value="pending">pending</option>
          <option value="resolved">resolved</option>
        </select>
        <select
          onChange={(event) => onFilterChange("channel", event.target.value)}
          value={filters.channel}
        >
          <option value="">Todos os canais</option>
          <option value="internal">internal</option>
          <option value="whatsapp">whatsapp</option>
          <option value="email">email</option>
        </select>
      </div>

      <div style={{ display: "grid", gap: "0.55rem" }}>
        <input
          onChange={(event) => onNewConversationChange("subject", event.target.value)}
          placeholder="Assunto da nova thread"
          value={newConversation.subject}
        />
        <textarea
          onChange={(event) => onNewConversationChange("initialMessage", event.target.value)}
          placeholder="Mensagem inicial opcional"
          value={newConversation.initialMessage}
        />
      </div>

      {error ? (
        <div className="empty-state">
          <strong>Falha operacional</strong>
          <p>{error}</p>
        </div>
      ) : null}

      {loadingList ? <p style={{ color: "var(--muted)", margin: 0 }}>Carregando threads...</p> : null}

      {!loadingList && items.length === 0 ? (
        <ProductEmptyState
          description="Nenhuma thread encontrada para os filtros atuais."
          title="Sem conversas"
        />
      ) : (
        <div style={{ display: "grid", gap: "0.65rem" }}>
          {items.map((item) => (
            <button
              key={item.id}
              onClick={() => onSelectThread(item.id)}
              style={{
                background: selectedId === item.id ? "rgba(30, 58, 138, 0.08)" : "transparent",
                border: "1px solid var(--border)",
                borderRadius: 20,
                color: "inherit",
                display: "grid",
                gap: "0.3rem",
                padding: "0.85rem",
                textAlign: "left"
              }}
              type="button"
            >
              <strong>{item.subject ?? `Thread ${item.id.slice(0, 8)}`}</strong>
              <span style={{ color: "var(--muted)" }}>
                {item.channel} · {item.status} · {item.messageCount} mensagens
              </span>
              <span>{item.lastMessagePreview ?? "Sem preview ainda."}</span>
            </button>
          ))}
        </div>
      )}
    </aside>
  );
}

type ConversationDetailProps = {
  composer: string;
  detail: ConversationDetail | null;
  loadingDetail: boolean;
  onComposerChange: (value: string) => void;
  onPublishNote: () => void;
  onStatusChange: (conversationId: string, status: string) => void;
  selectedSummary: ConversationListItem | null;
};

export function ConversationDetailPanel(props: ConversationDetailProps) {
  const {
    composer,
    detail,
    loadingDetail,
    onComposerChange,
    onPublishNote,
    onStatusChange,
    selectedSummary
  } = props;

  return (
    <section className="panel" style={{ display: "grid", gap: "0.85rem", alignContent: "start" }}>
      {!selectedSummary ? (
        <ProductEmptyState
          description="Escolha uma thread na coluna lateral para abrir o contexto completo."
          title="Nenhuma conversa selecionada"
        />
      ) : loadingDetail ? (
        <p style={{ color: "var(--muted)", margin: 0 }}>Carregando detalhe da conversa...</p>
      ) : detail ? (
        <>
          <div
            style={{
              alignItems: "center",
              display: "flex",
              flexWrap: "wrap",
              gap: "0.75rem",
              justifyContent: "space-between"
            }}
          >
            <div style={{ display: "grid", gap: "0.25rem" }}>
              <h2 style={{ marginBottom: 0 }}>{detail.subject ?? "Thread sem assunto"}</h2>
              <span style={{ color: "var(--muted)" }}>
                {detail.channel} · atualizada em {new Date(detail.updatedAt).toLocaleString("pt-BR")}
              </span>
            </div>
            <select onChange={(event) => onStatusChange(detail.id, event.target.value)} value={detail.status}>
              <option value="open">open</option>
              <option value="pending">pending</option>
              <option value="resolved">resolved</option>
            </select>
          </div>

          <div style={{ display: "grid", gap: "0.75rem" }}>
            {detail.messages.length === 0 ? (
              <ProductEmptyState
                description="Ainda nao ha mensagens registradas nesta thread."
                title="Thread sem mensagens"
              />
            ) : (
              detail.messages.map((message) => (
                <article
                  key={message.id}
                  style={{
                    background:
                      message.direction === "internal" ? "rgba(30, 58, 138, 0.08)" : "rgba(255,255,255,0.48)",
                    border: "1px solid var(--border)",
                    borderRadius: 18,
                    display: "grid",
                    gap: "0.4rem",
                    padding: "0.85rem"
                  }}
                >
                  <div
                    style={{
                      alignItems: "center",
                      display: "flex",
                      justifyContent: "space-between"
                    }}
                  >
                    <strong>{message.role ?? message.direction}</strong>
                    <span style={{ color: "var(--muted)" }}>
                      {new Date(message.createdAt).toLocaleString("pt-BR")}
                    </span>
                  </div>
                  <pre
                    style={{
                      margin: 0,
                      overflowX: "auto",
                      whiteSpace: "pre-wrap"
                    }}
                  >
                    {message.content}
                  </pre>
                </article>
              ))
            )}
          </div>

          <div style={{ display: "grid", gap: "0.65rem" }}>
            <textarea
              onChange={(event) => onComposerChange(event.target.value)}
              placeholder="Registrar nota interna"
              value={composer}
            />
            <button
              className="action-button"
              onClick={onPublishNote}
              type="button"
            >
              Publicar nota
            </button>
          </div>
        </>
      ) : null}
    </section>
  );
}
