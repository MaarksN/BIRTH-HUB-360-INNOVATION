import Link from "next/link";

import { ProductPageHeader } from "../../../components/dashboard/page-fragments";
import { EXECUTIVE_PREMIUM_SPOTLIGHT_PAGE_SIZE } from "../../../lib/executive-premium";
import { fetchExecutivePremiumCollection } from "../../../lib/marketplace-api.server";
import { SALES_OS_MODULES, salesOsTools } from "../../../lib/sales-os/catalog";
import { getDictionary } from "../../../lib/i18n";
import { getRequestLocale } from "../../../lib/i18n.server";
import { loadDashboardHomePage } from "./page.data";
import {
  DashboardExecutivePremiumSection,
  DashboardNoticeSections,
  getDashboardStaticCopy
} from "./page.sections";
import {
  DashboardAttributionSection,
  DashboardClinicalSection,
  DashboardCustomerHealthSection,
  DashboardIntegrationActivitySection,
  DashboardSalesOsSection,
  DashboardWorkflowUsageSection
} from "./page.panels";

export default async function DashboardHomePage() {
  const locale = await getRequestLocale();
  const copy = getDictionary(locale);
  const [data, executivePremium] = await Promise.all([
    loadDashboardHomePage(),
    fetchExecutivePremiumCollection(EXECUTIVE_PREMIUM_SPOTLIGHT_PAGE_SIZE).catch(() => null)
  ]);
  const staticCopy = getDashboardStaticCopy(locale);
  const salesOsModuleCount = SALES_OS_MODULES.length;
  const salesOsToolCount = salesOsTools.length;
  const salesOsRoleplayCount = salesOsTools.filter((tool) => tool.isChat).length;
  const executivePremiumCount = executivePremium?.total ?? 0;
  const executivePremiumResults = executivePremium?.results ?? [];
  const usageEntries = Object.entries(data.billing.usage ?? {});

  return (
    <main className="dashboard-content">
      <ProductPageHeader
        actions={
          <div className="hero-actions">
            <Link href="/workflows">{copy.dashboardHome.openWorkflows}</Link>
            <Link href="/reports">{copy.dashboardHome.viewReports}</Link>
            <Link className="ghost-button" href={data.onboarding.nextHref}>
              {copy.dashboardHome.continueOnboarding}
            </Link>
          </div>
        }
        badge={copy.dashboardHome.badge}
        description={copy.dashboardHome.description}
        title={copy.dashboardHome.title}
      />

      <DashboardNoticeSections
        copy={copy.dashboardHome}
        data={data}
        locale={locale}
        staticCopy={staticCopy}
      />
      <DashboardExecutivePremiumSection
        executivePremiumCount={executivePremiumCount}
        executivePremiumResults={executivePremiumResults}
        locale={locale}
        staticCopy={staticCopy}
      />

      <section className="stats-grid">
        {data.metrics.finance.map((item) => (
          <article key={item.label}>
            <span className="badge">{item.label}</span>
            <strong>{item.value}</strong>
            <p className="dashboard-muted dashboard-muted--compact">{item.delta}</p>
          </article>
        ))}
        {data.metrics.pipeline.map((item) => (
          <article key={item.stage}>
            <span className="badge">{item.stage}</span>
            <strong>{item.value}</strong>
            <p className="dashboard-muted dashboard-muted--compact">{item.trend}</p>
          </article>
        ))}
      </section>

      <DashboardSalesOsSection
        locale={locale}
        salesOsModuleCount={salesOsModuleCount}
        salesOsRoleplayCount={salesOsRoleplayCount}
        salesOsToolCount={salesOsToolCount}
        staticCopy={staticCopy}
      />
      <DashboardClinicalSection copy={copy.dashboardHome} data={data} locale={locale} />
      <DashboardWorkflowUsageSection
        copy={copy.dashboardHome}
        data={data}
        locale={locale}
        usageEntries={usageEntries}
      />
      <DashboardIntegrationActivitySection data={data} locale={locale} />
      <DashboardCustomerHealthSection copy={copy.dashboardHome} data={data} locale={locale} />
      <DashboardAttributionSection copy={copy.dashboardHome} data={data} />
    </main>
  );
}
