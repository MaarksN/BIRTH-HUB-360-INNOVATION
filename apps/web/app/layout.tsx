import React from "react";
import type { Metadata } from "next";

import "./globals.css";
import { LegalFooter } from "../components/legal-footer";
import { getRequestLocale } from "../lib/i18n.server";
import { AppProviders } from "../providers/AppProviders";

export const metadata: Metadata = {
  description: "BirthHub 360: multitenancy, workflow engine, marketplace de agentes e billing.",
  icons: {
    icon: "/brand/birthhub360-mark.svg",
    shortcut: "/brand/birthhub360-mark.svg"
  },
  manifest: "/manifest.json",
  title: "BirthHub 360"
};

export default async function RootLayout({
  children
}: Readonly<{ children: React.ReactNode }>) {
  const locale = await getRequestLocale();

  return (
    <html lang={locale} suppressHydrationWarning>
      <body>
        <AppProviders locale={locale}>
          <div className="app-shell">
            <div className="app-shell__content">{children}</div>
            <LegalFooter />
          </div>
        </AppProviders>
      </body>
    </html>
  );
}

