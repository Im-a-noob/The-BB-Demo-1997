// Ported from original scene7.c
// Original function: void scene6(void)

import { context, clrscr, params, AA_NONE } from "../aalib-setup.js";
import { timestuff } from "../timer.js";
import { fractalEngine } from "../effects/fractal.js";

const ETIME1 = 25 * 1000000 + 150000;

export async function scene6() {
  fractalEngine.resetMandelbrot();
  params.bright = 0;
  params.dither = AA_NONE;

  await timestuff(
    30,
    (step) => {
      fractalEngine.stepMandelbrot(1.03);
    },
    (elapsed, maxtime) => {
      // Fade in at the start, fade out at the end
      if (elapsed < 2000000) {
        params.bright = Math.round(-255 + (elapsed / 2000000) * 255);
      } else if (maxtime - elapsed < 2000000) {
        params.bright = Math.round(-((2000000 - (maxtime - elapsed)) / 2000000) * 255);
      } else {
        params.bright = 0;
      }

      fractalEngine.renderMandelbrot(60);
    },
    16000000
  );

  params.bright = 0;
  clrscr(context);
}
