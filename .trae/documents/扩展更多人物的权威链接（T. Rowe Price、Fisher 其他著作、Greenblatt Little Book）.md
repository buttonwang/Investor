## 目标
- 依据“关键词映射 + 站点白名单”，为 T. Rowe Price、Fisher 其他著作、Greenblatt Little Book 系列补齐四语 `links`，类型统一为 `website`/`research`。

## 站点白名单
- 出版社：Wiley、Simon & Schuster、McGraw‑Hill
- 机构官网：T. Rowe Price 官方网站

## 关键词映射
- T. Rowe Price → “公司历史/创始人理念/全球故事”
- Philip Fisher → “Paths to Wealth through Common Stocks”“Conservative Investors Sleep Well”“Developing an Investment Philosophy”（出版社页）
- Joel Greenblatt → “The Little Book That Beats the Market”“The Little Book That Still Beats the Market”（Wiley出版社页）

## 拟新增链接（四语标签模板）
- T. Rowe Price（id: `t_rowe_price`）
  - `website`：T. Rowe Price 官方站（示例：Global Story、History 页）
    - en："T. Rowe Price Global Story" → https://www.troweprice.com/institutional/us/en/about/global-story.html
    - en："T. Rowe Price History" → https://www.troweprice.com/corporate/lt/en/what-sets-us-apart/history.html
    - zh/es/fr：按既有风格翻译 label
- Fisher 其他著作（id: `fisher`）
  - `research`：Wiley 出版社页
    - Paths to Wealth through Common Stocks → https://www.wiley.com/en-us/Paths+to+Wealth+Through+Common+Stocks-p-x000341325
    - （若需）Conservative Investors Sleep Well/Developing an Investment Philosophy：如无独立页面，使用 Wiley 合集页（已验证）或合集中章节说明
- Greenblatt Little Book（id: `greenblatt`）
  - `research`：Wiley 出版社页
    - The Little Book That Beats the Market → https://www.wiley.com/en-us/The+Little+Book+That+Beats+the+Market-p-9780470893661
    - The Little Book That Still Beats the Market → https://www.wiley.com/en-us/The+Little+Book+That+Still+Beats+the+Market-p-9780470624159

## 数据更新方式
- 在对应人物对象中新增 `links` 项或向现有 `links` 追加条目
- 四语数组齐备：`zh`/`en`/`es`/`fr`，统一 `{ label, url, type }`
- `type`：机构/工具用 `website`；出版社和书籍页用 `research`

## 校验与回滚
- 打开本地页面 `http://localhost:3000/` 验证 `/api/investors` 返回计数与结构
- 仅增量修改，不触及既有条目；如发现站点更换或链接失效，替换为同源官方等效页

## 后续扩展
- T. Rowe Price 可补基金历史档案或创始人语录官方页（同站）
- Fisher 若找到独立出版社页则补齐；否则沿用 Wiley 合集
- Greenblatt 若新版 Little Book 出版社页稳定上线，可在后续追加新版链接

请确认以上计划，收到确认后我将一次性完成上述四语 `links` 补齐并进行验证。