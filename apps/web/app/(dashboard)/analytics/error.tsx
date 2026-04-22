"use client";

import { RouteErrorView } from "../../../components/dashboard/route-error-view";

export default function AnalyticsError({
  reset
}: Readonly<{
  error: Error;
  reset: () => void;
}>) {
  return (
    <RouteErrorView
      description="Nao foi possivel montar a pagina de analytics agora."
      reset={reset}
      title="Falha ao abrir analytics"
    />
  );
}

