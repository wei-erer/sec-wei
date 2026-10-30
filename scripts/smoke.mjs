/**
 * 交互冒烟测试：用无头 Edge + CDP 真点一遍搜索、目录、灯箱、主题、进度条。
 *
 * 用法：
 *   node scripts/smoke.mjs [baseUrl]
 *
 * 退出码 0 = 全部通过；1 = 有失败项。
 */

import { spawn } from 'node:child_process';
import { existsSync, mkdirSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';

const BASE = process.argv[2] || 'http://127.0.0.1:4321';
const PORT = 9334;
const OUT = resolve('.shots');

const EDGE = [
  'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',
  'C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe',
].find((p) => existsSync(p));

if (!EDGE) {
  console.error('找不到 msedge.exe');
  process.exit(1);
}

mkdirSync(OUT, { recursive: true });

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const child = spawn(
  EDGE,
  [
    '--headless=new',
    '--disable-gpu',
    '--no-first-run',
    '--no-default-browser-check',
    '--disable-extensions',
    '--hide-scrollbars',
    `--user-data-dir=${resolve(process.env.TEMP || '.', 'secwei-smoke-profile')}`,
    `--remote-debugging-port=${PORT}`,
    '--window-size=1440,900',
    'about:blank',
  ],
  { stdio: 'ignore', detached: true }
);

async function getTarget() {
  for (let i = 0; i < 40; i++) {
    try {
      const list = await (await fetch(`http://127.0.0.1:${PORT}/json/list`)).json();
      const page = list.find((t) => t.type === 'page' && t.webSocketDebuggerUrl);
      if (page) return page;
    } catch (e) {
      /* 等 Edge 起来 */
    }
    await sleep(250);
  }
  throw new Error('Edge 调试端口没有就绪');
}

function connect(url) {
  const ws = new WebSocket(url);
  const pending = new Map();
  const listeners = new Map();
  const events = new Map();
  let id = 0;

  ws.addEventListener('message', (ev) => {
    const msg = JSON.parse(ev.data);
    if (msg.id && pending.has(msg.id)) {
      const { res, rej } = pending.get(msg.id);
      pending.delete(msg.id);
      if (msg.error) rej(new Error(msg.error.message));
      else res(msg.result);
    } else if (msg.method) {
      (listeners.get(msg.method) || []).forEach((fn) => fn(msg.params));
      (events.get(msg.method) || []).splice(0).forEach((fn) => fn(msg.params));
    }
  });

  const ready = new Promise((res, rej) => {
    ws.addEventListener('open', res);
    ws.addEventListener('error', rej);
  });

  return {
    ready,
    send: (method, params = {}) =>
      new Promise((res, rej) => {
        const mid = ++id;
        pending.set(mid, { res, rej });
        ws.send(JSON.stringify({ id: mid, method, params }));
      }),
    on: (method, fn) => {
      if (!listeners.has(method)) listeners.set(method, []);
      listeners.get(method).push(fn);
    },
    once: (method) =>
      new Promise((res) => {
        if (!events.has(method)) events.set(method, []);
        events.get(method).push(res);
      }),
    close: () => ws.close(),
  };
}

const results = [];
const errors = [];

function check(name, ok, detail) {
  results.push({ name, ok: !!ok, detail });
  console.log(`${ok ? 'PASS' : 'FAIL'}  ${name}${ok ? '' : '  -> ' + JSON.stringify(detail)}`);
}

function skip(name, reason) {
  results.push({ name, ok: true, skipped: true });
  console.log(`SKIP  ${name}  (${reason})`);
}

(async () => {
  let cdp;
  try {
    const target = await getTarget();
    cdp = connect(target.webSocketDebuggerUrl);
    await cdp.ready;

    await cdp.send('Page.enable');
    await cdp.send('Runtime.enable');
    await cdp.send('Log.enable');
    await cdp.send('Emulation.setDeviceMetricsOverride', {
      width: 1440,
      height: 900,
      deviceScaleFactor: 1,
      mobile: false,
    });

    cdp.on('Runtime.exceptionThrown', (p) => {
      errors.push(p.exceptionDetails?.exception?.description || p.exceptionDetails?.text || 'exception');
    });
    cdp.on('Log.entryAdded', (p) => {
      if (p.entry.level === 'error') errors.push(p.entry.text);
    });

    const evalJS = async (expression) => {
      const r = await cdp.send('Runtime.evaluate', {
        expression,
        awaitPromise: true,
        returnByValue: true,
      });
      if (r.exceptionDetails) {
        throw new Error(r.exceptionDetails.exception?.description || r.exceptionDetails.text);
      }
      return r.result.value;
    };

    const shot = async (name) => {
      const s = await cdp.send('Page.captureScreenshot', { format: 'png' });
      writeFileSync(resolve(OUT, name), Buffer.from(s.data, 'base64'));
    };

    const goto = async (url) => {
      const loaded = cdp.once('Page.loadEventFired');
      await cdp.send('Page.navigate', { url });
      await loaded;
      await sleep(500);
    };

    // ── 首页 ───────────────────────────────────────────────
    await goto(`${BASE}/`);
    await sleep(3200);

    const cmds = await evalJS(
      `[...document.querySelectorAll('.term-step .cmd')].map((e) => e.textContent)`
    );
    check('Hero 打字机', Array.isArray(cmds) && cmds.length >= 2 && cmds.every((t) => t.length > 0), cmds);

    const kv = await evalJS(
      `[...document.querySelectorAll('.term-kv dd')].map((e) => e.textContent.trim())`
    );
    check('终端自动字段', Array.isArray(kv) && kv.length >= 6, kv);

    const hasPosts = await evalJS(`document.querySelectorAll('.post-row').length > 0`);

    // ── 搜索 ───────────────────────────────────────────────
    await evalJS(`document.getElementById('search-open').click()`);
    await sleep(800);
    check('搜索浮层打开', await evalJS(`document.getElementById('search-overlay').classList.contains('open')`));

    await evalJS(
      `(() => { const i = document.getElementById('search-input'); i.value = '${hasPosts ? 'WAF' : 'zzz'}'; i.dispatchEvent(new Event('input', { bubbles: true })); })()`
    );
    await sleep(350);

    if (hasPosts) {
      const hits = await evalJS(
        `[...document.querySelectorAll('.search-item')].map((a) => ({ t: a.querySelector('.st').textContent, h: a.getAttribute('href') }))`
      );
      check('搜索命中', Array.isArray(hits) && hits.length > 0, hits?.slice(0, 3));
    } else {
      check('搜索空状态', await evalJS(`!!document.querySelector('.search-empty')`));
    }
    await shot('ui-search.png');

    await evalJS(`document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }))`);
    await sleep(250);
    check(
      'ESC 关闭搜索',
      !(await evalJS(`document.getElementById('search-overlay').classList.contains('open')`))
    );

    // ── 主题切换（在首页测，不依赖文章）────────────────────
    await evalJS(`document.getElementById('theme-toggle').click()`);
    await sleep(400);
    const theme = await evalJS(`document.documentElement.dataset.theme`);
    const saved = await evalJS(`localStorage.getItem('theme')`);
    check('切换到浅色并记住', theme === 'light' && saved === 'light', { theme, saved });
    await shot('ui-light.png');

    await evalJS(`document.getElementById('theme-toggle').click()`);
    await sleep(250);

    // ── 文章页（有文章才测）────────────────────────────────
    const firstHref = await evalJS(
      `document.querySelector('.post-row')?.getAttribute('href') || ''`
    );

    if (!firstHref) {
      skip('文章页相关', '当前没有文章，跳过目录/复制/灯箱/进度条');
    } else {
      await goto(firstHref.startsWith('http') ? firstHref : BASE + firstHref);
      await sleep(400);

      const toc = await evalJS(`document.querySelectorAll('.toc a').length`);
      const active = await evalJS(`document.querySelectorAll('.toc a.active').length`);
      check('目录生成 + 高亮', toc >= 3 && active === 1, { toc, active });

      const copyBtns = await evalJS(`document.querySelectorAll('.prose pre .copy-btn').length`);
      const codeBlocks = await evalJS(`document.querySelectorAll('.prose pre').length`);
      check('代码复制按钮', copyBtns === codeBlocks && codeBlocks > 0, { copyBtns, codeBlocks });

      const hasImg = await evalJS(`!!document.querySelector('.prose img')`);
      if (hasImg) {
        await evalJS(`document.querySelector('.prose img').click()`);
        await sleep(300);
        const lbOpen = await evalJS(`document.getElementById('lightbox').classList.contains('open')`);
        const lbSrc = await evalJS(`document.querySelector('#lightbox img').getAttribute('src')`);
        check('图片灯箱打开', lbOpen && !!lbSrc, { lbOpen, lbSrc });
        await shot('ui-lightbox.png');
        await evalJS(`document.getElementById('lightbox').click()`);
        await sleep(200);
        check(
          '灯箱关闭',
          !(await evalJS(`document.getElementById('lightbox').classList.contains('open')`))
        );
      } else {
        skip('图片灯箱', '这篇文章没有配图');
      }

      await evalJS(`window.scrollTo(0, 1400)`);
      await sleep(400);
      const width = await evalJS(`document.getElementById('progress').style.width`);
      check('阅读进度条', parseFloat(width) > 0, width);
    }

    // ── 控制台报错 ─────────────────────────────────────────
    const realErrors = errors.filter((e) => !/favicon|404 \(Not Found\)/i.test(e));
    check('无 JS 控制台报错', realErrors.length === 0, realErrors.slice(0, 5));

    cdp.close();
  } catch (err) {
    check('测试流程', false, err.message);
    process.exitCode = 1;
  } finally {
    const failed = results.filter((r) => !r.ok);
    console.log(`\n${results.length - failed.length}/${results.length} 通过`);
    if (failed.length) process.exitCode = 1;
    try {
      process.kill(child.pid);
    } catch (e) {
      /* ignore */
    }
  }
})();
