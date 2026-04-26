"use client";

import {
  Activity,
  Bot,
  CheckCircle2,
  Plus
} from "lucide-react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis
} from "recharts";

import type { SupportedLocale } from "../../lib/i18n";
import type { SdrAutomaticLead } from "./sdr-automatic-data";
import type {
  LeadDashboardCopy,
  PendingTask
} from "./sdr-automatic-dashboard";
import {
  buildStageColor,
  type SupportMessage
} from "./SdrLeadScoreWorkspace.helpers";
import shellStyles from "./sdr-automatic-platform.module.css";
import styles from "./sdr-lead-score.module.css";

type StageDistributionEntry = {
  count: number;
  stage: SdrAutomaticLead["stage"];
  stageLabel: string;
};

type SdrLeadScoreWorkspaceSideProps = {
  dashboardCopy: LeadDashboardCopy;
  locale: SupportedLocale;
  setSupportInput: (value: string) => void;
  setSupportOpen: (value: boolean | ((current: boolean) => boolean)) => void;
  setTaskInput: (value: string) => void;
  stageDistribution: StageDistributionEntry[];
  supportInput: string;
  supportMessages: SupportMessage[];
  supportOpen: boolean;
  taskInput: string;
  tasks: PendingTask[];
  handleAddTask: () => void;
  handleSupportSubmit: (question?: string) => void;
  toggleTask: (taskId: string) => void;
};

export function SdrLeadScoreWorkspaceSide(props: SdrLeadScoreWorkspaceSideProps) {
  const {
    dashboardCopy,
    handleAddTask,
    handleSupportSubmit,
    locale,
    setSupportInput,
    setSupportOpen,
    setTaskInput,
    stageDistribution,
    supportInput,
    supportMessages,
    supportOpen,
    taskInput,
    tasks,
    toggleTask
  } = props;

  return (
    <>
      <div className={styles.sideRail}>
        <article className={`${shellStyles.surfaceCard} ${styles.distributionCard}`}>
          <div className={shellStyles.cardHeader}>
            <div>
              <strong>{dashboardCopy.distributionTitle}</strong>
              <p>{dashboardCopy.leadsByStageHint}</p>
            </div>
            <Activity size={18} />
          </div>
          <div className={styles.distributionChart}>
            <ResponsiveContainer height="100%" width="100%">
              <BarChart data={stageDistribution} layout="vertical" margin={{ left: 8, right: 8 }}>
                <CartesianGrid horizontal={false} stroke="rgba(148, 163, 184, 0.16)" />
                <XAxis allowDecimals={false} dataKey="count" type="number" />
                <YAxis dataKey="stageLabel" tickLine={false} type="category" width={90} />
                <Tooltip
                  contentStyle={{
                    background: "var(--surface-panel-strong)",
                    border: "1px solid var(--border)",
                    borderRadius: 16
                  }}
                />
                <Bar dataKey="count" radius={[0, 12, 12, 0]}>
                  {stageDistribution.map((entry) => (
                    <Cell fill={buildStageColor(entry.stage)} key={entry.stage} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </article>

        <article className={`${shellStyles.surfaceCard} ${styles.taskCard}`}>
          <div className={shellStyles.cardHeader}>
            <div>
              <strong>{dashboardCopy.tasksTitle}</strong>
              <p>{tasks.filter((task) => !task.completed).length}</p>
            </div>
            <CheckCircle2 size={18} />
          </div>
          <div className={styles.taskComposer}>
            <input
              aria-label="Nova tarefa"
              onChange={(event) => setTaskInput(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Enter") {
                  event.preventDefault();
                  handleAddTask();
                }
              }}
              placeholder={dashboardCopy.taskPlaceholder}
              type="text"
              value={taskInput}
            />
            <button className={styles.secondaryButton} onClick={handleAddTask} type="button">
              <Plus size={16} />
              <span>{dashboardCopy.addTaskLabel}</span>
            </button>
          </div>
          {tasks.length === 0 ? (
            <p className={styles.emptyCopy}>{dashboardCopy.noTasksLabel}</p>
          ) : (
            <div className={styles.taskList}>
              {tasks.map((task) => (
                <label className={styles.taskItem} data-completed={task.completed} key={task.id}>
                  <input
                    checked={task.completed}
                    onChange={() => toggleTask(task.id)}
                    type="checkbox"
                  />
                  <span>{task.title}</span>
                </label>
              ))}
            </div>
          )}
        </article>
      </div>

      <button className={styles.supportFab} onClick={() => setSupportOpen((current) => !current)} type="button">
        <Bot size={18} />
        <span>{dashboardCopy.chatbotTitle}</span>
      </button>

      {supportOpen ? (
        <aside className={styles.supportPanel}>
          <div className={styles.supportHeader}>
            <div>
              <strong>{dashboardCopy.chatbotTitle}</strong>
              <p>{dashboardCopy.chatbotEmpty}</p>
            </div>
            <button className={styles.secondaryButton} onClick={() => setSupportOpen(false)} type="button">
              {locale === "en-US" ? "Close" : "Fechar"}
            </button>
          </div>

          <div className={styles.quickQuestions}>
            {dashboardCopy.chatbotQuickPrompts.map((prompt) => (
              <button
                className={styles.quickQuestionButton}
                key={prompt}
                onClick={() => handleSupportSubmit(prompt)}
                type="button"
              >
                {prompt}
              </button>
            ))}
          </div>

          <div className={styles.supportTranscript}>
            {supportMessages.map((message) => (
              <article className={styles.supportBubble} data-role={message.role} key={message.id}>
                <strong>
                  {message.role === "assistant"
                    ? dashboardCopy.chatbotTitle
                    : locale === "en-US"
                      ? "You"
                      : "Voce"}
                </strong>
                <p>{message.text}</p>
              </article>
            ))}
          </div>

          <div className={styles.supportComposer}>
            <input
              aria-label="Mensagem de suporte"
              onChange={(event) => setSupportInput(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Enter") {
                  event.preventDefault();
                  handleSupportSubmit();
                }
              }}
              placeholder={dashboardCopy.chatbotPromptPlaceholder}
              type="text"
              value={supportInput}
            />
            <button className={styles.secondaryButton} onClick={() => handleSupportSubmit()} type="button">
              {dashboardCopy.chatbotSend}
            </button>
          </div>
        </aside>
      ) : null}
    </>
  );
}
