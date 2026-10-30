# sec(wei)

> 信息安全学习笔记 · 终端绿 CRT 风格静态博客

基于 **Astro 5** 的纯静态博客：Markdown 写作、构建成 HTML、托管在 GitHub Pages。
没有后端、没有数据库、没有第三方追踪。所有样式和交互都是手写的（不引 UI 组件库）。

---

## 快速开始

```bash
npm install        # 或 pnpm install
npm run dev        # 本地开发：http://127.0.0.1:4321
npm run build      # 构建到 dist/
npm run preview    # 预览构建结果
```

> 首次 `npm install` 走的是 `.npmrc` 里配置的国内镜像（npmmirror），装完可以删掉 `.npmrc`。

---

## 写一篇新文章

在 `src/content/posts/` 下新建 `xxx.md`，**文件名就是网址**（`/posts/xxx/`）。

```markdown
---
title: '标题'
date: 2026-10-27
category: web          # 对应 site.config.mjs 里的 categories.slug
tags: ['XSS', 'WAF']
summary: '一句话摘要，会显示在列表页和搜索结果里。'
series: '从零开始学内网' # 可选：系列名
seriesOrder: 2          # 可选：系列里的顺序
draft: false            # 可选：true 则构建时跳过
---

正文从这里开始……
```

字段说明：

| 字段 | 必填 | 说明 |
| --- | --- | --- |
| `title` | ✅ | 文章标题 |
| `date` | ✅ | 发布日期，`YYYY-MM-DD` |
| `category` | ✅ | 分类 slug，见 `src/site.config.mjs` |
| `tags` | | 标签数组，自动生成标签页 |
| `summary` | | 摘要（列表页 / SEO / 搜索） |
| `series` + `seriesOrder` | | 系列文章导航 |
| `draft` | | `true` 不发布 |
| `updated` | | 更新日期 |

正文支持：标题、列表、表格、引用、代码块（自动高亮 + 复制按钮 + 语言角标）、
图片（点击放大）、`$行内公式$` 和 `$$块级公式$$`（KaTeX）。

图片放 `public/images/`，正文里写绝对路径：

```markdown
![示意图](/images/xxx.png)
```

---

## 配置

几乎所有的站点信息都在 **`src/site.config.mjs`** 一个文件里：

- 站点名、描述、关键词
- 部署地址（`url` / `base`）
- 作者信息、导航、分类
- giscus 评论、访问统计

配色和排版统一在 `src/styles/global.css` 顶部的 CSS 变量里改：

```css
:root {
  --bg: #040705;          /* 底色 */
  --accent: #00ff41;      /* 主色（荧光绿） */
  --accent-soft: #5dff94; /* 悬停 / 次级 */
  --accent-dim: #2a8a4a;  /* 边线 */
  --ink: #c8f2d5;         /* 正文色 */
  --dim: #61917a;         /* 次要文字 */
  --glow-rgb: 0, 255, 65; /* 所有辉光/扫描线的颜色 */
  /* ... */
}
```

换主色只需要动这 7 个值（暗色和 `[data-theme='light']` 各一份），
`--glow-rgb` 是三通道数字（`R, G, B`），所有 `rgba(var(--glow-rgb), …)` 的辉光会一起变。
另外记得同步三处：`astro.config.mjs` 里的代码高亮主题、`public/favicon.svg`、
以及 `python scripts/make-assets.py` 重新生成的 OG 图。

---

## 目录结构

```
src/
├─ site.config.mjs        # 站点配置（改这里就够了）
├─ content.config.ts      # 文章 frontmatter 校验
├─ content/posts/         # ✍️ 文章都放这里
├─ layouts/BaseLayout.astro
├─ components/            # Header / Hero / PostRow / Toc / Search / Comments ...
├─ pages/                 # 路由：首页 / 文章 / 归档 / 分类 / 标签 / 关于 / 404 / rss
├─ lib/utils.js           # 日期、阅读时长、路径工具
├─ scripts/main.js        # 全局交互（主题、进度条、复制、灯箱、目录高亮）
└─ styles/global.css      # 设计系统
public/
├─ images/                # 文章配图
├─ og-default.png         # 社交分享卡片
└─ favicon.svg
scripts/
├─ make-assets.py         # 重新生成占位图（可选）
└─ shot.mjs               # 无头 Edge 截图（可选）
```

---

## 部署到 GitHub Pages

### 1. 先决定站点形态

| 形态 | 仓库名 | `url` | `base` |
| --- | --- | --- | --- |
| 用户站点 | `<用户名>.github.io` | `https://<用户名>.github.io` | `/` |
| 项目站点 | 任意（如 `blog`） | `https://<用户名>.github.io` | `/blog/`（CI 自动填） |

只需要改 `src/site.config.mjs` 里的 `url`，同时把 `public/robots.txt` 里的 Sitemap
地址改成同一个域名。**`base` 不用手填**：CI 会用 `SITE_BASE=/${{ github.event.repository.name }}/`
把仓库名注入进去，换仓库名也不会 404。

本地如果想模拟项目站点的路径：

```powershell
$env:SITE_BASE='/sec-wei/'; npm run build; npm run preview   # 访问 http://127.0.0.1:4321/sec-wei/
```

### 2. 用 GitHub Actions 自动部署（推荐）

仓库里已经放好了 `.github/workflows/deploy.yml`，不用自己再建：

```yaml
# 用的就是仓库里的 .github/workflows/deploy.yml
# checkout → setup-node(22) → corepack enable → pnpm install → astro build → deploy-pages
```

然后在仓库 **Settings → Pages → Build and deployment → Source** 选 **GitHub Actions**。
之后每次 `git push` 到 `main` 都会自动构建发布。

> 说明：CI 上是 `pnpm install --no-frozen-lockfile`，避免本地 pnpm 版本和 runner 不一致导致失败。

### 3. 注意

- `public/.nojekyll` 必须保留，否则 GitHub Pages 的 Jekyll 会忽略 `_astro/` 目录，样式全丢。
- 如果仓库根目录有 `src/`、`package.json`，GitHub Pages 用 Actions 构建不会有问题；
  但如果用「Deploy from a branch」方式，请把 `dist/` 推到 `gh-pages` 分支。
- 项目站点（`base: '/blog/'`）时，Markdown 里的 `/images/x.png` 会被自动补上前缀，
  不用手改（由 `astro.config.mjs` 里的 `rehypeBasePath` 处理）。

---

## 已接好的功能

- [x] 终端 Hero（打字机 + 状态栏）
- [x] 分类 / 标签 / 归档
- [x] 站内搜索（`/` 或 `Ctrl+K`，静态索引，无后端）
- [x] 文内目录 TOC + 滚动高亮
- [x] 阅读进度条、阅读时长
- [x] 代码高亮（自定义荧光绿主题）+ 复制按钮 + 语言角标
- [x] KaTeX 数学公式（仅文章页加载样式）
- [x] 图片灯箱、系列导航、上一篇/下一篇
- [x] RSS、sitemap、OpenGraph/JSON-LD
- [x] 亮/暗主题切换（`?theme=light` 可直接预览）
- [ ] giscus 评论：填好 `site.config.mjs` 里的 `repoId` / `categoryId` 并打开 `enabled`
- [ ] 访问统计（不蒜子）：把 `analytics.enabled` 改成 `true`

---

## 本地自检（可选，需要本机有 Edge）

```bash
node scripts/smoke.mjs      # 真点一遍：打字机/搜索/TOC/灯箱/进度条/主题，共 11 项
node scripts/shot.mjs <url> .shots/x.png 1440 900        # 桌面截图
node scripts/shot.mjs <url> .shots/m.png 390 844 full    # 移动端整页截图
```

`smoke.mjs` 会打印 PASS/FAIL，截图写到 `.shots/`（已在 `.gitignore` 里）。

---

## 常见问题

**删了文章，但页面上的数字/列表没变？**

Astro 5 把内容索引缓存在 `node_modules/.astro/` 里，删文件或改文件名后可能残留旧条目：

```bash
npm run clean   # 清掉 .astro / dist / node_modules/.astro
npm run build
```

**`npm run dev` 报 `EBUSY: resource busy or locked`？**

Windows 上文件监听偶尔会和编辑器/压缩软件抢锁。已经忽略了 `.shots/`、`*.log`、`*.tmp`；
还不行就用 `npm run build` + `npm run preview`（预览模式不监听文件，更稳）。

---

## 一些实现说明

- **CRT 效果**：`.crt` 固定层做扫描线 + 暗角，`prefers-reduced-motion` 下自动关闭动画。
- **主题防闪烁**：`<head>` 里的内联脚本在首屏渲染前就把 `data-theme` 写到 `<html>`。
- **代码高亮主题**：`astro.config.mjs` 里自定义的 `sec-wei-terminal`，想换回内置主题把
  `shikiConfig.theme` 改成 `'github-dark-default'` 即可。
- **占位图**：`python scripts/make-assets.py` 重新生成（需要 Pillow）。
- **评论**：giscus 未配置时，文章底部显示的是一段"怎么配"的提示，不会留下空白。

---

## License

文章内容版权归作者所有；代码部分可随意取用。
