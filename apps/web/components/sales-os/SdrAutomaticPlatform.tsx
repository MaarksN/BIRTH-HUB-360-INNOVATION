"use client";
import React, { useState } from "react";
import styles from "./sdr-automatic-platform.module.css";
import { SdrLeadScoreView, SdrAssistenteView, SdrAgendadorView, SdrHandoffView } from "./SdrAutomaticViews";
import { getSdrAutomaticConfig } from "./sdr-automatic-data";

export function SdrAutomaticPlatform({ locale }: { locale: "en-US" | "pt-BR" }) {
  const [activeTab, setActiveTab] = useState("score");

  const tabLabels = {
    "en-US": {
      score: "Predictive Score",
      assistente: "Qualification Assist",
      agendador: "Smart Scheduler",
      handoff: "AE Handoff"
    },
    "pt-BR": {
      score: "Score Preditivo",
      assistente: "Assistente Qualificação",
      agendador: "Agendamento Inteligente",
      handoff: "Handoff AE"
    }
  } as const;

  const currentLabels = tabLabels[locale] ?? tabLabels["pt-BR"];

  // Usando configuração real
  const { copy, crmRegions, leads, timeSlots } = getSdrAutomaticConfig(locale);
  // Pega o primeiro lead como amostra
  const prospect = leads[0];

  return (
    <div className={styles.platformContainer}>
      <nav className={styles.platformNav}>
        <button
          onClick={() => setActiveTab("score")}
          data-active={activeTab === "score"}
        >
          {currentLabels.score}
        </button>
        <button
          onClick={() => setActiveTab("assistente")}
          data-active={activeTab === "assistente"}
        >
          {currentLabels.assistente}
        </button>
        <button
          onClick={() => setActiveTab("agendador")}
          data-active={activeTab === "agendador"}
        >
          {currentLabels.agendador}
        </button>
        <button
          onClick={() => setActiveTab("handoff")}
          data-active={activeTab === "handoff"}
        >
          {currentLabels.handoff}
        </button>
      </nav>

      <div className={styles.platformContent}>
        {activeTab === "score" && <SdrLeadScoreView copy={copy} crmRegions={crmRegions} locale={locale} leads={leads} />}
        {activeTab === "assistente" && <SdrAssistenteView copy={copy} locale={locale} />}
        {activeTab === "agendador" && <SdrAgendadorView copy={copy} locale={locale} timeSlots={timeSlots} />}
        {activeTab === "handoff" && <SdrHandoffView copy={copy} locale={locale} />}
      </div>
    </div>
  );
}
