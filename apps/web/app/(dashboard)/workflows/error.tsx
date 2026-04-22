"use client";

import { RouteErrorView } from "../../../components/dashboard/route-error-view";

export default function WorkflowsError({
  reset
}: Readonly<{
  error: Error;
  reset: () => void;
}>) {
  return (
    <RouteErrorView
      description="Nao foi possivel carregar a lista de workflows agora."
      reset={reset}
      title="Falha ao abrir workflows"
    />
  );
}

