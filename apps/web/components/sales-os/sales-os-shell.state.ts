"use client";

import { useEffect, useState } from "react";

import type {
  SalesOsChatMessage,
  SalesOsModuleDefinition,
  SalesOsModuleId,
  SalesOsTool
} from "../../lib/sales-os/types";
import {
  buildMentorGreeting,
  speakReply,
  type CatalogResponse,
  type SalesOsShellCopy
} from "./shell-support";

export type SalesOsSelectedImage = {
  data: string;
  mimeType: string;
  name?: string;
};

export function useSalesOsShellState(copy: SalesOsShellCopy) {
  const [catalogLoading, setCatalogLoading] = useState(true);
  const [modules, setModules] = useState<SalesOsModuleDefinition[]>([]);
  const [tools, setTools] = useState<SalesOsTool[]>([]);
  const [selectedModule, setSelectedModule] = useState<SalesOsModuleId>("sales");
  const [moduleSearch, setModuleSearch] = useState("");
  const [toolSearch, setToolSearch] = useState("");
  const [selectedToolId, setSelectedToolId] = useState("");
  const [formValues, setFormValues] = useState<Record<string, string>>({});
  const [selectedImage, setSelectedImage] = useState<SalesOsSelectedImage | null>(null);
  const [runLoading, setRunLoading] = useState(false);
  const [output, setOutput] = useState("");
  const [outputProvider, setOutputProvider] = useState("");
  const [copyState, setCopyState] = useState<"copied" | "idle">("idle");
  const [roleplayMessages, setRoleplayMessages] = useState<SalesOsChatMessage[]>([]);
  const [roleplayInput, setRoleplayInput] = useState("");
  const [roleplayLoading, setRoleplayLoading] = useState(false);
  const [mentorOpen, setMentorOpen] = useState(false);
  const [mentorMessages, setMentorMessages] = useState<SalesOsChatMessage[]>([]);
  const [mentorInput, setMentorInput] = useState("");
  const [mentorLoading, setMentorLoading] = useState(false);

  useEffect(() => {
    async function loadCatalog() {
      try {
        const response = await fetch("/api/sales-os/catalog", {
          cache: "no-store"
        });
        const payload = (await response.json()) as CatalogResponse;
        setModules(payload.modules);
        setTools(payload.tools);
      } finally {
        setCatalogLoading(false);
      }
    }

    void loadCatalog();
  }, []);

  const availableModules = modules.filter((moduleDefinition) => {
    const haystack = `${moduleDefinition.title} ${moduleDefinition.subtitle} ${moduleDefinition.description}`.toLowerCase();
    return haystack.includes(moduleSearch.toLowerCase());
  });

  const moduleCounts = modules.reduce<Record<string, number>>((accumulator, moduleDefinition) => {
    accumulator[moduleDefinition.id] = tools.filter((tool) =>
      tool.modules.includes(moduleDefinition.id)
    ).length;
    return accumulator;
  }, {});

  const visibleTools = tools.filter((tool) => {
    if (!tool.modules.includes(selectedModule)) {
      return false;
    }

    const haystack = `${tool.name} ${tool.desc} ${tool.prompt}`.toLowerCase();
    return haystack.includes(toolSearch.toLowerCase());
  });

  const selectedTool =
    visibleTools.find((tool) => tool.id === selectedToolId) ??
    tools.find((tool) => tool.id === selectedToolId && tool.modules.includes(selectedModule)) ??
    visibleTools[0];

  useEffect(() => {
    if (selectedTool?.id && selectedTool.id !== selectedToolId) {
      setSelectedToolId(selectedTool.id);
    }
  }, [selectedTool?.id, selectedToolId]);

  useEffect(() => {
    if (!selectedTool) {
      return;
    }

    setFormValues({});
    setSelectedImage(null);
    setOutput("");
    setOutputProvider("");
    setRoleplayInput("");
    setRoleplayMessages(
      selectedTool.isChat && selectedTool.firstMsg
        ? [{ role: "assistant", text: selectedTool.firstMsg }]
        : []
    );
  }, [selectedTool?.id]);

  useEffect(() => {
    const currentModuleDefinition = modules.find((moduleDefinition) => moduleDefinition.id === selectedModule);
    setMentorMessages(
      currentModuleDefinition
        ? [{ role: "assistant", text: buildMentorGreeting(copy, currentModuleDefinition.title) }]
        : []
    );
    setMentorInput("");
  }, [copy, modules, selectedModule]);

  async function handleRunTool() {
    if (!selectedTool || selectedTool.isChat) {
      return;
    }

    setRunLoading(true);

    try {
      const response = await fetch("/api/sales-os/execute", {
        body: JSON.stringify({
          fields: formValues,
          image: selectedImage,
          toolId: selectedTool.id
        }),
        headers: {
          "Content-Type": "application/json"
        },
        method: "POST"
      });
      const payload = (await response.json()) as {
        error?: string;
        output?: string;
        provider?: string;
      };

      if (!response.ok) {
        throw new Error(payload.error ?? "Sales OS execution failed.");
      }

      setOutput(payload.output ?? "");
      setOutputProvider(payload.provider ?? "");
    } catch (error) {
      setOutput(error instanceof Error ? error.message : "Unexpected Sales OS execution error.");
      setOutputProvider("error");
    } finally {
      setRunLoading(false);
    }
  }

  async function handleRoleplaySend() {
    if (!selectedTool || !selectedTool.isChat || !roleplayInput.trim()) {
      return;
    }

    const userText = roleplayInput.trim();
    const nextHistory = [...roleplayMessages, { role: "user" as const, text: userText }];
    setRoleplayMessages(nextHistory);
    setRoleplayInput("");
    setRoleplayLoading(true);

    try {
      const response = await fetch("/api/sales-os/chat", {
        body: JSON.stringify({
          currentModule: selectedModule,
          history: nextHistory,
          input: userText,
          toolId: selectedTool.id
        }),
        headers: {
          "Content-Type": "application/json"
        },
        method: "POST"
      });
      const payload = (await response.json()) as {
        error?: string;
        output?: string;
      };

      if (!response.ok) {
        throw new Error(payload.error ?? "Roleplay execution failed.");
      }

      const assistantReply = payload.output ?? "";
      setRoleplayMessages((current) => [...current, { role: "assistant", text: assistantReply }]);
      speakReply(assistantReply);
    } catch (error) {
      setRoleplayMessages((current) => [
        ...current,
        {
          role: "assistant",
          text: error instanceof Error ? error.message : "Unexpected Sales OS chat error."
        }
      ]);
    } finally {
      setRoleplayLoading(false);
    }
  }

  async function handleMentorSend() {
    if (!mentorInput.trim()) {
      return;
    }

    const userText = mentorInput.trim();
    const nextHistory = [...mentorMessages, { role: "user" as const, text: userText }];
    setMentorMessages(nextHistory);
    setMentorInput("");
    setMentorLoading(true);

    try {
      const response = await fetch("/api/sales-os/chat", {
        body: JSON.stringify({
          currentModule: selectedModule,
          history: nextHistory,
          input: userText,
          mentor: true
        }),
        headers: {
          "Content-Type": "application/json"
        },
        method: "POST"
      });
      const payload = (await response.json()) as {
        error?: string;
        output?: string;
      };

      if (!response.ok) {
        throw new Error(payload.error ?? "Mentor execution failed.");
      }

      const assistantReply = payload.output ?? "";
      setMentorMessages((current) => [...current, { role: "assistant", text: assistantReply }]);
      speakReply(assistantReply);
    } catch (error) {
      setMentorMessages((current) => [
        ...current,
        {
          role: "assistant",
          text: error instanceof Error ? error.message : "Unexpected mentor error."
        }
      ]);
    } finally {
      setMentorLoading(false);
    }
  }

  async function handleCopyOutput() {
    if (!output) {
      return;
    }

    await navigator.clipboard.writeText(output);
    setCopyState("copied");
    window.setTimeout(() => {
      setCopyState("idle");
    }, 1800);
  }

  return {
    availableModules,
    catalogLoading,
    copyState,
    formValues,
    handleCopyOutput,
    handleMentorSend,
    handleRoleplaySend,
    handleRunTool,
    mentorInput,
    mentorLoading,
    mentorMessages,
    mentorOpen,
    moduleCounts,
    moduleSearch,
    modules,
    output,
    outputProvider,
    roleplayInput,
    roleplayLoading,
    roleplayMessages,
    runLoading,
    selectedImage,
    selectedModule,
    selectedTool,
    setFormValues,
    setMentorInput,
    setMentorOpen,
    setModuleSearch,
    setRoleplayInput,
    setSelectedImage,
    setSelectedModule,
    setSelectedToolId,
    setToolSearch,
    toolSearch,
    tools,
    visibleTools
  };
}
