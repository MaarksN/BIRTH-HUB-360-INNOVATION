"use client";

import { createContext, useContext, type ReactNode } from "react";

import {
  formatDateTime,
  formatNumber,
  getDictionary,
  type Dictionary,
  type SupportedLocale
} from "../lib/i18n";

type I18nContextValue = {
  dictionary: Dictionary;
  formatDateTime: (value: Date | string, options?: Intl.DateTimeFormatOptions) => string;
  formatNumber: (value: number, options?: Intl.NumberFormatOptions) => string;
  locale: SupportedLocale;
};

const I18nContext = createContext<I18nContextValue | null>(null);

export function I18nProvider(input: {
  children: ReactNode;
  locale: SupportedLocale;
}) {
  const dictionary = getDictionary(input.locale);

  return (
    <I18nContext.Provider
      value={{
        dictionary,
        formatDateTime: (value, options) => formatDateTime(input.locale, value, options),
        formatNumber: (value, options) => formatNumber(input.locale, value, options),
        locale: input.locale
      }}
    >
      {input.children}
    </I18nContext.Provider>
  );
}

export function useI18n(): I18nContextValue {
  const context = useContext(I18nContext);

  if (!context) {
    throw new Error("useI18n must be used within I18nProvider.");
  }

  return context;
}

