// Ported from original scene1.c
// Original function: void vezen(struct image *i1, struct image *i2, struct image *i3, struct image *i4)

import {
  context,
  aa_imgwidth,
  aa_imgheight,
  aa_putpixel,
  aa_render,
  aa_flush,
  clrscr,
  params,
  AA_FLOYD_S,
} from "../aalib-setup.js";
import { timestuff, bbwait } from "../timer.js";
import { strobikstart, strobikend } from "../effects/strobe.js";

// Cache for loaded portrait ImageDatas
const portraitCache = new Map();

export async function loadPortraitImage(name) {
  if (portraitCache.has(name)) return portraitCache.get(name);

  return new Promise((resolve) => {
    const img = new Image();
    img.src = `/images/${name}.png`;
    img.onload = () => {
      const canvas = document.createElement("canvas");
      canvas.width = img.width;
      canvas.height = img.height;
      const ctx = canvas.getContext("2d", { willReadFrequently: true });
      ctx.drawImage(img, 0, 0);
      const idata = ctx.getImageData(0, 0, img.width, img.height);
      const gray = new Uint8Array(img.width * img.height);
      for (let i = 0; i < gray.length; i++) {
        gray[i] = idata.data[i * 4];
      }
      const item = { data: gray, width: img.width, height: img.height };
      portraitCache.set(name, item);
      resolve(item);
    };
    img.onerror = () => {
      // Fallback empty if image fails
      const fallback = { data: new Uint8Array(200 * 200), width: 200, height: 200 };
      portraitCache.set(name, fallback);
      resolve(fallback);
    };
  });
}

/**
 * Render portrait into virtual framebuffer with aspect scaling.
 * Supports placement = "top" so text can be rendered directly below the picture.
 */
export function drawPortrait(imgItem, scale = 1.0, placement = "top") {
  if (!imgItem) return;
  const width = aa_imgwidth(context);
  const height = aa_imgheight(context);

  context.imagebuffer.fill(0);

  let targetW, targetH, startX, startY;

  if (placement === "top") {
    // Upper area of terminal screen (approx. terminal rows 1..17, image Y 2..36)
    targetH = Math.min(34, Math.max(20, Math.round(34 * scale)));
    const aspect = imgItem.width / imgItem.height;
    // Monospace terminal characters have ~1:2 width:height aspect ratio
    targetW = Math.min(width - 16, Math.round(targetH * aspect * 1.85));
    startX = Math.round((width - targetW) / 2);
    startY = 2;
  } else {
    targetW = Math.round(width * 0.7 * scale);
    targetH = Math.round(height * 0.9 * scale);
    startX = Math.round((width - targetW) / 2);
    startY = Math.round((height - targetH) / 2);
  }

  const scaleX = imgItem.width / targetW;
  const scaleY = imgItem.height / targetH;

  for (let y = 0; y < targetH; y++) {
    const py = startY + y;
    if (py < 0 || py >= height) continue;
    const srcY = Math.min(imgItem.height - 1, Math.floor(y * scaleY));
    const srcRow = srcY * imgItem.width;
    const destRow = py * width;

    for (let x = 0; x < targetW; x++) {
      const px = startX + x;
      if (px < 0 || px >= width) continue;
      const srcX = Math.min(imgItem.width - 1, Math.floor(x * scaleX));
      context.imagebuffer[destRow + px] = imgItem.data[srcRow + srcX];
    }
  }

  aa_render(context);
  aa_flush(context);
}

/**
 * vezen() - Displays the 4 photos of an author with strobe flashes.
 * Ported directly from vezen() in scene1.c.
 * Keeps the final portrait stable in the upper portion so biography text appears below it.
 */
export async function vezen(name1, name2, name3, name4) {
  params.dither = AA_FLOYD_S;
  params.contrast = 110;
  params.bright = 0;

  const [i1, i2, i3, i4] = await Promise.all([
    loadPortraitImage(name1),
    loadPortraitImage(name2),
    loadPortraitImage(name3),
    loadPortraitImage(name4),
  ]);

  const portraits = [i1, i2, i3, i4];

  strobikstart();

  // Show portraits 1 through 4 with strobe cuts in upper half
  for (let idx = 0; idx < 4; idx++) {
    const portrait = portraits[idx];
    await timestuff(
      30,
      null,
      (elapsed, maxtime) => {
        // Quick flash on entry
        if (elapsed < 300000) {
          params.bright = Math.round(100 - (elapsed / 300000) * 100);
        } else {
          params.bright = 0;
        }
        drawPortrait(portrait, 1.0, "top");
      },
      1200000
    );
  }

  // Fast final strobing between portraits
  for (let cycle = 0; cycle < 6; cycle++) {
    const p = portraits[cycle % 4];
    params.bright = cycle % 2 === 0 ? 60 : -20;
    drawPortrait(p, 1.0, "top");
    await bbwait(150000);
  }

  strobikend();
  params.bright = 0;

  // Render the 4th portrait stably at normal brightness and keep it on screen
  drawPortrait(portraits[3], 1.0, "top");
  aa_render(context);
}
