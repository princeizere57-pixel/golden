"""Golden favicon.ico and src/app/icon.png: black claw on a white rounded tile.
Usage: python3 make_favicon.py <claw.png> <repo-root> [<repo-root> ...]
"""
import sys
from PIL import Image, ImageDraw, ImageFilter
src = Image.open(sys.argv[1]).convert("RGBA")

def tile(size, grow=0):
    """Black claw on a white rounded tile (readable on light and dark browser tabs)."""
    a = src.resize((size, size), Image.LANCZOS).split()[3]
    if grow >= 3:
        a = src.resize((256, 256), Image.LANCZOS).split()[3].filter(ImageFilter.MaxFilter(grow)).resize((size, size), Image.LANCZOS)
    out = Image.new("RGBA", (size, size), (0, 0, 0, 0))
    m = Image.new("L", (size, size), 0)
    ImageDraw.Draw(m).rounded_rectangle((0, 0, size - 1, size - 1), radius=max(2, size // 5), fill=255)
    white = Image.new("RGBA", (size, size), (255, 255, 255, 255)); white.putalpha(m)
    out.alpha_composite(white)
    inner = int(size * 0.86)
    claw = Image.new("RGBA", (size, size), (0, 0, 0, 255)); claw.putalpha(a)
    claw = claw.resize((inner, inner), Image.LANCZOS)
    out.alpha_composite(claw, ((size - inner) // 2, (size - inner) // 2))
    return out

for repo in sys.argv[2:]:
    sizes = [(16, 9), (32, 7), (48, 5), (64, 3)]
    imgs = [tile(s, g) for s, g in sizes]
    imgs[-1].save(f"{repo}/src/app/favicon.ico", sizes=[(s, s) for s, _ in sizes], append_images=imgs[:-1])
    tile(512).save(f"{repo}/src/app/icon.png", optimize=True)
print("ok")
