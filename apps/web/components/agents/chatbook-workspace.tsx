"use client";

import {
  startTransition,
  useEffect,
  useEffectEvent,
  useRef,
  useState
} from "react";
import Link from "next/link";
import {
  ArrowUpRight,
  AudioLines,
  BrainCircuit,
  Download,
  ExternalLink,
  Globe,
  History,
  Mic,
  MicOff,
  Search,
  SlidersHorizontal,
  Sparkles,
  Trash2,
  Volume2,
  VolumeX,
  WandSparkles
} from "lucide-react";

import {
  buildChatbookConversationDraft,
  buildChatbookExportMarkdown,
  CHATBOOK_TOOLS,
  getChatbookQuickCommands,
  type ChatbookReply,
  type ChatbookTool
} from "../../lib/chatbook";
import {
  createChatbookAssistedWorkflow,
  createConversation,
  createOutputArtifact
} from "../../lib/product-api";

type BrowserSpeechRecognitionConstructor = new () => BrowserSpeechRecognition;

interface BrowserSpeechRecognitionResultAlternative {
  transcript: string;
}

interface BrowserSpeechRecognitionResult {
  0: BrowserSpeechRecognitionResultAlternative;
  isFinal: boolean;
  length: number;
}

interface BrowserSpeechRecognitionResultList {
  [index: number]: BrowserSpeechRecognitionResult;
  length: number;
}

interface BrowserSpeechRecognitionEventLike {
  resultIndex: number;
  results: BrowserSpeechRecognitionResultList;
}

interface BrowserSpeechRecognitionErrorEventLike {
  error: string;
}

interface BrowserSpeechRecognition extends EventTarget {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  onend: (() => void) | null;
  onerror: ((event: BrowserSpeechRecognitionErrorEventLike) => void) | null;
  onresult: ((event: BrowserSpeechRecognitionEventLike) => void) | null;
  abort(): void;
  start(): void;
  stop(): void;
}

declare global {
  interface Window {
    SpeechRecognition?: BrowserSpeechRecognitionConstructor;
    webkitSpeechRecognition?: BrowserSpeechRecognitionConstructor;
  }
}

interface ChatMessage {
  id: string;
  reply?: ChatbookReply;
  role: "assistant" | "user";
  text: string;
}

interface SimulationFormState {
  activeUsers: string;
  annualVolume: string;
  currentMonthlyCost: string;
  currentPlan: string;
  onboardingBacklog: string;
  recommendedPlan: string;
}

interface AttachmentContext {
  contentType?: string;
  name: string;
  size?: number;
  text: string;
}

const CHATBOOK_HISTORY_STORAGE_KEY = "birthub.chatbook.history.v1";
const MAX_ATTACHMENT_BYTES = 120_000;
const MAX_ATTACHMENT_TEXT_CHARS = 4_000;
const WELCOME_MESSAGE: ChatMessage = {
  id: "chatbook-welcome",
  role: "assistant",
  text:
    "Estou pronto para pesquisar na plataforma, complementar na web, simular cenarios e sugerir a proxima acao com transparencia."
};
const DEFAULT_SIMULATION_FORM: SimulationFormState = {
  activeUsers: "42",
  annualVolume: "920",
  currentMonthlyCost: "18400",
  currentPlan: "Growth Lite",
  onboardingBacklog: "17",
  recommendedPlan: "Growth Assistido"
};

const QUICK_COMMANDS = getChatbookQuickCommands();
const SIMULATOR_PRESETS = [
  {
    id: "economia-anual",
    label: "Economia anual",
    prompt: "Compare os planos deste cliente e simule a economia anual com recomendacao pratica."
  },
  {
    id: "roi-operacional",
    label: "ROI operacional",
    prompt: "Monte um cenario de ROI operacional com base, otimista e conservador."
  },
  {
    id: "web-validation",
    label: "Validacao externa",
    prompt: "Pesquise referencias confiaveis na web para validar este cenario e separe a origem."
  }
] as const;

function createMessageId(prefix: string): string {
  return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

function formatCurrency(value: number): string {
  return new Intl.NumberFormat("pt-BR", {
    currency: "BRL",
    maximumFractionDigits: 0,
    style: "currency"
  }).format(value);
}

function getToolIcon(tool: ChatbookTool) {
  if (tool === "busca_web") {
    return Globe;
  }

  if (tool === "simulacao" || tool === "comparacao") {
    return BrainCircuit;
  }

  if (tool === "acao_plataforma") {
    return WandSparkles;
  }

  return Search;
}

function getToolLabel(tool: ChatbookTool): string {
  return tool.replace(/_/g, " ");
}

function parsePositiveNumber(value: string): number | undefined {
  const normalized = value.replace(/\./g, "").replace(",", ".").trim();
  const parsed = Number(normalized);

  return Number.isFinite(parsed) && parsed >= 0 ? parsed : undefined;
}

function buildSimulationInput(form: SimulationFormState) {
  return {
    ...(parsePositiveNumber(form.activeUsers) !== undefined
      ? { activeUsers: parsePositiveNumber(form.activeUsers) }
      : {}),
    ...(parsePositiveNumber(form.annualVolume) !== undefined
      ? { annualVolume: parsePositiveNumber(form.annualVolume) }
      : {}),
    ...(parsePositiveNumber(form.currentMonthlyCost) !== undefined
      ? { currentMonthlyCost: parsePositiveNumber(form.currentMonthlyCost) }
      : {}),
    ...(form.currentPlan.trim() ? { currentPlan: form.currentPlan.trim() } : {}),
    ...(parsePositiveNumber(form.onboardingBacklog) !== undefined
      ? { onboardingBacklog: parsePositiveNumber(form.onboardingBacklog) }
      : {}),
    ...(form.recommendedPlan.trim() ? { recommendedPlan: form.recommendedPlan.trim() } : {})
  };
}

function isReadableTextAttachment(file: File): boolean {
  const extension = file.name.split(".").pop()?.toLowerCase() ?? "";
  const readableExtensions = new Set(["csv", "json", "log", "md", "txt", "tsv"]);

  return file.type.startsWith("text/") || readableExtensions.has(extension);
}

async function readAttachmentContexts(files: File[]): Promise<AttachmentContext[]> {
  const readableFiles = files
    .filter((file) => file.size <= MAX_ATTACHMENT_BYTES && isReadableTextAttachment(file))
    .slice(0, 4);
  const contexts = await Promise.all(
    readableFiles.map(async (file) => ({
      contentType: file.type || "text/plain",
      name: file.name,
      size: file.size,
      text: (await file.text()).slice(0, MAX_ATTACHMENT_TEXT_CHARS)
    }))
  );

  return contexts.filter((context) => context.text.trim().length > 0);
}

function normalizeStoredMessages(value: unknown): ChatMessage[] {
  if (!Array.isArray(value)) {
    return [WELCOME_MESSAGE];
  }

  const messages = value
    .filter((item): item is ChatMessage => {
      if (!item || typeof item !== "object") {
        return false;
      }

      const record = item as Record<string, unknown>;
      return (
        typeof record.id === "string" &&
        typeof record.text === "string" &&
        (record.role === "assistant" || record.role === "user")
      );
    })
    .slice(-40);

  return messages.length > 0 ? messages : [WELCOME_MESSAGE];
}

function matchesHistoryQuery(message: ChatMessage, query: string): boolean {
  if (!query.trim()) {
    return true;
  }

  const normalizedQuery = query.trim().toLowerCase();
  const haystack = [
    message.text,
    message.reply?.sections.resumo,
    message.reply?.router.intencaoPrincipal,
    ...(message.reply?.router.ferramentasNecessarias ?? [])
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();

  return haystack.includes(normalizedQuery);
}

function MessageBubble({ message, onRunFollowUp, onSpeak }: {
  message: ChatMessage;
  onRunFollowUp: (prompt: string) => void;
  onSpeak: (text: string) => void;
}) {
  if (message.role === "user") {
    return (
      <article className="chatbook-message chatbook-message--user">
        <div className="chatbook-message__meta">
          <span className="badge">Usuario</span>
        </div>
        <p>{message.text}</p>
      </article>
    );
  }

  return (
    <article className="chatbook-message chatbook-message--assistant">
      <div className="chatbook-message__meta">
        <span className="badge">ChatBook</span>
        {message.reply ? (
          <div className="chatbook-pill-row">
            <span className="chatbook-pill">confianca {Math.round(message.reply.router.nivelDeConfianca * 100)}%</span>
            <span className="chatbook-pill">{message.reply.router.intencaoPrincipal}</span>
          </div>
        ) : null}
      </div>

      <p>{message.text}</p>

      {message.reply ? (
        <>
          <div className="chatbook-confidence">
            <div className="chatbook-confidence__label">
              <small>Ranking de confianca</small>
              <strong>{message.reply.router.confidenceLabel}</strong>
            </div>
            <div className="meter">
              <span style={{ width: `${Math.round(message.reply.router.nivelDeConfianca * 100)}%` }} />
            </div>
          </div>

          <div className="chatbook-pill-row">
            {message.reply.router.ferramentasNecessarias.map((tool) => {
              const Icon = getToolIcon(tool);

              return (
                <span className="chatbook-pill" key={`${message.id}-${tool}`}>
                  <Icon size={14} />
                  {getToolLabel(tool)}
                </span>
              );
            })}
          </div>

          <div className="chatbook-response-grid">
            <section className="chatbook-section-card">
              <header>
                <strong>Resumo</strong>
                <button
                  className="ghost-button"
                  onClick={() => onSpeak(message.reply?.sections.resumo ?? message.text)}
                  type="button"
                >
                  <Volume2 size={16} />
                  <span>Falar resposta</span>
                </button>
              </header>
              <p>{message.reply.sections.resumo}</p>
            </section>

            <section className="chatbook-section-card">
              <header>
                <strong>O que encontrei na plataforma</strong>
              </header>
              <ul className="chatbook-list">
                {message.reply.sections.plataforma.map((item) => (
                  <li key={`${message.id}-${item}`}>{item}</li>
                ))}
              </ul>
              <div className="chatbook-source-grid">
                {message.reply.sources.plataforma.map((item) => (
                  <a
                    className="chatbook-source-card"
                    href={item.href ?? "#"}
                    key={item.id}
                  >
                    <small>{item.sourceLabel}</small>
                    <strong>{item.title}</strong>
                    <span>{item.summary}</span>
                    <span className="chatbook-source-card__meta">
                      {item.module}
                      {item.href ? <ArrowUpRight size={14} /> : null}
                    </span>
                  </a>
                ))}
              </div>
            </section>

            <section className="chatbook-section-card">
              <header>
                <strong>O que complementei na web</strong>
              </header>
              <ul className="chatbook-list">
                {message.reply.sections.web.map((item) => (
                  <li key={`${message.id}-web-${item}`}>{item}</li>
                ))}
              </ul>
              <div className="chatbook-source-grid">
                {message.reply.sources.web.map((item) => (
                  <a
                    className="chatbook-source-card"
                    href={item.href ?? "#"}
                    key={item.id}
                    rel="noreferrer"
                    target="_blank"
                  >
                    <small>{item.sourceLabel}</small>
                    <strong>{item.title}</strong>
                    <span>{item.summary}</span>
                    <span className="chatbook-source-card__meta">
                      {item.module}
                      <ExternalLink size={14} />
                    </span>
                  </a>
                ))}
              </div>
            </section>

            <section className="chatbook-section-card">
              <header>
                <strong>Simulacao / comparacao</strong>
              </header>
              {message.reply.simulation ? (
                <div className="chatbook-scenario-grid">
                  {message.reply.simulation.scenarios.map((scenario) => (
                    <article
                      className={`chatbook-scenario chatbook-scenario--${scenario.tone}`}
                      key={`${message.id}-${scenario.label}`}
                    >
                      <small>{scenario.label}</small>
                      <strong>{formatCurrency(scenario.annualValue)}</strong>
                      <span>{formatCurrency(scenario.monthlyValue)} / mes</span>
                      <span>Delta anual {formatCurrency(scenario.annualDelta)}</span>
                    </article>
                  ))}
                </div>
              ) : (
                <p>Sem simulacao nesta resposta.</p>
              )}
              {message.reply.simulation ? (
                <>
                  <div className="chatbook-data-points">
                    {message.reply.simulation.dataPoints.map((item) => (
                      <div className="chatbook-data-point" key={`${message.id}-${item.label}`}>
                        <small>{item.label}</small>
                        <strong>{item.value}</strong>
                        <span>{item.origin}</span>
                      </div>
                    ))}
                  </div>
                  <ul className="chatbook-list">
                    {message.reply.simulation.gains.map((item) => (
                      <li key={`${message.id}-gain-${item}`}>{item}</li>
                    ))}
                  </ul>
                </>
              ) : null}
            </section>
          </div>

          <section className="chatbook-section-card">
            <header>
              <strong>Proxima acao recomendada</strong>
            </header>
            <p>{message.reply.sections.proximaAcaoRecomendada}</p>
            <div className="hero-actions">
              {message.reply.actions.map((action) =>
                action.href ? (
                  <Link href={action.href} key={action.id}>
                    {action.label}
                  </Link>
                ) : (
                  <span className="ghost-button" key={action.id}>
                    {action.label}
                  </span>
                )
              )}
            </div>
          </section>

          <section className="chatbook-section-card">
            <header>
              <strong>Execucao assistida</strong>
              <span className="badge">{message.reply.executionPlan.status}</span>
            </header>
            <p>
              Modulo alvo: <strong>{message.reply.executionPlan.targetModule}</strong>. Auditoria:{" "}
              {message.reply.executionPlan.auditLabel}.
            </p>
            <div className="chatbook-pill-row">
              <span className="chatbook-pill">
                {message.reply.executionPlan.approvalRequired
                  ? "aprovacao obrigatoria"
                  : "execucao simples"}
              </span>
              <span className="chatbook-pill">
                {message.reply.executionPlan.prefilledFields.length} campos pre-preenchidos
              </span>
            </div>
            <div className="chatbook-data-points">
              {message.reply.executionPlan.prefilledFields.map((field) => (
                <div className="chatbook-data-point" key={`${message.id}-field-${field.label}`}>
                  <small>{field.label}</small>
                  <strong>{field.value}</strong>
                  <span>{field.source}</span>
                </div>
              ))}
            </div>
            <ul className="chatbook-list">
              {message.reply.executionPlan.checklist.map((step) => (
                <li key={`${message.id}-execution-${step}`}>{step}</li>
              ))}
            </ul>
          </section>

          <section className="chatbook-section-card">
            <header>
              <strong>Trilha de decisao</strong>
            </header>
            <ul className="chatbook-list">
              {message.reply.decisionTrail.map((item) => (
                <li key={`${message.id}-trail-${item}`}>{item}</li>
              ))}
            </ul>
            <div className="chatbook-pill-row">
              {message.reply.warnings.map((item) => (
                <span className="chatbook-pill chatbook-pill--warning" key={`${message.id}-warn-${item}`}>
                  {item}
                </span>
              ))}
            </div>
          </section>

          <section className="chatbook-section-card">
            <header>
              <strong>Continue a conversa</strong>
            </header>
            <div className="chatbook-follow-up-grid">
              {message.reply.quickFollowUps.map((prompt) => (
                <button
                  className="ghost-button"
                  key={`${message.id}-follow-${prompt}`}
                  onClick={() => onRunFollowUp(prompt)}
                  type="button"
                >
                  {prompt}
                </button>
              ))}
            </div>
          </section>
        </>
      ) : null}
    </article>
  );
}

export function ChatbookWorkspace() {
  const [messages, setMessages] = useState<ChatMessage[]>([WELCOME_MESSAGE]);
  const [draft, setDraft] = useState(
    "Encontre o melhor cenario para este cliente, compare os planos, pesquise referencias na web e me mostre a economia anual."
  );
  const [selectedTools, setSelectedTools] = useState<ChatbookTool[]>([
    "busca_interna",
    "simulacao",
    "acao_plataforma"
  ]);
  const [attachmentContexts, setAttachmentContexts] = useState<AttachmentContext[]>([]);
  const [attachmentNames, setAttachmentNames] = useState<string[]>([]);
  const [attachmentError, setAttachmentError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [listening, setListening] = useState(false);
  const [voiceSupported, setVoiceSupported] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [voiceError, setVoiceError] = useState<string | null>(null);
  const [lastReply, setLastReply] = useState<ChatbookReply | null>(null);
  const [savedOutputId, setSavedOutputId] = useState<string | null>(null);
  const [assistedWorkflowId, setAssistedWorkflowId] = useState<string | null>(null);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [saveOutputError, setSaveOutputError] = useState<string | null>(null);
  const [workflowError, setWorkflowError] = useState<string | null>(null);
  const [conversationError, setConversationError] = useState<string | null>(null);
  const [isSavingOutput, setIsSavingOutput] = useState(false);
  const [isCreatingWorkflow, setIsCreatingWorkflow] = useState(false);
  const [isCreatingConversation, setIsCreatingConversation] = useState(false);
  const [speaking, setSpeaking] = useState(false);
  const [historyHydrated, setHistoryHydrated] = useState(false);
  const [historyQuery, setHistoryQuery] = useState("");
  const [simulationForm, setSimulationForm] = useState<SimulationFormState>(DEFAULT_SIMULATION_FORM);
  const recognitionRef = useRef<BrowserSpeechRecognition | null>(null);
  const historyMatches = messages
    .filter((message) => message.role === "user" || message.reply)
    .filter((message) => matchesHistoryQuery(message, historyQuery))
    .slice()
    .reverse()
    .slice(0, 8);

  const onRecognitionResult = useEffectEvent((event: BrowserSpeechRecognitionEventLike) => {
    let transcript = "";

    for (let index = 0; index < event.results.length; index += 1) {
      transcript += event.results[index]?.[0]?.transcript ?? "";
    }

    setDraft(transcript.trim());
  });

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    try {
      const stored = window.localStorage.getItem(CHATBOOK_HISTORY_STORAGE_KEY);
      const storedMessages = normalizeStoredMessages(stored ? JSON.parse(stored) : null);
      const latestReply = storedMessages
        .slice()
        .reverse()
        .find((message) => message.reply)?.reply;

      setMessages(storedMessages);
      setLastReply(latestReply ?? null);
    } catch {
      setMessages([WELCOME_MESSAGE]);
    } finally {
      setHistoryHydrated(true);
    }
  }, []);

  useEffect(() => {
    if (typeof window === "undefined" || !historyHydrated) {
      return;
    }

    window.localStorage.setItem(
      CHATBOOK_HISTORY_STORAGE_KEY,
      JSON.stringify(messages.slice(-40))
    );
  }, [historyHydrated, messages]);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    const SpeechRecognitionConstructor =
      window.SpeechRecognition ?? window.webkitSpeechRecognition;

    if (!SpeechRecognitionConstructor) {
      setVoiceSupported(false);
      return;
    }

    const recognition = new SpeechRecognitionConstructor();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = "pt-BR";
    recognition.onresult = (event) => {
      onRecognitionResult(event);
    };
    recognition.onerror = (event) => {
      setVoiceError(`Falha no modo voz: ${event.error}.`);
      setListening(false);
    };
    recognition.onend = () => {
      setListening(false);
    };
    recognitionRef.current = recognition;
    setVoiceSupported(true);

    return () => {
      recognition.abort();
      recognitionRef.current = null;
    };
  }, [onRecognitionResult]);

  async function runPrompt(prompt: string) {
    const message = prompt.trim();

    if (!message || isSubmitting) {
      return;
    }

    setError(null);
    setVoiceError(null);
    setIsSubmitting(true);

    const userMessage: ChatMessage = {
      id: createMessageId("user"),
      role: "user",
      text: message
    };

    setMessages((current) => [...current, userMessage]);
    setDraft("");

    try {
      const response = await fetch("/api/chatbook/query", {
        body: JSON.stringify({
          attachmentContexts,
          attachmentNames,
          message,
          preferredTools: selectedTools,
          simulationInput: buildSimulationInput(simulationForm),
          voiceEnabled: voiceSupported
        }),
        headers: {
          "content-type": "application/json"
        },
        method: "POST"
      });

      if (!response.ok) {
        throw new Error(`Falha ao consultar o ChatBook (${response.status}).`);
      }

      const payload = (await response.json()) as {
        reply: ChatbookReply;
      };

      startTransition(() => {
        setLastReply(payload.reply);
        setSavedOutputId(null);
        setAssistedWorkflowId(null);
        setConversationId(null);
        setSaveOutputError(null);
        setWorkflowError(null);
        setConversationError(null);
        setMessages((current) => [
          ...current,
          {
            id: createMessageId("assistant"),
            reply: payload.reply,
            role: "assistant",
            text: payload.reply.sections.resumo
          }
        ]);
      });
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : "Falha desconhecida ao consultar o ChatBook."
      );
    } finally {
      setAttachmentContexts([]);
      setAttachmentNames([]);
      setIsSubmitting(false);
    }
  }

  function updateSimulationForm(field: keyof SimulationFormState, value: string) {
    setSimulationForm((current) => ({
      ...current,
      [field]: value
    }));
  }

  async function handleAttachmentSelection(files: File[]) {
    setAttachmentError(null);
    setAttachmentNames(files.map((file) => file.name));

    try {
      const contexts = await readAttachmentContexts(files);
      setAttachmentContexts(contexts);

      if (files.length > 0 && contexts.length === 0) {
        setAttachmentError(
          "Nenhum anexo textual pequeno foi lido. PDF, DOCX e imagens ficam registrados por nome nesta versao."
        );
      }
    } catch {
      setAttachmentContexts([]);
      setAttachmentError("Nao foi possivel ler os anexos textuais selecionados.");
    }
  }

  function clearHistory() {
    window.localStorage.removeItem(CHATBOOK_HISTORY_STORAGE_KEY);
    setMessages([WELCOME_MESSAGE]);
    setLastReply(null);
    setHistoryQuery("");
  }

  function exportLastReply() {
    if (!lastReply || typeof document === "undefined") {
      return;
    }

    const markdown = buildChatbookExportMarkdown(lastReply);
    const blob = new Blob([markdown], {
      type: "text/markdown;charset=utf-8"
    });
    const url = window.URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `chatbook-${lastReply.requestId}.md`;
    anchor.click();
    window.setTimeout(() => {
      window.URL.revokeObjectURL(url);
    }, 250);
  }

  async function saveLastReplyAsOutput() {
    if (!lastReply || isSavingOutput) {
      return;
    }

    setSaveOutputError(null);
    setIsSavingOutput(true);

    try {
      const payload = await createOutputArtifact({
        agentId: "chatbook-inteligentissimo",
        content: buildChatbookExportMarkdown(lastReply),
        requireApproval: true,
        type: "executive-report"
      });

      setSavedOutputId(payload.output.id);
    } catch (outputError) {
      setSaveOutputError(
        outputError instanceof Error
          ? outputError.message
          : "Nao foi possivel salvar o output executivo."
      );
    } finally {
      setIsSavingOutput(false);
    }
  }

  async function createAssistedWorkflowFromReply() {
    if (!lastReply || isCreatingWorkflow) {
      return;
    }

    setWorkflowError(null);
    setIsCreatingWorkflow(true);

    try {
      const payload = await createChatbookAssistedWorkflow({
        actions: lastReply.actions.map((action) => action.label),
        requestId: lastReply.requestId,
        summary: lastReply.sections.resumo
      });

      setAssistedWorkflowId(payload.workflow.id);
    } catch (workflowCreationError) {
      setWorkflowError(
        workflowCreationError instanceof Error
          ? workflowCreationError.message
          : "Nao foi possivel criar o workflow assistido."
      );
    } finally {
      setIsCreatingWorkflow(false);
    }
  }

  async function createOperationalThreadFromReply() {
    if (!lastReply || isCreatingConversation) {
      return;
    }

    setConversationError(null);
    setIsCreatingConversation(true);

    try {
      const draftPayload = buildChatbookConversationDraft(lastReply);
      const payload = await createConversation(draftPayload);

      setConversationId(payload.conversation.id);
    } catch (conversationCreationError) {
      setConversationError(
        conversationCreationError instanceof Error
          ? conversationCreationError.message
          : "Nao foi possivel criar a thread operacional."
      );
    } finally {
      setIsCreatingConversation(false);
    }
  }

  function toggleTool(tool: ChatbookTool) {
    setSelectedTools((current) =>
      current.includes(tool)
        ? current.filter((item) => item !== tool)
        : [...current, tool]
    );
  }

  function toggleVoice() {
    if (!recognitionRef.current || !voiceSupported) {
      setVoiceError("Voz indisponivel neste navegador.");
      return;
    }

    setVoiceError(null);

    if (listening) {
      recognitionRef.current.stop();
      setListening(false);
      return;
    }

    recognitionRef.current.start();
    setListening(true);
  }

  function speakText(text: string) {
    if (typeof window === "undefined" || typeof SpeechSynthesisUtterance === "undefined") {
      setVoiceError("Sintese de voz indisponivel neste navegador.");
      return;
    }

    if (speaking) {
      window.speechSynthesis.cancel();
      setSpeaking(false);
      return;
    }

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = "pt-BR";
    utterance.onend = () => {
      setSpeaking(false);
    };
    utterance.onerror = () => {
      setSpeaking(false);
      setVoiceError("Nao foi possivel falar a resposta agora.");
    };

    window.speechSynthesis.cancel();
    setSpeaking(true);
    window.speechSynthesis.speak(utterance);
  }

  return (
    <section className="chatbook-grid">
      <div className="panel chatbook-shell">
        <div className="chatbook-toolbar">
          <div className="chatbook-toolbar__copy">
            <span className="badge">Workspace vivo</span>
            <h2>Assistente conversacional + busca unificada + simuladores</h2>
            <p>
              O ChatBook classifica a intencao, escolhe ferramentas, separa origem da informacao
              e fecha cada resposta com uma proxima acao util.
            </p>
          </div>

          <div className="chatbook-pill-row">
            <span className="chatbook-pill">
              <Sparkles size={14} />
              resposta em cards
            </span>
            <span className="chatbook-pill">
              <AudioLines size={14} />
              voz com fallback
            </span>
            <span className="chatbook-pill">
              <BrainCircuit size={14} />
              simulador integrado
            </span>
          </div>
        </div>

        <div className="chatbook-quick-grid">
          {QUICK_COMMANDS.map((command) => (
            <button
              className="ghost-button"
              key={command.id}
              onClick={() => {
                void runPrompt(command.prompt);
              }}
              type="button"
            >
              {command.label}
            </button>
          ))}
        </div>

        <section className="chatbook-toolbox">
          <header>
            <strong>Ferramentas do roteador</strong>
            <small>Ative manualmente ou deixe o ChatBook decidir.</small>
          </header>
          <div className="chatbook-tool-toggle-grid">
            {CHATBOOK_TOOLS.map((tool) => {
              const Icon = getToolIcon(tool);

              return (
                <button
                  className="chatbook-tool-toggle"
                  data-active={selectedTools.includes(tool)}
                  key={tool}
                  onClick={() => toggleTool(tool)}
                  type="button"
                >
                  <Icon size={16} />
                  <span>{getToolLabel(tool)}</span>
                </button>
              );
            })}
          </div>
        </section>

        <section className="chatbook-attachments">
          <div className="chatbook-attachments__header">
            <div>
              <strong>Anexos do contexto</strong>
              <p>PDF, DOCX, imagem ou planilha podem entrar no fluxo do proximo passo.</p>
            </div>
            <label className="ghost-button">
              <span>Anexar arquivos</span>
              <input
                hidden
                multiple
                onChange={(event) => {
                  void handleAttachmentSelection(Array.from(event.target.files ?? []));
                }}
                type="file"
              />
            </label>
          </div>
          {attachmentNames.length > 0 ? (
            <div className="chatbook-pill-row">
              {attachmentNames.map((item) => (
                <span className="chatbook-pill" key={item}>
                  {item}
                </span>
              ))}
            </div>
          ) : (
            <p className="dashboard-muted dashboard-muted--compact">
              Nenhum anexo selecionado nesta rodada.
            </p>
          )}
          {attachmentContexts.length > 0 ? (
            <p className="dashboard-muted dashboard-muted--compact">
              {attachmentContexts.length} anexo(s) textual(is) serao usados como contexto real.
            </p>
          ) : null}
          {attachmentError ? <p className="agent-error-text">{attachmentError}</p> : null}
        </section>

        <div aria-live="polite" className="chatbook-message-list">
          {messages.map((message) => (
            <MessageBubble
              key={message.id}
              message={message}
              onRunFollowUp={(prompt) => {
                void runPrompt(prompt);
              }}
              onSpeak={speakText}
            />
          ))}

          {isSubmitting ? (
            <article className="chatbook-message chatbook-message--assistant">
              <div className="chatbook-message__meta">
                <span className="badge">ChatBook</span>
              </div>
              <p>Analisando contexto, escolhendo ferramentas e montando a resposta...</p>
            </article>
          ) : null}
        </div>

        <form
          className="chatbook-composer"
          onSubmit={(event) => {
            event.preventDefault();
            void runPrompt(draft);
          }}
        >
          <label className="chatbook-composer__field">
            <span>Mensagem do usuario</span>
            <textarea
              className="agent-textarea"
              onChange={(event) => setDraft(event.target.value)}
              placeholder="Pergunte, peça uma comparacao, rode um simulador ou mande o ChatBook abrir a proxima tela."
              rows={5}
              value={draft}
            />
          </label>

          <div className="chatbook-composer__actions">
            <button
              className="ghost-button"
              onClick={toggleVoice}
              type="button"
            >
              {listening ? <MicOff size={16} /> : <Mic size={16} />}
              <span>{listening ? "Parar voz" : "Iniciar voz"}</span>
            </button>

            <button
              className="ghost-button"
              disabled={!lastReply}
              onClick={() => {
                if (lastReply) {
                  speakText(lastReply.sections.resumo);
                }
              }}
              type="button"
            >
              {speaking ? <VolumeX size={16} /> : <Volume2 size={16} />}
              <span>{speaking ? "Parar fala" : "Falar ultimo resumo"}</span>
            </button>

            <button className="action-button" disabled={isSubmitting} type="submit">
              {isSubmitting ? "Analisando..." : "Executar analise"}
            </button>
          </div>

          {error ? <p className="agent-error-text">{error}</p> : null}
          {voiceError ? <p className="agent-error-text">{voiceError}</p> : null}
        </form>
      </div>

      <aside className="chatbook-sidebar">
        <section className="panel">
          <div className="chatbook-sidebar__header">
            <strong>Modo de resposta ideal</strong>
            <span className="badge">estrutura fixa</span>
          </div>
          <ul className="chatbook-list">
            <li>Resumo executivo primeiro.</li>
            <li>Plataforma e web separados por origem.</li>
            <li>Simulacao sempre que houver comparacao, preco ou ROI.</li>
            <li>Fechamento com acao pratica.</li>
          </ul>
        </section>

        <section className="panel">
          <div className="chatbook-sidebar__header">
            <strong>Presets de simulador</strong>
            <span className="badge">acoes rapidas</span>
          </div>
          <div className="chatbook-follow-up-grid">
            {SIMULATOR_PRESETS.map((preset) => (
              <button
                className="ghost-button"
                key={preset.id}
                onClick={() => {
                  void runPrompt(preset.prompt);
                }}
                type="button"
              >
                {preset.label}
              </button>
            ))}
          </div>
        </section>

        <section className="panel">
          <div className="chatbook-sidebar__header">
            <strong>Parametros do simulador</strong>
            <span className="badge">
              <SlidersHorizontal size={14} />
              editavel
            </span>
          </div>
          <div className="chatbook-simulator-form">
            <label>
              <span>Custo mensal atual</span>
              <input
                className="agent-input"
                inputMode="decimal"
                onChange={(event) => updateSimulationForm("currentMonthlyCost", event.target.value)}
                value={simulationForm.currentMonthlyCost}
              />
            </label>
            <label>
              <span>Usuarios ativos</span>
              <input
                className="agent-input"
                inputMode="numeric"
                onChange={(event) => updateSimulationForm("activeUsers", event.target.value)}
                value={simulationForm.activeUsers}
              />
            </label>
            <label>
              <span>Volume anual</span>
              <input
                className="agent-input"
                inputMode="numeric"
                onChange={(event) => updateSimulationForm("annualVolume", event.target.value)}
                value={simulationForm.annualVolume}
              />
            </label>
            <label>
              <span>Backlog atual</span>
              <input
                className="agent-input"
                inputMode="numeric"
                onChange={(event) => updateSimulationForm("onboardingBacklog", event.target.value)}
                value={simulationForm.onboardingBacklog}
              />
            </label>
            <label>
              <span>Plano atual</span>
              <input
                className="agent-input"
                onChange={(event) => updateSimulationForm("currentPlan", event.target.value)}
                value={simulationForm.currentPlan}
              />
            </label>
            <label>
              <span>Plano recomendado</span>
              <input
                className="agent-input"
                onChange={(event) => updateSimulationForm("recommendedPlan", event.target.value)}
                value={simulationForm.recommendedPlan}
              />
            </label>
          </div>
        </section>

        <section className="panel">
          <div className="chatbook-sidebar__header">
            <strong>Estado atual</strong>
            <span className="badge">{voiceSupported ? "voz pronta" : "fallback texto"}</span>
          </div>
          <div className="chatbook-data-points">
            <div className="chatbook-data-point">
              <small>Mensagens</small>
              <strong>{messages.length}</strong>
              <span>historico do chat</span>
            </div>
            <div className="chatbook-data-point">
              <small>Ferramentas ativas</small>
              <strong>{selectedTools.length}</strong>
              <span>override manual</span>
            </div>
            <div className="chatbook-data-point">
              <small>Anexos</small>
              <strong>{attachmentNames.length}</strong>
              <span>{attachmentContexts.length} lidos como texto</span>
            </div>
            <div className="chatbook-data-point">
              <small>Ultimo request</small>
              <strong>{lastReply?.requestId ?? "--"}</strong>
              <span>trilha auditavel</span>
            </div>
          </div>
          <div className="chatbook-sidebar-actions">
            <button
              className="ghost-button"
              disabled={!lastReply}
              onClick={exportLastReply}
              type="button"
            >
              <Download size={16} />
              <span>Exportar ultimo resultado</span>
            </button>
            <button
              className="action-button"
              disabled={!lastReply || isSavingOutput}
              onClick={() => {
                void saveLastReplyAsOutput();
              }}
              type="button"
            >
              <WandSparkles size={16} />
              <span>{isSavingOutput ? "Salvando..." : "Salvar como output executivo"}</span>
            </button>
            {savedOutputId ? (
              <Link className="ghost-button" href={`/outputs?outputId=${encodeURIComponent(savedOutputId)}`}>
                Abrir output salvo
              </Link>
            ) : null}
            {saveOutputError ? (
              <p className="agent-error-text">
                {saveOutputError}. Se necessario, exporte em Markdown ou confirme permissao ADMIN.
              </p>
            ) : null}
            <button
              className="ghost-button"
              disabled={!lastReply || isCreatingWorkflow}
              onClick={() => {
                void createAssistedWorkflowFromReply();
              }}
              type="button"
            >
              <BrainCircuit size={16} />
              <span>{isCreatingWorkflow ? "Criando workflow..." : "Criar workflow assistido"}</span>
            </button>
            {assistedWorkflowId ? (
              <Link
                className="ghost-button"
                href={`/workflows/${encodeURIComponent(assistedWorkflowId)}/edit`}
              >
                Abrir workflow no editor
              </Link>
            ) : null}
            {workflowError ? (
              <p className="agent-error-text">
                {workflowError}. Confirme permissao ADMIN ou use o output salvo como alternativa.
              </p>
            ) : null}
            <button
              className="ghost-button"
              disabled={!lastReply || isCreatingConversation}
              onClick={() => {
                void createOperationalThreadFromReply();
              }}
              type="button"
            >
              <History size={16} />
              <span>{isCreatingConversation ? "Criando thread..." : "Criar thread operacional"}</span>
            </button>
            {conversationId ? (
              <Link
                className="ghost-button"
                href={`/conversations?thread=${encodeURIComponent(conversationId)}`}
              >
                Abrir thread criada
              </Link>
            ) : null}
            {conversationError ? (
              <p className="agent-error-text">
                {conversationError}. Voce ainda pode exportar ou salvar como output.
              </p>
            ) : null}
          </div>
        </section>

        <section className="panel">
          <div className="chatbook-sidebar__header">
            <strong>Historico pesquisavel</strong>
            <span className="badge">
              <History size={14} />
              local
            </span>
          </div>
          <input
            aria-label="Buscar no historico local"
            className="agent-input"
            onChange={(event) => setHistoryQuery(event.target.value)}
            placeholder="Buscar no historico local"
            value={historyQuery}
          />
          <div className="chatbook-history-list">
            {historyMatches.length === 0 ? (
              <p className="dashboard-muted dashboard-muted--compact">
                Nenhum item encontrado no historico.
              </p>
            ) : null}
            {historyMatches.map((message) => (
              <button
                className="chatbook-history-item"
                key={`history-${message.id}`}
                onClick={() => setDraft(message.text)}
                type="button"
              >
                <small>{message.role === "user" ? "Pergunta" : "Resposta"}</small>
                <span>{message.text}</span>
              </button>
            ))}
          </div>
          <button
            className="ghost-button"
            onClick={clearHistory}
            type="button"
          >
            <Trash2 size={16} />
            <span>Limpar historico local</span>
          </button>
        </section>

        <section className="panel">
          <div className="chatbook-sidebar__header">
            <strong>Ultimo roteamento</strong>
            <span className="badge">router</span>
          </div>
          {lastReply ? (
            <>
              <p className="dashboard-muted">
                Intencao principal: <strong>{lastReply.router.intencaoPrincipal}</strong>
              </p>
              <p className="dashboard-muted">
                Formato ideal: {lastReply.router.formatIdealDeResposta}
              </p>
              <div className="chatbook-pill-row">
                {lastReply.router.ferramentasNecessarias.map((tool) => (
                  <span className="chatbook-pill" key={`sidebar-${tool}`}>
                    {getToolLabel(tool)}
                  </span>
                ))}
              </div>
            </>
          ) : (
            <p className="dashboard-muted dashboard-muted--compact">
              Envie a primeira consulta para ver o roteador em acao.
            </p>
          )}
        </section>
      </aside>
    </section>
  );
}
