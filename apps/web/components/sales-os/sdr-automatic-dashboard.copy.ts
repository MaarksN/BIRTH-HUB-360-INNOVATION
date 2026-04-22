import type { SupportedLocale } from "../../lib/i18n";

import type {
  LeadRegionId,
  LeadSequenceStatus,
  SdrAutomaticLead
} from "./sdr-automatic-data";
import type {
  ChurnWatchEntry,
  LeadColumnTooltipId,
  LeadDashboardCopy,
  LeadScoreBandId
} from "./sdr-automatic-dashboard";

export function isEnglish(locale: SupportedLocale): boolean {
  return locale === "en-US";
}

function buildRegionLabels(locale: SupportedLocale): Record<LeadRegionId, string> {
  return isEnglish(locale)
    ? {
        "asia-pacific": "Asia-Pacific",
        "europe": "Europe",
        "latin-america": "Latin America",
        "north-america": "North America"
      }
    : {
        "asia-pacific": "Asia-Pacifico",
        "europe": "Europa",
        "latin-america": "America Latina",
        "north-america": "America do Norte"
      };
}

function buildSequenceStatusLabels(locale: SupportedLocale): Record<LeadSequenceStatus, string> {
  return isEnglish(locale)
    ? {
        active: "In progress",
        completed: "Completed",
        paused: "Paused"
      }
    : {
        active: "Em andamento",
        completed: "Concluido",
        paused: "Pausado"
      };
}

function buildScoreBandLabels(locale: SupportedLocale): Record<LeadScoreBandId, string> {
  return isEnglish(locale)
    ? {
        critical: "Critical",
        high: "High",
        warm: "Warm"
      }
    : {
        critical: "Critico",
        high: "Alto",
        warm: "Quente"
      };
}

function buildStageLabels(locale: SupportedLocale): Record<SdrAutomaticLead["stage"], string> {
  return isEnglish(locale)
    ? {
        demo: "Demo",
        negotiation: "Negotiation",
        new: "New",
        proposal: "Proposal",
        qualified: "Qualified"
      }
    : {
        demo: "Demo",
        negotiation: "Negociacao",
        new: "Novo",
        proposal: "Proposta",
        qualified: "Qualificado"
      };
}

function buildColumnTooltips(locale: SupportedLocale): Record<LeadColumnTooltipId, string> {
  return isEnglish(locale)
    ? {
        action: "Run AI scoring or trigger the outbound sequence tailored to this account.",
        company: "Company context helps prioritize by segment fit and account size.",
        createdAt: "Creation date shows freshness and how fast the team is acting on demand.",
        email: "Email search is the fastest way to isolate a known buyer or account owner.",
        lead: "Lead name plus role show seniority and buying influence.",
        owner: "Owner shows who is accountable for the next action and SLA recovery.",
        region: "Region helps route plays by territory, language, and market motion.",
        score: "Predictive score blends fit, engagement, and risk into one prioritization signal.",
        sequenceStatus: "Sequence status tracks whether the automated email cadence is active, paused, or completed.",
        sla: "SLA highlights response pressure before opportunities cool down.",
        source: "Source identifies which campaign, referral, or inbound touch created intent.",
        stage: "Stage shows how far the lead progressed through the revenue pipeline."
      }
    : {
        action: "Rode a analise preditiva ou dispare a sequencia de e-mails adaptada para esta conta.",
        company: "O contexto da empresa ajuda a priorizar por segmento, fit e tamanho de conta.",
        createdAt: "A data de criacao mostra frescor e velocidade de resposta da operacao.",
        email: "A busca por e-mail e a forma mais rapida de isolar um comprador conhecido.",
        lead: "Nome e cargo ajudam a entender senioridade e influencia na compra.",
        owner: "Owner mostra quem responde pelo proximo passo e pela recuperacao de SLA.",
        region: "Regiao ajuda a roteirizar territorio, idioma e motion comercial.",
        score: "O score preditivo combina fit, engajamento e risco em um unico sinal de prioridade.",
        sequenceStatus: "Status da sequencia mostra se a cadencia automatizada esta ativa, pausada ou concluida.",
        sla: "SLA destaca a pressao de resposta antes que a oportunidade esfrie.",
        source: "Origem mostra qual campanha, indicacao ou touch inbound gerou a intencao.",
        stage: "Estagio mostra o quanto o lead avancou pelo pipeline de receita."
      };
}

function buildRiskLabels(locale: SupportedLocale): Record<ChurnWatchEntry["tone"], string> {
  return isEnglish(locale)
    ? {
        critical: "High risk",
        healthy: "Stable",
        watch: "Monitor"
      }
    : {
        critical: "Alto risco",
        healthy: "Estavel",
        watch: "Monitorar"
      };
}

export function getLeadDashboardCopy(locale: SupportedLocale): LeadDashboardCopy {
  const regionLabels = buildRegionLabels(locale);
  const sequenceStatusLabels = buildSequenceStatusLabels(locale);
  const scoreBandLabels = buildScoreBandLabels(locale);
  const stageLabels = buildStageLabels(locale);
  const columnTooltips = buildColumnTooltips(locale);
  const riskLevelLabels = buildRiskLabels(locale);

  if (isEnglish(locale)) {
    return {
      activeAccountsLabel: "Active accounts",
      activeLeadsLabel: "Active leads",
      addTaskLabel: "Add task",
      aiAgentLabel: "predictive_lead_scoring",
      aiAnalysisLabel: "AI analysis",
      aiButtonTooltipBullets: [
        "Combines stage, SLA, email clicks, and key page visits.",
        "Highlights the most likely next move for the owner.",
        "Exposes engagement lift and churn drag inside the score."
      ],
      aiButtonTooltipTitle: "What the AI analysis does",
      aiExecutionsLabel: "AI runs",
      aiTooltipEmpty: "No analysis available yet.",
      aiTooltipLoading: "Generating a structured analysis...",
      chatbotEmpty: "Ask about top leads, SLA pressure, MQL volume, or the current filters.",
      chatbotGreeting:
        "I can summarize hot leads, explain SLA pressure, and translate the dashboard metrics into next actions.",
      chatbotPromptPlaceholder: "Ask about leads, SLAs, MQLs, or next steps...",
      chatbotQuickPrompts: [
        "Which leads need attention now?",
        "Summarize SLA risk",
        "Who has the highest score?"
      ],
      chatbotSend: "Send",
      chatbotTitle: "Support bot",
      churnAgentLabel: "sentiment_analysis_churn_risk",
      churnEmptyLabel: "No churn hotspots in the current slice.",
      churnRefreshLabel: "Refresh AI summary",
      churnSubtitle: "Recent support sentiment and adoption friction flag the accounts most likely to churn.",
      churnTitle: "Churn risk monitor",
      clearFiltersLabel: "Clear filters",
      columnTooltips,
      columnsLabel: "Columns",
      conversionRateLabel: "Conversion",
      createdAtColumn: "Created at",
      dateFilterLabel: "Creation date",
      dateFromLabel: "From",
      dateToLabel: "To",
      distributionTitle: "Leads by stage",
      emailColumn: "Email",
      emailSearchPlaceholder: "Search by email...",
      exportCsvLabel: "Export filtered CSV",
      filterTooltips: {
        columns: "Choose which columns stay visible in the lead table.",
        date: "Limit the queue to leads created inside the selected time window.",
        region: "Route demand by territory to spot concentration and coverage gaps.",
        score: "Stack multiple score bands to isolate the best-fit opportunities.",
        stage: "Select one or many pipeline stages to narrow the recent lead list."
      },
      filtersTitle: "Recent leads",
      funnelSubtitle: "Full CRM funnel from subscriber to customer with live conversion checkpoints.",
      funnelTitle: "Revenue funnel",
      leadsByStageHint: "Distribution follows the filtered list.",
      leadsTrendTitle: "Lead volume trend",
      leadsTrendSubtitle: "Lead flow and MQL creation over the latest polling windows.",
      leadsVisibleLabel: (visible, total) => `${visible} of ${total} leads visible`,
      mapActiveRegionLabel: "Region focus",
      mapSubtitle: "Click a region to refine the queue and inspect the regional revenue picture.",
      mapTitle: "Geographic lead map",
      metricsUpdatedLabel: (seconds) =>
        seconds === 0 ? "Updated just now" : `Updated ${seconds}s ago`,
      mqlsGeneratedLabel: "MQLs generated",
      nextPageLabel: "Next",
      noLeadsLabel: "No leads match the current filters.",
      noTasksLabel: "No pending tasks yet.",
      pageLabel: (page, totalPages) => `Page ${page} of ${totalPages}`,
      pipelineCoverageLabel: "Pipeline coverage",
      pipelineSubtitle: "Stage counts and conversion from one step to the next.",
      pipelineTitle: "Pipeline flow",
      previousPageLabel: "Previous",
      regionColumn: "Region",
      regionFilterLabel: "Regions",
      regionLabels,
      revenuePotentialLabel: "Revenue potential",
      riskLevelLabels,
      scoreBandLabels,
      scoreColumn: "Score",
      scoreFilterLabel: "Score bands",
      sendSequenceLabel: "Send email sequence",
      sequenceStatusColumn: "Email sequence",
      sequenceStatusLabels,
      slaBreachedLabel: "Breached",
      slaColumn: "SLA",
      slaComplianceLabel: "SLA compliance",
      slaHealthyLabel: "Healthy",
      slaTrendTitle: "SLA trend",
      slaTrendSubtitle: "Violations and compliance rate update with live polling.",
      slaViolationsLabel: "SLA breaches",
      slaWatchLabel: "Watch",
      sourceColumn: "Source",
      stageColumn: "Stage",
      stageFilterLabel: "Stages",
      stageLabels,
      taskPlaceholder: "Add a pending task...",
      tasksTitle: "Pending tasks"
    };
  }

  return {
    activeAccountsLabel: "Contas ativas",
    activeLeadsLabel: "Leads ativos",
    addTaskLabel: "Adicionar tarefa",
    aiAgentLabel: "predictive_lead_scoring",
    aiAnalysisLabel: "Analise IA",
    aiButtonTooltipBullets: [
      "Combina estagio, SLA, cliques em e-mail e visitas em paginas-chave.",
      "Aponta o proximo movimento mais provavel para o owner.",
      "Mostra o impacto de engajamento e churn dentro do score."
    ],
    aiButtonTooltipTitle: "O que a analise de IA faz",
    aiExecutionsLabel: "Execucoes de IA",
    aiTooltipEmpty: "Nenhuma analise disponivel ainda.",
    aiTooltipLoading: "Gerando uma analise estruturada...",
    chatbotEmpty: "Pergunte sobre top leads, pressao de SLA, volume de MQLs ou os filtros atuais.",
    chatbotGreeting:
      "Consigo resumir os leads mais quentes, explicar o risco de SLA e traduzir as metricas do dashboard em proximos passos.",
    chatbotPromptPlaceholder: "Pergunte sobre leads, SLAs, MQLs ou proximos passos...",
    chatbotQuickPrompts: [
      "Quais leads exigem atencao agora?",
      "Resuma o risco de SLA",
      "Quem tem maior score?"
    ],
    chatbotSend: "Enviar",
    chatbotTitle: "Chat de suporte",
    churnAgentLabel: "sentiment_analysis_churn_risk",
    churnEmptyLabel: "Nenhum foco critico de churn no recorte atual.",
    churnRefreshLabel: "Atualizar resumo de IA",
    churnSubtitle: "Sentimento recente no suporte e friccao de adocao sinalizam as contas com maior risco de cancelamento.",
    churnTitle: "Monitor de churn",
    clearFiltersLabel: "Limpar filtros",
    columnTooltips,
    columnsLabel: "Colunas",
    conversionRateLabel: "Conversao",
    createdAtColumn: "Criado em",
    dateFilterLabel: "Data de criacao",
    dateFromLabel: "De",
    dateToLabel: "Ate",
    distributionTitle: "Leads por estagio",
    emailColumn: "E-mail",
    emailSearchPlaceholder: "Buscar por e-mail...",
    exportCsvLabel: "Exportar CSV filtrado",
    filterTooltips: {
      columns: "Escolha quais colunas permanecem visiveis na tabela de leads.",
      date: "Limite a fila aos leads criados dentro da janela selecionada.",
      region: "Roteie a demanda por territorio para enxergar concentracao e cobertura.",
      score: "Empilhe varias faixas de score para isolar as melhores oportunidades.",
      stage: "Selecione um ou varios estagios do pipeline para refinar a lista."
    },
    filtersTitle: "Leads Recentes",
    funnelSubtitle: "Funil completo do CRM de subscriber ate customer com checkpoints de conversao.",
    funnelTitle: "Funil de receita",
    leadsByStageHint: "A distribuicao acompanha a lista filtrada.",
    leadsTrendTitle: "Tendencia de leads",
    leadsTrendSubtitle: "Fluxo de leads e criacao de MQLs nas janelas mais recentes de polling.",
    leadsVisibleLabel: (visible, total) => `${visible} de ${total} leads visiveis`,
    mapActiveRegionLabel: "Foco regional",
    mapSubtitle: "Clique em uma regiao para refinar a fila e inspecionar o retrato de receita local.",
    mapTitle: "Mapa geografico de leads",
    metricsUpdatedLabel: (seconds) =>
      seconds === 0 ? "Atualizado agora" : `Atualizado ha ${seconds}s`,
    mqlsGeneratedLabel: "MQLs gerados",
    nextPageLabel: "Proxima",
    noLeadsLabel: "Nenhum lead corresponde aos filtros atuais.",
    noTasksLabel: "Nenhuma tarefa pendente ainda.",
    pageLabel: (page, totalPages) => `Pagina ${page} de ${totalPages}`,
    pipelineCoverageLabel: "Cobertura de pipeline",
    pipelineSubtitle: "Contagem por estagio e conversao de uma etapa para a proxima.",
    pipelineTitle: "Fluxo do pipeline",
    previousPageLabel: "Anterior",
    regionColumn: "Regiao",
    regionFilterLabel: "Regioes",
    regionLabels,
    revenuePotentialLabel: "Potencial de receita",
    riskLevelLabels,
    scoreBandLabels,
    scoreColumn: "Score",
    scoreFilterLabel: "Faixas de score",
    sendSequenceLabel: "Enviar sequencia de e-mails",
    sequenceStatusColumn: "Sequencia de e-mails",
    sequenceStatusLabels,
    slaBreachedLabel: "Violado",
    slaColumn: "SLA",
    slaComplianceLabel: "Conformidade de SLA",
    slaHealthyLabel: "Saudavel",
    slaTrendTitle: "Tendencia de SLA",
    slaTrendSubtitle: "Violacoes e taxa de conformidade atualizadas com polling em tempo real.",
    slaViolationsLabel: "Violacoes de SLA",
    slaWatchLabel: "Atencao",
    sourceColumn: "Origem",
    stageColumn: "Estagio",
    stageFilterLabel: "Estagios",
    stageLabels,
    taskPlaceholder: "Adicionar uma tarefa pendente...",
    tasksTitle: "Tarefas Pendentes"
  };
}

export function resolveSlaLabel(
  locale: SupportedLocale,
  status: SdrAutomaticLead["slaStatus"]
): string {
  const copy = getLeadDashboardCopy(locale);

  if (status === "breached") {
    return copy.slaBreachedLabel;
  }

  if (status === "watch") {
    return copy.slaWatchLabel;
  }

  return copy.slaHealthyLabel;
}
