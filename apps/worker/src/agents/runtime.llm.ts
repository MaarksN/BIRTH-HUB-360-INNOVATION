import type { AgentLearningRecord, AgentManifest, ManagedAgentPolicy } from "@birthub/agents-core";
import { LLMClient } from "@birthub/llm-client";
import { z } from "zod";

export interface RuntimeLlmLikeClient {
  chat(messages: Array<{ content: string; role: "system" | "user" }>): Promise<{ content: string }>;
}

export interface RuntimeLlmContext {
  input: Record<string, unknown>;
  manifest: AgentManifest;
  memory?: Record<string, unknown>;
  policies?: ManagedAgentPolicy[];
  systemPrompt: string;
  toolCatalog: Array<{ description: string; name: string }>;
}

const agentPlanSchema = z.object({
  planReasoning: z.string().min(1),
  toolCalls: z.array(
    z.object({
      input: z.record(z.string(), z.unknown()),
      tool: z.string().min(1)
    })
  )
});

export type GeneratedAgentPlan = z.infer<typeof agentPlanSchema>;

function parseJsonObject(text: string): unknown {
  const trimmed = text.trim();
  if (trimmed.startsWith("{") || trimmed.startsWith("[")) {
    return JSON.parse(trimmed);
  }

  const firstObjectStart = trimmed.indexOf("{");
  const lastObjectEnd = trimmed.lastIndexOf("}");
  if (firstObjectStart !== -1 && lastObjectEnd > firstObjectStart) {
    return JSON.parse(trimmed.slice(firstObjectStart, lastObjectEnd + 1));
  }

  throw new Error("LLM response does not contain a valid JSON object.");
}

function createDefaultClient(): RuntimeLlmLikeClient {
  return new LLMClient({
    providers: {
      ...(process.env.OPENAI_API_KEY ? { openai: { apiKey: process.env.OPENAI_API_KEY } } : {}),
      ...(process.env.ANTHROPIC_API_KEY ? { anthropic: { apiKey: process.env.ANTHROPIC_API_KEY } } : {}),
      ...(process.env.GEMINI_API_KEY ? { gemini: { apiKey: process.env.GEMINI_API_KEY } } : {})
    }
  });
}

export async function generateStructuredObject<TSchema extends z.ZodTypeAny>(input: {
  context: RuntimeLlmContext;
  llmClient?: RuntimeLlmLikeClient;
  schema: TSchema;
}): Promise<z.infer<TSchema>> {
  const client = input.llmClient ?? createDefaultClient();
  const response = await client.chat([
    {
      content: `${input.context.systemPrompt}\nReturn only valid JSON matching this schema shape: ${input.schema.toString()}`,
      role: "system"
    },
    {
      content: JSON.stringify({
        input: input.context.input,
        manifest: {
          agent: input.context.manifest.agent,
          tools: input.context.manifest.tools.map((tool) => ({
            description: tool.description,
            id: tool.id,
            name: tool.name
          }))
        },
        memory: input.context.memory ?? {},
        policies: input.context.policies ?? [],
        toolCatalog: input.context.toolCatalog
      }),
      role: "user"
    }
  ]);

  const parsed = parseJsonObject(response.content);
  return input.schema.parse(parsed);
}

export async function generateAgentPlan(input: {
  context: RuntimeLlmContext;
  llmClient?: RuntimeLlmLikeClient;
}): Promise<GeneratedAgentPlan> {
  return generateStructuredObject({
    context: input.context,
    llmClient: input.llmClient,
    schema: agentPlanSchema
  });
}
