"use client";
import type { ReactNode } from "react";
import {
  Bot,
  Copy,
  ImagePlus,
  Loader2,
  MessageCircle,
  Mic,
  Search,
  Send,
  Sparkles,
  X
} from "lucide-react";
import type {
  SalesOsChatMessage,
  SalesOsModuleDefinition,
  SalesOsModuleId,
  SalesOsTool
} from "../../lib/sales-os/types";
import {
  accentStyle,
  readImageAsPayload,
  resolveIcon,
  startVoiceCapture,
  type SalesOsShellCopy
} from "./shell-support";
import type { SalesOsSelectedImage } from "./sales-os-shell.state";
import styles from "./sales-os.module.css";

function SalesOsChatTranscript(input: {
  assistantName: string;
  loading: boolean;
  messages: SalesOsChatMessage[];
  runningLabel: string;
}) {
  const { assistantName, loading, messages, runningLabel } = input;

  return (
    <>
      {messages.map((message, index) => (
        <article
          className={styles.chatBubble}
          data-role={message.role}
          key={`${message.role}-${index}-${message.text.slice(0, 16)}`}
        >
          <strong>{message.role === "assistant" ? assistantName : "Voce"}</strong>
          <p>{message.text}</p>
        </article>
      ))}
      {loading ? (
        <article className={styles.chatBubble} data-role="assistant">
          <strong>{assistantName}</strong>
          <p>{runningLabel}</p>
        </article>
      ) : null}
    </>
  );
}

function SalesOsChatComposer(input: {
  buttonIcon: ReactNode;
  copy: SalesOsShellCopy;
  disabled: boolean;
  inputValue: string;
  onInputChange: (value: string) => void;
  onSend: () => void | Promise<void>;
}) {
  const { buttonIcon, copy, disabled, inputValue, onInputChange, onSend } = input;
  return (
    <div className={styles.chatComposer}>
      <button
        className={styles.iconButton}
        onClick={() => {
          startVoiceCapture(onInputChange, copy);
        }}
        type="button"
      >
        <Mic size={16} />
      </button>
      <input
        aria-label={copy.composerPlaceholder}
        onChange={(event) => onInputChange(event.target.value)}
        onKeyDown={(event) => {
          if (event.key === "Enter") {
            event.preventDefault();
            void onSend();
          }
        }}
        placeholder={copy.roleplayInputPlaceholder}
        type="text"
        value={inputValue}
      />
      <button
        className={styles.primaryButton}
        disabled={disabled}
        onClick={() => {
          void onSend();
        }}
        type="button"
      >
        {buttonIcon}
        <span>{copy.send}</span>
      </button>
    </div>
  );
}

export function SalesOsModuleOverview(input: {
  availableModules: SalesOsModuleDefinition[];
  copy: SalesOsShellCopy;
  moduleCounts: Record<string, number>;
  moduleSearch: string;
  onModuleSearchChange: (value: string) => void;
  onSelectModule: (moduleId: SalesOsModuleId) => void;
  selectedModule: SalesOsModuleId;
  tools: SalesOsTool[];
}) {
  const {
    availableModules,
    copy,
    moduleCounts,
    moduleSearch,
    onModuleSearchChange,
    onSelectModule,
    selectedModule,
    tools
  } = input;
  return (
    <section className={styles.overview}>
      <div className={styles.searchCard}>
        <Search size={16} />
        <input
          aria-label="Buscar modulos"
          onChange={(event) => onModuleSearchChange(event.target.value)}
          placeholder={copy.moduleSearchPlaceholder}
          type="search"
          value={moduleSearch}
        />
      </div>

      <div className={styles.moduleGrid}>
        {availableModules.map((moduleDefinition) => {
          const Icon = resolveIcon(moduleDefinition.icon);
          const active = moduleDefinition.id === selectedModule;
          return (
            <button
              className={styles.moduleCard}
              data-active={active ? "true" : "false"}
              key={moduleDefinition.id}
              onClick={() => onSelectModule(moduleDefinition.id)}
              style={accentStyle(tools.find((tool) => tool.modules.includes(moduleDefinition.id))?.color ?? "indigo")}
              type="button"
            >
              <div className={styles.moduleCardHeader}>
                <span className={styles.moduleIconWrap}>
                  <Icon size={18} />
                </span>
                <span className={styles.moduleCount}>{moduleCounts[moduleDefinition.id] ?? 0}</span>
              </div>
              <strong>{moduleDefinition.title}</strong>
              <span>{moduleDefinition.subtitle}</span>
              <p>{moduleDefinition.description}</p>
            </button>
          );
        })}
      </div>
    </section>
  );
}

export function SalesOsToolRail(input: {
  copy: SalesOsShellCopy;
  onSelectTool: (toolId: string) => void;
  onToolSearchChange: (value: string) => void;
  selectedModuleTitle: string | undefined;
  selectedToolId: string | undefined;
  toolSearch: string;
  visibleTools: SalesOsTool[];
}) {
  const { copy, onSelectTool, onToolSearchChange, selectedModuleTitle, selectedToolId, toolSearch, visibleTools } = input;

  return (
    <aside className={styles.toolRail}>
      <div className={styles.railHeader}>
        <strong>{selectedModuleTitle}</strong>
        <span>{visibleTools.length} tools</span>
      </div>

      <div className={styles.searchCard}>
        <Search size={16} />
        <input
          aria-label="Buscar ferramentas"
          onChange={(event) => onToolSearchChange(event.target.value)}
          placeholder={copy.toolSearchPlaceholder}
          type="search"
          value={toolSearch}
        />
      </div>

      <div className={styles.toolList}>
        {visibleTools.length === 0 ? (
          <article className={styles.emptyCard}>
            <strong>{copy.emptySearchTitle}</strong>
            <p>{copy.emptySearchDescription}</p>
          </article>
        ) : (
          visibleTools.map((tool) => {
            const Icon = resolveIcon(tool.icon);
            return (
              <button
                className={styles.toolCard}
                data-active={tool.id === selectedToolId ? "true" : "false"}
                key={tool.id}
                onClick={() => onSelectTool(tool.id)}
                style={accentStyle(tool.color)}
                type="button"
              >
                <div className={styles.toolCardHeader}>
                  <span className={styles.toolIconWrap}>
                    <Icon size={16} />
                  </span>
                  <span>{tool.emoji}</span>
                </div>
                <strong>{tool.name}</strong>
                <p>{tool.desc}</p>
                <div className={styles.toolPills}>
                  {tool.isChat ? <span>Chat</span> : null}
                  {tool.acceptsImage ? <span>Vision</span> : null}
                  {tool.isImage ? <span>Image Brief</span> : null}
                  {tool.useSearch ? <span>Research</span> : null}
                </div>
              </button>
            );
          })
        )}
      </div>
    </aside>
  );
}

export function SalesOsToolBoardHeader(input: {
  copy: SalesOsShellCopy;
  outputProvider: string;
  selectedModuleTitle: string | undefined;
  selectedTool: SalesOsTool;
}) {
  const { copy, outputProvider, selectedModuleTitle, selectedTool } = input;

  return (
    <header className={styles.boardHeader} style={accentStyle(selectedTool.color)}>
      <div>
        <span className={styles.boardEyebrow}>{selectedModuleTitle}</span>
        <h2>{selectedTool.name}</h2>
        <p>{selectedTool.desc}</p>
      </div>
      <div className={styles.boardMeta}>
        {selectedTool.acceptsImage ? <span>{copy.visionHint}</span> : null}
        {selectedTool.isImage ? <span>{copy.imageBriefHint}</span> : null}
        {outputProvider ? <span>{outputProvider}</span> : null}
      </div>
    </header>
  );
}

export function SalesOsChatWorkspace(input: {
  copy: SalesOsShellCopy;
  inputValue: string;
  loading: boolean;
  messages: SalesOsChatMessage[];
  onInputChange: (value: string) => void;
  onSend: () => void | Promise<void>;
  selectedTool: SalesOsTool;
}) {
  const { copy, inputValue, loading, messages, onInputChange, onSend, selectedTool } = input;

  return (
    <section className={styles.chatBoard}>
      <div className={styles.chatTranscript}>
        <SalesOsChatTranscript
          assistantName={selectedTool.name}
          loading={loading}
          messages={messages}
          runningLabel={copy.running}
        />
      </div>

      <SalesOsChatComposer
        buttonIcon={<Send size={16} />}
        copy={copy}
        disabled={loading}
        inputValue={inputValue}
        onInputChange={onInputChange}
        onSend={onSend}
      />
    </section>
  );
}

export function SalesOsExecutionWorkspace(input: {
  copy: SalesOsShellCopy;
  copyState: "copied" | "idle";
  formValues: Record<string, string>;
  onCopyOutput: () => void | Promise<void>;
  onFormValueChange: (fieldId: string, value: string) => void;
  onRunTool: () => void | Promise<void>;
  onSelectedImageChange: (value: SalesOsSelectedImage | null) => void;
  output: string;
  runLoading: boolean;
  selectedImage: SalesOsSelectedImage | null;
  selectedTool: SalesOsTool;
}) {
  const {
    copy,
    copyState,
    formValues,
    onCopyOutput,
    onFormValueChange,
    onRunTool,
    onSelectedImageChange,
    output,
    runLoading,
    selectedImage,
    selectedTool
  } = input;

  const fields = selectedTool.fields ?? [
    {
      id: "context",
      label: "Contexto",
      placeholder: "Descreva o cenário, a conta e o objetivo.",
      type: "textarea"
    }
  ];

  return (
    <section className={styles.executionGrid}>
      <article className={styles.formPanel}>
        <div className={styles.sectionTitleRow}>
          <strong>Inputs</strong>
          <span>{selectedTool.fields?.length ?? 1}</span>
        </div>

        <div className={styles.fieldStack}>
          {fields.map((field) => (
            <label className={styles.field} key={field.id}>
              <span>{field.label}</span>
              {field.type === "textarea" ? (
                <textarea
                  onChange={(event) => onFormValueChange(field.id, event.target.value)}
                  placeholder={field.placeholder}
                  value={formValues[field.id] ?? ""}
                />
              ) : field.type === "select" ? (
                <select
                  onChange={(event) => onFormValueChange(field.id, event.target.value)}
                  value={formValues[field.id] ?? ""}
                >
                  <option value="">Selecione</option>
                  {field.options?.map((option) => (
                    <option key={option} value={option}>
                      {option}
                    </option>
                  ))}
                </select>
              ) : (
                <input
                  onChange={(event) => onFormValueChange(field.id, event.target.value)}
                  placeholder={field.placeholder}
                  type="text"
                  value={formValues[field.id] ?? ""}
                />
              )}
            </label>
          ))}
        </div>

        {selectedTool.acceptsImage ? (
          <div className={styles.uploadBox}>
            <label className={styles.uploadLabel}>
              <ImagePlus size={16} />
              <span>{selectedImage?.name ?? copy.uploadImage}</span>
              <input
                accept="image/*"
                className={styles.hiddenInput}
                onChange={(event) => {
                  const file = event.target.files?.[0];
                  if (!file) {
                    return;
                  }

                  void readImageAsPayload(file).then(onSelectedImageChange);
                }}
                type="file"
              />
            </label>
            <small>{selectedImage?.name ?? copy.noImageSelected}</small>
            {selectedImage ? (
              <button
                className={styles.secondaryButton}
                onClick={() => onSelectedImageChange(null)}
                type="button"
              >
                {copy.removeImage}
              </button>
            ) : null}
          </div>
        ) : null}

        <button
          className={styles.runButton}
          disabled={runLoading}
          onClick={() => {
            void onRunTool();
          }}
          style={accentStyle(selectedTool.color)}
          type="button"
        >
          {runLoading ? <Loader2 className={styles.spin} size={16} /> : <Sparkles size={16} />}
          <span>{runLoading ? copy.running : copy.runProtocol}</span>
        </button>
      </article>

      <article className={styles.outputPanel}>
        <div className={styles.sectionTitleRow}>
          <strong>{copy.outputTitle}</strong>
          <button className={styles.iconButton} onClick={() => void onCopyOutput()} type="button">
            <Copy size={16} />
            <span>{copyState === "copied" ? copy.copied : copy.copyOutput}</span>
          </button>
        </div>

        <div className={styles.outputBody}>
          {output ? <pre>{output}</pre> : <p>{copy.outputEmpty}</p>}
        </div>
      </article>
    </section>
  );
}

export function SalesOsMentorToggle(input: {
  copy: SalesOsShellCopy;
  mentorOpen: boolean;
  onToggle: () => void;
}) {
  const { copy, mentorOpen, onToggle } = input;
  return (
    <button className={styles.mentorToggle} onClick={onToggle} type="button">
      {mentorOpen ? <X size={18} /> : <MessageCircle size={18} />}
      <span>{copy.openMentor}</span>
    </button>
  );
}

export function SalesOsMentorPanel(input: {
  copy: SalesOsShellCopy;
  inputValue: string;
  loading: boolean;
  messages: SalesOsChatMessage[];
  onClose: () => void;
  onInputChange: (value: string) => void;
  onSend: () => void | Promise<void>;
}) {
  const { copy, inputValue, loading, messages, onClose, onInputChange, onSend } = input;

  return (
    <aside className={styles.mentorPanel}>
      <div className={styles.mentorHeader}>
        <div>
          <strong>{copy.mentorTitle}</strong>
          <p>{copy.mentorDescription}</p>
        </div>
        <button className={styles.iconButton} onClick={onClose} type="button">
          <X size={16} />
        </button>
      </div>

      <div className={styles.mentorTranscript}>
        <SalesOsChatTranscript
          assistantName={copy.mentorTitle}
          loading={loading}
          messages={messages}
          runningLabel={copy.running}
        />
      </div>

      <SalesOsChatComposer
        buttonIcon={<Bot size={16} />}
        copy={{
          ...copy,
          roleplayInputPlaceholder: copy.mentorInputPlaceholder
        }}
        disabled={loading}
        inputValue={inputValue}
        onInputChange={onInputChange}
        onSend={onSend}
      />
    </aside>
  );
}
