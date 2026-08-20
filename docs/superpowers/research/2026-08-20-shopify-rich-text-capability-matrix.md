# Shopify Native 能力矩阵（0.5.x）

> 状态：0.5.x 实现前置研究基线
>
> 更新时间：2026-08-20
>
> 说明：本文只固化资源引用和 Shopify Rich Text JSON 的结构边界，不包含真实店铺数据、Token、App Bridge 实例或 Admin API 调用。真实业务接入仍必须在宿主 App 中验证权限、API 版本和 Resource Picker 返回字段。

## 1. 0.5.x 范围

0.5.x 只实现以下闭环：

```text
业务应用 ResourceProvider
        ↓
稳定资源引用 Node
        ↓
服务端校验稳定 ID 和快照
        ↓
Shopify HTML 安全链接/文本输出
        ↓
Sanitizer
```

0.5.x 不把 Shopify Admin API、App Bridge、Token 或 Resource Picker 直接引入编辑器包，也不承诺 Tiptap JSON 与 Shopify `rich_text_field` JSON 的无损双向转换。后者只有在完整节点矩阵、降级规则和真实 API fixture 通过验证后，才能进入稳定 API。

## 2. 资源 ID 和快照规则

### 2.1 稳定资源标识

| 资源类型 | 持久化 `resourceType` | GID 格式 | 说明 |
| --- | --- | --- | --- |
| Product | `product` | `gid://shopify/Product/<numeric-id>` | 以 GID 为唯一标识，不能用标题或 Handle 替代 |
| Collection | `collection` | `gid://shopify/Collection/<numeric-id>` | 以 GID 为唯一标识，集合改名不影响引用 |
| Variant | `variant` | `gid://shopify/ProductVariant/<numeric-id>` | 业务层统一称 Variant，底层 GID 使用 ProductVariant |

GID 校验只接受完整字符串，不接受裸数字、URL 编码 GID、任意对象或包含店铺 Token 的字符串。fixture 中的数字 ID 是虚构值，仅用于测试格式。

### 2.2 可持久化快照

Resource Node 只保存：

- `resourceType`
- `id`
- 可选 `title`
- 可选 `handle`
- 可选 `image` URL

不保存完整 Shopify API response、价格、库存、权限信息、Admin URL、Access Token 或 Provider 私有字段。快照缺失或过期时保留稳定 ID，并显示 unresolved 状态；不得静默改写成普通文本。

## 3. Resource Picker / Provider 边界

编辑器只依赖 `ResourceProvider` 契约，业务应用负责实现具体选择器：

| 场景 | Provider 结果 | 编辑器行为 |
| --- | --- | --- |
| 用户选择一个资源 | `{ resourceType, id, snapshot? }` | 创建一个 Resource Node |
| 用户取消 | `undefined` 或取消结果 | 不创建空 Node，不触发错误回调 |
| 权限不足 | `PERMISSION_DENIED` | 交给业务显示授权/权限提示 |
| 网络失败 | `NETWORK_ERROR` | 交给业务重试或提示，不修改文档 |
| 资源不存在 | `RESOURCE_NOT_FOUND` | 保留已有 Node，标记 unresolved |
| 跨店铺资源 | Provider 必须拒绝或返回明确错误 | 不允许写入当前店铺文档 |

Provider 不负责刷新业务凭证、不持有 Admin Token、不直接修改 Tiptap 文档，也不依赖编辑器组件内部状态。

## 4. Shopify Rich Text JSON 支持矩阵

### 4.1 Shopify 方向的结构观察

Shopify `rich_text_field` 使用独立的树形 JSON 协议，常见结构包含 `root`、`paragraph`、`heading`、`list`、`list-item`、`link` 和 `text` 等节点。它与 Tiptap JSON 的根节点、attrs、mark 表达方式不同，因此不能通过改名字段实现无损双向转换。

### 4.2 0.5.x 实现矩阵

| 能力 | 0.5.x 状态 | 策略 |
| --- | --- | --- |
| Tiptap paragraph / heading / text | 支持 | 继续使用现有服务端 HTML Serializer |
| bold / italic / underline / link | 支持 HTML 输出 | 按现有 URL 和 Sanitizer 规则处理 |
| Product / Collection / Variant Resource Node | 支持实验性 HTML 输出 | 输出安全链接或纯文本，不泄露内部 attrs |
| Shopify `root` / `list-item` 等原生 JSON | 仅 fixture/研究 | 不作为稳定输入 API |
| Shopify JSON → Tiptap JSON | 未承诺 | 0.6.x Import Pipeline 再处理 |
| Tiptap JSON → Shopify Rich Text JSON | 未承诺 | 需要无损/降级测试后再开放 |
| Variables、AI、任意 HTML | 不支持 | 拒绝或保持未知能力错误 |

## 5. HTML 输出决策

Resource Node 的 Shopify HTML 输出采用安全链接优先策略：

- 有 `handle` 时生成当前店铺相对资源路径需要由业务 Channel 配置提供，Core 不猜测店铺域名；
- 没有可验证 URL 时输出经过清洗的标题纯文本；
- 图片只使用经过协议校验的 `https` 或 `http` URL；
- 输出不包含 `resourceType`、内部 attrs、Provider 数据、权限信息或 API response；
- 所有输出仍必须经过 Channel Adapter 和 Sanitizer。

0.5.x 不把 Shopify Admin URL 写入持久化文档，也不在浏览器拼接店铺 URL。

## 6. 研究限制和后续验证

以下事项必须由真实宿主 App 在目标 Shopify API 版本中验证：

- Resource Picker 的具体返回字段和权限 scope；
- 资源删除、无权限和跨店铺返回值；
- 当前 Shopify `rich_text_field` 支持的完整节点/mark 集合；
- 资源图片 CDN URL 的生命周期和协议；
- 业务店铺域名到资源 Handle 的 URL 映射。

这些运行时事实不能由编辑器包自行推断，也不能通过 fixture 冒充真实 API 兼容性。
