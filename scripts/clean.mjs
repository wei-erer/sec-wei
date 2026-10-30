/**
 * 清理缓存和构建产物。
 *
 * Astro 5 会把内容索引（含已删除文章的旧条目）缓存在 node_modules/.astro/ 里，
 * 删文章/改文件名后如果页面数字没变，跑一次 npm run clean 再构建即可。
 */

import { rmSync } from 'node:fs';
import { resolve } from 'node:path';

const targets = ['.astro', 'dist', 'node_modules/.astro'];

for (const t of targets) {
  const p = resolve(t);
  try {
    rmSync(p, { recursive: true, force: true });
    console.log(`cleaned ${t}`);
  } catch (e) {
    console.log(`skip ${t} (${e.message})`);
  }
}
