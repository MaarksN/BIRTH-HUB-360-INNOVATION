"use client";

import { Suspense, type ReactNode, useEffect } from "react";

import { CookieConsentBanner } from "../components/cookie-consent-banner";
import { ToastViewport } from "../components/dashboard/ToastViewport";
import type { SupportedLocale } from "../lib/i18n";
import { PaywallProvider } from "../components/paywall-provider";
import { AnalyticsProvider } from "./AnalyticsProvider";
import { EngagementProvider } from "./EngagementProvider";
import { I18nProvider } from "./I18nProvider";
import { ThemeProvider } from "./ThemeProvider";

function ServiceWorkerBootstrap() {
  useEffect(() => {
    if (!("serviceWorker" in navigator)) {
      return;
    }

    void navigator.serviceWorker.register("/sw.js").catch(() => undefined);
  }, []);

  return null;
}

export function AppProviders({
  children,
  locale
}: Readonly<{
  children: ReactNode;
  locale: SupportedLocale;
}>) {
  return (
    <I18nProvider locale={locale}>
      <ThemeProvider>
        <PaywallProvider>
          <EngagementProvider>
            <Suspense fallback={null}>
              <AnalyticsProvider>
                <ServiceWorkerBootstrap />
                {children}
                <CookieConsentBanner />
                <ToastViewport />
              </AnalyticsProvider>
            </Suspense>
          </EngagementProvider>
        </PaywallProvider>
      </ThemeProvider>
    </I18nProvider>
  );
}

