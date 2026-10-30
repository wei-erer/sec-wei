---
title: '文章标题'
date: 2026-10-28
category: web
tags: ['SSRF', '绕过']
summary: '一句话摘要，会出现在列表页、搜索结果和分享卡片里。'
series: '从零开始学内网'
seriesOrder: 1
draft: false
---

> 复制这个文件到 `src/content/posts/`，文件名就是网址：`xxx.md` → `/posts/xxx/`。
> 用不到的字段直接删掉即可。

正文从这里开始。支持 **加粗**、*斜体*、`行内代码`、[链接](https://example.com)。

## 二级标题会出现在右侧目录里

段落之间空一行。列表：

- 第一点
- 第二点
  - 嵌套也可以

### 三级标题

代码块带语言角标和复制按钮：

```python
import requests

resp = requests.get("http://127.0.0.1:8080/", timeout=3)
print(resp.status_code, len(resp.content))
```

表格：

| 场景 | 结论 | 备注 |
| --- | --- | --- |
| 内网回显 | 可以打 | 优先看响应长度 |
| 无回显 | 盲打 | 看时间差 |

引用：

> 过滤发生在字符串层，危害发生在解析层。

图片放 `public/images/`，正文写绝对路径（本地和线上都会自动带 base 前缀）：

```markdown
![示意图](/images/你的图.png)
```

公式：

$$
c = m^{e} \bmod n
$$

行内公式写成 `$m^{e} \bmod n$` 这样。

---

## 发布前检查

1. `category` 必须是 `src/site.config.mjs` 里 `categories` 的 slug 之一
2. `date` 用 `YYYY-MM-DD`，排序和归档都靠它
3. 写完跑一次 `npm run build`，看有没有报错
4. 不想发布的先写 `draft: true`
