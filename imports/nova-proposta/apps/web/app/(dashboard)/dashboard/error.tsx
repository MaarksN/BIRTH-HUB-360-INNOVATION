"use client";

import { RouteErrorView } from "../../../components/dashboard/route-error-view";

export default function DashboardHomeError({
  reset
}: Readonly<{
  error: Error;
  reset: () => void;
}>) {
  return (
    <RouteErrorView
      description="Nao foi possivel carregar a home do dashboard agora."
      reset={reset}
      title="Falha ao abrir dashboard"
    />
  );
}

