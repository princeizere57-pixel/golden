"""Golden splash screens: the black claw with a still gold shine across it, centred on white.
Usage: python3 make_splash.py <repo-root> [<repo-root> ...]
Writes design/brand/claw-gold-shine.png, android/.../drawable*/splash.png and the iOS Splash images.
"""
import glob, math, os, sys
from PIL import Image, ImageChops

def gold_claw(size=1024):
    here = os.path.dirname(os.path.abspath(__file__))
    claw = Image.open(os.path.join(here, "claw-black-transparent.png")).convert("RGBA").resize((size, size), Image.LANCZOS)
    band = Image.new("RGBA", (size, size), (0, 0, 0, 0)); px = band.load()
    for y in range(size):
        for x in range(size):
            d = (x + y) / (2 * size) - 0.5          # diagonal distance from the middle of the claw
            a = math.exp(-(d / 0.08) ** 2)
            if a > 0.02:
                px[x, y] = (255, 240, 170, int(250 * a)) if abs(d) < 0.025 else (245, 197, 24, int(235 * a))
    band.putalpha(ImageChops.multiply(band.split()[3], claw.split()[3]))
    out = Image.new("RGBA", (size, size), (0, 0, 0, 0)); out.alpha_composite(claw); out.alpha_composite(band)
    return out

def splash(path, mark, frac):
    w, h = Image.open(path).size
    sp = Image.new("RGBA", (w, h), (255, 255, 255, 255)); c = mark.resize((round(min(w, h) * frac),) * 2, Image.LANCZOS)
    sp.alpha_composite(c, ((w - c.width) // 2, (h - c.height) // 2)); sp.convert("RGB").save(path, optimize=True)

mark = gold_claw()
for repo in sys.argv[1:]:
    mark.save(os.path.join(repo, "design/brand/claw-gold-shine.png"), optimize=True)
    for p in glob.glob(os.path.join(repo, "android/app/src/main/res/drawable*/splash.png")): splash(p, mark, 0.34)
    for p in glob.glob(os.path.join(repo, "ios/App/App/Assets.xcassets/Splash.imageset/*.png")): splash(p, mark, 0.22)
    print("done", repo)
