// Ported from original scene5.c
// Original function: void scene5(void)

import { context, clrscr, params } from "../aalib-setup.js";
import { timestuff } from "../timer.js";
import { torusEffect } from "../effects/torus.js";

export async function scene5() {
  params.contrast = 100;
  params.bright = 0;

  let angleA = 0;
  let angleB = 0;
  let angleG = 0;

  await timestuff(
    60,
    (step) => {
      angleA += step * 3;
      angleB += step * 2;
      angleG += step * 1;
      torusEffect.setRotation(angleA, angleB, angleG);
    },
    (elapsed, maxtime) => {
      // Modulate zoom and position slightly like the original
      const z = 1.0 + Math.sin(elapsed / 1000000.0) * 0.25;
      torusEffect.setZoom(z);
      torusEffect.draw();
    },
    10000000
  );

  clrscr(context);
}
