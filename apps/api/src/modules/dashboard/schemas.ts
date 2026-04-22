import { z } from "zod";

export const dashboardOnboardingUpdateSchema = z
  .object({
    enabled: z.boolean()
  })
  .strict();
