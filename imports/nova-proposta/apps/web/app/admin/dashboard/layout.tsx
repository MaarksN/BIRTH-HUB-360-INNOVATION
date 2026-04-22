import type { ReactNode } from "react";

import { requireAuthenticatedWebSession } from "../../../lib/web-session";

export default async function AdminDashboardLayout({
  children
}: Readonly<{ children: ReactNode }>) {
  await requireAuthenticatedWebSession({
    minimumRole: "SUPER_ADMIN"
  });

  return children;
}
