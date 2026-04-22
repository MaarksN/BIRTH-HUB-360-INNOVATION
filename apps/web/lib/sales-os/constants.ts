import type { Tool } from "./types";

import { BDR_TOOLS } from "./tool-catalog/bdr";
import { CLOSER_TOOLS } from "./tool-catalog/closer";
import { CS_TOOLS } from "./tool-catalog/cs";
import { DATA_TOOLS } from "./tool-catalog/data";
import { EXEC_TOOLS } from "./tool-catalog/exec";
import { FINANCE_TOOLS } from "./tool-catalog/finance";
import { FINTECH_TOOLS } from "./tool-catalog/fintech";
import { LDR_TOOLS } from "./tool-catalog/ldr";
import { MARKETING_TOOLS } from "./tool-catalog/marketing";
import { PRESALES_TOOLS } from "./tool-catalog/presales";
import { REVOPS_TOOLS } from "./tool-catalog/revops";
import { SALES_TOOLS } from "./tool-catalog/sales";
import { SDR_TOOLS } from "./tool-catalog/sdr";
import { SHARED_TOOLS } from "./tool-catalog/shared";

export const TOOLS: Tool[] = [
  ...SHARED_TOOLS,
  ...LDR_TOOLS,
  ...BDR_TOOLS,
  ...SDR_TOOLS,
  ...CLOSER_TOOLS,
  ...EXEC_TOOLS,
  ...PRESALES_TOOLS,
  ...SALES_TOOLS,
  ...MARKETING_TOOLS,
  ...CS_TOOLS,
  ...REVOPS_TOOLS,
  ...DATA_TOOLS,
  ...FINANCE_TOOLS,
  ...FINTECH_TOOLS
];
