// Ported from original scene9.c
// Original function: void scene10(void)

import { context, clrscr, params } from "../aalib-setup.js";
import { timestuff } from "../timer.js";
import { torusEffect } from "../effects/torus.js";

export async function scene10() {
  params.contrast = 120;
  params.bright = 0;

  let angleA = 180;
  let angleB = 90;
  let angleG = 45;

  await timestuff(
    60,
    (step) => {
      angleA += step * 4;
      angleB += step * 3;
      angleG += step * 2;
      torusEffect.setRotation(angleA, angleB, angleG);
    },
    (elapsed, maxtime) => {
      // Camera zoom out and flyby
      const p = elapsed / maxtime;
      const zoom = 1.4 - p * 0.6;
      torusEffect.setZoom(zoom);
      torusEffect.setCenter(Math.sin(p * Math.PI * 2) * 30, Math.cos(p * Math.PI * 2) * 30, 160);
      torusEffect.draw();
    },
    6000000
  );

  clrscr(context);
}
