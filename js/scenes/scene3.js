// Ported from original scene3.c
// Original function: void scene3(void)

import { context, clrscr, params, AA_FLOYD_S } from "../aalib-setup.js";
import { timestuff, bbwait } from "../timer.js";
import { initPlasma, stepPlasma, drawPlasma } from "../effects/plasma.js";

const STIME = 11 * 1000000;
const TTIME = 1000000;

export async function scene3() {
  params.dither = AA_FLOYD_S;
  initPlasma();
  await bbwait(500000);

  const text = [
    "STILL",
    "WATCHING",
    "BB",
    "?",
    "GREAT",
    "",
    "",
    "NOW",
    "IT'S",
    "A GREAT",
    "TIME",
    "TO",
    "FILL",
    "IN",
    "YOUR",
    "REGISTRATION",
    "CARD",
    "",
    "????",
    "NEVER",
    "MORE",
    "",
    "(E.A. POE)",
    "...",
  ];

  await timestuff(
    35,
    (step) => {
      stepPlasma(step);
    },
    (elapsed, maxtime) => {
      let activeMsg = null;
      if (elapsed >= STIME) {
        const msgIdx = Math.floor((elapsed - STIME) / TTIME);
        if (msgIdx >= 0 && msgIdx < text.length) {
          activeMsg = text[msgIdx];
        }
      }
      drawPlasma(activeMsg);
    },
    42 * 1000000
  );

  params.bright = 0;
  clrscr(context);
}
