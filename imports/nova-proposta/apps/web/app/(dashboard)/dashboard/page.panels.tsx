import Link from "next/link";

import { ProductEmptyState } from "../../../components/dashboard/page-fragments";
import {
  formatDateTime,
  formatNumber,
  translateLabel,
  type Dictionary,
  type SupportedLocale
} from "../../../lib/i18n";
import { formatRiskTone, loadDashboardHomePage } from "./page.data";
import { getDashboardStaticCopy } from "./page.sections";

type DashboardHomeCopy = Dictionary["dashboardHome"];
type DashboardHomeData = Awaited<ReturnType<typeof loadDashboardHomePage>>;
type DashboardStaticCopy = ReturnType<typeof getDashboardStaticCopy>;

function formatHealthRisk(locale: SupportedLocale, risk: string): string {
  if (locale === "pt-BR") {
    return risk;
  }

  const labels: Record<string, string> = {
    alto: "High",
    baixo: "Low",
    medio: "Medium",
    moderado: "Moderate"
  };

  return labels[risk.toLowerCase()] ?? risk;
}

export function DashboardSalesOsSection(props: {
  locale: SupportedLocale;
  salesOsModuleCount: number;
  salesOsRoleplayCount: number;
  salesOsToolCount: number;
  staticCopy: DashboardStaticCopy;
}) {
  return (
    <section className="dashboard-grid dashboard-grid--equal">
      <article className="hero-card">
        <div className="dashboard-panel__header">
          <div className="dashboard-panel__copy">
            <span className="badge">Sales OS</span>
            <h2>{props.staticCopy.salesOsTitle}</h2>
            <p className="dashboard-muted">{props.staticCopy.salesOsDescription}</p>
          </div>
          <div className="hero-actions">
            <Link href="/sales-os">{props.staticCopy.salesOsCta}</Link>
            <Link className="ghost-button" href="/sales-os/sdr-automatico">
              {props.staticCopy.salesOsSecondaryCta}
            </Link>
          </div>
        </div>

        <section className="stats-grid dashboard-stats-grid">
          <article>
            <span className="badge">{props.staticCopy.salesOsMetrics[0]}</span>
            <strong>{formatNumber(props.locale, props.salesOsModuleCount)}</strong>
            <p className="dashboard-muted dashboard-muted--compact">
              {props.staticCopy.salesOsMetricSubtitles[0]}
            </p>
          </article>
          <article>
            <span className="badge">{props.staticCopy.salesOsMetrics[1]}</span>
            <strong>{formatNumber(props.locale, props.salesOsToolCount)}</strong>
            <p className="dashboard-muted dashboard-muted--compact">
              {props.staticCopy.salesOsMetricSubtitles[1]}
            </p>
          </article>
          <article>
            <span className="badge">{props.staticCopy.salesOsMetrics[2]}</span>
            <strong>{formatNumber(props.locale, props.salesOsRoleplayCount)}</strong>
            <p className="dashboard-muted dashboard-muted--compact">
              {props.staticCopy.salesOsMetricSubtitles[2]}
            </p>
          </article>
        </section>
      </article>

      <article className="panel">
        <h2>{props.locale === "pt-BR" ? "Entradas mais fortes" : "Best entry points"}</h2>
        <div className="dashboard-card-list">
          {props.staticCopy.entryPoints.map((entryPoint, index) => (
            <article className="dashboard-record-card" key={props.staticCopy.entryPointTitles[index]}>
              <strong>{props.staticCopy.entryPointTitles[index]}</strong>
              <span className="dashboard-record-card__meta">{entryPoint}</span>
            </article>
          ))}
        </div>
      </article>
    </section>
  );
}

export function DashboardClinicalSection(props: {
  copy: DashboardHomeCopy;
  data: DashboardHomeData;
  locale: SupportedLocale;
}) {
  if (!props.data.capabilities.clinicalWorkspaceEnabled || !props.data.clinical) {
    return null;
  }

  return (
    <section className="dashboard-grid dashboard-grid--primary">
      <article className="panel">
        <div className="dashboard-panel__header">
          <div className="dashboard-panel__copy">
            <h2>{props.copy.clinicalHeading}</h2>
            <p className="dashboard-muted">{props.copy.clinicalDescription}</p>
          </div>
          <Link href="/patients">{props.copy.openClinicalModule}</Link>
        </div>

        <section className="stats-grid dashboard-stats-grid">
          {props.data.clinical.metrics.map((item) => (
            <article key={item.label}>
              <span className="badge">{item.label}</span>
              <strong>{formatNumber(props.locale, item.value)}</strong>
              <p className="dashboard-muted dashboard-muted--compact">{item.delta}</p>
            </article>
          ))}
        </section>

        {props.data.clinical.spotlight.length === 0 ? (
          <ProductEmptyState
            description={props.copy.noClinicalSpotlightDescription}
            title={props.copy.noClinicalSpotlightTitle}
          />
        ) : (
          <div className="dashboard-card-list">
            {props.data.clinical.spotlight.map((patient) => (
              <article className="dashboard-record-card" key={patient.patientId}>
                <div className="dashboard-card__header">
                  <strong>{patient.patientName}</strong>
                  <span className="status-pill">
                    {translateLabel(props.copy.clinicalRiskLabels, patient.riskLevel)} ·{" "}
                    {translateLabel(props.copy.clinicalStatusLabels, patient.status)}
                  </span>
                </div>
                <span className="dashboard-record-card__meta">
                  {patient.gestationalAgeLabel ?? props.copy.gestationalAgeUnknown} ·{" "}
                  {patient.nextAppointmentAt
                    ? `${props.copy.returnPrefix} ${formatDateTime(props.locale, patient.nextAppointmentAt, {
                        dateStyle: "medium",
                        timeStyle: "short"
                      })}`
                    : props.copy.noReturnScheduled}
                </span>
                <span className="dashboard-record-card__meta">
                  {patient.latestNoteTitle ?? props.copy.noClinicalNote}
                </span>
                <div className="hero-actions">
                  <Link href={`/patients/${patient.patientId}`}>{props.copy.openPatient}</Link>
                  <Link className="ghost-button" href="/appointments">
                    {props.copy.viewSchedule}
                  </Link>
                </div>
              </article>
            ))}
          </div>
        )}
      </article>

      <article className="panel">
        <h2>{props.copy.goLiveAlertsHeading}</h2>
        {props.data.clinical.alerts.length === 0 ? (
          <ProductEmptyState
            description={props.copy.noClinicalAlertsDescription}
            title={props.copy.noClinicalAlertsTitle}
          />
        ) : (
          <div className="dashboard-card-list">
            {props.data.clinical.alerts.map((alert) => (
              <article className="dashboard-alert-card" key={alert.id}>
                <div className="dashboard-card__header">
                  <strong>{alert.title}</strong>
                  <span
                    className={`status-pill status-${alert.severity === "high" ? "red" : alert.severity === "medium" ? "yellow" : "green"}`}
                  >
                    {translateLabel(props.copy.alertSeverityLabels, alert.severity)}
                  </span>
                </div>
                <p className="dashboard-muted dashboard-muted--compact">{alert.description}</p>
                <Link href={alert.href}>{props.copy.openQueue}</Link>
              </article>
            ))}
          </div>
        )}
      </article>
    </section>
  );
}

export function DashboardWorkflowUsageSection(props: {
  copy: DashboardHomeCopy;
  data: DashboardHomeData;
  locale: SupportedLocale;
  usageEntries: Array<[string, number]>;
}) {
  return (
    <section className="dashboard-grid dashboard-grid--secondary">
      <article className="panel">
        <div className="dashboard-panel__header">
          <div className="dashboard-panel__copy">
            <h2>{props.copy.highlightedWorkflowsHeading}</h2>
            <p className="dashboard-muted">{props.copy.highlightedWorkflowsDescription}</p>
          </div>
          <Link href="/workflows">{props.copy.viewFullWorkflowList}</Link>
        </div>

        {props.data.workflows.items.length === 0 ? (
          <ProductEmptyState
            description={props.copy.noWorkflowsDescription}
            title={props.copy.noWorkflowsTitle}
          />
        ) : (
          <div className="dashboard-card-list">
            {props.data.workflows.items.slice(0, 3).map((workflow) => (
              <article className="dashboard-record-card" key={workflow.id}>
                <div className="dashboard-card__header">
                  <strong>{workflow.name}</strong>
                  <span className="status-pill">
                    {translateLabel(props.copy.workflowStatusLabels, workflow.status)}
                  </span>
                </div>
                <span className="dashboard-record-card__meta">
                  {translateLabel(props.copy.workflowTriggerLabels, workflow.triggerType)} ·{" "}
                  {workflow._count.steps} {props.copy.stepsLabel} · {workflow._count.executions}{" "}
                  {props.copy.executionsLabel}
                </span>
                <div className="hero-actions">
                  <Link href={`/workflows/${workflow.id}/edit`}>{props.copy.openEditor}</Link>
                  <Link className="ghost-button" href={`/workflows/${workflow.id}/runs`}>
                    {props.copy.viewExecutions}
                  </Link>
                </div>
              </article>
            ))}
          </div>
        )}
      </article>

      <article className="panel">
        <h2>{props.copy.usageHeading}</h2>
        <p className="dashboard-muted">
          {props.data.billing.plan.name} · {props.copy.planStatusLabel} {props.data.billing.status}
        </p>
        {props.usageEntries.length === 0 ? (
          <ProductEmptyState
            description={props.copy.noUsageDescription}
            title={props.copy.noUsageTitle}
          />
        ) : (
          <div className="dashboard-usage">
            {props.usageEntries.map(([metric, value]) => (
              <div className="dashboard-usage__item" key={metric}>
                <div className="dashboard-usage__row">
                  <strong>{metric.replace(/_/g, " ")}</strong>
                  <span>{formatNumber(props.locale, value)}</span>
                </div>
                <progress
                  aria-hidden="true"
                  className="dashboard-meter"
                  max={100}
                  value={Math.min(100, Math.max(12, value % 100))}
                />
              </div>
            ))}
          </div>
        )}
      </article>
    </section>
  );
}

export function DashboardCustomerHealthSection(props: {
  copy: DashboardHomeCopy;
  data: DashboardHomeData;
  locale: SupportedLocale;
}) {
  return (
    <section className="dashboard-grid dashboard-grid--equal">
      <article className="panel">
        <h2>{props.copy.customerHealthHeading}</h2>
        {props.data.health.healthScore.length === 0 ? (
          <ProductEmptyState
            description={props.copy.noCustomerHealthDescription}
            title={props.copy.noCustomerHealthTitle}
          />
        ) : (
          <div className="table-wrapper">
            <table className="table">
              <thead>
                <tr>
                  <th>{props.copy.customerColumn}</th>
                  <th>{props.copy.scoreColumn}</th>
                  <th>{props.copy.npsColumn}</th>
                  <th>{props.copy.riskColumn}</th>
                </tr>
              </thead>
              <tbody>
                {props.data.health.healthScore.map((item) => (
                  <tr key={item.client}>
                    <td>{item.client}</td>
                    <td>{item.score}</td>
                    <td>{item.nps}</td>
                    <td className={formatRiskTone(item.risk)}>
                      {formatHealthRisk(props.locale, item.risk)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </article>

      <article className="panel">
        <h2>{props.copy.recentContractsHeading}</h2>
        {props.data.recent.contracts.length === 0 ? (
          <ProductEmptyState
            description={props.copy.noRecentContractsDescription}
            title={props.copy.noRecentContractsTitle}
          />
        ) : (
          <div className="dashboard-contract-list">
            {props.data.recent.contracts.map((contract) => (
              <div className="dashboard-contract-card" key={`${contract.customer}-${contract.owner}`}>
                <strong>{contract.customer}</strong>
                <span className="dashboard-record-card__meta">
                  {contract.status} · {contract.owner}
                </span>
                <span>{contract.mrr}</span>
              </div>
            ))}
          </div>
        )}
      </article>
    </section>
  );
}

export function DashboardAttributionSection(props: {
  copy: DashboardHomeCopy;
  data: DashboardHomeData;
}) {
  return (
    <section className="panel">
      <h2>{props.copy.attributionHeading}</h2>
      {props.data.recent.attribution.length === 0 ? (
        <ProductEmptyState
          description={props.copy.noAttributionDescription}
          title={props.copy.noAttributionTitle}
        />
      ) : (
        <div className="table-wrapper">
          <table className="table">
            <thead>
              <tr>
                <th>{props.copy.sourceColumn}</th>
                <th>{props.copy.leadsColumn}</th>
                <th>{props.copy.conversionColumn}</th>
                <th>{props.copy.cacColumn}</th>
              </tr>
            </thead>
            <tbody>
              {props.data.recent.attribution.map((item) => (
                <tr key={item.source}>
                  <td>{item.source}</td>
                  <td>{item.leads}</td>
                  <td>{item.conversion}</td>
                  <td>{item.cac}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}
