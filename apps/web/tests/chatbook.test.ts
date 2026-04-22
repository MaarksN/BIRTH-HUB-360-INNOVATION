import assert from "node:assert/strict";
import test from "node:test";

import {
  buildChatbookConversationDraft,
  buildChatbookExportMarkdown,
  buildChatbookReply
} from "../lib/chatbook";

void test("chatbook routes recommendation requests to internal search, simulation and actions", () => {
  const reply = buildChatbookReply({
    message:
      "Encontre o melhor plano para este cliente, compare as opcoes e me mostre a economia anual.",
    requestId: "test-1"
  });

  assert.equal(reply.router.intencaoPrincipal, "comparacao");
  assert.equal(reply.router.ferramentasNecessarias.includes("busca_interna"), true);
  assert.equal(reply.router.ferramentasNecessarias.includes("simulacao"), true);
  assert.equal(reply.router.ferramentasNecessarias.includes("acao_plataforma"), false);
  assert.equal(reply.simulation !== null, true);
  assert.equal(reply.executionPlan.approvalRequired, true);
  assert.equal(reply.executionPlan.targetModule, "Packs");
  assert.equal(
    reply.executionPlan.prefilledFields.some((field) => field.label === "Economia anual estimada"),
    true
  );
  assert.match(reply.sections.resumo, /economia anual/i);
});

void test("chatbook adds web context when the prompt asks for external validation", () => {
  const reply = buildChatbookReply({
    message:
      "Pesquise referencias confiaveis na web para validar este cenario e separe o que veio de fora.",
    requestId: "test-2"
  });

  assert.equal(reply.router.ferramentasNecessarias.includes("busca_web"), true);
  assert.equal(reply.sources.web.length > 0, true);
  assert.match(reply.sections.web[0] ?? "", /fonte/i);
});

void test("chatbook respects live platform results and exposes actionable next steps", () => {
  const reply = buildChatbookReply({
    livePlatformResults: [
      {
        href: "/reports?client=acme",
        id: "live-1",
        module: "Reports",
        subtitle: "Margem, ROI e produtividade do cliente Acme",
        title: "Relatorio Acme Materna",
        type: "relatorio"
      }
    ],
    message: "Abra a tela mais relevante para o cliente Acme e traga um resumo executivo.",
    preferredTools: ["busca_interna", "acao_plataforma", "resumo"],
    requestId: "test-3",
    voiceEnabled: true
  });

  assert.equal(reply.sources.plataforma[0]?.sourceLabel, "Busca viva da plataforma");
  assert.equal(reply.actions.some((action) => action.href === "/reports"), true);
  assert.match(reply.decisionTrail.join(" "), /voz/i);
});

void test("chatbook simulation accepts explicit editable parameters", () => {
  const reply = buildChatbookReply({
    message: "Simule este cenario com economia anual.",
    requestId: "test-4",
    simulationInput: {
      activeUsers: 50,
      annualVolume: 1200,
      currentMonthlyCost: 20000,
      currentPlan: "Plano Base",
      onboardingBacklog: 12,
      recommendedPlan: "Plano Assistido"
    }
  });

  assert.equal(reply.simulation?.scenarios[0]?.annualValue, 240000);
  assert.equal(reply.simulation?.dataPoints.find((item) => item.label === "Usuarios ativos")?.value, "50");
  assert.equal(reply.simulation?.dataPoints.find((item) => item.label === "Plano recomendado")?.value, "Plano Assistido");
  assert.match(reply.simulation?.assumptions.join(" ") ?? "", /parametros editaveis/i);
});

void test("chatbook export builds a portable markdown summary", () => {
  const reply = buildChatbookReply({
    message: "Compare planos e gere um resumo executivo.",
    requestId: "test-5"
  });
  const markdown = buildChatbookExportMarkdown(reply);

  assert.match(markdown, /# ChatBook Inteligentissimo/);
  assert.match(markdown, /## Resumo/);
  assert.match(markdown, /## Execucao assistida/);
  assert.match(markdown, /Request: test-5/);
});

void test("chatbook conversation draft turns a reply into an operational thread seed", () => {
  const reply = buildChatbookReply({
    message: "Abra uma thread operacional para acompanhar a recomendacao.",
    requestId: "test-6"
  });
  const draft = buildChatbookConversationDraft(reply);

  assert.match(draft.subject, /ChatBook:/);
  assert.match(draft.initialMessage, /Resumo gerado pelo ChatBook Inteligentissimo/);
  assert.match(draft.initialMessage, /Proximas acoes sugeridas/);
  assert.match(draft.initialMessage, /Checklist de execucao/);
  assert.match(draft.initialMessage, /test-6/);
});

void test("chatbook uses textual attachment context as an internal evidence source", () => {
  const reply = buildChatbookReply({
    attachmentContexts: [
      {
        contentType: "text/plain",
        name: "briefing-cliente.txt",
        size: 240,
        text: "Cliente pediu reducao de custo mensal, comparacao de planos e proposta com ROI anual."
      }
    ],
    attachmentNames: ["briefing-cliente.txt"],
    message: "Analise o anexo e monte uma recomendacao.",
    requestId: "test-7"
  });

  assert.equal(reply.sources.plataforma[0]?.sourceLabel, "Anexo enviado");
  assert.match(reply.sections.plataforma.join(" "), /reducao de custo mensal/i);
  assert.match(reply.decisionTrail.join(" "), /Li conteudo textual/i);
});
