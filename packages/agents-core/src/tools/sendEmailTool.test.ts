import assert from "node:assert/strict";
import test from "node:test";

import { SendEmailTool } from "./sendEmailTool.js";

function readJsonBody(init?: RequestInit): Record<string, unknown> {
  const body = init?.body;
  if (typeof body !== "string") {
    throw new TypeError("Expected request body to be a JSON string");
  }
  return JSON.parse(body) as Record<string, unknown>;
}

void test("SendEmailTool requires explicit SendGrid credentials", async () => {
  const tool = new SendEmailTool();

  await assert.rejects(
    () =>
      tool.run(
        {
          html: "<p>hello</p>",
          subject: "Hello",
          to: "person@example.com"
        },
        {
          agentId: "agent-1",
          tenantId: "tenant-1"
        }
      ),
    /SENDGRID_API_KEY/
  );
});

void test("SendEmailTool sends mail with explicit configuration", async () => {
  let capturedInit: RequestInit | undefined;

  const tool = new SendEmailTool({
    apiKey: "sg-test-key",
    fetchImpl: (_input, init) => {
      capturedInit = init;
      return Promise.resolve(new Response(null, {
        headers: {
          "x-message-id": "msg-123"
        },
        status: 202
      }));
    },
    fromEmail: "noreply@example.com"
  });

  const output = await tool.run(
    {
      html: "<p>hello</p>",
      subject: "Hello",
      to: "person@example.com"
    },
    {
      agentId: "agent-1",
      tenantId: "tenant-1"
    }
  );

  const payload = readJsonBody(capturedInit) as {
    from: { email: string };
    personalizations: Array<{ custom_args: { tenant_id: string } }>;
    subject?: string;
  };
  const headers = new Headers(capturedInit?.headers);

  assert.deepEqual(output, {
    accepted: true,
    messageId: "msg-123",
    statusCode: 202
  });
  assert.equal(headers.get("Authorization"), "Bearer sg-test-key");
  assert.equal(headers.get("Content-Type"), "application/json");
  assert.equal(payload.from.email, "noreply@example.com");
  assert.equal(payload.personalizations[0]?.custom_args.tenant_id, "tenant-1");
  assert.equal(payload.subject, "Hello");
});
