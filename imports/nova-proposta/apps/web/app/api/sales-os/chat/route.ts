import { NextResponse } from "next/server";

import { executeSalesOsChat } from "../../../../lib/sales-os/engine";
import type { SalesOsModuleId } from "../../../../lib/sales-os/types";

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as {
      currentModule?: SalesOsModuleId;
      history?: Array<{
        role: "assistant" | "user";
        text: string;
      }>;
      input?: string;
      mentor?: boolean;
      toolId?: string;
    };

    if (!body.currentModule || !body.input?.trim()) {
      return NextResponse.json(
        { error: "currentModule and a non-empty input are required." },
        { status: 400 }
      );
    }

    const result = await executeSalesOsChat({
      currentModule: body.currentModule,
      history: body.history ?? [],
      input: body.input.trim(),
      mentor: body.mentor ?? false,
      ...(body.toolId ? { toolId: body.toolId } : {})
    });

    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Unexpected Sales OS chat error."
      },
      { status: 500 }
    );
  }
}

