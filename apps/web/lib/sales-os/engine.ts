import { fetchWithTimeout } from "../fetch-with-timeout";

import { findSalesOsTool, salesOsModuleMap } from "./catalog";
import { resolveGeminiVisionConfig, resolveSalesOsProviders } from "./config";
import type { SalesOsChatMessage, SalesOsModuleId, SalesOsTool } from "./types";

type ChatRole = "assistant" | "system" | "user";

type LlmMessage = {
  content: string;
  role: ChatRole;
};

type SalesOsImageInput = {
  data: string;
  mimeType: string;
  name?: string;
};

type TextGenerationResult = {
  provider: string;
  text: string;
};

type ToolExecutionInput = {
  fields: Record<string, string>;
  image?: SalesOsImageInput | null;
  toolId: string;
};

type ChatExecutionInput = {
  currentModule: SalesOsModuleId;
  history?: SalesOsChatMessage[];
  input: string;
  mentor?: boolean;
  toolId?: string;
};

const OPENAI_API_URL = "https://api.openai.com/v1/chat/completions";
const ANTHROPIC_API_URL = "https://api.anthropic.com/v1/messages";
const GEMINI_API_URL = "https://generativelanguage.googleapis.com/v1beta";
const SALES_OS_PROVIDER_TIMEOUT_MS = 15_000;

function getConfiguredProviders() {
  return resolveSalesOsProviders();
}

function normalizeWhitespace(value: string): string {
  return value.replace(/\r\n/g, "\n").trim();
}

function formatFieldSummary(tool: SalesOsTool, fields: Record<string, string>): string {
  const knownLabels = new Map((tool.fields ?? []).map((field) => [field.id, field.label]));
  const lines = Object.entries(fields)
    .map(([fieldId, value]) => [knownLabels.get(fieldId) ?? fieldId, value.trim()] as const)
    .filter(([, value]) => value.length > 0)
    .map(([label, value]) => `- ${label}: ${value}`);

  return lines.length > 0 ? lines.join("\n") : "- Nenhum contexto adicional informado.";
}

function formatHistory(history: SalesOsChatMessage[]): string {
  if (history.length === 0) {
    return "Sem historico anterior.";
  }

  return history
    .map((message) => `${message.role === "assistant" ? "Assistente" : "Usuario"}: ${message.text}`)
    .join("\n");
}

async function callJson<T>(
  url: string,
  init: RequestInit & {
    headers?: Record<string, string>;
  }
): Promise<T> {
  const response = await fetchWithTimeout(url, {
    ...init,
    timeoutMessage: `Sales OS provider request exceeded the ${SALES_OS_PROVIDER_TIMEOUT_MS}ms timeout budget.`,
    timeoutMs: SALES_OS_PROVIDER_TIMEOUT_MS,
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`${response.status} ${response.statusText}: ${errorText}`);
  }

  return (await response.json()) as T;
}

async function generateWithOpenAi(messages: LlmMessage[], model: string, apiKey: string) {
  const response = await callJson<{
    choices?: Array<{
      message?: {
        content?: string;
      };
    }>;
  }>(OPENAI_API_URL, {
    body: JSON.stringify({
      max_tokens: 1400,
      messages,
      model,
      temperature: 0.4,
    }),
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    method: "POST",
  });

  return response.choices?.[0]?.message?.content?.trim() ?? "";
}

async function generateWithAnthropic(messages: LlmMessage[], model: string, apiKey: string) {
  const system = messages.find((message) => message.role === "system")?.content;
  const conversation = messages
    .filter((message) => message.role !== "system")
    .map((message) => ({
      content: message.content,
      role: message.role === "assistant" ? "assistant" : "user",
    }));

  const response = await callJson<{
    content?: Array<{
      text?: string;
    }>;
  }>(ANTHROPIC_API_URL, {
    body: JSON.stringify({
      max_tokens: 1400,
      messages: conversation,
      model,
      system,
      temperature: 0.4,
    }),
    headers: {
      "Content-Type": "application/json",
      "anthropic-version": "2023-06-01",
      "x-api-key": apiKey,
    },
    method: "POST",
  });

  return (
    response.content
      ?.map((entry) => entry.text ?? "")
      .join("\n")
      .trim() ?? ""
  );
}

async function generateWithGemini(messages: LlmMessage[], model: string, apiKey: string) {
  const systemMessage = messages.find((message) => message.role === "system")?.content;
  const response = await callJson<{
    candidates?: Array<{
      content?: {
        parts?: Array<{
          text?: string;
        }>;
      };
    }>;
  }>(`${GEMINI_API_URL}/models/${model}:generateContent?key=${apiKey}`, {
    body: JSON.stringify({
      contents: messages
        .filter((message) => message.role !== "system")
        .map((message) => ({
          parts: [{ text: message.content }],
          role: message.role === "assistant" ? "model" : "user",
        })),
      generationConfig: {
        maxOutputTokens: 1400,
        temperature: 0.4,
      },
      ...(systemMessage
        ? {
            systemInstruction: {
              parts: [{ text: systemMessage }],
            },
          }
        : {}),
    }),
    headers: {
      "Content-Type": "application/json",
    },
    method: "POST",
  });

  return (
    response.candidates?.[0]?.content?.parts
      ?.map((part) => part.text ?? "")
      .join("\n")
      .trim() ?? ""
  );
}

async function generateWithGeminiVision(
  prompt: string,
  image: SalesOsImageInput,
  model: string,
  apiKey: string
) {
  const response = await callJson<{
    candidates?: Array<{
      content?: {
        parts?: Array<{
          text?: string;
        }>;
      };
    }>;
  }>(`${GEMINI_API_URL}/models/${model}:generateContent?key=${apiKey}`, {
    body: JSON.stringify({
      contents: [
        {
          parts: [
            {
              text: prompt,
            },
            {
              inlineData: {
                data: image.data,
                mimeType: image.mimeType,
              },
            },
          ],
          role: "user",
        },
      ],
      generationConfig: {
        maxOutputTokens: 1400,
        temperature: 0.4,
      },
    }),
    headers: {
      "Content-Type": "application/json",
    },
    method: "POST",
  });

  return (
    response.candidates?.[0]?.content?.parts
      ?.map((part) => part.text ?? "")
      .join("\n")
      .trim() ?? ""
  );
}

async function generateText(messages: LlmMessage[]): Promise<TextGenerationResult> {
  const providers = getConfiguredProviders();

  for (const provider of providers) {
    try {
      if (provider.name === "openai") {
        return {
          provider: provider.name,
          text: await generateWithOpenAi(messages, provider.model, provider.apiKey),
        };
      }

      if (provider.name === "anthropic") {
        return {
          provider: provider.name,
          text: await generateWithAnthropic(messages, provider.model, provider.apiKey),
        };
      }

      return {
        provider: provider.name,
        text: await generateWithGemini(messages, provider.model, provider.apiKey),
      };
    } catch {
      continue;
    }
  }

  return {
    provider: "fallback",
    text: "",
  };
}

function buildExecutionFallback(
  tool: SalesOsTool,
  fieldSummary: string,
  imageProvided: boolean
): string {
  const lines = [
    `Ferramenta: ${tool.name}`,
    `Objetivo: ${tool.desc}`,
    "",
    "Modo local de contingencia ativado.",
    "Nenhum provedor de LLM respondeu, entao o Sales OS montou um plano operacional estruturado a partir do contexto enviado.",
    "",
    "Prompt base:",
    tool.prompt,
    "",
    "Contexto recebido:",
    fieldSummary,
  ];

  if (imageProvided) {
    lines.push("", "Imagem recebida: sim (analise multimodal indisponivel sem GEMINI_API_KEY).");
  }

  lines.push(
    "",
    "Proxima melhor acao:",
    "1. Resuma os sinais mais importantes do contexto em 3 bullets.",
    "2. Transforme esses sinais em um playbook pratico de abordagem.",
    "3. Liste perguntas criticas que faltam para aumentar a precisao da resposta.",
    "4. Gere a primeira entrega acionavel para o time comercial."
  );

  return lines.join("\n");
}

function buildChatFallback(input: ChatExecutionInput, tool?: SalesOsTool): string {
  const moduleName = salesOsModuleMap[input.currentModule]?.title ?? input.currentModule;

  if (tool?.isChat) {
    return [
      `${tool.name} em modo local:`,
      `Recebi sua mensagem: "${input.input}"`,
      "",
      "Resposta simulada:",
      "Entendi o contexto e vou pressionar sua argumentacao com uma objecao realista.",
      "Quero evidencias concretas de ROI, risco reduzido e urgencia para seguir na conversa.",
      "Tente responder em 3 partes: dor atual, impacto financeiro e proximo passo.",
    ].join("\n");
  }

  return [
    `Mentor ${moduleName} em modo local.`,
    `Recebi sua pergunta: "${input.input}"`,
    "",
    "Direcao recomendada:",
    "1. Defina o resultado de negocio que voce quer mover.",
    "2. Traduza isso para uma mensagem curta e uma prova de valor.",
    "3. Escolha um unico CTA para o proximo contato.",
    "4. Se quiser, cole mais contexto e eu estruturo um roteiro completo.",
  ].join("\n");
}

export async function executeSalesOsTool(input: ToolExecutionInput) {
  const tool = findSalesOsTool(input.toolId);
  const geminiVisionConfig = resolveGeminiVisionConfig();

  if (!tool) {
    throw new Error("Ferramenta Sales OS nao encontrada.");
  }

  const fieldSummary = formatFieldSummary(tool, input.fields);
  const imageProvided = Boolean(input.image?.data);

  if (tool.isImage) {
    const imageBriefPrompt = [
      "Voce atua como diretor de criacao para um Sales OS B2B.",
      `Ferramenta: ${tool.name}`,
      `Objetivo: ${tool.prompt}`,
      "",
      "Gere uma entrega em portugues com estas secoes exatas:",
      "1. Conceito visual",
      "2. Prompt final para modelo de imagem",
      "3. Negative prompt",
      "4. Direcao de arte",
      "5. Variacoes para teste",
      "",
      "Contexto:",
      fieldSummary,
    ].join("\n");

    const result = await generateText([
      {
        content:
          "Responda como um diretor de criacao conciso, visual e orientado a conversao. Evite floreios.",
        role: "system",
      },
      {
        content: imageBriefPrompt,
        role: "user",
      },
    ]);

    return {
      mode: "image-brief" as const,
      output:
        result.text.length > 0
          ? normalizeWhitespace(result.text)
          : buildExecutionFallback(tool, fieldSummary, imageProvided),
      provider: result.provider,
    };
  }

  if (tool.acceptsImage && input.image?.data && geminiVisionConfig) {
    const prompt = [
      `Ferramenta: ${tool.name}`,
      `Objetivo: ${tool.prompt}`,
      "",
      "Analise a imagem anexada e responda em portugues com estrutura profissional, bullets e recomendacoes praticas.",
      "",
      "Contexto adicional:",
      fieldSummary,
    ].join("\n");

    try {
      const text = await generateWithGeminiVision(
        prompt,
        input.image,
        geminiVisionConfig.model,
        geminiVisionConfig.apiKey
      );

      return {
        mode: "text" as const,
        output: normalizeWhitespace(text),
        provider: "gemini",
      };
    } catch {
      return {
        mode: "text" as const,
        output: buildExecutionFallback(tool, fieldSummary, imageProvided),
        provider: "fallback",
      };
    }
  }

  const instruction = [
    `Ferramenta: ${tool.name}`,
    `Objetivo: ${tool.prompt}`,
    "",
    "Produza uma resposta profissional, clara e imediatamente acionavel em portugues do Brasil.",
    "Use secoes curtas, bullets quando fizer sentido e mantenha foco comercial.",
    tool.useSearch
      ? "Se a tarefa depender de dados atuais e voce nao tiver confirmacao temporal, sinalize a limitacao e trabalhe com hipoteses explicitas."
      : "Nao invente fatos especificos; quando houver lacuna, assuma explicitamente.",
    "",
    "Contexto recebido:",
    fieldSummary,
  ].join("\n");

  const result = await generateText([
    {
      content:
        "Voce e um operador senior do BirthHub Sales OS. Entregue respostas densas em valor e economicas em palavras.",
      role: "system",
    },
    {
      content: instruction,
      role: "user",
    },
  ]);

  return {
    mode: "text" as const,
    output:
      result.text.length > 0
        ? normalizeWhitespace(result.text)
        : buildExecutionFallback(tool, fieldSummary, imageProvided),
    provider: result.provider,
  };
}

export async function executeSalesOsChat(input: ChatExecutionInput) {
  const tool = input.toolId ? findSalesOsTool(input.toolId) : undefined;
  const history = input.history ?? [];
  const systemPrompt = input.mentor
    ? [
        `Voce e o Mentor ${salesOsModuleMap[input.currentModule]?.title ?? input.currentModule} do BirthHub Sales OS.`,
        "Responda sempre em pt-BR, com orientacao pratica, clareza executiva e tom direto.",
        "Quando faltar contexto, faca uma melhor proxima recomendacao e liste o que falta.",
      ].join(" ")
    : [
        tool?.persona ?? `Voce representa o papel ${tool?.name ?? "Sales OS"}.`,
        "Permaneça no personagem, responda em pt-BR e pressione o usuario com realismo comercial.",
      ].join(" ");

  const messages: LlmMessage[] = [
    {
      content: systemPrompt,
      role: "system",
    },
    ...history.map((message) => ({
      content: message.text,
      role: message.role,
    })),
    {
      content: input.input,
      role: "user",
    },
  ];

  const result = await generateText(messages);

  return {
    output:
      result.text.length > 0 ? normalizeWhitespace(result.text) : buildChatFallback(input, tool),
    provider: result.provider,
    transcript: formatHistory(history),
  };
}
