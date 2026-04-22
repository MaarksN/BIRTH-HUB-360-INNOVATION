import assert from "node:assert/strict";
import test from "node:test";

import { JSDOM } from "jsdom";
import React, { act } from "react";
import { hydrateRoot } from "react-dom/client";
import { renderToString } from "react-dom/server";

void test("login page hydrates without mismatch", async () => {
  const { LoginForm } = await import("../components/login-form");
  const markup = renderToString(
    React.createElement(LoginForm, {
      initialRequestId: "req_test",
      navigate: () => undefined
    })
  );

  const dom = new JSDOM(`<div id="root">${markup}</div>`, {
    url: "http://localhost:3001/login"
  });
  const container = dom.window.document.getElementById("root");

  if (!container) {
    throw new Error("Root container not found.");
  }

  const originalWindow = globalThis.window;
  const originalDocument = globalThis.document;
  const originalNavigator = globalThis.navigator;
  const originalConsoleError = console.error;
  const reactActGlobal = globalThis as typeof globalThis & {
    IS_REACT_ACT_ENVIRONMENT?: boolean;
  };
  const originalActEnvironment = reactActGlobal.IS_REACT_ACT_ENVIRONMENT;
  const hydrationErrors: string[] = [];
  let root: ReturnType<typeof hydrateRoot> | null = null;

  Object.defineProperty(globalThis, "window", { configurable: true, value: dom.window });
  Object.defineProperty(globalThis, "document", { configurable: true, value: dom.window.document });
  Object.defineProperty(globalThis, "navigator", { configurable: true, value: dom.window.navigator });
  reactActGlobal.IS_REACT_ACT_ENVIRONMENT = true;

  console.error = (...args: unknown[]) => {
    hydrationErrors.push(args.join(" "));
  };

  const waitForHydration = () =>
    new Promise((resolve) => {
      dom.window.setTimeout(resolve, 0);
    });

  try {
    await act(async () => {
      root = hydrateRoot(
        container,
        React.createElement(LoginForm, {
          initialRequestId: "req_test",
          navigate: () => undefined
        })
      );
      await waitForHydration();
    });

    assert.deepEqual(hydrationErrors, []);
  } finally {
    if (root) {
      await act(async () => {
        root?.unmount();
        await waitForHydration();
      });
    }

    dom.window.close();
    console.error = originalConsoleError;

    if (originalActEnvironment === undefined) {
      delete reactActGlobal.IS_REACT_ACT_ENVIRONMENT;
    } else {
      reactActGlobal.IS_REACT_ACT_ENVIRONMENT = originalActEnvironment;
    }

    Object.defineProperty(globalThis, "window", { configurable: true, value: originalWindow });
    Object.defineProperty(globalThis, "document", { configurable: true, value: originalDocument });
    Object.defineProperty(globalThis, "navigator", { configurable: true, value: originalNavigator });
  }
});
