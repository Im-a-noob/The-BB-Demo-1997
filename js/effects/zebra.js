// Ported from scene8.c
// High-resolution bitmap zooming, pan, and oscillation on the zebra asset

import {
  context,
  aa_imgwidth,
  aa_imgheight,
  aa_putpixel,
  aa_render,
  aa_flush,
  params,
} from "../aalib-setup.js";

let zebraImage = null;
let zebraCanvas = null;
let zebraData = null;
const ZEB_WIDTH = 600;
const ZEB_HEIGHT = 470;

export async function loadZebra() {
  if (zebraData) return;
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.src = "/images/zeb.png";
    img.onload = () => {
      zebraImage = img;
      zebraCanvas = document.createElement("canvas");
      zebraCanvas.width = ZEB_WIDTH;
      zebraCanvas.height = ZEB_HEIGHT;
      const ctx = zebraCanvas.getContext("2d", { willReadFrequently: true });
      ctx.drawImage(img, 0, 0);
      const idata = ctx.getImageData(0, 0, ZEB_WIDTH, ZEB_HEIGHT);
      zebraData = new Uint8Array(ZEB_WIDTH * ZEB_HEIGHT);
      for (let i = 0; i < zebraData.length; i++) {
        zebraData[i] = idata.data[i * 4];
      }
      resolve();
    };
    img.onerror = reject;
  });
}

/**
 * Ported from mydraw() in scene8.c
 * @param {number} state1 - elapsed time from starttime1
 * @param {number} mul1 - interpolation factor 1
 * @param {number} mul2 - interpolation factor 2
 * @param {number} div - divisor
 */
export function drawZebra(state1, cx, cy, sx, sy, contrast, bright, noise) {
  if (!zebraData) return;

  params.contrast = contrast;
  params.bright = bright;
  params.randomval = noise;

  const width = aa_imgwidth(context);
  const height = aa_imgheight(context);

  // Oscillating window coordinates ported from scene8.c
  const curCx = cx + Math.sin(state1 / 300000.0) * 40;
  const curCy = cy + Math.cos(state1 / 500000.0) * 40;
  const curSx = sx + Math.sin(state1 / 520000.0) * 70;
  const curSy = sy + Math.cos(state1 / 700000.0) * 70;

  const x0 = Math.floor(((curCx - curSx) * ZEB_WIDTH) / 1000);
  const y0 = Math.floor(((curCy - curSy) * ZEB_HEIGHT) / 1000);
  const x1 = Math.floor(((curCx + curSx) * ZEB_WIDTH) / 1000);
  const y1 = Math.floor(((curCy + curSy) * ZEB_HEIGHT) / 1000);

  const viewW = Math.max(1, x1 - x0);
  const viewH = Math.max(1, y1 - y0);

  const scaleX = viewW / width;
  const scaleY = viewH / height;

  for (let y = 0; y < height; y++) {
    const srcY = Math.max(0, Math.min(ZEB_HEIGHT - 1, Math.floor(y0 + y * scaleY)));
    const rowOff = srcY * ZEB_WIDTH;

    for (let x = 0; x < width; x++) {
      const srcX = Math.max(0, Math.min(ZEB_WIDTH - 1, Math.floor(x0 + x * scaleX)));
      const pixel = zebraData[rowOff + srcX];
      aa_putpixel(context, x, y, pixel);
    }
  }

  aa_render(context);
  aa_flush(context);
}
