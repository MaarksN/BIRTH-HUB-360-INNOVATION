import {
  CalendarClock,
  CalendarPlus,
  Clock3,
  MessageSquareQuote,
  Send,
  Sparkles
} from "lucide-react";

import type { SupportedLocale } from "../../lib/i18n";
import type {
  CrmRegionSnapshot,
  SdrAutomaticCopy,
  SdrAutomaticLead,
  SdrAutomaticTimeSlot
} from "./sdr-automatic-data";
import { SdrLeadScoreWorkspace } from "./SdrLeadScoreWorkspace";
import styles from "./sdr-automatic-platform.module.css";

function isEnglish(locale: SupportedLocale) {
  return locale === "en-US";
}

export function SdrLeadScoreView(input: {
  copy: SdrAutomaticCopy;
  crmRegions: CrmRegionSnapshot[];
  leads: SdrAutomaticLead[];
  locale: SupportedLocale;
}) {
  return (
    <SdrLeadScoreWorkspace
      copy={input.copy}
      crmRegions={input.crmRegions}
      leads={input.leads}
      locale={input.locale}
    />
  );
}

export function SdrAssistenteView(input: {
  copy: SdrAutomaticCopy;
  locale: SupportedLocale;
}) {
  const english = isEnglish(input.locale);

  return (
    <section className={styles.viewGrid}>
      <article className={styles.surfaceCard}>
        <div className={styles.cardHeader}>
          <div>
            <strong>{input.copy.callFocus}</strong>
            <p>{input.copy.assistantHint}</p>
          </div>
          <Sparkles size={18} />
        </div>

        <div className={styles.notesPanel}>
          <article className={styles.noteBlock}>
            <strong>{english ? "Current pains" : "Dores atuais"}</strong>
            <p>{english ? "Lead flow is unstable, conversion is low, and the team spends too much time searching for qualified contacts." : "Fluxo de leads instavel, conversao baixa e excesso de tempo gasto procurando contatos qualificados."}</p>
          </article>
          <article className={styles.noteBlock}>
            <strong>{english ? "Target outcome" : "Objetivo principal"}</strong>
            <p>{english ? "Increase booked meetings by 30 percent without expanding headcount this quarter." : "Aumentar em 30 por cento as reunioes agendadas sem ampliar headcount neste trimestre."}</p>
          </article>
          <article className={styles.noteBlock}>
            <strong>{english ? "Buying signal" : "Sinal de compra"}</strong>
            <p>{english ? "Asked how long the team would need to go live and which integrations come out of the box." : "Perguntou sobre tempo de go-live e quais integracoes entram prontas no pacote."}</p>
          </article>
        </div>
      </article>

      <article className={styles.surfaceCard}>
        <div className={styles.cardHeader}>
          <div>
            <strong>{input.copy.spinLabel}</strong>
            <p>{english ? "Questions suggested in real time." : "Perguntas sugeridas em tempo real."}</p>
          </div>
          <MessageSquareQuote size={18} />
        </div>

        <div className={styles.stack}>
          <article className={styles.promptCard}>
            <span>{english ? "Situation" : "Situacao"}</span>
            <p>{english ? "\"How does your qualification process work today from first touch to demo handoff?\"" : "\"Como funciona hoje o processo de qualificacao do primeiro toque ate o handoff para demo?\""}</p>
          </article>
          <article className={styles.promptCard}>
            <span>{english ? "Problem" : "Problema"}</span>
            <p>{english ? "\"Where does the team lose the most time before a meeting gets booked?\"" : "\"Onde a equipe mais perde tempo antes de uma reuniao ser agendada?\""}</p>
          </article>
          <article className={styles.promptCard}>
            <span>{english ? "Implication" : "Implicacao"}</span>
            <p>{english ? "\"What happens to monthly targets when qualified contacts take too long to surface?\"" : "\"O que acontece com a meta mensal quando os contatos qualificados demoram a aparecer?\""}</p>
          </article>
          <article className={styles.promptCard}>
            <span>{english ? "Need-payoff" : "Necessidade"}</span>
            <p>{english ? "\"If the team received ranked leads with next actions, what would improve first?\"" : "\"Se a equipe recebesse leads ranqueados com proximo passo claro, o que melhoraria primeiro?\""}</p>
          </article>
        </div>
      </article>
    </section>
  );
}

export function SdrAgendadorView(input: {
  copy: SdrAutomaticCopy;
  locale: SupportedLocale;
  timeSlots: SdrAutomaticTimeSlot[];
}) {
  const english = isEnglish(input.locale);

  return (
    <section className={styles.viewGrid}>
      <article className={styles.surfaceCard}>
        <div className={styles.cardHeader}>
          <div>
            <strong>{input.copy.agendaTitle}</strong>
            <p>{input.copy.agendaCaption}</p>
          </div>
          <CalendarClock size={18} />
        </div>

        <div className={styles.recommendationCard}>
          <div>
            <span>{input.copy.agendaHelper}</span>
            <strong>Ricardo Mendes</strong>
            <p>{english ? "Strongest closer for media and demand-gen accounts with mid-market sales cycles." : "Closer mais aderente para contas de midia e demand gen com ciclo mid-market."}</p>
          </div>
          <div className={styles.recommendationMeta}>
            <span>Win rate 34%</span>
            <span>{english ? "Segment fit" : "Fit de segmento"}</span>
          </div>
        </div>

        <div className={styles.slotGrid}>
          {input.timeSlots.map((slot) => (
            <button
              className={styles.slotCard}
              data-recommended={slot.recommended ? "true" : "false"}
              key={slot.label}
              type="button"
            >
              <Clock3 size={16} />
              <strong>{slot.label}</strong>
              <span>
                {slot.recommended
                  ? english
                    ? "Best match"
                    : "Melhor encaixe"
                  : english
                    ? "Available"
                    : "Disponivel"}
              </span>
            </button>
          ))}
        </div>
      </article>

      <article className={styles.surfaceCard}>
        <div className={styles.cardHeader}>
          <div>
            <strong>{input.copy.timelineLabel}</strong>
            <p>{english ? "The platform crosses rep capacity, segment expertise, and speed-to-demo." : "A plataforma cruza capacidade do closer, expertise de segmento e velocidade para demo."}</p>
          </div>
          <CalendarPlus size={18} />
        </div>
        <div className={styles.timelineList}>
          <article>
            <strong>{english ? "Segment knowledge" : "Conhecimento de segmento"}</strong>
            <p>{english ? "Ricardo already closed three media clients in the last 60 days." : "Ricardo fechou tres contas de midia nos ultimos 60 dias."}</p>
          </article>
          <article>
            <strong>{english ? "Speed to first meeting" : "Velocidade para primeira reuniao"}</strong>
            <p>{english ? "Earliest premium slot is tomorrow at 09:30 with room for prep." : "Primeiro horario premium e amanha as 09:30 com tempo para prep."}</p>
          </article>
          <article>
            <strong>{input.copy.nextStepLabel}</strong>
            <p>{english ? "Lock 09:30, send the handoff, and preload the discovery plan." : "Fechar 09:30, enviar briefing e pre-carregar o plano de discovery."}</p>
          </article>
        </div>
      </article>
    </section>
  );
}

export function SdrHandoffView(input: {
  copy: SdrAutomaticCopy;
  locale: SupportedLocale;
}) {
  const english = isEnglish(input.locale);

  return (
    <section className={styles.viewGrid}>
      <article className={styles.surfaceCard}>
        <div className={styles.cardHeader}>
          <div>
            <strong>{input.copy.handoffTitle}</strong>
            <p>{input.copy.handoffSubtitle}</p>
          </div>
          <Send size={18} />
        </div>

        <div className={styles.summaryGrid}>
          <article className={styles.noteBlock}>
            <strong>{english ? "Pain points identified" : "Dores identificadas"}</strong>
            <p>{english ? "Low lead conversion, team fatigue, and difficulty surfacing qualified contacts fast enough." : "Baixa conversao de leads, equipe desmotivada e dificuldade para encontrar contatos qualificados no ritmo certo."}</p>
          </article>
          <article className={styles.noteBlock}>
            <strong>{english ? "Primary objective" : "Objetivo principal"}</strong>
            <p>{english ? "Book 30 percent more meetings per month with a more predictable SDR motion." : "Aumentar em 30 por cento as reunioes por mes com uma operacao SDR mais previsivel."}</p>
          </article>
          <article className={styles.noteBlock}>
            <strong>{english ? "Demo angle" : "Angulo da demo"}</strong>
            <p>{english ? "Focus on predictive ranking, qualification support, and automated handoff into closing." : "Focar em ranking preditivo, suporte de qualificacao e handoff automatizado para fechamento."}</p>
          </article>
        </div>
      </article>

      <article className={styles.surfaceCard}>
        <div className={styles.cardHeader}>
          <div>
            <strong>{input.copy.summaryLabel}</strong>
            <p>{english ? "What the closer needs before the call." : "O que o closer precisa antes da reuniao."}</p>
          </div>
          <Sparkles size={18} />
        </div>

        <div className={styles.stack}>
          <article className={styles.promptCard}>
            <span>{english ? "Recommended opening" : "Abertura recomendada"}</span>
            <p>{english ? "Start from revenue waste in qualification and bridge directly into demo velocity." : "Entrar pela perda de receita na qualificacao e conectar direto com velocidade de demo."}</p>
          </article>
          <article className={styles.promptCard}>
            <span>{english ? "Competitive risk" : "Risco competitivo"}</span>
            <p>{english ? "The account is also evaluating a generic sequencing tool with weaker ranking logic." : "A conta tambem esta avaliando uma ferramenta generica de sequencia com ranking mais fraco."}</p>
          </article>
          <article className={styles.promptCard}>
            <span>{input.copy.nextStepLabel}</span>
            <p>{english ? "Confirm KPIs, show the SDR workflow, and close on a pilot with one pod." : "Confirmar KPIs, mostrar o fluxo SDR e fechar piloto com um pod inicial."}</p>
          </article>
        </div>

        <button className={styles.primaryCta} type="button">
          <Send size={16} />
          <span>{input.copy.actionPrimary}</span>
        </button>
      </article>
    </section>
  );
}
