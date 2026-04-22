export type SalesOsProviderName = "anthropic" | "gemini" | "openai";

export type SalesOsProviderConfig = {
  apiKey: string;
  model: string;
  name: SalesOsProviderName;
};

type SalesOsEnvironment = Partial<
  Record<
    | "ANTHROPIC_API_KEY"
    | "ANTHROPIC_MODEL"
    | "GEMINI_API_KEY"
    | "GEMINI_MODEL"
    | "OPENAI_API_KEY"
    | "OPENAI_MODEL",
    string | undefined
  >
>;

export function resolveSalesOsProviders(
  env?: SalesOsEnvironment
): SalesOsProviderConfig[] {
  const source = env ?? (process.env as SalesOsEnvironment);
  const providers: SalesOsProviderConfig[] = [];

  if (source.OPENAI_API_KEY) {
    providers.push({
      apiKey: source.OPENAI_API_KEY,
      model: source.OPENAI_MODEL ?? "gpt-4o-mini",
      name: "openai"
    });
  }

  if (source.ANTHROPIC_API_KEY) {
    providers.push({
      apiKey: source.ANTHROPIC_API_KEY,
      model: source.ANTHROPIC_MODEL ?? "claude-3-5-sonnet-latest",
      name: "anthropic"
    });
  }

  if (source.GEMINI_API_KEY) {
    providers.push({
      apiKey: source.GEMINI_API_KEY,
      model: source.GEMINI_MODEL ?? "gemini-1.5-pro",
      name: "gemini"
    });
  }

  return providers;
}

export function resolveGeminiVisionConfig(
  env?: SalesOsEnvironment
): Pick<SalesOsProviderConfig, "apiKey" | "model"> | null {
  const source = env ?? (process.env as SalesOsEnvironment);

  if (!source.GEMINI_API_KEY) {
    return null;
  }

  return {
    apiKey: source.GEMINI_API_KEY,
    model: source.GEMINI_MODEL ?? "gemini-1.5-pro"
  };
}
