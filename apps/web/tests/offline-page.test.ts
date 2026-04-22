import assert from "node:assert/strict";
import test from "node:test";

import React from "react";
import { renderToString } from "react-dom/server";

void test("offline page renders contingency messaging", async () => {
  const { default: OfflinePage } = await import("../app/offline/page");
  const markup = renderToString(React.createElement(OfflinePage));

  assert.match(markup, /Modo offline/);
  assert.match(markup, /Tentar novamente/);
  assert.match(markup, /Ver healthcheck/);
});

