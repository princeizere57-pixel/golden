// Turns a camera frame or an uploaded image into Mini You's photo: a small square JPEG kept on
// the device, plus the skin and hair colours sampled from it. Client-side only.

export interface PhotoResult {
  photo: string;
  skin: string;
  hair: string;
  /** A larger 512 px copy, only kept in memory, for the optional 3D cartoon. */
  large?: string;
}

const toHex = (r: number, g: number, b: number) => `#${[r, g, b].map((v) => Math.round(v).toString(16).padStart(2, "0")).join("")}`;

/** Centre-crops the source to a 160 px square and samples colours from a typical headshot layout. */
export function processImage(source: CanvasImageSource, width: number, height: number, mirror = false): PhotoResult {
  const side = Math.min(width, height);
  const canvas = document.createElement("canvas");
  canvas.width = canvas.height = 160;
  const ctx = canvas.getContext("2d")!;
  if (mirror) {
    // Selfie cameras preview mirrored; keep the saved photo matching what the user saw.
    ctx.translate(160, 0);
    ctx.scale(-1, 1);
  }
  ctx.drawImage(source, (width - side) / 2, (height - side) / 2, side, side, 0, 0, 160, 160);
  ctx.setTransform(1, 0, 0, 1, 0, 0);

  const avg = (x0: number, y0: number, w: number, h: number, keep?: (luma: number) => boolean) => {
    const { data } = ctx.getImageData(x0, y0, w, h);
    let r = 0, g = 0, b = 0, n = 0;
    for (let i = 0; i < data.length; i += 4) {
      const luma = 0.3 * data[i] + 0.59 * data[i + 1] + 0.11 * data[i + 2];
      if (keep && !keep(luma)) continue;
      r += data[i]; g += data[i + 1]; b += data[i + 2]; n++;
    }
    return n ? toHex(r / n, g / n, b / n) : undefined;
  };

  const big = document.createElement("canvas");
  big.width = big.height = 512;
  const bctx = big.getContext("2d")!;
  if (mirror) {
    bctx.translate(512, 0);
    bctx.scale(-1, 1);
  }
  bctx.drawImage(source, (width - side) / 2, (height - side) / 2, side, side, 0, 0, 512, 512);

  return {
    large: big.toDataURL("image/jpeg", 0.85),
    photo: canvas.toDataURL("image/jpeg", 0.82),
    // Face: centre of the frame. Hair: the darker pixels across the top.
    skin: avg(58, 62, 44, 38) ?? "#e0ac83",
    hair: avg(38, 8, 84, 28, (l) => l < 110) ?? "#3b2a20",
  };
}

/** Shrinks a generated cartoon to a light JPEG on white so it fits comfortably in local storage. */
export async function shrinkImage(dataUrl: string, maxSide = 480): Promise<string> {
  const img = await new Promise<HTMLImageElement>((resolve, reject) => {
    const i = new Image();
    i.onload = () => resolve(i);
    i.onerror = () => reject(new Error("Couldn't read the cartoon image."));
    i.src = dataUrl;
  });
  const scale = Math.min(1, maxSide / Math.max(img.naturalWidth, img.naturalHeight));
  const canvas = document.createElement("canvas");
  canvas.width = Math.round(img.naturalWidth * scale);
  canvas.height = Math.round(img.naturalHeight * scale);
  const ctx = canvas.getContext("2d")!;
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
  return canvas.toDataURL("image/jpeg", 0.85);
}

export async function processFile(file: File): Promise<PhotoResult> {
  if (!file.type.startsWith("image/")) throw new Error("Please choose an image file.");
  const url = URL.createObjectURL(file);
  try {
    const img = await new Promise<HTMLImageElement>((resolve, reject) => {
      const i = new Image();
      i.onload = () => resolve(i);
      i.onerror = () => reject(new Error("That image couldn't be opened."));
      i.src = url;
    });
    return processImage(img, img.naturalWidth, img.naturalHeight);
  } finally {
    URL.revokeObjectURL(url);
  }
}
