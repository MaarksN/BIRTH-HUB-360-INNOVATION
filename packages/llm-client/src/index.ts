import {
  ILLMClient,
  Message,
  CompletionOptions,
  CompletionResponse,
  OpenAIClient,
  AnthropicClient,
  GeminiClient,
} from "@birthub/integrations";
import { logger } from "@birthub/utils";

export type LLMProvider = "openai" | "anthropic" | "gemini";

export interface LLMConfig {
  providers: {
    openai?: { apiKey: string; model?: string };
    anthropic?: { apiKey: string; model?: string };
    gemini?: { apiKey: string; model?: string };
  };
  fallbackOrder?: LLMProvider[];
}

function normalizeProviderError(error: unknown): Error {
  if (error instanceof Error) {
    return error;
  }

  if (typeof error === "string" && error.trim().length > 0) {
    return new Error(error);
  }

  try {
    return new Error(JSON.stringify(error));
  } catch {
    return new Error("Unknown LLM provider error.");
  }
}

export class LLMClient implements ILLMClient {
  private clients: Partial<Record<LLMProvider, ILLMClient>> = {};
  private fallbackOrder: LLMProvider[];

  constructor(config: LLMConfig) {
    this.fallbackOrder = config.fallbackOrder || [
      "openai",
      "anthropic",
      "gemini",
    ];

    if (config.providers.openai?.apiKey) {
      this.clients.openai = new OpenAIClient(
        config.providers.openai.apiKey,
        config.providers.openai.model,
      );
    }
    if (config.providers.anthropic?.apiKey) {
      this.clients.anthropic = new AnthropicClient(
        config.providers.anthropic.apiKey,
        config.providers.anthropic.model,
      );
    }
    if (config.providers.gemini?.apiKey) {
      this.clients.gemini = new GeminiClient(
        config.providers.gemini.apiKey,
        config.providers.gemini.model,
      );
    }
  }

  async chat(
    messages: Message[],
    options?: CompletionOptions,
  ): Promise<CompletionResponse> {
    let lastError: Error | null = null;

    for (const provider of this.fallbackOrder) {
      const client = this.clients[provider];
      if (!client) continue;

      try {
        logger.info(`Attempting LLM call with provider: ${provider}`);
        const result = await client.chat(messages, options);
        return result;
      } catch (error) {
        lastError = normalizeProviderError(error);
        logger.warn(`LLM call failed with provider ${provider}: ${lastError.message}`);
      }
    }

    throw lastError ?? new Error("All LLM providers failed or not configured.");
  }

  async *stream(
    messages: Message[],
    options?: CompletionOptions,
  ): AsyncGenerator<string, void, unknown> {
    let lastError: Error | null = null;

    for (const provider of this.fallbackOrder) {
      const client = this.clients[provider];
      if (!client) continue;

      try {
        logger.info(`Attempting LLM stream with provider: ${provider}`);
        for await (const chunk of client.stream(messages, options)) {
          yield chunk;
        }
        return;
      } catch (error) {
        lastError = normalizeProviderError(error);
        logger.warn(`LLM stream failed with provider ${provider}: ${lastError.message}`);
      }
    }

    throw lastError ?? new Error("All LLM providers failed or not configured.");
  }
}
