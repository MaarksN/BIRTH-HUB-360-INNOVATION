"use client";

import { RouteErrorView } from "../../../components/dashboard/route-error-view";

export default function NotificationsError({
  reset
}: Readonly<{
  error: Error;
  reset: () => void;
}>) {
  return (
    <RouteErrorView
      description="Nao foi possivel abrir a central de notificacoes."
      reset={reset}
      title="Falha ao abrir notificacoes"
    />
  );
}

