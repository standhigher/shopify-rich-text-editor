# Shopify Rich Text Editor

[![npm version](https://img.shields.io/npm/v/@standhigher/shopify-rich-text-editor?label=editor)](https://www.npmjs.com/package/@standhigher/shopify-rich-text-editor)
[![npm downloads](https://img.shields.io/npm/dm/@standhigher/shopify-rich-text-editor)](https://www.npmjs.com/package/@standhigher/shopify-rich-text-editor)
[![CI](https://github.com/standhigher/shopify-rich-text-editor/actions/workflows/ci.yml/badge.svg)](https://github.com/standhigher/shopify-rich-text-editor/actions/workflows/ci.yml)
[![License: MIT](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)
[![Demo](https://img.shields.io/badge/demo-Next.js%20app-green)](apps/demo)

Shopify Rich Text Editor 是面向 Shopify App 的通用富文本编辑器工具包，基于 React、Tiptap 3、Shopify Polaris，并提供服务端 Shopify 安全 HTML 渲染能力。

[English README](README.md)

## 链接

- npm 前端包：[@standhigher/shopify-rich-text-editor](https://www.npmjs.com/package/@standhigher/shopify-rich-text-editor)
- npm 服务端包：[@standhigher/shopify-rich-text-server](https://www.npmjs.com/package/@standhigher/shopify-rich-text-server)
- GitHub：[standhigher/shopify-rich-text-editor](https://github.com/standhigher/shopify-rich-text-editor)
- Demo：[apps/demo](apps/demo)
- API 文档：[前端包 README](packages/rich-text-editor/README.md)、[服务端包 README](packages/rich-text-server/README.md)
- 接入文档：[Shopify App 快速接入指南](docs/business-shopify-app-integration.md)
- 维护文档：[开发维护指南](docs/development-and-architecture.md)
- 演进规划：[版本演进规划](docs/evolution-roadmap.md)
- 1.0 API 矩阵：[公共 API 与兼容矩阵](docs/api-compatibility-matrix.md)
- 1.0 迁移：[迁移指南](docs/migration-guide-1.0.md)
- 更新日志：[CHANGELOG.md](CHANGELOG.md)

## 安装

```bash
pnpm add @standhigher/shopify-rich-text-editor @standhigher/shopify-rich-text-server
pnpm add @shopify/polaris react react-dom
```

全局引入样式：

```css
@import "@shopify/polaris/build/esm/styles.css";
@import "@standhigher/shopify-rich-text-editor/styles.css";
```

## 基础用法

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
      placeholder="Write product content..."
    />
  );
}
```

在服务端边界，把编辑器 JSON 封装为持久化协议数据包：

```ts
import { createRichTextDocument } from "@standhigher/shopify-rich-text-core";

const document = createRichTextDocument(content);
```

服务端渲染 Shopify HTML：

```ts
import {
  renderShopifyHtml,
  validateRichTextDocument
} from "@standhigher/shopify-rich-text-server";

export async function POST(request: Request) {
  const payload = await request.json();
  const document = validateRichTextDocument(payload);

  return Response.json({
    html: renderShopifyHtml(document)
  });
}
```

## 功能概览

- 面向 Shopify App 管理后台的 React 富文本编辑器。
- 使用 Tiptap JSON 作为唯一可编辑主数据。
- 接近 Polaris 风格的工具栏交互和视觉状态。
- 支持 URL 图片和上传到 Shopify 的回调。
- 服务端提供 JSON 校验、HTML 生成、HTML 清洗和 Shopify HTML 输出。
- 内置 Next.js demo，覆盖前端编辑和服务端渲染示例。

## 兼容性

| 依赖 | 支持范围 |
| --- | --- |
| React | `^18.3.1` |
| React DOM | `^18.3.1` |
| Shopify Polaris | `^12.0.0` |
| Tiptap | `^3.0.0` |
| TypeScript | `^5.8.2` |
| Node.js | `>=22.0.0` |
| pnpm | `10.15.x` |
| 协议 / Schema | `1` / `2026-08` |

## Demo / Storybook

当前仓库使用 Next.js demo 作为示例应用，暂未接入 Storybook。

```bash
pnpm install
pnpm dev
```

访问 `http://localhost:3000`。

`build-storybook` 脚本在 Storybook 接入前用于校验 demo 构建：

```bash
npm run build-storybook
```

## 包质量

npm 包仅发布：

- `dist` JavaScript 产物
- TypeScript 类型声明
- 包 README
- MIT LICENSE
- editor CSS export

发布前检查包内容：

```bash
pnpm pack:dry-run
pnpm pack:check
pnpm performance:baseline
```

## 本地开发

```bash
pnpm install
pnpm dev
pnpm -r typecheck
pnpm test
pnpm build
```

## 发布准备

```bash
npm run lint
npm run test
npm run typecheck
npm run build
npm run build-storybook
pnpm pack:dry-run
```

更多发布说明见 [docs/release.md](docs/release.md)。
