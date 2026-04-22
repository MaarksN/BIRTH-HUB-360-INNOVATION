"use client";

import { RouteErrorView } from "../../../components/dashboard/route-error-view";

export default function ReportsError({
  reset
}: Readonly<{
  error: Error;
  reset: () => void;
}>) {
  return (
    <RouteErrorView
      description="Nao foi possivel abrir a central de reports e exports."
      reset={reset}
      title="Falha ao abrir reports"
    />
  );
}

