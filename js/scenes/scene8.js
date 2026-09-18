// Ported from original scene8.c
// Original function: void scene8(void)

import { context, clrscr, params, AA_FLOYD_S } from "../aalib-setup.js";
import { timestuff } from "../timer.js";
import { loadZebra, drawZebra } from "../effects/zebra.js";

export async function scene8() {
  await loadZebra();
  params.dither = AA_FLOYD_S;

  let starttime1 = performance.now() * 1000;

  // Segment 1: Fade in with high noise
  await timestuff(
    35,
    null,
    (elapsed, maxtime) => {
      const p = elapsed / maxtime;
      const bright = Math.round(-255 + p * 255);
      const noise = 100;
      const contrast = 100;
      drawZebra(elapsed, 300, 400, 100, 100, contrast, bright, noise);
    },
    2000000
  );

  // Segment 2: Reduce noise
  await timestuff(
    35,
    null,
    (elapsed, maxtime) => {
      const p = elapsed / maxtime;
      const noise = Math.round(100 - p * 100);
      drawZebra(elapsed + 2000000, 300, 400, 100, 100, 100, 0, noise);
    },
    1000000
  );

  // Segment 3: Pan and zoom across the zebra stripes
  await timestuff(
    35,
    null,
    (elapsed, maxtime) => {
      const p = elapsed / maxtime;
      const cx = 300 + Math.sin(p * Math.PI) * 120;
      const cy = 400 - p * 150;
      const sx = 100 + p * 80;
      const sy = 100 + p * 80;
      drawZebra(elapsed + 3000000, cx, cy, sx, sy, 100, 0, 0);
    },
    8000000
  );

  clrscr(context);
}
