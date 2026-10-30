/* ═══════════════════════════════════════════════════════════════
   sec(wei) — 全局交互
   ═══════════════════════════════════════════════════════════════ */

const root = document.documentElement;

/* ── 主题切换 ────────────────────────────────────────────────── */
const themeBtn = document.getElementById('theme-toggle');

function applyTheme(theme) {
  root.dataset.theme = theme;
  try {
    localStorage.setItem('theme', theme);
  } catch (e) {
    /* 忽略隐私模式下的写入失败 */
  }
  document.dispatchEvent(new CustomEvent('themechange', { detail: theme }));
}

themeBtn?.addEventListener('click', () => {
  applyTheme(root.dataset.theme === 'light' ? 'dark' : 'light');
});

/* ── 阅读进度条 ──────────────────────────────────────────────── */
const bar = document.getElementById('progress');

if (bar) {
  let ticking = 0;

  const update = () => {
    ticking = 0;
    const max = root.scrollHeight - root.clientHeight;
    const pct = max > 0 ? Math.min(100, (root.scrollTop / max) * 100) : 0;
    bar.style.width = `${pct.toFixed(2)}%`;
  };

  const onScroll = () => {
    if (!ticking) ticking = requestAnimationFrame(update);
  };

  window.addEventListener('scroll', onScroll, { passive: true });
  window.addEventListener('resize', onScroll);
  update();
}

/* ── 滚动淡入 ────────────────────────────────────────────────── */
const reveals = [...document.querySelectorAll('.reveal')];

if (reveals.length) {
  if (!('IntersectionObserver' in window)) {
    reveals.forEach((el) => el.classList.add('in'));
  } else {
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('in');
            io.unobserve(entry.target);
          }
        });
      },
      { rootMargin: '0px 0px -6% 0px', threshold: 0.04 }
    );
    reveals.forEach((el) => io.observe(el));
  }
}

/* ── 代码块：复制按钮 ────────────────────────────────────────── */
document.querySelectorAll('.prose pre, .codeblock').forEach((pre) => {
  if (pre.dataset.enhanced) return;
  pre.dataset.enhanced = '1';

  const btn = document.createElement('button');
  btn.type = 'button';
  btn.className = 'copy-btn';
  btn.textContent = 'copy';
  btn.setAttribute('aria-label', '复制代码');

  btn.addEventListener('click', async () => {
    const code = pre.querySelector('code') || pre;
    const text = code.innerText.replace(/\n+$/, '');
    try {
      await navigator.clipboard.writeText(text);
      btn.textContent = 'copied';
      btn.classList.add('copied');
    } catch (e) {
      btn.textContent = 'failed';
    }
    setTimeout(() => {
      btn.textContent = 'copy';
      btn.classList.remove('copied');
    }, 1600);
  });

  pre.appendChild(btn);
});

/* ── 图片灯箱 ────────────────────────────────────────────────── */
const lightbox = document.getElementById('lightbox');

if (lightbox) {
  const lbImg = lightbox.querySelector('img');
  const closeBox = () => {
    lightbox.classList.remove('open');
    document.body.style.overflow = '';
  };

  document.querySelectorAll('.prose img').forEach((img) => {
    img.addEventListener('click', () => {
      lbImg.src = img.currentSrc || img.src;
      lbImg.alt = img.alt || '';
      lightbox.classList.add('open');
      document.body.style.overflow = 'hidden';
    });
  });

  lightbox.addEventListener('click', closeBox);
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && lightbox.classList.contains('open')) closeBox();
  });
}

/* ── 目录高亮 ────────────────────────────────────────────────── */
const tocLinks = [...document.querySelectorAll('[data-toc-link]')];

if (tocLinks.length) {
  const linkById = new Map();
  tocLinks.forEach((a) => {
    const href = a.getAttribute('href') || '';
    linkById.set(href.replace(/^#/, ''), a);
  });

  const heads = [...document.querySelectorAll('.prose h2[id], .prose h3[id]')];
  let tocTick = 0;

  const syncToc = () => {
    tocTick = 0;
    let current = null;
    for (const h of heads) {
      if (h.getBoundingClientRect().top <= 120) current = h;
      else break;
    }
    if (!current && heads.length) current = heads[0];
    tocLinks.forEach((a) => a.classList.remove('active'));
    if (current) linkById.get(current.id)?.classList.add('active');
  };

  window.addEventListener(
    'scroll',
    () => {
      if (!tocTick) tocTick = requestAnimationFrame(syncToc);
    },
    { passive: true }
  );
  syncToc();
}

/* ── giscus 跟随主题 ─────────────────────────────────────────── */
document.addEventListener('themechange', (e) => {
  const frame = document.querySelector('iframe.giscus-frame');
  if (!frame || !frame.contentWindow) return;
  frame.contentWindow.postMessage(
    { giscus: { setConfig: { theme: e.detail === 'light' ? 'light' : 'transparent_dark' } } },
    'https://giscus.app'
  );
});

/* ── 正文外链新窗口打开 ──────────────────────────────────────── */
document.querySelectorAll('.prose a[href^="http"]').forEach((a) => {
  try {
    if (new URL(a.href).origin !== window.location.origin) {
      a.target = '_blank';
      a.rel = 'noopener noreferrer';
    }
  } catch (e) {
    /* 忽略非法 URL */
  }
});
