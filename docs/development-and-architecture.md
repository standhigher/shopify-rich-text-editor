# Shopify Rich Text Editor 开发维护指南

## 项目定位

Shopify Rich Text Editor 是给多个 Shopify App 复用的富文本编辑器。

核心技术：

- Tiptap 3：编辑器内核
- Polaris React：Shopify Admin 风格 UI
- Next.js App Router：Demo 和服务端示例
- Tiptap JSON：唯一主数据
- 服务端 HTML 清洗：发布安全边界

核心原则：

> 前端负责编辑，服务端负责校验、清洗和渠道输出。

不要把 HTML 作为主数据保存。

## 项目结构

```text
apps/demo
  app/page.tsx
  app/api/render-shopify/route.ts

packages/rich-text-editor
  src/create-editor.ts
  src/components/RichTextEditor.tsx
  src/components/RichTextToolbar.tsx
  src/components/EditorContentArea.tsx
  src/extensions/base.ts
  src/styles.css
  src/types.ts
  src/extensions/registry.ts

packages/rich-text-server
  src/extensions/registry.ts
  src/channels/shopify.adapter.ts
  src/security/sanitize-html.ts
  src/serializers.ts
  src/validation.ts

packages/rich-text-core
  src/types.ts
  src/extensions.ts
  src/migrations.ts
  src/types.ts
```

模块职责：

| 模块 | 职责 |
|---|---|
| `rich-text-editor` | 前端编辑器组件 |
| `rich-text-server` | 服务端校验、HTML 生成、HTML 清洗 |
| `rich-text-core` | 依赖无关的协议、扩展注册和迁移契约 |
| `apps/demo` | 本地调试和接入示例 |

## 本地开发

安装依赖：

```bash
pnpm install
```

启动 demo：

```bash
pnpm dev
```

访问：

```text
http://localhost:3000
```

类型检查：

```bash
pnpm -r typecheck
```

测试：

```bash
pnpm test
```

构建：

```bash
pnpm build
```

发布准备和 npm 发布流程见：

- [发布指南](release.md)
- [更新日志](../CHANGELOG.md)

## 数据模型

```ts
import type { JSONContent } from "@tiptap/core";

export interface RichTextDocument {
  version: number;
  schemaVersion: string;
  content: JSONContent;
  plainText?: string;
}
```

字段说明：

| 字段 | 说明 |
|---|---|
| `version` | 数据包版本，当前为 `1` |
| `schemaVersion` | 编辑器 schema 版本 |
| `content` | Tiptap JSON，必须是 `{ type: "doc" }` |
| `plainText` | 服务端生成的纯文本 |

推荐数据库字段：

```text
content_json
content_plain_text
schema_version
rendered_html
updated_at
```

## 前端包

入口：

```ts
export { RichTextEditor } from "./components/RichTextEditor";
export { createEditorConfig, createEditorExtensionRegistry } from "./create-editor";
export { RichTextError } from "./errors";
export type { RichTextErrorCode } from "./errors";
export type { RichTextEditorProps, ShopifyImageUploadResult } from "./types";
```

组件 API：

```ts
export interface RichTextEditorProps {
  value: JSONContent;
  onChange?: (content: JSONContent) => void;
  onError?: (error: RichTextError) => void;
  readOnly?: boolean;
  disabled?: boolean;
  placeholder?: string;
  extensionContracts?: readonly EditorExtension[];
  onUploadImage?: (file: File) => Promise<ShopifyImageUploadResult>;
}
```

图片上传返回：

```ts
export interface ShopifyImageUploadResult {
  src: string;
  alt?: string;
  title?: string;
  shopifyFileId?: string;
}
```

注意：

- `RichTextEditor` 是 Client Component。
- 编辑器内部使用 `immediatelyRender: false`。
- `onChange` 输出 Tiptap JSON。
- `readOnly` 用于后台预览。
- `disabled` 保留工具栏但禁用编辑控件。
- `onError` 接收结构化上传错误。
- 编辑器卸载前会 flush 尚未回调的最后一次 debounce Change。
- 不要在服务端初始化 Tiptap editor。

## 工具栏规范

工具栏统一使用：

```tsx
<ToolbarIconButton
  icon={Bold}
  label="Bold"
  active={toolbarState.bold}
  onClick={() => editor.chain().focus().toggleBold().run()}
/>
```

图标规范：

- Lucide 图标库
- `size={20}`
- `strokeWidth={1.5}`
- 按钮尺寸 `32px × 32px`
- 默认透明背景
- hover 使用 Polaris hover 背景
- active 使用 Polaris selected 背景
- disabled 降低透明度

不要直接写：

```tsx
<Button icon={<Bold />} />
```

## Tiptap 扩展

当前基础扩展：

- StarterKit
- Heading H1-H4
- Underline
- Link
- Image

新增 extension 时，需要同时确认：

- 前端编辑能力
- 服务端 HTML 渲染
- HTML 白名单
- Shopify 输出兼容
- 数据迁移
- 测试

### 0.4.x Extension Registry

扩展契约只从 `@standhigher/shopify-rich-text-core` 的包根入口导入。Core 不依赖 React、Polaris、Next.js、Tiptap 或 Shopify SDK；编辑器和服务端分别把自己的运行时能力挂到同一个契约上。

注册生命周期如下：

```text
Extension contracts
    ↓
依赖拓扑排序
    ↓
ID / Node / Mark 冲突检测
    ↓
客户端 Tiptap 初始化       服务端 Node/Mark 白名单
                             ↓
                      Serializer / Plain Text
                             ↓
                      Channel Adapter + Sanitizer
```

客户端注册不等于服务端注册。只在编辑器注册的 Node 不能通过服务端校验；服务端扩展必须明确提供 Tiptap Extension 或 Serializer。Migration 使用 `from`、`to` 和纯函数，执行前复制文档，缺失迁移、重复迁移和循环迁移都会返回稳定错误码。

## 服务端包

入口：

```ts
export { CURRENT_RICH_TEXT_SCHEMA_VERSION } from "@standhigher/shopify-rich-text-core";
export { renderShopifyHtml } from "./channels/shopify.adapter";
export { processRichText } from "./process";
export { importStandardHtml } from "./import";
export { shopifyHtmlCapabilities, getChannelCapability } from "./channels/capabilities";
export { createServerExtensionRegistry } from "./extensions/registry";
export { richTextJsonToHtml, richTextJsonToPlainText } from "./serializers";
export { sanitizeRichTextHtml } from "./security/sanitize-html";
export { RICH_TEXT_VALIDATION_LIMITS } from "./types";
export { RichTextValidationError } from "./errors";
export { prepareRichTextDocument, validateRichTextDocument } from "./validation";
```

核心函数：

| 函数 | 作用 |
|---|---|
| `validateRichTextDocument` | 校验 JSON 数据结构 |
| `prepareRichTextDocument` | 校验数据包、执行 Schema Migration、再校验当前 Schema |
| `processRichText` | 推荐的服务端处理入口，返回 HTML、Plain Text、warnings、schemaVersion 和 channel |
| `importStandardHtml` | 把受限标准 HTML 导入为合法 Tiptap JSON |
| `richTextJsonToHtml` | JSON 转 HTML |
| `richTextJsonToPlainText` | JSON 转纯文本 |
| `sanitizeRichTextHtml` | 白名单清洗 HTML |
| `renderShopifyHtml` | 生成 Shopify Product/Page HTML |

禁止在 Client Component 中 import `rich-text-server`。

### 0.6.x Content Lifecycle

服务端推荐处理顺序固定为：

```text
Validate envelope
    ↓
Migrate to CURRENT_RICH_TEXT_SCHEMA_VERSION
    ↓
Validate current Schema
    ↓
Serialize
    ↓
Channel Adapter
    ↓
Sanitize
    ↓
ProcessResult
```

业务发布和缓存 HTML 时优先使用 `processRichText(document, { channel: "shopify-html" })`。`renderShopifyHtml()` 继续保留为兼容入口，但不会返回 warnings 和 channel 元信息。

`shopifyHtmlCapabilities` 是可调用的 Channel Capability Matrix。新增 Node/Mark 时必须在矩阵里标注 `supported`、`degraded` 或 `unsupported`，并为降级或不支持结果增加测试。当前矩阵覆盖 paragraph、heading、bold、italic、underline、lists、blockquote、link、image 和 `shopifyResource`。

`importStandardHtml()` 只承诺导入结构清晰的标准 HTML。Word HTML、Google Docs HTML、复杂 inline style、表单、iframe、脚本和任意自定义标签不属于稳定 Import 范围。

## 安全白名单

允许：

```text
p, br, strong, em, u
h1, h2, h3, h4
ul, ol, li
blockquote
a, img
table, thead, tbody, tr, td, th
```

禁止：

```text
script
iframe
object
embed
form
onclick / onerror
javascript: URL
data: image
任意自定义 HTML
```

## Demo

Demo 页面：

```text
apps/demo/app/page.tsx
```

服务端渲染 API：

```text
apps/demo/app/api/render-shopify/route.ts
```

Demo 展示：

- 编辑器
- 只读预览
- Shopify HTML
- 持久化 JSON

## 开发注意事项

- `content_json` 是唯一主数据。
- `rendered_html` 只是缓存或发布产物。
- 前端只负责编辑，不负责安全清洗。
- 服务端发布前必须调用 `renderShopifyHtml`。
- 服务端发布前优先调用 `processRichText`，旧接入可继续调用 `renderShopifyHtml`。
- 新增节点必须同步更新前端、服务端、白名单、Channel Capability Matrix、测试和文档。
- 不要私自修改 Tiptap JSON 结构。
- 不要修改 Lucide SVG path。

## 发布前检查

```bash
pnpm -r typecheck
pnpm test
pnpm build
```
