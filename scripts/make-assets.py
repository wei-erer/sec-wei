"""生成占位图素材：og-default.png / images/xss-flow.png / images/ida-flow.png

用法：python scripts/make-assets.py
只依赖 Pillow，不需要联网。改了配色想重新生成，直接再跑一次。
"""

from pathlib import Path

from PIL import Image, ImageDraw, ImageFilter, ImageFont

ROOT = Path(__file__).resolve().parent.parent
PUB = ROOT / "public"
IMG = PUB / "images"

BG = (4, 7, 5, 255)
AMBER = (0, 255, 65)
AMBER_SOFT = (93, 255, 148)
INK = (241, 255, 246)
DIM = (97, 145, 122)
DIM2 = (61, 105, 80)
LINE = (20, 51, 31)

FONT_DIR = Path("C:/Windows/Fonts")
MONO = FONT_DIR / "consola.ttf"
MONO_BOLD = FONT_DIR / "consolab.ttf"
CJK = FONT_DIR / "msyh.ttc"


def font(path, size, index=0):
    try:
        return ImageFont.truetype(str(path), size, index=index)
    except Exception:
        return ImageFont.load_default()


def scanlines(img, alpha=9, step=3):
    layer = Image.new("RGBA", img.size, (0, 0, 0, 0))
    d = ImageDraw.Draw(layer)
    for y in range(0, img.height, step):
        d.line([(0, y), (img.width, y)], fill=(0, 255, 65, alpha))
    img.alpha_composite(layer)


def grid(img, step=48, alpha=10):
    layer = Image.new("RGBA", img.size, (0, 0, 0, 0))
    d = ImageDraw.Draw(layer)
    for x in range(0, img.width, step):
        d.line([(x, 0), (x, img.height)], fill=(0, 255, 65, alpha))
    for y in range(0, img.height, step):
        d.line([(0, y), (img.width, y)], fill=(0, 255, 65, alpha))
    img.alpha_composite(layer)


def glow(img, draw_fn, blur=22, strength=2):
    layer = Image.new("RGBA", img.size, (0, 0, 0, 0))
    draw_fn(ImageDraw.Draw(layer))
    blurred = layer.filter(ImageFilter.GaussianBlur(blur))
    for _ in range(strength):
        img.alpha_composite(blurred)
    img.alpha_composite(layer)


def make_og():
    W, H = 1200, 630
    img = Image.new("RGBA", (W, H), BG)
    grid(img, 60, 8)

    f_mark = font(MONO_BOLD, 132)
    f_sub = font(CJK, 34)
    f_mono = font(MONO, 22)
    f_small = font(MONO, 17)

    x = 80

    d = ImageDraw.Draw(img)
    d.text((x, 74), "$ whoami", font=f_mono, fill=DIM)

    glow(
        img,
        lambda dd: dd.text((x - 2, 118), "sec(wei)", font=f_mark, fill=AMBER + (255,)),
        blur=26,
        strength=2,
    )
    d.text((x, 118), "sec(wei)", font=f_mark, fill=AMBER)
    d.rectangle([x, 282, x + 132, 286], fill=AMBER)

    d.text((x, 320), "Web 安全学习笔记", font=f_sub, fill=INK)
    d.text((x, 372), "记录每一次踩坑，也记录想明白的那一瞬间。", font=font(CJK, 26), fill=DIM)

    d.text((x, 520), "[ OK ]", font=f_mono, fill=AMBER)
    d.text((x + 88, 520), "blog.ready · web / intranet / reverse / crypto", font=f_mono, fill=DIM2)
    d.text((x, 556), "built with astro · hosted on github pages", font=f_small, fill=DIM2)

    scanlines(img)
    img.convert("RGB").save(PUB / "og-default.png", optimize=True)
    print("wrote public/og-default.png")


def box(d, xy, text, f, color=AMBER, fill=(9, 18, 12)):
    x0, y0, x1, y1 = xy
    d.rounded_rectangle(xy, radius=8, fill=fill, outline=LINE, width=1)
    w = d.textlength(text, font=f)
    d.text((x0 + (x1 - x0 - w) / 2, y0 + (y1 - y0) / 2 - 13), text, font=f, fill=color)


def arrow(d, x0, y0, x1, y1, color=DIM):
    d.line([(x0, y0), (x1, y1)], fill=color, width=2)
    if x1 > x0:
        d.polygon([(x1, y1), (x1 - 11, y1 - 6), (x1 - 11, y1 + 6)], fill=color)
    else:
        d.polygon([(x1, y1), (x1 + 11, y1 - 6), (x1 + 11, y1 + 6)], fill=color)


def make_flow(name, title, steps, note):
    W, H = 900, 360
    img = Image.new("RGBA", (W, H), (12, 9, 6, 255))
    grid(img, 36, 6)
    d = ImageDraw.Draw(img)
    f_title = font(MONO, 19)
    f_box = font(MONO, 22)
    f_note = font(CJK, 19)

    d.text((32, 24), title, font=f_title, fill=DIM)
    d.line([(32, 56), (W - 32, 56)], fill=LINE, width=1)

    n = len(steps)
    bw, bh = 168, 64
    gap = (W - 64 - n * bw) / (n - 1) if n > 1 else 0
    y0 = 112

    for i, s in enumerate(steps):
        x0 = 32 + i * (bw + gap)
        box(d, (x0, y0, x0 + bw, y0 + bh), s, f_box, color=AMBER_SOFT if i < n - 1 else AMBER)
        if i < n - 1:
            arrow(d, x0 + bw + 6, y0 + bh / 2, x0 + bw + gap - 8, y0 + bh / 2)

    d.text((32, 244), note, font=f_note, fill=DIM)
    d.text((32, 292), f"{n} steps · static view", font=font(MONO, 15), fill=DIM2)

    scanlines(img)
    img.convert("RGB").save(IMG / name, optimize=True)
    print(f"wrote public/images/{name}")


def main():
    PUB.mkdir(exist_ok=True)
    IMG.mkdir(parents=True, exist_ok=True)

    make_og()

    # 下面两张是示例文章的配图，文章删掉后就不需要了。
    # 想再生成一份示意图作参考，把注释去掉即可。
    # make_flow(
    #     "xss-flow.png",
    #     "// request -> context -> sink",
    #     ["USER INPUT", "FILTER / WAF", "HTML CONTEXT", "BROWSER SINK"],
    #     "WAF 只看字符串，浏览器看语义——差距就是绕过空间。",
    # )
    # make_flow(
    #     "ida-flow.png",
    #     "// static analysis order",
    #     ["STRINGS", "XREFS  (X)", "FUNCTION", "PSEUDOCODE  (F5)"],
    #     "先找字符串，再顺引用，最后才看伪代码。",
    # )


if __name__ == "__main__":
    main()
