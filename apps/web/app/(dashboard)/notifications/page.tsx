"use client";

import { useEffect, useMemo } from "react";
import Link from "next/link";
import { CheckCheck, Settings2 } from "lucide-react";

import {
  ProductEmptyState,
  ProductPageHeader
} from "../../../components/dashboard/page-fragments";
import { useNotificationStore } from "../../../stores/notification-store";
import { useUserPreferencesStore } from "../../../stores/user-preferences-store";

function groupByDay<T extends { createdAt: string }>(items: T[]) {
  return items.reduce<Array<{ items: T[]; label: string }>>((groups, item) => {
    const target = new Date(item.createdAt);
    const label = target.toLocaleDateString("pt-BR", {
      day: "2-digit",
      month: "short"
    });
    const currentGroup = groups.find((group) => group.label === label);

    if (currentGroup) {
      currentGroup.items.push(item);
      return groups;
    }

    groups.push({
      items: [item],
      label
    });
    return groups;
  }, []);
}

export default function NotificationsPage() {
  const preferences = useUserPreferencesStore((state) => state.preferences);
  const hydratePreferences = useUserPreferencesStore((state) => state.hydrate);
  const preferenceError = useUserPreferencesStore((state) => state.error);
  const items = useNotificationStore((state) => state.items);
  const feedError = useNotificationStore((state) => state.error);
  const isLoading = useNotificationStore((state) => state.isLoading);
  const nextCursor = useNotificationStore((state) => state.nextCursor);
  const refresh = useNotificationStore((state) => state.refresh);
  const loadMore = useNotificationStore((state) => state.loadMore);
  const markAllAsRead = useNotificationStore((state) => state.markAllAsRead);
  const markAsRead = useNotificationStore((state) => state.markAsRead);
  const grouped = useMemo(() => groupByDay(items), [items]);

  useEffect(() => {
    void hydratePreferences();
    void refresh();
  }, [hydratePreferences, refresh]);

  return (
    <main className="dashboard-content">
      <ProductPageHeader
        actions={
          <div className="hero-actions">
            <button className="action-button" onClick={() => void markAllAsRead()} type="button">
              <CheckCheck size={14} />
              Marcar tudo como lido
            </button>
            <Link className="ghost-button" href="/profile/notifications">
              <Settings2 size={14} />
              Preferencias
            </Link>
          </div>
        }
        badge="Notifications"
        description="Feed persistido no backend com marcacao de leitura, preferencias do usuario e atualizacao leve."
        title="Central de notificacoes"
      />

      <section className="stats-grid">
        <article>
          <span className="badge">In-app</span>
          <strong>{preferences.inAppNotifications ? "Ativo" : "Desligado"}</strong>
        </article>
        <article>
          <span className="badge">Email</span>
          <strong>{preferences.emailNotifications ? "Ativo" : "Desligado"}</strong>
        </article>
        <article>
          <span className="badge">Push</span>
          <strong>{preferences.pushNotifications ? "Ativo" : "Desligado"}</strong>
        </article>
        <article>
          <span className="badge">Consentimento</span>
          <strong>{preferences.cookieConsent}</strong>
        </article>
      </section>

      {feedError || preferenceError ? (
        <section className="panel empty-state">
          <strong>Falha ao carregar notificacoes</strong>
          <p>{feedError ?? preferenceError}</p>
          <button className="action-button" onClick={() => void refresh()} type="button">
            Tentar novamente
          </button>
        </section>
      ) : null}

      {isLoading && items.length === 0 ? (
        <section className="panel">
          <p style={{ color: "var(--muted)", margin: 0 }}>Sincronizando feed...</p>
        </section>
      ) : null}

      {!isLoading && items.length === 0 ? (
        <ProductEmptyState
          description="Nenhuma notificacao recente para o usuario atual. O sino continuara atualizando em background."
          title="Feed vazio"
        />
      ) : null}

      {grouped.map((group) => (
        <section className="panel" key={group.label}>
          <div
            style={{
              alignItems: "center",
              display: "flex",
              justifyContent: "space-between",
              marginBottom: "0.85rem"
            }}
          >
            <h2 style={{ marginBottom: 0 }}>{group.label}</h2>
            <button className="ghost-button" onClick={() => void refresh()} type="button">
              Atualizar feed
            </button>
          </div>
          <div style={{ display: "grid", gap: "0.75rem" }}>
            {group.items.map((item) => (
              <article
                key={item.id}
                style={{
                  background: item.isRead ? "transparent" : "rgba(30, 58, 138, 0.08)",
                  border: "1px solid var(--border)",
                  borderRadius: 22,
                  display: "grid",
                  gap: "0.4rem",
                  padding: "1rem"
                }}
              >
                <div
                  style={{
                    alignItems: "center",
                    display: "flex",
                    justifyContent: "space-between"
                  }}
                >
                  <strong>{item.type.replace(/_/g, " ")}</strong>
                  <span style={{ color: "var(--muted)" }}>
                    {new Date(item.createdAt).toLocaleTimeString("pt-BR", {
                      hour: "2-digit",
                      minute: "2-digit"
                    })}
                  </span>
                </div>
                <p style={{ margin: 0 }}>{item.content}</p>
                <div className="hero-actions">
                  <button
                    className="ghost-button"
                    onClick={() => void markAsRead(item.id)}
                    type="button"
                  >
                    Marcar como lida
                  </button>
                  <a className="ghost-button" href={item.link ?? "/notifications"}>
                    Abrir destino
                  </a>
                </div>
              </article>
            ))}
          </div>
        </section>
      ))}

      {nextCursor ? (
        <section className="panel">
          <button className="action-button" onClick={() => void loadMore()} type="button">
            Carregar mais
          </button>
        </section>
      ) : null}
    </main>
  );
}

