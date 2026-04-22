"use client";

import { RouteErrorView } from "../../../components/dashboard/route-error-view";

export default function OnboardingError({
  reset
}: Readonly<{
  error: Error;
  reset: () => void;
}>) {
  return (
    <RouteErrorView
      description="Nao foi possivel abrir o onboarding agora."
      reset={reset}
      title="Falha ao abrir onboarding"
    />
  );
}

