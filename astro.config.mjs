import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import site from './src/site.config.mjs';

// 代码高亮主题：荧光绿终端风（如需换回内置主题，把 theme 改成 'github-dark-default'）
const terminalTheme = {
  name: 'sec-wei-terminal',
  type: 'dark',
  colors: {
    'editor.background': '#060b07',
    'editor.foreground': '#c8f7d4',
  },
  settings: [
    { settings: { foreground: '#c8f7d4', background: '#060b07' } },
    { scope: ['comment', 'punctuation.definition.comment'], settings: { foreground: '#5f9e78', fontStyle: 'italic' } },
    { scope: ['string', 'string.quoted', 'string.template'], settings: { foreground: '#9ae6a0' } },
    { scope: ['keyword', 'storage', 'storage.type', 'storage.modifier'], settings: { foreground: '#00ff41' } },
    { scope: ['entity.name.function', 'support.function', 'meta.function-call'], settings: { foreground: '#5fd7a0' } },
    { scope: ['constant.numeric', 'constant.language', 'constant.character'], settings: { foreground: '#ffd166' } },
    { scope: ['variable', 'variable.other', 'variable.parameter'], settings: { foreground: '#d9ffe4' } },
    { scope: ['entity.name.tag', 'entity.name.type', 'support.class'], settings: { foreground: '#00d17a' } },
    { scope: ['entity.other.attribute-name'], settings: { foreground: '#ffd166' } },
    { scope: ['keyword.operator'], settings: { foreground: '#66ffa0' } },
    { scope: ['punctuation', 'meta.brace'], settings: { foreground: '#6f9c7c' } },
    { scope: ['markup.heading', 'markup.bold'], settings: { foreground: '#00ff41', fontStyle: 'bold' } },
    { scope: ['markup.italic'], settings: { fontStyle: 'italic' } },
    { scope: ['markup.inserted'], settings: { foreground: '#00ff41' } },
    { scope: ['markup.deleted'], settings: { foreground: '#ff5f57' } },
    { scope: ['invalid'], settings: { foreground: '#ff5f57' } },
  ],
};

// 项目站点（base 不是 '/'）时，把 markdown 里的 /images/... 和站内链接自动加上 base 前缀
function rehypeBasePath({ base }) {
  if (!base || base === '/') return () => () => {};
  const prefix = base.replace(/\/+$/, '');
  const walk = (node, fn) => {
    if (!node || typeof node !== 'object') return;
    if (node.type === 'element') fn(node);
    if (Array.isArray(node.children)) node.children.forEach((child) => walk(child, fn));
  };
  const rewrite = (value) =>
    typeof value === 'string' && value.startsWith('/') && !value.startsWith('//')
      ? prefix + value
      : value;

  return () => (tree) => {
    walk(tree, (node) => {
      if (!node.properties) return;
      if (node.tagName === 'img') node.properties.src = rewrite(node.properties.src);
      if (node.tagName === 'a') node.properties.href = rewrite(node.properties.href);
    });
  };
}

export default defineConfig({
  site: site.url,
  base: site.base,
  trailingSlash: 'ignore',
  prefetch: { prefetchAll: true, defaultStrategy: 'viewport' },
  integrations: [sitemap({ filter: (page) => !page.includes('/404') })],
  // Windows 下写文件时 Vite watcher 偶尔会 EBUSY，把临时文件/日志/截图目录排除掉
  vite: {
    server: {
      watch: {
        ignored: ['**/.shots/**', '**/*.log', '**/*.tmp', '**/*.tmpdir/**', '**/*~'],
      },
    },
  },
  markdown: {
    remarkPlugins: [remarkMath],
    rehypePlugins: [rehypeKatex, rehypeBasePath({ base: site.base })],
    shikiConfig: {
      theme: terminalTheme,
      wrap: false,
    },
  },
});
