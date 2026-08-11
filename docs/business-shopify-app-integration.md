# Shopify App 快速接入 Shopify Rich Text Editor

## 一、接入目标

在业务 Shopify App 中使用统一富文本编辑器，完成：

- 编辑富文本内容
- 保存 Tiptap JSON
- 上传图片到 Shopify
- 服务端生成安全 Shopify HTML
- 发布到 Shopify Product / Page

## 二、安装依赖

在业务项目中加入：

```json
{
  "dependencies": {
    "@standhigher/shopify-rich-text-editor": "workspace:*",
    "@standhigher/shopify-rich-text-server": "workspace:*",
    "@shopify/polaris": "^12.0.0",
    "@tiptap/core": "^3.0.0"
  }
}
```

如果业务项目不在同一个 monorepo，改用 npm 版本号，例如 `^0.2.0`。

## 三、引入样式

全局 CSS：

```css
@import "@shopify/polaris/build/esm/styles.css";
@import "@standhigher/shopify-rich-text-editor/styles.css";
```

如果业务项目已经引入 Polaris CSS，只补充编辑器 CSS 即可。

## 四、确认 Polaris Provider

业务 App 需要有 Polaris `AppProvider`：

```tsx
import { AppProvider } from "@shopify/polaris";

export function RootProvider({ children }: { children: React.ReactNode }) {
  return <AppProvider i18n={{}}>{children}</AppProvider>;
}
```

如果项目已有 Provider，不要重复加。

## 五、前端最小接入

```tsx
"use client";

import { useState } from "react";
import type { JSONContent } from "@tiptap/core";
import { RichTextEditor } from "@standhigher/shopify-rich-text-editor";

const emptyContent: JSONContent = {
  type: "doc",
  content: [{ type: "paragraph" }]
};

export function ProductDescriptionEditor() {
  const [content, setContent] = useState<JSONContent>(emptyContent);

  return (
    <RichTextEditor
      value={content}
      onChange={setContent}
      placeholder="Write product description"
    />
  );
}
```

注意：

- 组件必须是 Client Component。
- `onChange` 输出的是 Tiptap JSON，不是 HTML。
- 不要在前端生成最终 HTML。

## 六、保存数据结构

提交给服务端：

```ts
{
  version: 1,
  schemaVersion: "2026-07",
  content
}
```

完整结构：

```ts
interface RichTextDocument {
  version: number;
  schemaVersion: string;
  content: JSONContent;
  plainText?: string;
}
```

数据库建议字段：

```text
content_json
content_plain_text
schema_version
rendered_html
updated_at
```

重点：

```text
content_json 是唯一主数据
rendered_html 只是缓存或发布产物
```

## 七、服务端保存接口

```ts
import {
  renderShopifyHtml,
  richTextJsonToPlainText,
  validateRichTextDocument
} from "@standhigher/shopify-rich-text-server";

export async function PUT(request: Request) {
  const payload = await request.json();

  const document = validateRichTextDocument(payload.description);
  const plainText = richTextJsonToPlainText(document.content);
  const html = renderShopifyHtml(document);

  await db.productDescription.update({
    where: { id: payload.id },
    data: {
      content_json: document.content,
      content_plain_text: plainText,
      schema_version: document.schemaVersion,
      rendered_html: html
    }
  });

  return Response.json({ ok: true });
}
```

业务需要自己处理：

- 用户权限
- 店铺归属
- 商品归属
- 保存错误提示
- 操作日志

## 八、生成 Shopify HTML

服务端 API：

```ts
import {
  renderShopifyHtml,
  richTextJsonToPlainText,
  validateRichTextDocument
} from "@standhigher/shopify-rich-text-server";

export async function POST(request: Request) {
  const payload = await request.json();
  const document = validateRichTextDocument(payload);

  return Response.json({
    html: renderShopifyHtml(document),
    plainText: richTextJsonToPlainText(document.content)
  });
}
```

前端调用：

```ts
await fetch("/api/rich-text/render-shopify", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    version: 1,
    schemaVersion: "2026-07",
    content
  })
});
```

禁止在 Client Component 中写：

```tsx
import { renderShopifyHtml } from "@standhigher/shopify-rich-text-server";
```

## 九、上传图片到 Shopify

前端接入：

```tsx
import {
  RichTextEditor,
  type ShopifyImageUploadResult
} from "@standhigher/shopify-rich-text-editor";

async function uploadToShopify(file: File): Promise<ShopifyImageUploadResult> {
  const formData = new FormData();
  formData.append("file", file);

  const response = await fetch("/api/shopify/files/upload", {
    method: "POST",
    body: formData
  });

  if (!response.ok) {
    throw new Error("Upload failed");
  }

  return response.json();
}

<RichTextEditor
  value={content}
  onChange={setContent}
  onUploadImage={uploadToShopify}
/>;
```

上传接口返回：

```ts
interface ShopifyImageUploadResult {
  src: string;
  alt?: string;
  title?: string;
  shopifyFileId?: string;
}
```

示例：

```json
{
  "src": "https://cdn.shopify.com/s/files/1/0000/files/image.jpg",
  "alt": "image",
  "title": "Uploaded to Shopify",
  "shopifyFileId": "gid://shopify/MediaImage/123"
}
```

服务端上传接口由业务实现，需要处理：

- Shopify token
- 文件大小
- MIME 类型
- 店铺权限
- Shopify API 错误
- 上传失败重试

不要在浏览器暴露 Shopify Admin API token。

## 十、只读预览

```tsx
import { RichTextEditor } from "@standhigher/shopify-rich-text-editor";

export function DescriptionPreview({ content }) {
  return <RichTextEditor value={content} readOnly />;
}
```

适合：

- 后台详情页
- 审核页
- 发布确认页

不建议作为 Storefront 最终展示。

## 十一、发布到 Shopify

发布流程：

```text
读取 content_json
  ↓
validateRichTextDocument
  ↓
renderShopifyHtml
  ↓
调用 Shopify Admin API 更新 Product / Page
```

示例：

```ts
const document = validateRichTextDocument({
  version: 1,
  schemaVersion: record.schema_version,
  content: record.content_json,
  plainText: record.content_plain_text
});

const html = renderShopifyHtml(document);

await shopifyAdmin.graphql(PRODUCT_UPDATE_MUTATION, {
  input: {
    id: record.shopify_product_id,
    bodyHtml: html
  }
});
```

发布前确认：

- 用户有发布权限
- Shopify resource 属于当前店铺
- access token 有效
- Shopify `userErrors` 已处理
- 发布失败不覆盖草稿

## 十二、注意事项

必须做：

- 保存 Tiptap JSON
- 服务端生成 HTML
- 服务端清洗 HTML
- 上传图片走业务后端
- 发布前重新生成 Shopify HTML

不要做：

- 不要保存 HTML 作为主数据
- 不要在前端 import server 包
- 不要绕过 `renderShopifyHtml`
- 不要私自改 Tiptap JSON
- 不要在浏览器暴露 Shopify Admin API token

## 十三、验收清单

前端：

- 标题、段落可编辑
- 粗体、斜体、下划线可用
- 有序列表、无序列表可用
- 链接可插入
- 图片 URL 可插入
- Shopify 图片上传可用
- 撤销、重做可用
- 保存后刷新可恢复
- 只读预览正确
- 移动端无横向溢出

服务端：

- 非法 JSON 返回错误
- `script` 被清洗
- `onclick` 被清洗
- `javascript:` 被清洗
- plain text 正确生成
- Shopify HTML 正确生成

Shopify：

- Product / Page 后台展示正常
- Storefront 展示正常
- 图片 CDN 可访问
- 链接安全属性正确
- 发布失败保留草稿
