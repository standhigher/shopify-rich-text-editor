import { NextResponse } from "next/server";
import {
  renderShopifyHtml,
  richTextJsonToPlainText,
  validateRichTextDocument
} from "@best-rich-editor/rich-text-server";

export async function POST(request: Request) {
  try {
    const payload = await request.json();
    const document = validateRichTextDocument(payload);

    return NextResponse.json({
      html: renderShopifyHtml(document),
      plainText: richTextJsonToPlainText(document.content)
    });
  } catch (error) {
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Unable to render Shopify HTML"
      },
      { status: 400 }
    );
  }
}

