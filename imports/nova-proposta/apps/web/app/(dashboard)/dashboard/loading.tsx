import { ProductLoadingShell } from "../../../components/dashboard/page-fragments";
import { getDictionary } from "../../../lib/i18n";
import { getRequestLocale } from "../../../lib/i18n.server";

export default async function DashboardHomeLoading() {
  const locale = await getRequestLocale();
  const copy = getDictionary(locale);

  return (
    <ProductLoadingShell
      badge={copy.loading.badge}
      description={copy.loading.dashboardDescription}
      title={copy.loading.dashboardTitle}
    />
  );
}

