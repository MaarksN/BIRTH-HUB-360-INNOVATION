import { cookies, headers } from "next/headers";

import {
  LOCALE_COOKIE_NAME,
  parseSupportedLocale,
  resolveLocale,
  type SupportedLocale
} from "./i18n";

export async function getRequestLocale(): Promise<SupportedLocale> {
  const requestCookies = await cookies();
  const cookieLocale = parseSupportedLocale(requestCookies.get(LOCALE_COOKIE_NAME)?.value);

  if (cookieLocale) {
    return cookieLocale;
  }

  const requestHeaders = await headers();
  return resolveLocale(requestHeaders.get("accept-language"));
}

