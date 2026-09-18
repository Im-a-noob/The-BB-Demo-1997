// Ported from original scene2.c
// Original function: void scene2(void)

import {
  context,
  clrscr,
  aa_render,
  aa_flush,
  params,
} from "../aalib-setup.js";
import { timestuff } from "../timer.js";
import { dvojprujezd2, drawzoomer } from "../effects/text-effects.js";

const ETIME = 650000;

export async function scene2() {
  params.randomval = 0;

  // 1. Dual passing text: "Greetings" / "To"
  await timestuff(
    60,
    null,
    (elapsed, maxDuration) => {
      clrscr(context);
      dvojprujezd2(elapsed, maxDuration, "Greetings", "To");
      aa_render(context);
      aa_flush(context);
    },
    2750000
  );

  // 2. Zooming demo group names from original pokec[] array
  const pokec = [
    "Future",
    "Crew",
    "Triton",
    "Cascada",
    "Complex",
    "Pascal",
    "Titans",
    "Xography",
    "Sonic PC",
    "Scrymag",
    "...",
    "Microsoft",
    "",
    "!?!",
  ];

  let pos = 2;
  let lastpos = 1;
  let mesg = "";
  let lastmesg = "";

  for (let i = 0; i < pokec.length; i++) {
    lastpos = pos;
    pos++;
    if (pos > 4) pos = 2;

    lastmesg = mesg;
    mesg = pokec[i];

    const duration = i === pokec.length - 1 ? 3 * ETIME : ETIME;

    await timestuff(
      60,
      null,
      (elapsed) => {
        clrscr(context);
        drawzoomer(lastmesg, elapsed + ETIME, lastpos);
        drawzoomer(mesg, elapsed, pos);
        aa_render(context);
        aa_flush(context);
      },
      duration
    );
  }

  clrscr(context);
  aa_render(context);
}
