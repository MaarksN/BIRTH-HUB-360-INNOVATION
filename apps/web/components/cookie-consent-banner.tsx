"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import { getStoredSession } from "../lib/auth-client";
import { useI18n } from "../providers/I18nProvider";
import { useUserPreferencesStore } from "../stores/user-preferences-store";

export function CookieConsentBanner() {
  const { dictionary: copy } = useI18n();
  const hydrated = useUserPreferencesStore((state) => state.hydrated);
  const isSaving = useUserPreferencesStore((state) => state.isSaving);
  const preferences = useUserPreferencesStore((state) => state.preferences);
  const update = useUserPreferencesStore((state) => state.update);
  const [session, setSession] = useState<ReturnType<typeof getStoredSession> | null | undefined>(
    undefined
  );

  useEffect(() => {
    setSession(getStoredSession());
  }, []);

  if (session === undefined || !session || !hydrated || preferences.cookieConsent !== "PENDING") {
    return null;
  }

  return (
    <aside className="cookie-consent-banner">
      <div className="cookie-consent-banner__copy">
        <strong>{copy.consentBanner.title}</strong>
        <p className="cookie-consent-banner__description">{copy.consentBanner.description}</p>
      </div>
      <div className="cookie-consent-banner__actions">
        <button
          className="action-button"
          disabled={isSaving}
          onClick={() => {
            void update({
              cookieConsent: "ACCEPTED"
            });
          }}
          type="button"
        >
          {copy.consentBanner.accept}
        </button>
        <button
          className="ghost-button ghost-button--inverse"
          disabled={isSaving}
          onClick={() => {
            void update({
              cookieConsent: "REJECTED"
            });
          }}
          type="button"
        >
          {copy.consentBanner.reject}
        </button>
        <Link className="cookie-consent-banner__link" href="/settings/privacy">
          {copy.consentBanner.settings}
        </Link>
      </div>
    </aside>
  );
}

