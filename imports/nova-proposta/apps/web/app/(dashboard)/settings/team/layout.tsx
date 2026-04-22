import type { ReactNode } from "react";

import { requireAuthenticatedWebSession } from "../../../../lib/web-session";

export default async function SettingsTeamLayout({ children }: Readonly<{ children: ReactNode }>) {
  await requireAuthenticatedWebSession({
    minimumRole: "ADMIN"
  });

  return children;
}
