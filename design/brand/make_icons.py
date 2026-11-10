"""Golden app icons, splash screens and web icons from one claw PNG.
Usage: python3 make_icons.py <claw.png> <repo-root> [<repo-root> ...]
"""
import glob, os, sys
from PIL import Image, ImageDraw
src = Image.open(sys.argv[1]).convert("RGBA")
INK = (255, 255, 255, 255)  # white behind the black claw

def claw(size, frac=1.0):
    s = max(1, round(size * frac))
    return src.resize((s, s), Image.LANCZOS)

def on(size, bg, frac, round_mask=False):
    im = Image.new("RGBA", (size, size), bg)
    c = claw(size, frac)
    im.alpha_composite(c, ((size - c.width) // 2, (size - c.height) // 2))
    if round_mask:
        m = Image.new("L", (size, size), 0)
        ImageDraw.Draw(m).ellipse((0, 0, size - 1, size - 1), fill=255)
        im.putalpha(m)
    return im

for repo in sys.argv[2:]:
    pub = f"{repo}/public/brand"; os.makedirs(pub, exist_ok=True)
    claw(512).save(f"{pub}/claw.png", optimize=True)          # loader mask + watermark
    claw(512).save(f"{pub}/claw.webp", quality=90)
    on(512, INK, 0.78).convert("RGB").save(f"{pub}/claw-icon-512.png", optimize=True)  # PWA / share
    on(192, INK, 0.78).convert("RGB").save(f"{pub}/claw-icon-192.png", optimize=True)
    # Browser tab: Next's file conventions in src/app (icon.png, apple-icon.png, favicon.ico)
    claw(512, 0.98).save(f"{repo}/src/app/icon.png", optimize=True)
    on(180, INK, 0.78).convert("RGB").save(f"{repo}/src/app/apple-icon.png", optimize=True)
    fav = Image.new("RGBA", (256, 256), (0, 0, 0, 0)); fav.alpha_composite(claw(256, 1.0))
    fav.save(f"{repo}/src/app/favicon.ico", sizes=[(16, 16), (32, 32), (48, 48), (64, 64)])
    # Android launcher icons
    res = f"{repo}/android/app/src/main/res"
    if os.path.isdir(res):
        for p in glob.glob(f"{res}/mipmap-*/ic_launcher.png"):
            n = Image.open(p).width; on(n, INK, 0.74).convert("RGB").save(p, optimize=True)
        for p in glob.glob(f"{res}/mipmap-*/ic_launcher_round.png"):
            n = Image.open(p).width; on(n, INK, 0.70, round_mask=True).save(p, optimize=True)
        for p in glob.glob(f"{res}/mipmap-*/ic_launcher_foreground.png"):
            # adaptive icon: 108dp canvas, keep the claw inside the 66dp safe circle
            n = Image.open(p).width; on(n, (0, 0, 0, 0), 0.52).save(p, optimize=True)
        with open(f"{res}/values/ic_launcher_background.xml", "w") as f:
            f.write('<?xml version="1.0" encoding="utf-8"?>\n<resources>\n    <color name="ic_launcher_background">#FFFFFF</color>\n</resources>\n')
        # Splash: the claw centred on the white page
        for p in glob.glob(f"{res}/drawable*/splash.png"):
            im = Image.open(p); w, h = im.size
            sp = Image.new("RGBA", (w, h), (255, 255, 255, 255)); c = claw(min(w, h), 0.34)
            sp.alpha_composite(c, ((w - c.width) // 2, (h - c.height) // 2)); sp.convert("RGB").save(p, optimize=True)
    ios = f"{repo}/ios/App/App/Assets.xcassets"
    if os.path.isdir(ios):
        on(1024, INK, 0.74).convert("RGB").save(f"{ios}/AppIcon.appiconset/AppIcon-512@2x.png", optimize=True)
        for p in glob.glob(f"{ios}/Splash.imageset/*.png"):
            im = Image.open(p); w, h = im.size
            sp = Image.new("RGBA", (w, h), (255, 255, 255, 255)); c = claw(min(w, h), 0.22)
            sp.alpha_composite(c, ((w - c.width) // 2, (h - c.height) // 2)); sp.convert("RGB").save(p, optimize=True)
    print("done", repo)
