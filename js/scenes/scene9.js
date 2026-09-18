// Ported from original tex.c and scene7.c
// Original function: void scene9(void)

import { context, clrscr, params } from "../aalib-setup.js";
import { timestuff } from "../timer.js";
import { torusEffect } from "../effects/torus.js";

export async function scene9() {
  params.contrast = 110;
  params.bright = 0;

  let angleA = 0;
  let angleB = 45;
  let angleG = 30;

  await timestuff(
    60,
    (step) => {
      angleA += step * 2;
      angleB += step * 4;
      angleG += step * 1.5;
      torusEffect.setRotation(angleA, angleB, angleG);
    },
    (elapsed) => {
      const z = 1.1 + Math.cos(elapsed / 800000.0) * 0.35;
      torusEffect.setZoom(z);
      torusEffect.draw();
    },
    8000000
  );

  clrscr(context);
}
