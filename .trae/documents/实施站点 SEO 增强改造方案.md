## 改造目标
- 提升可索引性与多语言覆盖：完善 hreflang、canonical、sitemap
- 强化页面信号：结构化数据（JSON‑LD）、OG/Twitter 元数据
- 优化抓取与性能：压缩传输、移除无效脚本、内容可读化

## 页面结构与元数据
- 标题/摘要
  - 保留当前标题与摘要生成：`server.js:189, 194`
  - 为各段（theory/strategy/wins）增加简短摘要（保留现有生成；内容层面后续增强）
- OpenGraph/Twitter
  - 已有 `og:type/title/description/url/locale`：`server.js:197–201`
  - 新增：`og:image`（默认占位图）、`twitter:card=summary_large_image`
- JSON‑LD
  - 详情页（人物）：保留 `@type=Person` 与 `sameAs`：`server.js:202–207`
  - 扩充字段：`jobTitle`（由 tags 推断，例如 value/quant/macro）、`works` 映射为 `CreativeWork`/`Book`（来自 `works` 字段）；`knowsAbout` 已存在
  - 机构页（如 `man_ahl/renaissance`）：`@type=Organization` 增加 `logo`（默认占位）、`contactPoint`（邮箱占位或 null），保留 `sameAs`

## 多语言与索引
- hreflang/alternate
  - 已输出四语 `alternate`：`server.js:160`
  - 规范 `x-default` 与 canonical（已存在 `server.js:192`），保证每语言页自指 canonical
- sitemap
  - 已生成：`/sitemap.xml`：`server.js:92–110`
  - 增加 `<xhtml:link rel=alternate hreflang=…>`（在 sitemap 中反映四语），并提升首页与多语言入口权重

## 抓取与性能
- 压缩传输
  - 引入 `compression` 中间件：优先压缩 HTML/JSON，提升抓取速度
- 移除无效脚本
  - 站点如存在 `_vercel/insights/script.js` 引用，移除或加环境开关（非 Vercel 环境禁用），消除 404 噪音
- 静态缓存策略
  - 保留 `express.static` 缓存：`server.js:17`；动态页面不长缓存

## 实施改动文件
- `server.js`
  - 增加 `compression` 中间件
  - 在详情页 `<head>` 中补充 `og:image`、Twitter 元标签（`server.js:187–206` 区域）
  - 扩充 JSON‑LD 生成逻辑（`server.js:202–207`）
  - 优化 sitemap XML，加入多语言 `<xhtml:link>` 并调整权重
- `public`（若存在 insights 脚本引用文件）
  - 移除或围绕 `NODE_ENV/VERCEL` 变量做条件注入

## 验证
- 本地预览 `http://localhost:3000/investors/:id?lang=zh` 检查 `<head>` 元标签与 JSON‑LD
- 用 `https://validator.schema.org/` 验证 JSON‑LD（复制页面源）
- 用 `https://search.google.com/test/rich-results` 测试富结果
- 抓取模拟：`/sitemap.xml` 校验多语言链接与条目

## 回滚与风险
- 所有改动为纯增量；若出现错误，撤回新增中间件与 `<head>` 标签生成段即可
- JSON‑LD 与 OG/Twitter 标签为静态插入，不影响 API 返回

请确认以上方案，确认后我将直接落地到代码并完成验证。