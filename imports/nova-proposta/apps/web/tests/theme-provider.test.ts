import assert from "node:assert/strict";
import test from "node:test";

import { JSDOM } from "jsdom";
import { act, createElement } from "react";
import { createRoot } from "react-dom/client";

import {
  ThemeProvider,
  useThemeMode
} from "../providers/ThemeProvider";

type MatchMediaResult = {
  addEventListener: () => void;
  addListener: () => void;
  dispatchEvent: () => false;
  matches: boolean;
  media: string;
  onchange: null;
  removeEventListener: () => void;
  removeListener: () => void;
};

function createMatchMedia(matches: boolean) {
  return (_query: string): MatchMediaResult => ({
    addEventListener: () => undefined,
    addListener: () => undefined,
    dispatchEvent: () => false,
    matches,
    media: "(prefers-color-scheme: dark)",
    onchange: null,
    removeEventListener: () => undefined,
    removeListener: () => undefined
  });
}

function ThemeProbe() {
  const { mode, toggleMode } = useThemeMode();
  return createElement(
    "button",
    {
      "data-mode": mode,
      id: "theme-toggle",
      onClick: toggleMode,
      type: "button"
    },
    mode
  );
}

void test("theme provider persists the chosen mode and updates document theme state", () => {
  const originalWindow = globalThis.window;
  const originalDocument = globalThis.document;
  const originalLocalStorage = globalThis.localStorage;
  const reactActEnvironmentTarget = globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean };
  const hadActEnvironment = "IS_REACT_ACT_ENVIRONMENT" in reactActEnvironmentTarget;
  const originalActEnvironment = reactActEnvironmentTarget.IS_REACT_ACT_ENVIRONMENT;

  const dom = new JSDOM("<div id='root'></div>", {
    url: "https://app.birthhub.test/dashboard"
  });
  Object.defineProperty(dom.window, "matchMedia", {
    configurable: true,
    value: createMatchMedia(true)
  });
  Object.defineProperty(globalThis, "window", { configurable: true, value: dom.window });
  Object.defineProperty(globalThis, "document", { configurable: true, value: dom.window.document });
  Object.defineProperty(globalThis, "localStorage", {
    configurable: true,
    value: dom.window.localStorage
  });
  reactActEnvironmentTarget.IS_REACT_ACT_ENVIRONMENT = true;

  const root = createRoot(dom.window.document.getElementById("root") as Element);

  try {
    act(() => {
      root.render(createElement(ThemeProvider, null, createElement(ThemeProbe)));
    });

    const button = dom.window.document.getElementById("theme-toggle");
    assert.equal(button?.getAttribute("data-mode"), "dark");
    assert.equal(dom.window.document.documentElement.dataset.theme, "dark");
    assert.equal(dom.window.localStorage.getItem("bh_theme_mode"), "dark");

    act(() => {
      button?.dispatchEvent(new dom.window.MouseEvent("click", { bubbles: true }));
    });

    assert.equal(button?.getAttribute("data-mode"), "light");
    assert.equal(dom.window.document.documentElement.dataset.theme, "light");
    assert.equal(dom.window.document.documentElement.style.colorScheme, "light");
    assert.equal(dom.window.localStorage.getItem("bh_theme_mode"), "light");
  } finally {
    act(() => {
      root.unmount();
    });
    Object.defineProperty(globalThis, "window", { configurable: true, value: originalWindow });
    Object.defineProperty(globalThis, "document", { configurable: true, value: originalDocument });
    Object.defineProperty(globalThis, "localStorage", {
      configurable: true,
      value: originalLocalStorage
    });
    if (hadActEnvironment && originalActEnvironment !== undefined) {
      reactActEnvironmentTarget.IS_REACT_ACT_ENVIRONMENT = originalActEnvironment;
    } else {
      Reflect.deleteProperty(reactActEnvironmentTarget, "IS_REACT_ACT_ENVIRONMENT");
    }
    dom.window.close();
  }
});

