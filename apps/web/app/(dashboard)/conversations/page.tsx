"use client";

import { useCallback, useDeferredValue, useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

import {
  ProductPageHeader
} from "../../../components/dashboard/page-fragments";
import {
  appendConversationNote,
  createConversation,
  fetchConversationDetail,
  fetchConversationList,
  updateConversationStatus
} from "../../../lib/product-api";
import {
  ConversationDetailPanel,
  ConversationListPanel
} from "./conversation-panels";
import type {
  ConversationDetail,
  ConversationFiltersState,
  ConversationListItem,
  FilterPayload
} from "./conversation.types";

function buildListFilters(filters: ConversationFiltersState, deferredQuery: string): FilterPayload {
  const nextFilters: FilterPayload = {};

  if (filters.channel) {
    nextFilters.channel = filters.channel;
  }

  if (deferredQuery) {
    nextFilters.q = deferredQuery;
  }

  if (filters.status) {
    nextFilters.status = filters.status;
  }

  return nextFilters;
}

async function loadConversationListState(options: {
  filters: FilterPayload;
  onSelectFirst: (id: string) => void;
  selectedId: string;
  setError: (value: string | null) => void;
  setItems: (items: ConversationListItem[]) => void;
  setLoading: (value: boolean) => void;
}): Promise<void> {
  const { filters, onSelectFirst, selectedId, setError, setItems, setLoading } = options;

  try {
    const payload = await fetchConversationList(filters);
    setItems(payload.items);

    if (!selectedId && payload.items[0]?.id) {
      onSelectFirst(payload.items[0].id);
    }
  } catch (loadError) {
    setError(loadError instanceof Error ? loadError.message : "Falha ao carregar conversas.");
  } finally {
    setLoading(false);
  }
}

async function loadConversationDetailState(options: {
  conversationId: string;
  setDetail: (value: ConversationDetail | null) => void;
  setError: (value: string | null) => void;
  setLoading: (value: boolean) => void;
}): Promise<void> {
  const { conversationId, setDetail, setError, setLoading } = options;

  try {
    const payload = await fetchConversationDetail(conversationId);
    setDetail(payload.conversation);
  } catch (loadError) {
    setError(loadError instanceof Error ? loadError.message : "Falha ao carregar conversa.");
  } finally {
    setLoading(false);
  }
}

export default function ConversationsPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [filters, setFilters] = useState<ConversationFiltersState>({
    channel: "",
    q: "",
    status: ""
  });
  const [items, setItems] = useState<ConversationListItem[]>([]);
  const [detail, setDetail] = useState<ConversationDetail | null>(null);
  const [loadingList, setLoadingList] = useState(true);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [composer, setComposer] = useState("");
  const [newConversation, setNewConversation] = useState({
    initialMessage: "",
    subject: ""
  });
  const selectedId = searchParams.get("thread") ?? "";
  const deferredQuery = useDeferredValue(filters.q);

  const handleSelectThread = useCallback(
    (id: string) => {
      router.replace(`/conversations?thread=${encodeURIComponent(id)}`, {
        scroll: false
      });
    },
    [router]
  );

  const handleCreateConversation = useCallback(async () => {
    if (!newConversation.subject.trim()) {
      setError("Informe um assunto para abrir a thread.");
      return;
    }

    setError(null);

    try {
      const payload = await createConversation(newConversation);
      setNewConversation({
        initialMessage: "",
        subject: ""
      });
      handleSelectThread(payload.conversation.id);
    } catch (creationError) {
      setError(
        creationError instanceof Error ? creationError.message : "Falha ao criar conversa."
      );
    }
  }, [handleSelectThread, newConversation]);

  const handleUpdateStatus = useCallback(
    async (conversationId: string, nextStatus: string) => {
      try {
        await updateConversationStatus(conversationId, nextStatus);
        setDetail((current) => (current ? { ...current, status: nextStatus } : current));
        setItems((current) =>
          current.map((item) => (item.id === conversationId ? { ...item, status: nextStatus } : item))
        );
      } catch (statusError) {
        setError(
          statusError instanceof Error ? statusError.message : "Falha ao atualizar status."
        );
      }
    },
    []
  );

  const handlePublishNote = useCallback(async () => {
    if (!composer.trim() || !detail) {
      setError("Escreva uma nota antes de enviar.");
      return;
    }

    try {
      await appendConversationNote(detail.id, composer);
      setComposer("");
      const payload = await fetchConversationDetail(detail.id);
      setDetail(payload.conversation);
    } catch (noteError) {
      setError(noteError instanceof Error ? noteError.message : "Falha ao publicar nota.");
    }
  }, [composer, detail]);

  const updateFilters = useCallback(
    (field: keyof ConversationFiltersState, value: string) => {
      setFilters((current) => ({
        ...current,
        [field]: value
      }));
    },
    []
  );

  const updateNewConversation = useCallback((field: "subject" | "initialMessage", value: string) => {
    setNewConversation((current) => ({
      ...current,
      [field]: value
    }));
  }, []);

  const handleComposerChange = useCallback((value: string) => {
    setComposer(value);
  }, []);

  useEffect(() => {
    setLoadingList(true);
    setError(null);

    const nextFilters = buildListFilters(filters, deferredQuery);

    void loadConversationListState({
      filters: nextFilters,
      onSelectFirst: handleSelectThread,
      selectedId,
      setError,
      setItems,
      setLoading: setLoadingList
    });
  }, [deferredQuery, filters, handleSelectThread, selectedId]);

  useEffect(() => {
    if (!selectedId) {
      setDetail(null);
      return;
    }

    setLoadingDetail(true);
    void loadConversationDetailState({
      conversationId: selectedId,
      setDetail,
      setError,
      setLoading: setLoadingDetail
    });
  }, [selectedId]);

  const selectedSummary = useMemo(
    () => items.find((item) => item.id === selectedId) ?? null,
    [items, selectedId]
  );

  return (
    <main className="dashboard-content">
      <ProductPageHeader
        actions={
          <div className="hero-actions">
            <button
              className="action-button"
              onClick={handleCreateConversation}
              type="button"
            >
              Nova thread
            </button>
          </div>
        }
        badge="Conversations"
        description="Fila operacional para acompanhar threads, registrar notas internas e fechar atendimentos sem sair do produto."
        title="Conversations UI"
      />

      <section
        style={{
          display: "grid",
          gap: "1rem",
          gridTemplateColumns: "minmax(280px, 0.9fr) minmax(0, 1.4fr)"
        }}
      >
        <ConversationListPanel
          error={error}
          filters={filters}
          loadingList={loadingList}
          newConversation={newConversation}
          items={items}
          onFilterChange={updateFilters}
          onNewConversationChange={updateNewConversation}
          onSelectThread={handleSelectThread}
          selectedId={selectedId}
        />

        <ConversationDetailPanel
          composer={composer}
          detail={detail}
          loadingDetail={loadingDetail}
          onComposerChange={handleComposerChange}
          onPublishNote={handlePublishNote}
          onStatusChange={handleUpdateStatus}
          selectedSummary={selectedSummary}
        />
      </section>
    </main>
  );
}
