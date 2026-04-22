import Link from "next/link";

import {
  ProductEmptyState,
  ProductPageHeader
} from "../../../components/dashboard/page-fragments";
import { CreateWorkflowButton } from "../../../components/workflows/CreateWorkflowButton";
import { RunWorkflowButton } from "../../../components/workflows/RunWorkflowButton";
import { formatDateTime, getDictionary, translateLabel } from "../../../lib/i18n";
import { getRequestLocale } from "../../../lib/i18n.server";
import { fetchProductJson } from "../../../lib/product-api.server";

type WorkflowListPayload = {
  items: Array<{
    _count: {
      executions: number;
      steps: number;
    };
    createdAt: string;
    id: string;
    name: string;
    status: "ARCHIVED" | "DRAFT" | "PUBLISHED";
    triggerType: string;
    updatedAt: string;
  }>;
};

export default async function WorkflowsPage() {
  const locale = await getRequestLocale();
  const copy = getDictionary(locale);
  const data = await fetchProductJson<WorkflowListPayload>("/api/v1/workflows");

  return (
    <main className="dashboard-content">
      <ProductPageHeader
        actions={
          <div className="hero-actions">
            <CreateWorkflowButton />
            <Link className="ghost-button" href="/dashboard">
              {copy.workflowsPage.backHome}
            </Link>
          </div>
        }
        badge={copy.workflowsPage.badge}
        description={copy.workflowsPage.description}
        title={copy.workflowsPage.title}
      />

      {data.items.length === 0 ? (
        <ProductEmptyState
          action={<CreateWorkflowButton />}
          description={copy.workflowsPage.emptyDescription}
          title={copy.workflowsPage.emptyTitle}
        />
      ) : (
        <section className="workflow-list-grid">
          {data.items.map((workflow) => (
            <article className="panel" key={workflow.id}>
              <div className="workflow-card__header">
                <strong>{workflow.name}</strong>
                <span className="status-pill">
                  {translateLabel(copy.workflowsPage.statusLabels, workflow.status)}
                </span>
              </div>
              <p className="workflow-card__meta">
                {translateLabel(copy.workflowsPage.triggerLabels, workflow.triggerType)} ·{" "}
                {workflow._count.steps} {copy.workflowsPage.stepsLabel} ·{" "}
                {workflow._count.executions} {copy.workflowsPage.executionsLabel}
              </p>
              <p className="workflow-card__updated">
                {copy.workflowsPage.updatedAtLabel}{" "}
                {formatDateTime(locale, workflow.updatedAt, {
                  dateStyle: "medium",
                  timeStyle: "short"
                })}
              </p>

              <div className="workflow-card__stack">
                {workflow.status === "PUBLISHED" ? (
                  <RunWorkflowButton workflowId={workflow.id} />
                ) : (
                  <Link className="action-button" href={`/workflows/${workflow.id}/edit`}>
                    {copy.workflowsPage.continueEditing}
                  </Link>
                )}
                <div className="hero-actions">
                  <Link className="ghost-button" href={`/workflows/${workflow.id}/edit`}>
                    {copy.workflowsPage.openEditor}
                  </Link>
                  <Link className="ghost-button" href={`/workflows/${workflow.id}/runs`}>
                    {copy.workflowsPage.viewExecutions}
                  </Link>
                  <Link className="ghost-button" href={`/workflows/${workflow.id}/revisions`}>
                    {copy.workflowsPage.revisions}
                  </Link>
                </div>
              </div>
            </article>
          ))}
        </section>
      )}
    </main>
  );
}

