# Shopify Rich Text Editor Iteration Roadmap Execution Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 将 `0.2.x` 到 `1.0.0` 的演进路线拆分为可以独立开发、测试和合并的 Codex 任务文档。

**Architecture:** 每个版本阶段使用独立的 `codex/*` 分支，从当前主干 `main` 签出。阶段之间按协议和能力依赖顺序推进，阶段完成后先通过验证门禁，再合并回 `main`，不在主干直接开发功能。

**Tech Stack:** TypeScript, React 18, Tiptap 3, Shopify Polaris 12, Next.js 15, Zod, sanitize-html, Vitest, pnpm.

---

## 1. 任务文档索引

| 阶段 | 任务文档 | 分支 | 前置条件 |
|---|---|---|---|
| `0.3.x` | [Core 稳定性](2026-08-20-0.3-core-stability.md) | `codex/0.3-core-stability` | 当前 `0.2.x` 基线 |
| `0.4.x` | [扩展契约](2026-08-20-0.4-extension-contract.md) | `codex/0.4-extension-contract` | `0.3.x` 已合并 |
| `0.5.x` | [Shopify Native](2026-08-20-0.5-shopify-native.md) | `codex/0.5-shopify-native` | `0.4.x` 已合并，Shopify 预研完成 |
| `0.6.x` | [内容生命周期](2026-08-20-0.6-content-lifecycle.md) | `codex/0.6-content-lifecycle` | `0.4.x` 已合并 |
| `1.0.0` | [稳定版发布](2026-08-20-1.0-stable-release.md) | `codex/1.0-stable-release` | `0.3.x` 至 `0.6.x` 验收完成 |

Variables、AI 和多渠道 Adapter 不进入本轮编码计划，待存在明确业务消费者后单独建立 `1.1+` 任务文档。

## 2. 分支和合并策略

### 2.1 开始阶段任务前

每个阶段的执行者必须从最新 `main` 创建分支：

```bash
git switch main
git pull --ff-only
git switch -c codex/<phase-name>
```

本次规划阶段不执行上述分支创建命令。当前工作区只产生规划文档变更；这些文档合并到 `main` 后，后续编码任务再从新的 `main` 签出功能分支。

### 2.2 阶段分支规则

- 一个版本阶段对应一个主分支；
- 阶段内每个 Task 使用独立、可回滚的提交；
- 不把未完成的阶段分支作为下一阶段的基础分支；
- 不在 `main` 直接提交功能代码；
- 阶段分支只能修改本阶段声明的文件，跨阶段修改必须先更新任务文档；
- 阶段完成后执行完整验证，再合并回 `main`。

### 2.3 合并门禁

阶段分支合并前至少执行：

```bash
git diff --check
pnpm -r typecheck
pnpm test
pnpm build
```

涉及公开包 API 或发布内容时，还必须执行：

```bash
pnpm pack:dry-run
```

## 3. 统一实施约束

- 不把 HTML 重新定义为主数据；
- 不在编辑器包中引入服务端 Sanitizer；
- 不让业务项目依赖 `src/core`、`src/internal` 等内部路径；
- 不静默丢弃未知 Node；
- 不在浏览器暴露 Shopify Admin token；
- 新增持久化字段必须有版本和迁移说明；
- 新增 Node 必须同时说明编辑器、服务端、Channel 和测试行为；
- 任何公共 API 变化都必须同步更新包 README、接入文档和 CHANGELOG。

## 4. 推荐执行顺序

1. 先执行 `0.3.x`，修复当前编辑器作为业务表单组件的稳定性问题。
2. 再执行 `0.4.x`，建立跨前后端共享的 Core 契约和扩展机制。
3. Shopify 预研结果满足 `0.5.x` 入口条件后，再开发资源节点和 Provider。
4. `0.6.x` 可在 `0.4.x` 合并后开始，但发布顺序仍建议晚于 `0.5.x`。
5. 所有阶段验收完成后执行 `1.0.0` API 冻结和发布准备。

## 5. 当前任务边界

- 本轮只创建任务规划文档；
- 不创建 `codex/*` 编码分支；
- 不修改 TypeScript、React、Tiptap、测试或构建配置源码；
- 不升级依赖；
- 不执行 npm 发布、GitHub Pages 部署或 Shopify API 调用。

