// Ported from original scene7.c
// Original function: void scene7(void)

import { context, clrscr, params, AA_NONE } from "../aalib-setup.js";
import { timestuff } from "../timer.js";
import { fractalEngine } from "../effects/fractal.js";

export async function scene7() {
  params.dither = AA_NONE;
  params.bright = 0;

  await timestuff(
    30,
    null,
    (elapsed, maxtime) => {
      const t = elapsed / 1000000.0;
      const cr = -0.7 + Math.sin(t * 0.8) * 0.18;
      const ci = 0.27015 + Math.cos(t * 1.1) * 0.18;

      fractalEngine.renderJulia(cr, ci, 50);
    },
    8000000
  );

  clrscr(context);
}
