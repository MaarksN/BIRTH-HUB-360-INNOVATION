import { NextResponse } from "next/server";

import { SALES_OS_MODULES, salesOsTools } from "../../../../lib/sales-os/catalog";

export function GET() {
  return NextResponse.json({
    modules: SALES_OS_MODULES,
    tools: salesOsTools
  });
}

