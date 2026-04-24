import assert from "node:assert/strict";
import test from "node:test";

import { LLMClient } from "./index.js";

void test("llm client fails fast when no providers are configured", async () => {
  const client = new LLMClient({ providers: {} });

  await assert.rejects(
    () => client.chat([{ content: "hello", role: "user" }]),
    (error) => error instanceof Error && error.message === "All LLM providers failed or not configured."
  );
});

void test("llm client falls back to the next provider on chat failures", async () => {
  const client = new LLMClient({ providers: {} });

  client.clients = {
    anthropic: {
      async chat() {
        return {
          content: "fallback-response",
          model: "claude-fallback"
        };
      },
      async *stream() {
        yield "unused";
      }
    },
    openai: {
      async chat() {
        throw "rate-limit";
      },
      async *stream() {
        yield "unused";
      }
    }
  };
  client.fallbackOrder = ["openai", "anthropic"];

  const response = await client.chat([{ content: "hello", role: "user" }]);

  assert.equal(response.content, "fallback-response");
  assert.equal(response.model, "claude-fallback");
});

void test("llm client falls back to the next provider on stream failures", async () => {
  const client = new LLMClient({ providers: {} });

  client.clients = {
    anthropic: {
      async chat() {
        return {
          content: "unused",
          model: "claude-fallback"
        };
      },
      async *stream() {
        yield "chunk-1";
        yield "chunk-2";
      }
    },
    openai: {
      async chat() {
        return {
          content: "unused",
          model: "gpt-failing"
        };
      },
      async *stream() {
        throw new Error("stream failed");
      }
    }
  };
  client.fallbackOrder = ["openai", "anthropic"];

  const chunks: string[] = [];
  for await (const chunk of client.stream([{ content: "hello", role: "user" }])) {
    chunks.push(chunk);
  }

  assert.deepEqual(chunks, ["chunk-1", "chunk-2"]);
});
