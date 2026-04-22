"use client";

import { RouteErrorView } from "../../../components/dashboard/route-error-view";

export default function ConversationsError({
  reset
}: Readonly<{
  error: Error;
  reset: () => void;
}>) {
  return (
    <RouteErrorView
      description="Nao foi possivel abrir a interface de conversations."
      reset={reset}
      title="Falha ao abrir conversations"
    />
  );
}

