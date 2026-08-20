import { NextResponse } from "next/server";
import { processRichText } from "@standhigher/shopify-rich-text-server";

export async function POST(request: Request) {
  try {
    const payload = await request.json();
    const result = processRichText(payload, { channel: "shopify-html" });

    return NextResponse.json(result, { status: result.ok ? 200 : 400 });
  } catch (error) {
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Unable to render Shopify HTML"
      },
      { status: 400 }
    );
  }
}
