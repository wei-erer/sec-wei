/**
 * 用无头 Edge + CDP 截图（支持真正的移动端视口和整页截图）。
 *
 * 用法：
 *   node scripts/shot.mjs <url> <输出文件> [宽度=1440] [高度=900] [full]
 *
 * 说明：
 *   - 通过 --remote-debugging-port 启动 Edge，再用 CDP 覆盖设备指标，
 *     这样才不受 Windows 上窗口最小宽度（约 500px）的影响。
 *   - 只依赖 Node 内置的 fetch / WebSocket（Node 22+）。
 */

import { spawn } from 'node:child_process';
import { existsSync, mkdirSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';

const [, , url, out, w = '1440', h = '900', mode = ''] = process.argv;

if (!url || !out) {
  console.error('usage: node scripts/shot.mjs <url> <out.png> [width] [height] [full|motion, 可组合]');
  process.exit(1);
}

const width = Number(w);
const height = Number(h);
const fullPage = mode.includes('full');
// motion：保留动画（不加 --force-prefers-reduced-motion），用于看数据雨/光扫效果
const motion = mode.includes('motion');
const isMobile = width < 700;
const PORT = 9333;

const EDGE_CANDIDATES = [
  'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',
  'C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe',
];

const edge = EDGE_CANDIDATES.find((p) => existsSync(p));
if (!edge) {
  console.error('找不到 msedge.exe');
  process.exit(1);
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const profile = resolve(process.env.TEMP || '.', 'secwei-cdp-profile');

const child = spawn(
  edge,
  [
    '--headless=new',
    '--disable-gpu',
    '--no-first-run',
    '--no-default-browser-check',
    '--disable-extensions',
    '--hide-scrollbars',
    ...(motion ? [] : ['--force-prefers-reduced-motion']),
    `--user-data-dir=${profile}`,
    `--remote-debugging-port=${PORT}`,
    '--window-size=1440,900',
    'about:blank',
  ],
  { stdio: 'ignore', detached: true }
);

async function getTarget() {
  for (let i = 0; i < 40; i++) {
    try {
      const res = await fetch(`http://127.0.0.1:${PORT}/json/list`);
      const list = await res.json();
      const page = list.find((t) => t.type === 'page' && t.webSocketDebuggerUrl);
      if (page) return page;
    } catch (e) {
      /* 还没起来 */
    }
    await sleep(250);
  }
  throw new Error('Edge 调试端口没有就绪');
}

function connect(wsUrl) {
  const ws = new WebSocket(wsUrl);
  const pending = new Map();
  const events = new Map();
  let id = 0;

  ws.addEventListener('message', (ev) => {
    const msg = JSON.parse(ev.data);
    if (msg.id && pending.has(msg.id)) {
      const { resolve: res, reject } = pending.get(msg.id);
      pending.delete(msg.id);
      if (msg.error) reject(new Error(msg.error.message));
      else res(msg.result);
    } else if (msg.method && events.has(msg.method)) {
      events.get(msg.method).forEach((fn) => fn(msg.params));
      events.delete(msg.method);
    }
  });

  const ready = new Promise((res, rej) => {
    ws.addEventListener('open', res);
    ws.addEventListener('error', rej);
  });

  const send = (method, params = {}) =>
    new Promise((res, rej) => {
      const mid = ++id;
      pending.set(mid, { resolve: res, reject: rej });
      ws.send(JSON.stringify({ id: mid, method, params }));
    });

  const once = (method) =>
    new Promise((res) => {
      if (!events.has(method)) events.set(method, []);
      events.get(method).push(res);
    });

  return { ready, send, once, close: () => ws.close() };
}

(async () => {
  try {
    const target = await getTarget();
    const cdp = connect(target.webSocketDebuggerUrl);
    await cdp.ready;

    await cdp.send('Page.enable');
    await cdp.send('Runtime.enable');
    await cdp.send('Emulation.setDeviceMetricsOverride', {
      width,
      height,
      deviceScaleFactor: isMobile ? 2 : 1,
      mobile: isMobile,
    });

    const loaded = cdp.once('Page.loadEventFired');
    await cdp.send('Page.navigate', { url });
    await loaded;
    await sleep(motion ? 2800 : 700);

    let clip;
    if (fullPage) {
      const metrics = await cdp.send('Page.getLayoutMetrics');
      const size = metrics.cssContentSize || metrics.contentSize;
      clip = { x: 0, y: 0, width, height: Math.min(size.height, 6000), scale: 1 };
    }

    const shot = await cdp.send('Page.captureScreenshot', {
      format: 'png',
      captureBeyondViewport: fullPage,
      ...(clip ? { clip } : {}),
    });

    mkdirSync(dirname(resolve(out)), { recursive: true });
    writeFileSync(resolve(out), Buffer.from(shot.data, 'base64'));
    console.log(`wrote ${out} (${width}x${clip ? clip.height : height})`);

    cdp.close();
  } catch (err) {
    console.error('截图失败:', err.message);
    process.exitCode = 1;
  } finally {
    try {
      process.kill(child.pid);
    } catch (e) {
      /* ignore */
    }
  }
})();
