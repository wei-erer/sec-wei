---
title: '伟大的 requests 库'
date: 2026-10-30
category: knowledge
tags: ['python', 'requests', 'http']
summary: 'Python requests 入门：从 GET/POST 到 params、headers、cookies、timeout 和 Session，附几个新手最容易踩的坑。'
---

> 你知道吗？requests 是 Python 里最受欢迎的第三方 HTTP 库。

先跑起来，三行就够：

```python
import requests

r = requests.get("https://wei-erer.github.io/sec-wei/", timeout=5)
print(r.status_code, len(r.text))
```

## 一、requests 可以干什么？

> 用 Python 代码模拟浏览器 / 客户端发送 HTTP 请求，并拿到服务器返回的响应。

### 核心能力：发 HTTP 请求

requests 支持常见的 HTTP 方法：

- `requests.get()`：GET 请求获取数据
- `requests.post()`：POST 请求提交数据
- `put()`、`delete()`、`head()`、`patch()` 等等

可以携带：

- `params`：URL 查询参数
- `headers`：请求头
- `cookies`：Cookie
- `data`：表单数据
- `json`：JSON 数据
- `files`：上传文件
- `proxies`：代理
- `timeout`：超时

拿到响应后可以读：

- `response.text`：文本 / HTML
- `response.content`：二进制（图片、文件）
- `response.json()`：解析 JSON
- `response.status_code`：状态码
- `response.headers`：响应头

## 二、核心用法和语句

### 1. 安装和准备

在终端安装：

```bash
pip install requests
```

在 Python 脚本中导入使用：

```python
import requests
```

### 2. 发送 GET 请求

示例：

```python
import requests

response = requests.get("https://wei-erer.github.io/sec-wei/")
```

返回值 `response` 是一个 Response 对象，包含服务器的全部回复信息：

| 属性 / 方法 | 说明 |
| --- | --- |
| `response.status_code` | HTTP 状态码（200 成功，404 未找到，500 服务器错误等） |
| `response.text` | 网页源代码，字符串 |
| `response.content` | 原始字节 |
| `response.json()` | JSON 数据 |
| `response.headers` | 响应头 |
| `response.url` | 最终请求的完整 URL（参数被编码后，可以用它确认实际请求的地址） |

### 3. GET 常用参数

下面几段的 `url` 都沿用这个：

```python
url = "https://wei-erer.github.io/sec-wei/"
```

#### params

给 URL 后面拼接参数：

```python
import requests

url = "https://wei-erer.github.io/sec-wei/"

params_data = {
    "username": "wei_er",
    "password": "123456"
}

response = requests.get(url, params=params_data)

print(response.url)
# 输出：https://wei-erer.github.io/sec-wei/?username=wei_er&password=123456
```

#### headers

```python
import requests

url = "https://wei-erer.github.io/sec-wei/"

headers_data = {
    "User-Agent": "wei_er/5.2.0",
    "Referer": "https://wei-erer.github.io/"
    # 告诉服务器你是从哪个页面点过来的
}
response = requests.get(url, headers=headers_data)
```

很多网站会拒绝没有 User-Agent 的请求，这个时候你就需要伪装成正常浏览器，~~你已经学会了爬虫？~~

#### cookies

```python
import requests

url = "https://wei-erer.github.io/sec-wei/"

cookies_data = {
    "token": "wei_er_1s_v3ry_hands0me",
    "session_id": "1"
}
response = requests.get(url, cookies=cookies_data)
```

扔一个 cookie，yummy！

> ⚠️ 上面是编的假值。真实的 Cookie / token / 密码**不要写进代码，更不要截图发到博客里**——这东西泄露一次就得改密码。

#### timeout

```python
import requests

url = "https://wei-erer.github.io/sec-wei/"

try:
    # 如果 3 秒没响应，就抛 TimeoutError 异常
    response = requests.get(url, timeout=3)
except requests.exceptions.Timeout:
    print("请求超时了，服务器太慢了！")
```

防止服务器一直没响应而卡在那里。**建议每个请求都带上 `timeout`**，不写的话默认是等到底。

### 4. 发送 POST 请求

#### 提交表单数据

`Content-Type: application/x-www-form-urlencoded`

```python
import requests

data = {
    "username": "wei_er",
    "password": "123456"
}
response = requests.post("https://httpbin.org/post", data=data)
print(response.json())
```

#### 提交 JSON 数据

`Content-Type: application/json`

```python
import requests

payload = {
    "username": "wei_er",
    "role": "admin"
}
response = requests.post("https://httpbin.org/post", json=payload)
print(response.json())
```

`data=` 和 `json=` 的区别：前者发的是表单（`a=1&b=2`），后者发 JSON 字符串并自动设置 `Content-Type`。

### 5. 保持会话：Session

每次 `requests.get()` 都是独立的，上一次服务器给你的 Cookie 不会带到下一次。要“记住登录状态”，用 `Session`：

```python
import requests

s = requests.Session()
s.headers.update({"User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)"})

s.post("https://httpbin.org/post", data={"username": "wei_er"})   # 登录，拿到 cookie
r = s.get("https://httpbin.org/cookies")                          # 自动带上 cookie
print(r.json())
```

它还会复用底层的 TCP 连接，连续请求同一个站时更快。

### 6. 几个新手常踩的坑

**① 中文乱码**

```python
r.encoding = r.apparent_encoding   # 让 requests 按实际内容猜编码
print(r.text)
```

**② 拿着 404 的错误页往下解析**

```python
r = requests.get(url, timeout=5)
r.raise_for_status()   # 4xx / 5xx 直接抛异常，不用自己写 if
```

**③ 对非 JSON 页面调 `response.json()`**

会抛 `ValueError`。先确认一下：

```python
if "application/json" in r.headers.get("Content-Type", ""):
    data = r.json()
```

**④ 路径少个斜杠就是 404**

`/about` 和 `/about/` 在很多站点上是两个地址。404 的时候先检查这个。

## 三、小结

把这几件事做好，日常八成场景就够了：

1. 每个请求都带 `timeout`
2. 拿数据前先 `raise_for_status()` 或检查 `status_code`
3. 中文页面记得处理 `encoding`
4. 要连续操作同一个站，用 `Session` 而不是反复 `requests.get()`

再往下是认证（Basic / Bearer）、代理池、并发，等真开始写爬虫再补。
