import { NextResponse } from "next/server";

import { executeSalesOsTool } from "../../../../lib/sales-os/engine";

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as {
      fields?: Record<string, string>;
      image?: {
        data: string;
        mimeType: string;
        name?: string;
      } | null;
      toolId?: string;
    };

    if (!body.toolId) {
      return NextResponse.json({ error: "toolId is required." }, { status: 400 });
    }

    const result = await executeSalesOsTool({
      fields: body.fields ?? {},
      ...(body.image !== undefined ? { image: body.image ?? null } : {}),
      toolId: body.toolId
    });

    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Unexpected Sales OS execution error."
      },
      { status: 500 }
    );
  }
}

