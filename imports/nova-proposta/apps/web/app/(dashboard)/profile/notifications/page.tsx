"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";

import { getStoredSession } from "../../../../lib/auth-client";
import { type SupportedLocale } from "../../../../lib/i18n";
import { useI18n } from "../../../../providers/I18nProvider";
import { useThemeMode } from "../../../../providers/ThemeProvider";
import { useNotificationStore } from "../../../../stores/notification-store";
import { useUserPreferencesStore } from "../../../../stores/user-preferences-store";

function ToggleCard(input: {
  checked: boolean;
  description: string;
  disabled?: boolean;
  label: string;
  onChange: (checked: boolean) => void;
}) {
  return (
    <label
      style={{
        background: "var(--surface-panel)",
        border: "1px solid var(--border)",
        borderRadius: 20,
        cursor: "pointer",
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
        <strong>{input.label}</strong>
        <input
          checked={input.checked}
          disabled={input.disabled}
          onChange={(event) => input.onChange(event.target.checked)}
          type="checkbox"
        />
      </div>
      <span style={{ color: "var(--muted)" }}>{input.description}</span>
    </label>
  );
}

function ThemeOptionCard(input: {
  active: boolean;
  description: string;
  label: string;
  onClick: () => void;
  tone: "dark" | "light";
}) {
  const previewBackground =
    input.tone === "dark"
      ? "linear-gradient(145deg, rgba(6, 18, 25, 0.96), rgba(14, 38, 50, 0.88))"
      : "linear-gradient(145deg, rgba(255,255,255,0.94), rgba(224, 245, 240, 0.88))";
  const previewBorder =
    input.tone === "dark" ? "1px solid rgba(255,255,255,0.1)" : "1px solid rgba(17,42,57,0.08)";

  return (
    <button
      aria-pressed={input.active}
      onClick={input.onClick}
      style={{
        background: "var(--surface-panel-strong)",
        border: input.active ? "1px solid var(--accent)" : "1px solid var(--border)",
        borderRadius: 24,
        cursor: "pointer",
        display: "grid",
        gap: "0.75rem",
        padding: "1rem",
        textAlign: "left"
      }}
      type="button"
    >
      <div
        style={{
          background: previewBackground,
          border: previewBorder,
          borderRadius: 20,
          display: "grid",
          gap: "0.5rem",
          minHeight: 128,
          padding: "0.9rem"
        }}
      >
        <div
          style={{
            background: input.tone === "dark" ? "rgba(255,255,255,0.08)" : "rgba(24,122,115,0.08)",
            borderRadius: 999,
            height: 12,
            width: "46%"
          }}
        />
        <div
          style={{
            background: input.tone === "dark" ? "rgba(255,255,255,0.12)" : "rgba(24,122,115,0.14)",
            borderRadius: 20,
            flex: 1
          }}
        />
        <div
          style={{
            display: "grid",
            gap: "0.45rem",
            gridTemplateColumns: "repeat(3, minmax(0, 1fr))"
          }}
        >
          <span
            style={{
              background:
                input.tone === "dark" ? "rgba(103, 215, 192, 0.14)" : "rgba(24,122,115,0.12)",
              borderRadius: 16,
              minHeight: 34
            }}
          />
          <span
            style={{
              background:
                input.tone === "dark" ? "rgba(103, 215, 192, 0.1)" : "rgba(24,122,115,0.08)",
              borderRadius: 16,
              minHeight: 34
            }}
          />
          <span
            style={{
              background:
                input.tone === "dark" ? "rgba(103, 215, 192, 0.18)" : "rgba(24,122,115,0.16)",
              borderRadius: 16,
              minHeight: 34
            }}
          />
        </div>
      </div>

      <div style={{ display: "grid", gap: "0.3rem" }}>
        <strong>{input.label}</strong>
        <span style={{ color: "var(--muted)" }}>{input.description}</span>
      </div>
    </button>
  );
}

export default function NotificationPreferencesPage() {
  const router = useRouter();
  const { dictionary, formatDateTime } = useI18n();
  const copy = dictionary.notificationPreferencesPage;
  const { mode, setMode } = useThemeMode();
  const [session, setSession] = useState<ReturnType<typeof getStoredSession> | null | undefined>(
    undefined
  );
  const preferences = useUserPreferencesStore((state) => state.preferences);
  const prefError = useUserPreferencesStore((state) => state.error);
  const prefHydrated = useUserPreferencesStore((state) => state.hydrated);
  const prefSaving = useUserPreferencesStore((state) => state.isSaving);
  const hydratePreferences = useUserPreferencesStore((state) => state.hydrate);
  const updatePreferences = useUserPreferencesStore((state) => state.update);
  const feed = useNotificationStore((state) => state.items);
  const feedError = useNotificationStore((state) => state.error);
  const isLoadingFeed = useNotificationStore((state) => state.isLoading);
  const nextCursor = useNotificationStore((state) => state.nextCursor);
  const refreshFeed = useNotificationStore((state) => state.refresh);
  const loadMore = useNotificationStore((state) => state.loadMore);
  const markAsRead = useNotificationStore((state) => state.markAsRead);
  const markAllAsRead = useNotificationStore((state) => state.markAllAsRead);

  useEffect(() => {
    setSession(getStoredSession());
  }, []);

  useEffect(() => {
    if (!session) {
      return;
    }

    void hydratePreferences();
    void refreshFeed();
  }, [hydratePreferences, refreshFeed, session]);

  if (session === undefined) {
    return <main aria-busy="true" style={{ padding: "1.5rem" }} />;
  }

  if (!session) {
    return (
      <main style={{ padding: "1.5rem" }}>
        <div className="panel">
          <h1 style={{ marginTop: 0 }}>{copy.signInTitle}</h1>
          <p>{copy.signInDescription}</p>
        </div>
      </main>
    );
  }

  return (
    <main style={{ display: "grid", gap: "1rem", padding: "1.5rem" }}>
      <section className="hero-card">
        <span className="badge">{copy.badge}</span>
        <h1>{copy.title}</h1>
        <p style={{ marginBottom: 0 }}>
          <strong>Preferencias de notificacao</strong> centralizadas para email, feed in-app,
          idioma da interface e consentimento de analytics.
        </p>
      </section>

      <section className="panel">
        <div
          style={{
            alignItems: "center",
            display: "flex",
            flexWrap: "wrap",
            gap: "0.75rem",
            justifyContent: "space-between",
            marginBottom: "1rem"
          }}
        >
          <div>
            <h2 style={{ marginTop: 0 }}>{copy.themeHeading}</h2>
            <p style={{ color: "var(--muted)", marginBottom: 0 }}>{copy.themeDescription}</p>
          </div>
          <span className="badge">
            {copy.activeThemeLabel}: {mode === "dark" ? copy.darkThemeLabel : copy.lightThemeLabel}
          </span>
        </div>

        <div
          style={{
            display: "grid",
            gap: "0.9rem",
            gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))"
          }}
        >
          <ThemeOptionCard
            active={mode === "light"}
            description={copy.themeDescription}
            label={copy.lightThemeLabel}
            onClick={() => setMode("light")}
            tone="light"
          />
          <ThemeOptionCard
            active={mode === "dark"}
            description={copy.themeDescription}
            label={copy.darkThemeLabel}
            onClick={() => setMode("dark")}
            tone="dark"
          />
        </div>
      </section>

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
            <h2 style={{ marginTop: 0 }}>{copy.interfaceLanguageHeading}</h2>
            <p style={{ color: "var(--muted)", marginBottom: 0 }}>
              {copy.interfaceLanguageDescription}
            </p>
          </div>
          <label
            style={{
              display: "grid",
              gap: "0.35rem",
              minWidth: 220
            }}
          >
            <span>{copy.interfaceLanguageLabel}</span>
            <select
              disabled={prefSaving || !prefHydrated}
              onChange={(event) => {
                const nextLocale = event.target.value as SupportedLocale;

                void updatePreferences({
                  locale: nextLocale
                }).then((updated) => {
                  if (updated?.locale === nextLocale) {
                    router.refresh();
                  }
                });
              }}
              value={preferences.locale}
            >
              <option value="pt-BR">{copy.localeLabels["pt-BR"]}</option>
              <option value="en-US">{copy.localeLabels["en-US"]}</option>
            </select>
          </label>
        </div>
      </section>

      <section
        style={{
          display: "grid",
          gap: "0.9rem",
          gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))"
        }}
      >
        <ToggleCard
          checked={preferences.inAppNotifications}
          description={copy.inAppNotificationsDescription}
          disabled={prefSaving || !prefHydrated}
          label={copy.inAppNotificationsLabel}
          onChange={(checked) => {
            void updatePreferences({
              inAppNotifications: checked
            });
          }}
        />
        <ToggleCard
          checked={preferences.emailNotifications}
          description={copy.emailNotificationsDescription}
          disabled={prefSaving || !prefHydrated}
          label={copy.emailNotificationsLabel}
          onChange={(checked) => {
            void updatePreferences({
              emailNotifications: checked
            });
          }}
        />
        <ToggleCard
          checked={preferences.marketingEmails}
          description={copy.marketingEmailsDescription}
          disabled={prefSaving || !prefHydrated}
          label={copy.marketingEmailsLabel}
          onChange={(checked) => {
            void updatePreferences({
              marketingEmails: checked
            });
          }}
        />
        <ToggleCard
          checked={preferences.pushNotifications}
          description={copy.pushNotificationsDescription}
          disabled={prefSaving || !prefHydrated}
          label={copy.pushNotificationsLabel}
          onChange={(checked) => {
            void updatePreferences({
              pushNotifications: checked
            });
          }}
        />
      </section>

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
            <h2 style={{ marginTop: 0 }}>{copy.cookieConsentHeading}</h2>
            <p style={{ color: "var(--muted)", marginBottom: 0 }}>
              {copy.cookieConsentDescription}
            </p>
          </div>
          <div style={{ display: "flex", gap: "0.65rem" }}>
            <button
              className="action-button"
              disabled={prefSaving}
              onClick={() => {
                void updatePreferences({
                  cookieConsent: "ACCEPTED"
                });
              }}
              type="button"
            >
              {copy.acceptCookies}
            </button>
            <button
              className="ghost-button"
              disabled={prefSaving}
              onClick={() => {
                void updatePreferences({
                  cookieConsent: "REJECTED"
                });
              }}
              type="button"
            >
              {copy.rejectCookies}
            </button>
          </div>
        </div>
        <p style={{ marginBottom: 0 }}>
          {copy.cookieStatusLabel}: <strong>{preferences.cookieConsent}</strong>
        </p>
        {prefError ? <p style={{ color: "#9b2f2f", marginBottom: 0 }}>{prefError}</p> : null}
      </section>

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
            <h2 style={{ marginTop: 0 }}>{copy.feedHeading}</h2>
            <p style={{ color: "var(--muted)", marginBottom: 0 }}>
              {copy.feedDescription}
            </p>
          </div>
          <button
            className="ghost-button"
            onClick={() => {
              void markAllAsRead();
            }}
            type="button"
          >
            {copy.markAllRead}
          </button>
        </div>

        {feed.length === 0 && !isLoadingFeed ? (
          <p style={{ marginBottom: 0 }}>{copy.emptyFeed}</p>
        ) : (
          <div style={{ display: "grid", gap: "0.75rem" }}>
            {feed.map((item) => (
              <article
                key={item.id}
                style={{
                  background: item.isRead ? "var(--surface-panel)" : "rgba(24,122,115,0.08)",
                  border: "1px solid var(--border)",
                  borderRadius: 18,
                  display: "grid",
                  gap: "0.35rem",
                  padding: "0.9rem"
                }}
              >
                <div
                  style={{
                    alignItems: "center",
                    display: "flex",
                    gap: "0.75rem",
                    justifyContent: "space-between"
                  }}
                >
                  <strong>{item.type.replace(/_/g, " ")}</strong>
                  <small style={{ color: "var(--muted)" }}>
                    {formatDateTime(item.createdAt, {
                      dateStyle: "medium",
                      timeStyle: "short"
                    })}
                  </small>
                </div>
                <span>{item.content}</span>
                <div style={{ display: "flex", flexWrap: "wrap", gap: "0.65rem" }}>
                  {item.link ? (
                    <a href={item.link} style={{ color: "var(--accent-strong)" }}>
                      {copy.openLink}
                    </a>
                  ) : null}
                  {!item.isRead ? (
                    <button
                      className="ghost-button"
                      onClick={() => {
                        void markAsRead(item.id);
                      }}
                      type="button"
                    >
                      {copy.markAsRead}
                    </button>
                  ) : null}
                </div>
              </article>
            ))}
          </div>
        )}

        {nextCursor ? (
          <button
            className="ghost-button"
            disabled={isLoadingFeed}
            onClick={() => {
              void loadMore();
            }}
            type="button"
          >
            {isLoadingFeed ? copy.loadingMore : copy.loadMore}
          </button>
        ) : null}

        {feedError ? <p style={{ color: "#9b2f2f", marginBottom: 0 }}>{feedError}</p> : null}
      </section>
    </main>
  );
}

