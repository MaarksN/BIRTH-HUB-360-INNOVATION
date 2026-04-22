"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Bell,
  BellOff,
  CheckCheck,
  ExternalLink,
  MoonStar,
  Sparkles,
  SunMedium
} from "lucide-react";

import { EXECUTIVE_PREMIUM_COLLECTION_HREF } from "../../lib/executive-premium";
import { useThemeMode } from "../../providers/ThemeProvider";
import {
  type NotificationItem,
  useNotificationStore
} from "../../stores/notification-store";
import { useUserPreferencesStore } from "../../stores/user-preferences-store";
import { useI18n } from "../../providers/I18nProvider";
import { BrandLogo } from "../brand/BrandLogo";
import { GlobalSearch } from "./GlobalSearch";
import {
  getProductCapabilities,
  isDashboardNavigationItemEnabled
} from "../../lib/product-capabilities";

const productCapabilities = getProductCapabilities();

function toDisplayDateLabel(
  locale: string,
  labels: {
    today: string;
    yesterday: string;
  },
  value: string
): string {
  const current = new Date();
  const target = new Date(value);
  const dayDiff = Math.floor(
    (Date.UTC(current.getFullYear(), current.getMonth(), current.getDate()) -
      Date.UTC(target.getFullYear(), target.getMonth(), target.getDate())) /
      (24 * 60 * 60 * 1000)
  );

  if (dayDiff === 0) {
    return labels.today;
  }

  if (dayDiff === 1) {
    return labels.yesterday;
  }

  return target.toLocaleDateString(locale, {
    day: "2-digit",
    month: "short"
  });
}

function groupByDay(
  locale: string,
  labels: {
    today: string;
    yesterday: string;
  },
  items: NotificationItem[]
) {
  return items.reduce<Array<{ label: string; items: NotificationItem[] }>>((groups, item) => {
    const label = toDisplayDateLabel(locale, labels, item.createdAt);
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

export function Navbar() {
  const {
    dictionary: copy,
    formatDateTime,
    locale
  } = useI18n();
  const pathname = usePathname();
  const dropdownRef = useRef<HTMLDivElement | null>(null);
  const [open, setOpen] = useState(false);
  const { mode, toggleMode } = useThemeMode();
  const items = useNotificationStore((state) => state.items);
  const unreadCount = useNotificationStore((state) => state.unreadCount);
  const refresh = useNotificationStore((state) => state.refresh);
  const markAsRead = useNotificationStore((state) => state.markAsRead);
  const markAllAsRead = useNotificationStore((state) => state.markAllAsRead);
  const notificationsEnabled = useUserPreferencesStore(
    (state) => state.preferences.inAppNotifications
  );

  useEffect(() => {
    function handleOutsideClick(event: MouseEvent) {
      if (!dropdownRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    }

    document.addEventListener("mousedown", handleOutsideClick);
    return () => {
      document.removeEventListener("mousedown", handleOutsideClick);
    };
  }, []);

  useEffect(() => {
    if (notificationsEnabled === false) {
      return;
    }

    void refresh();

    const intervalId = window.setInterval(() => {
      if (document.hidden) {
        return;
      }

      void refresh();
    }, 45_000);

    return () => {
      window.clearInterval(intervalId);
    };
  }, [notificationsEnabled, refresh]);

  const grouped = useMemo(
    () => groupByDay(locale, copy.navbar, items.slice(0, 10)),
    [copy.navbar, items, locale]
  );
  const navigationItems = useMemo(
    () =>
      copy.navbar.items.filter((item) =>
        isDashboardNavigationItemEnabled(item.href, productCapabilities)
      ),
    [copy.navbar.items]
  );

  return (
    <>
      <div className="dashboard-topbar__identity">
        <BrandLogo href="/dashboard" size="sm" theme={mode === "dark" ? "dark" : "light"} />
        <div className="dashboard-title__meta">
          <span>{copy.navbar.identityTitle}</span>
          <strong>{copy.navbar.identityDescription}</strong>
        </div>
      </div>

      <div className="dashboard-topbar__content">
        <nav className="dashboard-nav" aria-label={copy.navbar.navigationAriaLabel}>
          {navigationItems.map((item) => {
            const active =
              pathname === item.href || (item.href !== "/dashboard" && pathname.startsWith(item.href));

            return (
              <Link
                aria-current={active ? "page" : undefined}
                data-active={active ? "true" : "false"}
                href={item.href}
                key={item.href}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="dashboard-topbar__actions">
          <GlobalSearch />

          <Link
            aria-label={copy.navbar.premiumLinkTitle}
            className="ghost-button"
            href={EXECUTIVE_PREMIUM_COLLECTION_HREF}
            title={copy.navbar.premiumLinkTitle}
          >
            <Sparkles size={16} />
            <span>{copy.navbar.premiumLinkLabel}</span>
          </Link>

          <button
            aria-label={mode === "dark" ? copy.navbar.activateLightTheme : copy.navbar.activateDarkTheme}
            className="ghost-button"
            onClick={toggleMode}
            type="button"
          >
            {mode === "dark" ? <SunMedium size={16} /> : <MoonStar size={16} />}
            <span>{mode === "dark" ? copy.navbar.lightModeLabel : copy.navbar.darkModeLabel}</span>
          </button>

          <div className="navbar-dropdown-anchor" ref={dropdownRef}>
            <button
              aria-expanded={open}
              aria-label={copy.navbar.openNotifications}
              className="ghost-button navbar-feed-button"
              type="button"
              onClick={() => {
                if (!open) {
                  void refresh();
                }
                setOpen((current) => !current);
              }}
            >
              {notificationsEnabled === false ? <BellOff size={18} /> : <Bell size={18} />}
              <span>{copy.navbar.feedLabel}</span>
              {notificationsEnabled !== false && unreadCount > 0 ? (
                <span className="notification-badge">{unreadCount > 99 ? "99+" : unreadCount}</span>
              ) : null}
            </button>

            {open ? (
              <div className="notification-dropdown">
                <div className="notification-dropdown__header">
                  <div>
                    <strong>{copy.navbar.notificationsTitle}</strong>
                    <p>{copy.navbar.notificationsDescription}</p>
                  </div>
                  <button
                    className="ghost-button"
                    onClick={() => {
                      void markAllAsRead();
                    }}
                    type="button"
                  >
                    <CheckCheck size={16} />
                    <span>{copy.navbar.markAllRead}</span>
                  </button>
                </div>

                {notificationsEnabled === false ? (
                  <div className="panel panel--compact">
                    <strong>{copy.navbar.notificationsDisabledTitle}</strong>
                    <p className="panel-copy">{copy.navbar.notificationsDisabledDescription}</p>
                  </div>
                ) : grouped.length === 0 ? (
                  <div className="panel panel--compact">
                    <strong>{copy.navbar.emptyTitle}</strong>
                    <p className="panel-copy">{copy.navbar.emptyDescription}</p>
                  </div>
                ) : (
                  <div className="notification-dropdown__list">
                    {grouped.map((group) => (
                      <section className="notification-day-group" key={group.label}>
                        <small>{group.label}</small>
                        {group.items.map((item) => (
                          <a
                            className="notification-card"
                            href={item.link ?? "/notifications"}
                            key={item.id}
                            onClick={() => {
                              setOpen(false);
                              if (!item.isRead) {
                                void markAsRead(item.id);
                              }
                            }}
                          >
                            <div className="notification-card__title">
                              <strong>{item.type.replace(/_/g, " ")}</strong>
                              <small>
                                {formatDateTime(item.createdAt, {
                                  hour: "2-digit",
                                  minute: "2-digit"
                                })}
                              </small>
                            </div>
                            <span>{item.content}</span>
                            <span className="notification-card__link">
                              {copy.navbar.openDetail}
                              <ExternalLink size={14} />
                            </span>
                          </a>
                        ))}
                      </section>
                    ))}
                  </div>
                )}

                <div className="notification-dropdown__footer">
                  <Link href="/notifications" onClick={() => setOpen(false)}>
                    {copy.navbar.viewCenter}
                  </Link>
                  <Link href="/profile/notifications" onClick={() => setOpen(false)}>
                    {copy.navbar.preferences}
                  </Link>
                </div>
              </div>
            ) : null}
          </div>
        </div>
      </div>
    </>
  );
}

