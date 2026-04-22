import type { ApiConfig } from "@birthub/config";
import type { Express } from "express";

import { mountAuthRoutes } from "../modules/auth/router.js";

export function registerAuthRoutes(app: Express, config: ApiConfig): void {
  mountAuthRoutes(app, config);
}
