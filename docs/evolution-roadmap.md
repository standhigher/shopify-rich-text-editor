# Shopify Rich Text Editor 版本演进规划

> 状态：规划基线
>
> 更新时间：2026-08-20
>
> 适用版本：`0.2.0` 及后续版本

## 1. 文档目标

本文档用于明确 `@standhigher/shopify-rich-text-editor` 和 `@standhigher/shopify-rich-text-server` 的后续迭代边界、版本目标、兼容策略、验收标准和发布门禁。

本文档基于当前仓库已经实现的能力制定，不把尚未落地的完整架构蓝图视为现有能力。

核心判断是：当前项目已经具备可运行的基础闭环，后续应优先稳定内容协议、受控组件语义、错误处理和测试体系，再逐步引入 Extension、Provider、Shopify Resource、变量、AI 和多渠道输出。

对应的 Codex 分阶段实施任务见：[迭代任务文档索引](superpowers/plans/2026-08-20-iteration-roadmap-index.md)。

## 2. 当前基线：0.2.x

### 2.1 已实现能力

当前版本已经形成以下垂直闭环：

```text
Polaris 风格编辑器
    ↓
Tiptap JSON
    ↓
服务端文档信封校验
    ↓
JSON 转 HTML / Plain Text
    ↓
HTML Sanitizer
    ↓
Shopify HTML 输出
```

已实现能力包括：

- Tiptap 3 编辑器和 `immediatelyRender: false` 的客户端初始化；
- 段落、H1-H4、粗体、斜体、下划线、有序列表和无序列表；
- 链接插入、图片 URL 插入和图片上传回调；
- 撤销、重做、清除格式和重置内容；
- 只读模式；
- Polaris 风格工具栏和基础视觉规范；
- Tiptap JSON 作为编辑器输出；
- `RichTextDocument` 服务端数据包；
- 服务端 JSON 信封校验；
- JSON 到 HTML 和 Plain Text 的转换；
- 白名单 HTML 清洗；
- Shopify HTML Demo 和 Next.js 服务端渲染接口；
- 服务端基础单元测试、工作区类型检查和生产构建。

### 2.2 当前明确不包含的能力

以下能力仍属于后续规划：

- 通用 `UI Adapter` 和自定义 UI；
- 外部 Extension 注册和 Extension Registry；
- `MediaProvider`、`ResourceProvider`、`AIProvider`；
- Variables Node；
- Shopify Product、Collection、Variant Resource Node；
- Shopify Rich Text JSON 双向转换；
- HTML Import Pipeline；
- Schema Migration；
- Email、Storefront 等其他 Channel Adapter；
- AI 改写、翻译、SEO 等能力；
- 数据库持久化、草稿恢复和真正的 Shopify 发布流程。

### 2.3 0.2.x 基线限制

当前版本在继续扩展前必须承认以下限制：

1. 编辑器 API 使用 `JSONContent`，服务端 API 使用 `RichTextDocument`，两者尚未形成统一公共协议。
2. `RichTextEditor` 初始化时读取 `value`，外部 `value` 后续变化尚未完整同步到编辑器实例。
3. 编辑器和服务端分别维护一套基础 Extension 配置，存在未来能力漂移风险。
4. `RichTextEditor` 直接依赖 Polaris Toolbar，尚未实现 Core 与 UI 的真正解耦。
5. 服务端校验当前主要校验文档信封和 `doc` 根节点，不是完整的 Tiptap Schema 白名单校验。
6. 编辑器包目前缺少实际组件测试，服务端测试覆盖范围也只包含基础转换和清洗路径。

## 3. 演进原则

### 3.1 数据原则

- Tiptap JSON 是唯一主数据。
- HTML、Plain Text 和 Shopify 发布内容是派生产物或缓存。
- 发布前必须在服务端重新校验、转换和清洗。
- 未知节点不得被静默丢弃。
- 持久化 Node Schema 发生变化时必须有可测试的 Migration。

### 3.2 API 原则

- `0.x` 版本优先保持现有接入可用，破坏性变化必须提供兼容层和迁移说明。
- `1.0` 前不冻结完整 Extension、Provider 和 Channel API。
- 公共入口只暴露稳定能力，内部目录不构成公共 API。
- 所有异步外部能力都必须有成功、失败、取消和重试语义。

### 3.3 安全原则

- 浏览器只负责编辑，不承担最终发布安全责任。
- 服务端拒绝未知或不符合约束的文档结构。
- 链接、图片、文档大小和嵌套深度都要有明确限制。
- Shopify Admin token 只允许存在于业务服务端。
- Sanitizer、Serializer 和 Channel Adapter 必须有恶意输入测试。

### 3.4 范围原则

- 先完成基础编辑器的稳定闭环，再做通用扩展抽象。
- 先验证 Shopify 的真实能力边界，再实现 Shopify Native Node。
- AI 和复杂 Import 不进入 1.0 核心阻塞路径。
- 没有第二种实际 UI 使用方时，不提前建设过度通用的 UI 抽象。

## 4. 版本路线图

| 版本 | 主题 | 主要结果 | 是否允许破坏性 API | 进入条件 |
|---|---|---|---|---|
| `0.3.x` | Core 稳定性 | 修复受控组件、协议、错误处理和测试缺口 | 否 | 当前 0.2.x 基础能力保持可用 |
| `0.4.x` | 扩展契约 | 建立 Core 类型、Extension Registry 和基础 Migration | 仅限实验 API | 0.3.x 验收通过 |
| `0.5.x` | Shopify Native | Provider、Shopify Resource 和资源兼容策略 | 仅限实验 API | Shopify 能力预研完成 |
| `0.6.x` | 内容生命周期 | 标准 HTML Import、严格校验、迁移和完整服务端管道 | 否 | 0.4.x 协议稳定 |
| `1.0.0` | 稳定版本 | 冻结公共 API、Schema、兼容矩阵和发布流程 | 不允许 | 所有 1.0 门禁通过 |
| `1.1+` | 可选能力 | Variables、AI、多渠道和高级扩展 | 按模块演进 | 有明确业务需求和独立验收标准 |

## 5. 0.3.x：Core 稳定性版本

### 5.1 版本目标

让当前基础编辑器成为可以安全嵌入业务表单的 MVP，而不是继续增加高级功能。

### 5.2 必做范围

#### 受控编辑器语义

- 外部 `value` 变化时同步编辑器内容；
- 区分初始化内容、用户编辑和外部重置；
- 避免外部同步触发重复 `onChange`；
- 明确 `readOnly` 切换时的编辑器状态；
- 增加 `disabled` 状态或明确暂不支持该状态。

#### Change 和错误处理

- 保留现有 debounce，但在卸载或提交前提供 flush 机制；
- 图片上传失败时返回结构化错误；
- 增加可选 `onError` 回调或等价的错误展示机制；
- 明确上传取消、重复选择和上传中按钮状态；
- 不把底层 Tiptap、Polaris 或业务上传错误直接暴露为公共错误类型。

#### 内容协议整理

- 继续兼容当前 `JSONContent` 编辑器 API；
- 服务端继续接受 `RichTextDocument`；
- 增加从 `JSONContent` 创建 `RichTextDocument` 的公共辅助函数；
- 在文档中明确编辑器输出和服务端持久化输入的边界；
- 暂不在 0.3.x 强制把编辑器 `value` 改成 `RichTextDocument`，避免无迁移地破坏现有接入。

#### 服务端基础校验

- 对文档大小和递归深度设上限；
- 校验文本节点、Mark、Node 的基本结构；
- 对图片和链接 URL 执行协议校验；
- 明确未知字段可以保留，但未知 Node/Mark 必须拒绝或产生可识别错误；
- 为 `plainText` 明确缓存字段语义，服务端生成值优先于客户端提交值。

#### 测试和文档

- 增加编辑器组件测试；
- 增加受控更新、只读切换、上传成功和上传失败测试；
- 增加空文档、嵌套列表、硬换行、图片和链接边界测试；
- 更新两个包的 README，统一 `JSONContent` 和 `RichTextDocument` 说明。

### 5.3 0.3.x 验收标准

- 父组件替换 `value` 后，编辑器在一个渲染周期内展示新文档；
- 外部同步不会触发伪造的用户 `onChange`；
- 卸载前的最后一次编辑不会无故丢失；
- 上传失败可以被业务捕获并展示明确错误；
- 非法 URL、超大文档和过深嵌套文档被服务端拒绝；
- 现有基础编辑功能和服务端 0.2.x 用例全部保持通过；
- 编辑器包拥有最小可运行的组件回归测试。

## 6. 0.4.x：扩展契约版本

### 6.1 版本目标

建立能够支持自定义 Node、Toolbar 和 Server Serializer 的最小扩展基础，但不一次性实现所有业务扩展。

### 6.2 目标架构

建议增加依赖无关的 Core 契约层：

```text
packages/rich-text-core
├── src/types.ts
├── src/schema.ts
├── src/extensions.ts
└── src/migrations.ts
```

Core 只包含类型、协议和纯函数，不依赖 React、Polaris、Next.js 或 Shopify SDK。

目标依赖关系：

```text
rich-text-core
   ├── rich-text-editor
   └── rich-text-server
```

### 6.3 必做范围

- 统一导出 `RichTextDocument`、错误类型和基础 Node 类型；
- 定义 Extension 的唯一 ID、版本、依赖和注册顺序；
- 支持 Extension 提供 Tiptap Extension、Toolbar Item 和服务器端能力声明；
- 建立客户端和服务端的 Extension Registry；
- 增加节点冲突检测；
- 增加最小 Migration 接口和迁移链测试；
- 允许编辑器接收扩展配置，但保留默认基础扩展；
- 保留现有无扩展用法的兼容行为。

### 6.4 暂不实现

- Variables；
- Shopify Resource Node；
- AI；
- 完整 Custom UI Adapter；
- 多渠道输出。

### 6.5 0.4.x 验收标准

- 一个示例自定义 Node 能同时在编辑器和服务端被注册；
- 未注册 Node 在服务端被明确拒绝；
- Migration 可以从旧版本升级到当前版本，并且重复执行结果不变；
- Extension 冲突会在初始化阶段失败并返回可识别错误；
- 旧版基础编辑器接入代码无需修改即可继续构建。

## 7. 0.5.x：Shopify Native 版本

### 7.1 版本目标

在确认 Shopify 真实数据结构和 API 能力后，增加资源选择和资源引用能力。

### 7.2 进入开发前的技术预研

必须先确认：

- Shopify Product、Collection、Variant 的稳定标识格式；
- Resource Picker 返回字段和权限要求；
- 资源标题、Handle、图片等快照字段是否需要持久化；
- 资源删除、改名、无权限和跨店铺场景；
- Shopify `rich_text_field` 的真实支持节点；
- 不支持节点的报错、链接降级或文本降级策略。

预研产物必须包括：

- Shopify Node 能力矩阵；
- 双向转换样例；
- 失败和降级样例；
- 至少一组真实 API 返回数据的脱敏 fixture。

### 7.3 必做范围

- `ResourceProvider` 契约；
- Product、Collection、Variant 的资源选择能力；
- Resource Node 的稳定 attrs；
- 资源快照和资源 ID 的区分；
- Shopify HTML 中资源节点的统一输出策略；
- 资源失效时的显示和发布策略；
- 服务端店铺归属和资源权限由业务层校验的接口边界。

### 7.4 版本边界

0.5.x 只优先支持 Shopify HTML 输出。Shopify Rich Text JSON 双向转换只有在兼容矩阵和降级规则经过验证后才能进入稳定 API。

### 7.5 0.5.x 验收标准

- 用户可以通过 Provider 选择 Product、Collection 和 Variant；
- 编辑器只保存稳定资源引用和明确的展示快照；
- 服务端不会把内部资源 attrs 泄露到最终 HTML；
- 资源失效时不会静默生成错误链接；
- 每个资源节点都有支持、降级或报错结果；
- Shopify 相关能力不要求业务项目直接依赖 App Bridge 实现细节。

## 8. 0.6.x：内容生命周期版本

### 8.1 版本目标

建立完整、可迁移、可审计的内容生命周期，解决内容导入、版本升级和服务端处理的一致性问题。

### 8.2 必做范围

统一服务端入口：

```text
RichTextDocument
    ↓
Validate
    ↓
Migrate
    ↓
Schema Validate
    ↓
Serialize
    ↓
Sanitize / Channel Check
    ↓
ProcessResult
```

建议返回：

```ts
interface ProcessResult {
  html?: string;
  plainText?: string;
  warnings: RichTextWarning[];
  schemaVersion: string;
  channel: string;
}
```

同时实现：

- 标准 HTML Import；
- HTML Normalizer；
- JSON、HTML、Plain Text Serializer 的测试矩阵；
- Migration 失败和回滚策略；
- Channel Capability Matrix；
- 不支持 Node 的显式 warnings 或 errors；
- 文档内容哈希或等价的幂等校验能力。

### 8.3 Import 范围控制

0.6.x 只支持结构清晰的标准 HTML，包括段落、标题、列表、链接、图片和基础 Mark。

Word HTML、Google Docs HTML、复杂 inline style 和任意自定义 HTML 不进入 0.6.x 的稳定承诺，除非有独立预研和专门测试集。

### 8.4 0.6.x 验收标准

- 标准 HTML 可以导入为合法 Tiptap JSON；
- Import 后再导出不会产生危险标签或危险 URL；
- Migration 链覆盖所有已发布 Schema 版本；
- 不支持节点不会被静默删除；
- 同一输入在相同 Schema 和 Channel 下输出稳定；
- `processRichText()` 成为业务推荐入口。

## 9. 1.0.0：稳定版本

### 9.1 1.0 必须冻结的公共能力

- `RichTextDocument` 协议；
- 基础 Node 和 Mark 支持范围；
- 编辑器受控组件语义；
- 错误码和错误恢复语义；
- Extension Contract；
- Provider Contract；
- Shopify HTML Adapter；
- 版本和 Migration 规则；
- 服务端安全边界；
- 包入口和导出类型。

### 9.2 1.0 不承诺的能力

以下能力不作为 1.0 的默认承诺：

- 任意 HTML 无损导入；
- 任意自定义 Node 自动转换到所有 Channel；
- Shopify Rich Text JSON 对所有节点的无损双向转换；
- 内置 AI 服务；
- 内置 Shopify Admin 权限和 Token 管理；
- 多人实时协同编辑；
- 数据库和业务发布服务。

### 9.3 1.0 发布门禁

发布前必须满足：

- `pnpm -r typecheck` 通过；
- `pnpm test` 通过；
- `pnpm build` 通过；
- 两个包的 `pnpm pack:dry-run` 内容符合白名单；
- 编辑器组件测试、服务端测试和至少一条端到端流程通过；
- 安全测试覆盖脚本、事件属性、危险 URL、危险图片和未知节点；
- 性能基线覆盖 10KB、50KB、100KB 文档；
- 兼容矩阵和 Migration Guide 已发布；
- README、CHANGELOG 和接入文档与实际 API 一致。

## 10. 1.1+ 可选演进

### 10.1 Variables

Variables 不应保存为普通文本。进入开发前需要确定：

- 变量命名空间和 key 的稳定规则；
- 编辑态展示文本和存储值的区分；
- Shopify HTML、Email、Storefront 的替换策略；
- 缺失变量、无权限变量和非法变量的行为。

### 10.2 AI

AI 应保持为 Provider 和临时交互能力，不直接进入核心持久化协议。

必须支持：

- 基于选区快照的请求；
- 预览后确认替换；
- 取消和超时；
- 并发请求保护；
- 原内容恢复；
- 业务侧模型、权限和费用控制。

### 10.3 多渠道输出

只有存在明确业务消费者时才增加 Email、Storefront 等 Adapter。每个 Adapter 都必须定义：

- 支持节点；
- 降级节点；
- 禁止节点；
- URL 和资源策略；
- 测试 fixture；
- 输出安全边界。

## 11. 兼容和发布策略

### 11.1 API 兼容

- `0.3.x` 保持现有 `JSONContent` 编辑器 API 可用；
- `0.4.x` 提供新协议和扩展 API，但不强制已有业务立即迁移；
- `0.5.x` 的 Shopify Native 能力可先标记为实验 API；
- `1.0.0` 冻结稳定 API；
- 任何删除或重命名公共字段的变更必须进入 major 版本。

### 11.2 数据迁移

- 旧数据读取时允许迁移到当前 Schema；
- 迁移结果在保存时回写，避免每次读取重复迁移；
- 迁移失败不得覆盖原始数据；
- 每个迁移版本必须有正向、重复执行和失败测试；
- 发布前必须保留旧数据备份或等价恢复路径。

### 11.3 发布产物

两个公开 npm 包继续保持最小发布内容：

- `dist`；
- TypeScript declarations；
- README；
- LICENSE；
- editor CSS。

测试、Demo、Storybook、内部源码和迁移 fixture 不进入 npm 包。

## 12. 推荐实施顺序

按以下顺序推进，不跨阶段并行引入高耦合能力：

1. 先完成 0.3.x 的受控组件、错误处理、严格校验和测试补齐。
2. 再完成 0.4.x 的 Core 类型、Extension Registry 和基础 Migration。
3. 在 Shopify 真实能力预研完成后进入 0.5.x Resource 和 Provider。
4. 再完成 0.6.x Import、统一 Server Pipeline 和 Channel 能力矩阵。
5. 最后冻结 1.0 API、Schema、兼容策略和发布门禁。
6. Variables、AI 和多渠道能力根据真实业务需求在 1.1+ 独立演进。

## 13. 当前阶段执行清单

当前最优先的工作不是实现 AI 或完整 UI Adapter，而是：

- [ ] 修复外部 `value` 到编辑器实例的同步；
- [ ] 为 debounce Change 增加 flush 和卸载保护；
- [ ] 增加上传失败和结构化错误回调；
- [ ] 明确 `JSONContent` 到 `RichTextDocument` 的公共转换方式；
- [ ] 收紧服务端 Node、Mark、URL、大小和深度校验；
- [ ] 增加编辑器组件测试；
- [ ] 增加基础导出、只读和上传流程测试；
- [ ] 更新 README 和接入文档中的 API 说明；
- [ ] 完成 0.3.x 的版本验收后再设计 0.4.x 扩展契约。

## 14. 成功标准

整个演进规划以以下结果为成功标准：

- 业务项目可以稳定保存和恢复富文本内容；
- 同一份主数据可以经过服务端安全地生成 Shopify HTML；
- 新增节点不会要求修改所有业务项目的核心代码；
- 不支持的 Channel 能力会明确报错或降级；
- 旧数据和旧客户端有可验证的迁移路径；
- 1.0 发布后公共 API、数据协议和安全边界可被长期维护；
- 高级能力以独立 Provider、Extension 或 Adapter 演进，不反向污染 Core。
