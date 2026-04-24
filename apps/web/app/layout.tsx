import React from "react";
import type { Metadata } from "next";
import {
  Fraunces,
  IBM_Plex_Mono,
  IBM_Plex_Sans
} from "next/font/google";

import "./globals.css";
import { LegalFooter } from "../components/legal-footer";
import { getRequestLocale } from "../lib/i18n.server";
import { AppProviders } from "../providers/AppProviders";

const sansFont = IBM_Plex_Sans({
  subsets: ["latin"],
  variable: "--font-inter",
  weight: ["400", "500", "600", "700"]
});

const displayFont = Fraunces({
  subsets: ["latin"],
  variable: "--font-outfit",
  weight: ["600", "700"]
});

const monoFont = IBM_Plex_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
  weight: ["400", "500", "600"]
});

export const metadata: Metadata = {
  description:
    "BirthHub 360: sistema operacional de receita com Sales OS, agentes autonomos, workflows, integracoes e billing.",
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
    <html
      className={`${sansFont.variable} ${displayFont.variable} ${monoFont.variable}`}
      lang={locale}
      suppressHydrationWarning
    >
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

