// ─────────────────────────────────────────────────────────────
//  sec(wei) — 站点全局配置
//  改这里就够了，不需要动其他文件。
// ─────────────────────────────────────────────────────────────

export default {
  // ── 基本信息 ───────────────────────────────────────────────
  title: 'sec(wei)',
  titleHtml: 'sec<span class="glow-paren">(wei)</span>', // 首页大字里的写法（可带样式）
  tagline: 'Web 安全学习笔记',
  description:
    'sec(wei) 的个人博客 —— 记录 Web 安全（SQLi / XSS / SSRF / 反序列化 / WAF 绕过）、内网渗透与逆向复现的踩坑与思考。',
  keywords: ['Web安全', '渗透测试', 'XSS', 'SQL注入', 'SSRF', 'WAF绕过', '信息安全', 'CTF'],

  // ── 部署地址（上线前改 url；base 一般不用手填）──────────────
  // 用户站点 https://<用户名>.github.io          → base 保持 '/'
  // 项目站点 https://<用户名>.github.io/<仓库名>/ → CI 会自动注入 SITE_BASE=/<仓库名>/
  //   本地想模拟项目站点：$env:SITE_BASE='/sec-wei/'; npm run build
  url: 'https://wei-erer.github.io',
  base: process.env.SITE_BASE || '/',

  // ── 作者 ───────────────────────────────────────────────────
  author: {
    name: 'wei_er',
    handle: 'sec(wei)',
    bio: '信息安全学习者。记录踩过的坑，也记录想明白的瞬间。',
    github: 'https://github.com/wei-erer',
    email: '',
  },

  // ── 首屏终端（Hero 里那个窗口）────────────────────────────
  // posts / tags / categories 是自动统计的，不用写在这里。
  // 下面四行是手写的"自画像"，想改人设就改这块。
  terminal: {
    host: 'sec',
    user: 'wei_er',
    name: 'wei_er',
    focus: 'web_security',
    org: 'JNSEC',
    motto: 'keep learning',
  },

  // ── 导航 ───────────────────────────────────────────────────
  nav: [
    { label: '首页', href: '/' },
    { label: '文章', href: '/archive/' },
    { label: '分类', href: '/categories/' },
    { label: '标签', href: '/tags/' },
    { label: '关于', href: '/about/' },
  ],

  // ── 分类（首页/归档按这个顺序展示，可自由增删）──────────────
  // slug 用英文，文章 frontmatter 里 category 写 slug。
  categories: [
    { slug: 'knowledge', label: '知识点干货', desc: '原理、复现、踩坑记录' },
    { slug: 'meeting', label: '例会感悟', desc: '俱乐部例会听到的、想到的' },
    { slug: 'ctf', label: '比赛复盘', desc: '比赛和靶场，打完再回头看' },
    { slug: 'notes', label: '碎碎叨', desc: '日常、计划、和学习无关的那些' },
  ],

  // ── 评论：giscus（基于 GitHub Discussions）──────────────────
  // 填好这三项并把 enabled 改成 true 即可生效。
  // 获取地址：https://giscus.app/zh-CN
  giscus: {
    enabled: false,
    repo: 'wei-erer/sec-wei',
    repoId: '',
    category: 'Announcements',
    categoryId: '',
    mapping: 'pathname',
    lang: 'zh-CN',
  },

  // ── 访问统计 ───────────────────────────────────────────────
  // busuanzi（不蒜子）：无需注册，改成 true 直接可用，但依赖第三方脚本。
  analytics: {
    busuanziUrl: 'https://busuanzi.ibruce.info/busuanzi/2.3/busuanzi.pure.mini.js',
    enabled: false,
  },

  // ── 社交 / 页脚 ────────────────────────────────────────────
  socials: [
    { label: 'GitHub', href: 'https://github.com/wei-erer' },
    { label: 'RSS', href: '/rss.xml' },
  ],

  // ── 主题：dark = 终端绿（默认），light = 纸白终端 ───────────
  defaultTheme: 'dark',
  showThemeToggle: true,

  // 建站年份（页脚用）
  since: 2026,
};
