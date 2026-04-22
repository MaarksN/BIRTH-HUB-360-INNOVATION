import assert from "node:assert/strict";
import test from "node:test";

import {
  formatDateTime,
  formatPtBrDateTime,
  getDictionary,
  parseSupportedLocale,
  resolveLocale
} from "../lib/i18n";

void test("pt-BR dictionary exposes canonical product navigation and consent copy", () => {
  const copy = getDictionary();
  const conversationsItem = copy.navbar.items.find((item) => item.href === "/conversations");
  const chatbookItem = copy.navbar.items.find((item) => item.href === "/agents/chatbook-inteligentissimo");
  const marketplaceItem = copy.navbar.items.find((item) => item.href === "/marketplace");

  assert.equal(copy.navbar.identityTitle, "Central de Operacao");
  assert.equal(copy.navbar.items[0]?.href, "/dashboard");
  assert.equal(conversationsItem?.label, "Conversas");
  assert.equal(chatbookItem?.label, "ChatBook");
  assert.equal(marketplaceItem?.label, "Marketplace");
  assert.equal(copy.navbar.items.at(-1)?.href, "/sales-os");
  assert.equal(copy.navbar.premiumLinkTitle, "Abrir colecao premium executiva");
  assert.equal(copy.consentBanner.settings, "Abrir central LGPD");
  assert.equal(copy.dashboardHome.badge, "Home do produto");
  assert.equal(copy.notificationPreferencesPage.interfaceLanguageHeading, "Idioma da interface");
  assert.equal(copy.notificationPreferencesPage.themeHeading, "Tema do dashboard");
});

void test("formatPtBrDateTime uses the pt-BR locale baseline", () => {
  const formatted = formatPtBrDateTime("2026-04-07T12:34:00.000Z", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    timeZone: "UTC"
  });

  assert.equal(formatted, "07/04/2026");
});

void test("resolveLocale falls back to pt-BR and accepts accept-language headers", () => {
  assert.equal(resolveLocale(), "pt-BR");
  assert.equal(resolveLocale("en-US,en;q=0.9,pt-BR;q=0.8"), "en-US");
  assert.equal(resolveLocale("fr-FR,pt-BR;q=0.9"), "pt-BR");
  assert.equal(parseSupportedLocale("en"), "en-US");
  assert.equal(parseSupportedLocale("pt-BR"), "pt-BR");
  assert.equal(parseSupportedLocale("fr-FR"), null);
});

void test("en-US dictionary exposes translated navigation and dashboard copy", () => {
  const copy = getDictionary("en-US");
  const chatbookItem = copy.navbar.items.find((item) => item.href === "/agents/chatbook-inteligentissimo");
  const marketplaceItem = copy.navbar.items.find((item) => item.href === "/marketplace");

  assert.equal(copy.navbar.identityTitle, "Operations Hub");
  assert.equal(copy.navbar.items[1]?.label, "Patients");
  assert.equal(chatbookItem?.label, "ChatBook");
  assert.equal(marketplaceItem?.label, "Marketplace");
  assert.equal(copy.navbar.items.at(-1)?.label, "Sales OS");
  assert.equal(copy.navbar.premiumLinkLabel, "Premium");
  assert.equal(copy.workflowsPage.backHome, "Back to home");
  assert.equal(copy.dashboardHome.noUsageTitle, "No recorded usage");
  assert.equal(copy.notificationPreferencesPage.interfaceLanguageLabel, "Language");
  assert.equal(copy.notificationPreferencesPage.darkThemeLabel, "Dark");
});

void test("formatDateTime honors the requested locale", () => {
  const formatted = formatDateTime("en-US", "2026-04-07T12:34:00.000Z", {
    day: "2-digit",
    month: "2-digit",
    timeZone: "UTC",
    year: "numeric"
  });

  assert.equal(formatted, "04/07/2026");
});
