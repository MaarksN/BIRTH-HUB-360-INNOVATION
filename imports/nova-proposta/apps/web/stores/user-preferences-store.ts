"use client";

import { create } from "zustand";

import {
  fetchWithSession,
  getCookieValue,
  getStoredSession,
  setCookieValue
} from "../lib/auth-client";
import {
  defaultLocale,
  LOCALE_COOKIE_NAME,
  parseSupportedLocale,
  type SupportedLocale
} from "../lib/i18n";

export type CookieConsentStatus = "ACCEPTED" | "PENDING" | "REJECTED";
const LOCALE_COOKIE_MAX_AGE_SECONDS = 60 * 60 * 24 * 365;

export interface UserNotificationPreferences {
  cookieConsent: CookieConsentStatus;
  emailNotifications: boolean;
  inAppNotifications: boolean;
  locale: SupportedLocale;
  marketingEmails: boolean;
  pushNotifications: boolean;
}

interface UserPreferencesState {
  error: string | null;
  hydrated: boolean;
  isSaving: boolean;
  preferences: UserNotificationPreferences;
  hydrate: () => Promise<void>;
  update: (next: Partial<UserNotificationPreferences>) => Promise<UserNotificationPreferences | null>;
}

function getStoredLocalePreference(): SupportedLocale {
  return parseSupportedLocale(getCookieValue(LOCALE_COOKIE_NAME)) ?? defaultLocale;
}

function syncLocaleCookie(locale: SupportedLocale): void {
  setCookieValue(LOCALE_COOKIE_NAME, locale, {
    maxAgeSeconds: LOCALE_COOKIE_MAX_AGE_SECONDS,
    path: "/",
    sameSite: "lax"
  });
}

function createDefaultPreferences(): UserNotificationPreferences {
  return {
    cookieConsent: "PENDING",
    emailNotifications: true,
    inAppNotifications: true,
    locale: getStoredLocalePreference(),
    marketingEmails: false,
    pushNotifications: false
  };
}

const defaultPreferences: UserNotificationPreferences = createDefaultPreferences();

function normalizeLocale(locale: string | null | undefined): SupportedLocale {
  return parseSupportedLocale(locale) ?? getStoredLocalePreference();
}

function normalizePreferences(
  input: Partial<UserNotificationPreferences> | null | undefined
): UserNotificationPreferences {
  return {
    cookieConsent: input?.cookieConsent ?? defaultPreferences.cookieConsent,
    emailNotifications: input?.emailNotifications ?? defaultPreferences.emailNotifications,
    inAppNotifications: input?.inAppNotifications ?? defaultPreferences.inAppNotifications,
    locale: normalizeLocale(input?.locale),
    marketingEmails: input?.marketingEmails ?? defaultPreferences.marketingEmails,
    pushNotifications: input?.pushNotifications ?? defaultPreferences.pushNotifications
  };
}

export const useUserPreferencesStore = create<UserPreferencesState>((set, get) => ({
  error: null,
  hydrated: false,
  isSaving: false,
  preferences: defaultPreferences,
  async hydrate() {
    if (!getStoredSession()) {
      const preferences = createDefaultPreferences();

      set({
        error: null,
        hydrated: true,
        preferences
      });
      syncLocaleCookie(preferences.locale);
      return;
    }

    try {
      const response = await fetchWithSession("/api/v1/notifications/preferences", {
        cache: "no-store"
      });

      if (!response.ok) {
        throw new Error(`Falha ao carregar preferencias (${response.status}).`);
      }

      const payload = (await response.json()) as {
        preferences?: Partial<UserNotificationPreferences>;
      };
      const preferences = normalizePreferences(payload.preferences);

      syncLocaleCookie(preferences.locale);
      set({
        error: null,
        hydrated: true,
        preferences
      });
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : "Falha ao carregar preferencias.",
        hydrated: true
      });
    }
  },
  async update(next) {
    if (!getStoredSession()) {
      return null;
    }

    const previous = get().preferences;
    const optimistic = normalizePreferences({
      ...previous,
      ...next
    });

    syncLocaleCookie(optimistic.locale);
    set({
      error: null,
      isSaving: true,
      preferences: optimistic
    });

    try {
      const response = await fetchWithSession("/api/v1/notifications/preferences", {
        body: JSON.stringify(next),
        headers: {
          "content-type": "application/json"
        },
        method: "PUT"
      });

      if (!response.ok) {
        throw new Error(`Falha ao salvar preferencias (${response.status}).`);
      }

      const payload = (await response.json()) as {
        preferences?: Partial<UserNotificationPreferences>;
      };
      const preferences = normalizePreferences(payload.preferences);

      syncLocaleCookie(preferences.locale);
      set({
        error: null,
        isSaving: false,
        preferences
      });

      return preferences;
    } catch (error) {
      syncLocaleCookie(previous.locale);
      set({
        error: error instanceof Error ? error.message : "Falha ao salvar preferencias.",
        isSaving: false,
        preferences: previous
      });

      return null;
    }
  }
}));
