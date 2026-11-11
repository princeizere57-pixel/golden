# Golden claw: brand sources

Everything needed to rebuild Golden's icons without any outside tool or service.

| File | What it is |
|---|---|
| `claw-gold-original.png` | The original gold claw artwork (1254 px, white background) |
| `claw-gold-transparent.png` | The gold claw cut out, square, transparent (1058 px) |
| `claw-black-transparent.png` | The black claw used everywhere now, transparent (1058 px) |
| `golden-app-icon.jpg`, `golden-app-icon.pdf` | The app icon (black claw on white, 1024 px) for stores, decks and print |
| `make_icons.py` | Writes the app icons, splash screens and web icons from a claw PNG |
| `make_favicon.py` | Writes `favicon.ico` (16–64 px, bolder at small sizes) and `src/app/icon.png` |

## Where the claw is used

- Browser tab: `src/app/favicon.ico`, `src/app/icon.png`; home screen: `src/app/apple-icon.png`, `public/brand/claw-icon-*.png` (web manifest in `src/app/manifest.ts`).
- Loader (`src/components/claw-loader.tsx`, `.claw-*` in `src/app/globals.css`): `public/brand/claw.png` with a gold light sweeping down it; also `mobile/www/claw.png` on the offline page.
- Android: `android/app/src/main/res/mipmap-*/ic_launcher*.png`, `drawable*/splash.png`, background colour in `values/ic_launcher_background.xml` (white).
- iPhone: `ios/App/App/Assets.xcassets/AppIcon.appiconset`, `Splash.imageset`.

## Rebuild the icons (Python 3 + Pillow: `pip install pillow`)

From the repository root:

```sh
python3 design/brand/make_icons.py design/brand/claw-black-transparent.png .
python3 design/brand/make_favicon.py design/brand/claw-black-transparent.png .
cp public/brand/claw.png mobile/www/claw.png
npx cap sync
```

`make_icons.py` puts the claw on white (`INK` at the top of the script is the background colour).
To change the shine colour, edit the gradient in `.claw-mark::after` in `src/app/globals.css`
and in `mobile/www/index.html`.
