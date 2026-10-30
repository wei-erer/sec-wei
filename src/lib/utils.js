import site from '../site.config.mjs';

/** 构建时的 base 前缀（用户站点为 '/'，项目站点为 '/repo/'） */
export const BASE = import.meta.env.BASE_URL || '/';

/** 把站内路径拼上 base，避免项目站点 404 */
export function withBase(path = '/') {
  const b = BASE.endsWith('/') ? BASE.slice(0, -1) : BASE;
  const p = path.startsWith('/') ? path : `/${path}`;
  return `${b}${p}` || '/';
}

/** 'YYYY-MM-DD' */
export function isoDate(d) {
  return new Date(d).toISOString().slice(0, 10);
}

/** 'YYYY.MM.DD' */
export function displayDate(d) {
  return isoDate(d).replace(/-/g, '.');
}

/** 中文友好的阅读时长估算 */
export function readingTime(body = '') {
  const clean = body
    .replace(/```[\s\S]*?```/g, ' ')
    .replace(/`[^`]*`/g, ' ')
    .replace(/!\[[^\]]*\]\([^)]*\)/g, ' ')
    .replace(/\[[^\]]*\]\([^)]*\)/g, ' ');
  const cjk = (clean.match(/[\u4e00-\u9fa5]/g) || []).length;
  const words = clean
    .replace(/[\u4e00-\u9fa5]/g, ' ')
    .split(/\s+/)
    .filter(Boolean).length;
  return Math.max(1, Math.round(cjk / 400 + words / 220));
}

/** 分类 slug → { slug, label, desc } */
export function categoryOf(slug) {
  return (
    site.categories.find((c) => c.slug === slug) || {
      slug,
      label: slug,
      desc: '',
    }
  );
}

/** 去掉 markdown 标记，用于摘要与搜索索引 */
export function plainText(md = '') {
  return md
    .replace(/```[\s\S]*?```/g, ' ')
    .replace(/!\[[^\]]*\]\([^)]*\)/g, ' ')
    .replace(/\[([^\]]*)\]\([^)]*\)/g, '$1')
    .replace(/\$\$[\s\S]*?\$\$/g, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/[#>*_~`]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

/** 发布时间倒序 */
export function byDateDesc(a, b) {
  return new Date(b.data.date).getTime() - new Date(a.data.date).getTime();
}
