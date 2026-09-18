// Ported from original credits2.c
// Original function: void credits2(void)

import {
  context,
  aa_imgwidth,
  aa_imgheight,
  aa_scrwidth,
  aa_scrheight,
  aa_puts,
  aa_render,
  aa_flush,
  clrscr,
  textclrscr,
  centerprint,
  AA_NORMAL,
  AA_BOLD,
  AA_DIM,
  params,
} from "../aalib-setup.js";
import { timestuff, bbwait, bbupdate } from "../timer.js";
import { load_song, play, sound } from "../audio.js";

export async function credits2() {
  clrscr(context);

  const w = aa_imgwidth(context);
  const h = aa_imgheight(context);
  const scrW = aa_scrwidth(context);
  const scrH = aa_scrheight(context);

  // 1. "The END" static display
  centerprint(w / 2, Math.round(h / 3), 3.5, 180, "The");
  centerprint(w / 2, Math.round((2 * h) / 3), 3.5, 180, "END");
  aa_render(context);
  aa_flush(context);
  await bbwait(1500000);

  // 2. pryc() - "The END" zooms into deep distance with orbital spin
  await timestuff(
    60,
    null,
    (elapsed, maxtime) => {
      clrscr(context);
      const state = elapsed;
      const size = 3.5 - (state / maxtime) * 2.5;
      const radius = (state * w) / (maxtime * 1.8);
      const yradius = (state * h) / (maxtime * 1.8);
      const xm = w / 2;
      const ym = h / 3;

      centerprint(
        xm + radius * Math.sin(state / 100000.0),
        ym + yradius * Math.cos(state / 300000.0),
        Math.max(0.5, size),
        140,
        "The"
      );
      centerprint(
        xm + radius * Math.sin(state / 150000.0),
        2 * ym + yradius * Math.cos(state / 400000.0),
        Math.max(0.5, size),
        140,
        "END"
      );
      aa_render(context);
      aa_flush(context);
    },
    3000000
  );

  // 3. Switch music to bb3.s3m (Outro)
  load_song("bb3.s3m");
  play();

  textclrscr(context);
  clrscr(context);

  // 4. AA Project logo entry
  const logoY = Math.floor((scrH - 6) / 2);
  for (let i = 0; i < 6; i++) {
    aa_puts(context, Math.floor(scrW / 2) - 4, logoY + i, AA_BOLD, "88  88");
    if (i > 0) {
      aa_puts(context, Math.floor(scrW / 2) - 4, logoY + i - 1, AA_NORMAL, "88  88");
    }
    aa_render(context);
    await bbwait(100000);
  }

  aa_puts(context, Math.floor(scrW / 2) - 9, logoY + 3, AA_DIM, "<AA-PROJECT>");
  aa_render(context);
  await bbwait(100000);
  aa_puts(context, Math.floor(scrW / 2) - 9, logoY + 3, AA_NORMAL, "<AA-PROJECT>");
  aa_render(context);
  await bbwait(100000);
  aa_puts(context, Math.floor(scrW / 2) - 9, logoY + 3, AA_BOLD, "<AA-PROJECT>");
  aa_render(context);
  await bbwait(1000000);

  // 5. Interactive Outro Jukebox Console
  textclrscr(context);
  clrscr(context);

  const menu = [
    "============================================================",
    "               BB (1997) - THE PORTABLE DEMO                ",
    "               Recreated in pure web with aalib.js           ",
    "============================================================",
    "",
    "  [1] - Play Soundtrack Part 1 (bb.s3m)",
    "  [2] - Play Credits Soundtrack (bb2.s3m)",
    "  [3] - Play Outro Soundtrack (bb3.s3m)",
    "",
    "  [R] - Replay demo from beginning",
    "  [Space] - Pause / Resume",
    "  [S] - Jump to next scene",
    "",
    "  Original authors:",
    "    Jan Hubicka (HH), Kamil Toman (KT),",
    "    Mojmir Svoboda (MS), Filip Kupsa (FK)",
    "",
    "============================================================",
  ];

  for (let i = 0; i < menu.length; i++) {
    const isHeader = i === 1 || i === 2;
    aa_puts(context, Math.floor((scrW - 60) / 2), 4 + i, isHeader ? AA_BOLD : AA_NORMAL, menu[i]);
  }

  aa_render(context);

  // Keep interactive loop running so user can trigger tracks or loop
  let looping = true;
  while (looping) {
    const ch = bbupdate();
    if (ch === "1") {
      load_song("bb.s3m");
      play();
    } else if (ch === "2") {
      load_song("bb2.s3m");
      play();
    } else if (ch === "3") {
      load_song("bb3.s3m");
      play();
    } else if (ch === "r" || ch === "R") {
      return "restart";
    }
    await bbwait(100000);
  }
}
