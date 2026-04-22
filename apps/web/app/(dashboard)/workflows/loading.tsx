import { ProductLoadingShell } from "../../../components/dashboard/page-fragments";
import { getDictionary } from "../../../lib/i18n";
import { getRequestLocale } from "../../../lib/i18n.server";

export default async function WorkflowsLoading() {
  const locale = await getRequestLocale();
  const copy = getDictionary(locale);

  return (
    <ProductLoadingShell
      badge={copy.loading.badge}
      description={copy.loading.workflowsDescription}
      title={copy.loading.workflowsTitle}
    />
  );
}

