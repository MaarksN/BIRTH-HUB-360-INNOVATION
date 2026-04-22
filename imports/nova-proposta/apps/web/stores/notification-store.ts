"use client";

import { create } from "zustand";

import { fetchWithSession, getStoredSession } from "../lib/auth-client";
import { sanitizeCapabilityScopedLink } from "../lib/product-capabilities";

export interface NotificationItem {
  content: string;
  createdAt: string;
  id: string;
  isRead: boolean;
  link: string | null;
  metadata?: Record<string, unknown> | null;
  type: string;
}

interface NotificationState {
  error: string | null;
  initialized: boolean;
  isLoading: boolean;
  items: NotificationItem[];
  nextCursor: string | null;
  unreadCount: number;
  loadMore: () => Promise<void>;
  markAllAsRead: () => Promise<void>;
  markAsRead: (id: string) => Promise<void>;
  refresh: () => Promise<void>;
}

interface NotificationFeedPayload {
  items: NotificationItem[];
  nextCursor: string | null;
  unreadCount: number;
}

interface NotificationStoreContext {
  get: () => NotificationState;
  set: (
    nextState:
      | Partial<NotificationState>
      | ((state: NotificationState) => Partial<NotificationState>)
  ) => void;
}

type NotificationStoreFields = Pick<
  NotificationState,
  "error" | "initialized" | "isLoading" | "items" | "nextCursor" | "unreadCount"
>;

const INITIAL_PAGE_SIZE = 10;
const LOAD_MORE_PAGE_SIZE = 20;

function dedupeNotifications(items: NotificationItem[]): NotificationItem[] {
  const seen = new Set<string>();
  const deduped: NotificationItem[] = [];

  for (const item of items) {
    if (seen.has(item.id)) {
      continue;
    }

    seen.add(item.id);
    deduped.push(item);
  }

  return deduped.sort(
    (left, right) => new Date(right.createdAt).getTime() - new Date(left.createdAt).getTime()
  );
}

function getErrorMessage(error: unknown, fallback: string): string {
  return error instanceof Error ? error.message : fallback;
}

function hasActiveSession(): boolean {
  return Boolean(getStoredSession());
}

function createLoadingState(): Pick<NotificationStoreFields, "error" | "isLoading"> {
  return {
    error: null,
    isLoading: true
  };
}

function createAnonymousState(): NotificationStoreFields {
  return {
    error: null,
    initialized: true,
    isLoading: false,
    items: [],
    nextCursor: null,
    unreadCount: 0
  };
}

function createFeedState(
  payload: NotificationFeedPayload,
  items: NotificationItem[] = payload.items
): NotificationStoreFields {
  return {
    error: null,
    initialized: true,
    isLoading: false,
    items: dedupeNotifications(
      items.map((item) => ({
        ...item,
        link: sanitizeCapabilityScopedLink(item.link)
      }))
    ),
    nextCursor: payload.nextCursor,
    unreadCount: payload.unreadCount
  };
}

function createMarkAllAsReadState(
  state: NotificationStoreFields
): Pick<NotificationStoreFields, "error" | "items" | "unreadCount"> {
  return {
    error: null,
    items: state.items.map((item) => ({
      ...item,
      isRead: true
    })),
    unreadCount: 0
  };
}

function createMarkAsReadState(
  state: NotificationStoreFields,
  id: string
): Pick<NotificationStoreFields, "items" | "unreadCount"> {
  const unreadTarget = state.items.find((item) => item.id === id && !item.isRead);

  return {
    items: state.items.map((item) =>
      item.id === id
        ? {
            ...item,
            isRead: true
          }
        : item
    ),
    unreadCount: Math.max(0, state.unreadCount - (unreadTarget ? 1 : 0))
  };
}

function canLoadMore(state: NotificationState): boolean {
  return hasActiveSession() && Boolean(state.nextCursor) && !state.isLoading;
}

async function fetchFeed(
  cursor?: string | null,
  limit = INITIAL_PAGE_SIZE
): Promise<NotificationFeedPayload> {
  const search = new URLSearchParams({
    limit: String(limit)
  });

  if (cursor) {
    search.set("cursor", cursor);
  }

  const response = await fetchWithSession(`/api/v1/notifications?${search.toString()}`, {
    cache: "no-store"
  });

  if (!response.ok) {
    throw new Error(`Falha ao carregar notificacoes (${response.status}).`);
  }

  return (await response.json()) as NotificationFeedPayload;
}

function createLoadMoreAction(context: NotificationStoreContext): NotificationState["loadMore"] {
  return async () => {
    const current = context.get();

    if (!canLoadMore(current)) {
      return;
    }

    context.set(createLoadingState());

    try {
      const payload = await fetchFeed(current.nextCursor, LOAD_MORE_PAGE_SIZE);

      context.set((state) => createFeedState(payload, [...state.items, ...payload.items]));
    } catch (error) {
      context.set({
        error: getErrorMessage(error, "Falha ao carregar mais notificacoes."),
        isLoading: false
      });
    }
  };
}

function createMarkAllAsReadAction(
  context: NotificationStoreContext
): NotificationState["markAllAsRead"] {
  return async () => {
    if (!hasActiveSession()) {
      return;
    }

    try {
      const response = await fetchWithSession("/api/v1/notifications/read-all", {
        method: "PATCH"
      });

      if (!response.ok) {
        throw new Error(`Falha ao marcar notificacoes (${response.status}).`);
      }

      context.set((state) => createMarkAllAsReadState(state));
    } catch (error) {
      context.set({
        error: getErrorMessage(error, "Falha ao marcar notificacoes.")
      });
    }
  };
}

function createRefreshAction(context: NotificationStoreContext): NotificationState["refresh"] {
  return async () => {
    if (!hasActiveSession()) {
      context.set(createAnonymousState());
      return;
    }

    context.set(createLoadingState());

    try {
      const payload = await fetchFeed(undefined, INITIAL_PAGE_SIZE);

      context.set(createFeedState(payload));
    } catch (error) {
      context.set({
        error: getErrorMessage(error, "Falha ao carregar notificacoes."),
        initialized: true,
        isLoading: false
      });
    }
  };
}

function createMarkAsReadAction(context: NotificationStoreContext): NotificationState["markAsRead"] {
  return async (id) => {
    if (!hasActiveSession()) {
      return;
    }

    const snapshot = context.get();

    context.set((state) => createMarkAsReadState(state, id));

    try {
      const response = await fetchWithSession(
        `/api/v1/notifications/${encodeURIComponent(id)}/read`,
        {
          method: "PATCH"
        }
      );

      if (!response.ok) {
        throw new Error(`Falha ao marcar notificacao (${response.status}).`);
      }
    } catch (error) {
      context.set({
        error: getErrorMessage(error, "Falha ao marcar notificacao."),
        items: snapshot.items,
        unreadCount: snapshot.unreadCount
      });
      await context.get().refresh();
    }
  };
}

function createNotificationActions(
  context: NotificationStoreContext
): Pick<NotificationState, "loadMore" | "markAllAsRead" | "markAsRead" | "refresh"> {
  return {
    loadMore: createLoadMoreAction(context),
    markAllAsRead: createMarkAllAsReadAction(context),
    markAsRead: createMarkAsReadAction(context),
    refresh: createRefreshAction(context)
  };
}

function createNotificationStoreState(
  set: NotificationStoreContext["set"],
  get: NotificationStoreContext["get"]
): NotificationState {
  return {
    error: null,
    initialized: false,
    isLoading: false,
    items: [],
    nextCursor: null,
    unreadCount: 0,
    ...createNotificationActions({ get, set })
  };
}

export const useNotificationStore = create<NotificationState>(createNotificationStoreState);
