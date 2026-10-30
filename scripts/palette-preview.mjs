/**
 * 配色预览：在同一个页面上切换 CSS 变量，快速截几版首屏做对比。
 *
 * 用法：node scripts/palette-preview.mjs
 * 输出：.shots/p-<name>.png
 *
 * 说明：数据雨的颜色是启动时读取的，切变量不会跟着变，
 * 所以预览时会先把 canvas 藏起来，只对比文字/边框/辉光。
 */

import { spawn } from 'node:child_process';
import { existsSync, mkdirSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';

const URL = process.argv[2] || 'http://127.0.0.1:4321/';
const PORT = 9335;
const OUT = resolve('.shots');

const EDGE = [
  'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',
  'C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe',
].find((p) => existsSync(p));

if (!EDGE) {
  console.error('找不到 msedge.exe');
  process.exit(1);
}

const PALETTES = {
  cyan: {
    bg: '#05090c',
    'bg-soft': '#071216',
    'bg-elev': '#091a20',
    line: '#14363f',
    'line-soft': '#0b232a',
    ink: '#d3eef5',
    'ink-strong': '#eefbff',
    accent: '#22e0ff',
    'accent-soft': '#8ceeff',
    'accent-dim': '#146f84',
    dim: '#7ba6b3',
    'dim-2': '#476874',
    'glow-rgb': '34, 224, 255',
    cyan: '#6ff0c8',
  },
  magenta: {
    bg: '#0a0509',
    'bg-soft': '#120710',
    'bg-elev': '#190a15',
    line: '#3d1230',
    'line-soft': '#260b1d',
    ink: '#f7dcea',
    'ink-strong': '#fff2f9',
    accent: '#ff3d9a',
    'accent-soft': '#ff9ccb',
    'accent-dim': '#8d1f52',
    dim: '#b4899c',
    'dim-2': '#6d4756',
    'glow-rgb': '255, 61, 154',
    cyan: '#35e0e0',
  },
  green: {
    bg: '#040705',
    'bg-soft': '#070d09',
    'bg-elev': '#0a120d',
    line: '#14331f',
    'line-soft': '#0c2116',
    ink: '#c8f2d5',
    'ink-strong': '#f1fff6',
    accent: '#00ff41',
    'accent-soft': '#5dff94',
    'accent-dim': '#2a8a4a',
    dim: '#61917a',
    'dim-2': '#3d6950',
    'glow-rgb': '0, 255, 65',
    cyan: '#38e8c8',
  },
  purple: {
    bg: '#07050b',
    'bg-soft': '#0b0813',
    'bg-elev': '#100b1a',
    line: '#2a1c45',
    'line-soft': '#1a1130',
    ink: '#e6dcff',
    'ink-strong': '#f8f3ff',
    accent: '#b388ff',
    'accent-soft': '#d9c6ff',
    'accent-dim': '#5f4396',
    dim: '#9b8ab5',
    'dim-2': '#584a75',
    'glow-rgb': '179, 136, 255',
    cyan: '#6fd7ff',
  },
};

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
mkdirSync(OUT, { recursive: true });

const child = spawn(
  EDGE,
  [
    '--headless=new',
    '--disable-gpu',
    '--no-first-run',
    '--no-default-browser-check',
    '--disable-extensions',
    '--hide-scrollbars',
    `--user-data-dir=${resolve(process.env.TEMP || '.', 'secwei-palette-profile')}`,
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
      /* 等 */
    }
    await sleep(250);
  }
  throw new Error('Edge 调试端口没有就绪');
}

function connect(url) {
  const ws = new WebSocket(url);
  const pending = new Map();
  const events = new Map();
  let id = 0;

  ws.addEventListener('message', (ev) => {
    const msg = JSON.parse(ev.data);
    if (msg.id && pending.has(msg.id)) {
      const { res, rej } = pending.get(msg.id);
      pending.delete(msg.id);
      if (msg.error) rej(new Error(msg.error.message));
      else res(msg.result);
    } else if (msg.method && events.has(msg.method)) {
      events.get(msg.method).splice(0).forEach((fn) => fn(msg.params));
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
    once: (method) =>
      new Promise((res) => {
        if (!events.has(method)) events.set(method, []);
        events.get(method).push(res);
      }),
    close: () => ws.close(),
  };
}

(async () => {
  try {
    const target = await getTarget();
    const cdp = connect(target.webSocketDebuggerUrl);
    await cdp.ready;

    await cdp.send('Page.enable');
    await cdp.send('Runtime.enable');
    await cdp.send('Emulation.setDeviceMetricsOverride', {
      width: 1440,
      height: 620,
      deviceScaleFactor: 1,
      mobile: false,
    });

    const loaded = cdp.once('Page.loadEventFired');
    await cdp.send('Page.navigate', { url: URL });
    await loaded;
    await sleep(3200); // 等打字机跑完

    // 数据雨的颜色在初始化时读取，切变量不会重算，先藏起来
    await cdp.send('Runtime.evaluate', {
      expression: `document.querySelector('.hero-rain')?.style.setProperty('display','none')`,
    });

    for (const [name, vars] of Object.entries(PALETTES)) {
      const payload = JSON.stringify(JSON.stringify(vars));
      const expr = `(() => {
        const vars = JSON.parse(${payload});
        const s = document.documentElement.style;
        Object.entries(vars).forEach(([k, v]) => s.setProperty('--' + k, v));
        return 'ok';
      })()`;
      await cdp.send('Runtime.evaluate', { expression: expr, returnByValue: true });
      await sleep(450);

      const shot = await cdp.send('Page.captureScreenshot', { format: 'png' });
      writeFileSync(resolve(OUT, `p-${name}.png`), Buffer.from(shot.data, 'base64'));
      console.log(`wrote .shots/p-${name}.png`);
    }

    cdp.close();
  } catch (err) {
    console.error('预览失败:', err.message);
    process.exitCode = 1;
  } finally {
    try {
      process.kill(child.pid);
    } catch (e) {
      /* ignore */
    }
  }
})();
