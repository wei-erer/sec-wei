---
title: 'PHP 基本语法：从 <?php 到 $_GET'
date: 2026-10-30
category: knowledge
tags: ['php', 'web', 'basics']
summary: 'PHP 语法入门笔记：代码标记、变量、字符串、数组、函数、作用域、超全局变量、类型比较和文件包含。'
---

> PHP,为web而生

先跑起来：

```php
<?php
echo "hello, php\n";
```

保存成 `hello.php`，命令行运行 `php hello.php`；或者起个临时服务器：

```bash
php -S localhost:8000
```

浏览器打开 `http://localhost:8000/hello.php` 就能看到输出。

## 一、PHP 长什么样

- 文件后缀 `.php`，代码写在 `<?php ... ?>` 里面
- 一个文件里可以混着 HTML 和 PHP，服务器只执行 PHP 那部分
- 变量以 `$` 开头，不需要声明类型（弱定义）
- 每条语句结尾要写分号（和C语言一样）

```php
<?php
$name = "wei_er";
$age = 18;
echo "我的名字是 " . $name;
?>
```

### 代码标记有几种写法

```php
<?php  echo "标准标记"; ?>     // 最常见
<?=   "短输出标记"; ?>          // 等价于 echo，模板里很常见
<?    echo "短标记"; ?>         // 需要 php.ini 里 short_open_tag = On
```

另外老版本 PHP 还支持 `<script language="php">...</script>`，PHP 7 之后已经删掉了。

短标记在 CTF 里有个用处：有些过滤只拦 `<?php`，但拦不住 `<?=`，所以看到过滤规则时值得留意。

### 注释

```php
<?php
// 单行注释
# 也是单行注释
/* 多行
   注释 */
```

### 语句分隔符

```php
<?php
$a = 1;
$b = 2;

echo $a + $b ?>
```

`?>` 自带语句结束的效果，所以最后一行可以不写分号。不过纯 PHP 文件一般建议**连 `?>` 一起省掉**，避免文件末尾的空行被当成输出。

## 二、基本语法

### 1. 变量

PHP 是弱类型，同一个变量可以先后装不同类型的东西：

```php
<?php
$a = 1;          // 整数
$b = 1.5;        // 浮点
$c = "text";     // 字符串
$d = true;       // 布尔
$e = null;       // 空
$f = [1, 2, 3];  // 数组

$k = "aaa";
$k = 111;        // 同一个变量可以换类型

unset($a);       // 删除变量
```

变量名必须用 `$` 开头，后面跟字母或下划线。不需要 `var`、`let` 这种关键字。

#### 可变变量

如果变量的值正好是另一个变量的名字，可以再加一个 `$` 去取它：

```php
<?php
$a = 'b';
$b = 2;

echo $$a;    // 输出 2，因为 $$a 就是 $b
```

这个特性在“变量覆盖”类漏洞里很常见，后面看到 `extract()`、`$$` 这类写法可以多想一层。

### 2. 输出：echo、print、var_dump

```php
<?php
echo "可以输出多个", "字符串";   // echo 没有返回值，快
print "只能输出一个";            // print 有返回值 1

var_dump("abc");                 // string(3) "abc"，带类型和长度
print_r([1, 2, 3]);              // 只打印值，适合看数组
```

调试的时候 `var_dump()` 最有用，因为它会把类型也打出来。

### 3. 字符串

三种写法，区别只在引号：

```php
<?php
$name = "wei_er";

echo '单引号：$name 原样输出';      // 单引号不解析变量
echo "双引号：$name 会被替换";       // 双引号解析变量
echo "拼接：" . $name . " 你好";     // 用点拼接
```

拼接用的是 `.`，不是 `+`。和 Python、JavaScript 都不一样。

### 4. 数组

```php
<?php
// 索引数组
$list = ["web", "pwn", "crypto","re","misc"];
echo $list[0];              // web

// 关联数组（相当于字典）
$user = [
    "name" => "wei_er",
    "age"  => 18
];
echo $user["name"];         // wei_er

// 遍历
foreach ($user as $key => $value) {
    echo "$key = $value\n";
}
```

数组里可以放任何类型，也可以嵌套。

### 5. 条件与循环

```php
<?php
$score = 85;

if ($score >= 90) {
    echo "优秀";
} elseif ($score >= 60) {
    echo "及格";
} else {
    echo "不及格";
}

for ($i = 0; $i < 3; $i++) {
    echo $i;
}

foreach ([1, 2, 3] as $n) {
    echo $n;
}
```

### 6. 函数

```php
<?php
function add($a, $b = 10) {   // 参数可以有默认值
    return $a + $b;
}

echo add(1);      // 11
echo add(1, 2);   // 3
```

参数和返回值不写类型也能跑，写了更容易看懂。

传参默认是**值传递**，函数里改不会影响外面；加 `&` 变成引用传递：

```php
<?php
function plus(&$n) {
    $n++;
}

$x = 1;
plus($x);
echo $x;    // 2
```

### 7. 作用域与常量

函数内部拿不到外面的变量，要用 `global` 声明，或者直接操作 `$GLOBALS`：

```php
<?php
$x = 5;
$y = 10;

function myTest() {
    global $x, $y;
    $y = $x + $y;
}

myTest();
echo $y;    // 15
```

```php
<?php
$x = 5;
$y = 10;

function myTest2() {
    $GLOBALS['y'] = $GLOBALS['x'] + $GLOBALS['y'];
}

myTest2();
echo $y;    // 15
```

`$GLOBALS` 是个数组，键名就是变量名（不带 `$`），它在函数里也能直接访问。

常量用 `define()` 定义，不需要 `$`，整个脚本里都能用：

```php
<?php
define("GREETING", "Welcome to JNSEC!");
echo GREETING;
```

### 8. 超全局变量

这是 PHP 在 Web 里最常用的部分——请求里的数据都在这几个变量里：

| 变量 | 内容 |
| --- | --- |
| `$_GET` | URL 查询参数 |
| `$_POST` | 表单提交的数据 |
| `$_REQUEST` | GET 和 POST 合在一起 |
| `$_COOKIE` | Cookie |
| `$_SERVER` | 服务器和请求信息（如 `$_SERVER['REMOTE_ADDR']`） |
| `$_FILES` | 上传的文件 |
| `$_SESSION` | 会话数据 |
| `$_ENV` | 环境变量 |
| `$GLOBALS` | 所有全局变量的集合 |

```php
<?php
// 访问 /index.php?name=wei_er
echo $_GET["name"];             // wei_er
echo $_SERVER["REMOTE_ADDR"];   // 访客 IP
```

这些变量的内容是用户可以随便改的——所以以后看漏洞的时候，第一件事就是找它们出现在哪。

### 9. 文件包含

```php
<?php
include "header.php";   // 找不到只警告，继续执行
require "config.php";   // 找不到直接报错，停止
```

`include` 和 `require` 会把另一个文件的内容当成 PHP 代码执行。模板系统基本都靠它，它也是文件包含漏洞的入口，这个以后有可能会单独写一篇。

## 三、类型比较：`==` 和 `===`

PHP 是弱类型，比较的时候有两种方式：

```php
<?php
var_dump(42 == "42");    // true，先转类型再比
var_dump(42 === "42");   // false，类型不同
```

`==` 叫松散比较，`===` 叫严格比较。`==` 的规则有过几次变化，下面这张表要分版本看：

| 表达式 | PHP 7 | PHP 8 |
| --- | --- | --- |
| `12 == "12"` | true | true |
| `12 == "12aa"` | true | false |
| `0 == "a"` | true | false |
| `0 == null` | true | true |
| `"0e123" == "0e456"` | true | true |
| `true == "随便一个字"` | true | true |

PHP 8 收紧的是“数字和字符串”的比较：不再是字符串转数字，而是把数字转成字符串按字符串比。但两边都是数字字符串时，仍然按数值比——这就是 `0e` 那一行还成立的原因。

`0e` 开头的东西按科学计数法算就是 0，所以两个不同的 `0e...` 字符串在 `==` 下会相等。CTF 里常见的几个：

```text
QNKCDZO        -> 0e830400451993494058024219903391
240610708      -> 0e462097431906509019562988736854
s878926199a    -> 0e545993274517709034328855841020
```

这些字符串的 md5 都是 `0e` 开头，所以在 `md5($a) == md5($b)` 这种写法下能绕过。

> 平时写代码一律用 `===`；看到别人用 `==` 比较从用户那儿拿来的值，就值得多看两眼。

## 四、几个容易出错的地方

**① 变量忘了写 `$`**

```php
$name = "wei_er";
echo name;      // 报错：未定义的常量
```

**② 用 `+` 拼字符串**

```php
echo "a" + "b";   // 报错
echo "a" . "b";   // ab
```

**③ 语句末尾漏分号**

```php
$a = 1
$b = 2;      // 第一行就报错
```

**④ 数组元素之间用 `+`**

```php
echo $list[0] . " 和 " . $list[1];   // 对
echo $list[0] + " 和 " + $list[1];   // 错，+ 在这里是数学运算
```

**⑤ `?>` 后面多打了空格或换行**

纯 PHP 文件末尾如果写了 `?>` 又跟了空格，这些空格会被当成输出发给浏览器，`header()` 之类的函数就会报 “headers already sent”。所以纯 PHP 文件通常不写 `?>`。

## 五、和安全有关的几个函数

这几个函数本身是正常功能，但在 CTF 和代码审计里出现频率很高，先混个脸熟：

| 函数 | 作用 |
| --- | --- |
| `include` / `require` | 把文件内容当 PHP 代码执行（文件包含漏洞的入口） |
| `system()` | 执行系统命令并直接输出结果 |
| `exec()` | 执行命令，返回最后一行（需要自己输出） |
| `shell_exec()` | 执行命令，返回完整输出 |
| `passthru()` | 执行命令并输出原始二进制数据 |
| `eval()` | 把字符串当 PHP 代码执行 |
| `md5()` | 算哈希，不可逆；传入数组会返回 `null`，所以常被拿来绕弱比较 |

反引号 `` ` `` 和 `shell_exec()` 等价，比如 `` echo `dir`; `` 就能执行命令——这个写法很容易被忽略。

这些每一个都能单独写一篇，这里只做索引。

## 六、小结

这篇笔记记了这些：

- PHP 代码写在 `<?php ... ?>` 里，还有 `<?=` 这种短输出标记；语句用分号结尾，`?>` 自带结束效果
- 注释有 `//`、`#`、`/* */` 三种
- 变量以 `$` 开头、弱类型，可以用 `unset()` 删掉；`$$a` 是可变变量
- `echo` 能输出多个值、`print` 只能一个、`var_dump()` 会带类型
- 字符串拼接用 `.`；单引号不解析变量，双引号会解析
- 数组分索引数组和关联数组，遍历用 `foreach`
- 函数可以有默认参数，`&` 是引用传递
- 函数内访问全局变量要 `global` 或 `$GLOBALS`；常量用 `define()`
- 九个超全局变量，尤其是 `$_GET` 和 `$_POST`
- `include` / `require` 会把别的文件当代码执行
- `==` 是松散比较、`===` 是严格比较，PHP 7 和 PHP 8 的规则还不一样
- 一串常见的高危函数：`system`、`exec`、`eval`、`include` 等
