// Ported from original scene1.c
// Original function: void scene1(void)

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
  params,
} from "../aalib-setup.js";
import { timestuff, bbwait } from "../timer.js";
import { strobikstart, strobikend } from "../effects/strobe.js";
import { blazinec } from "../effects/text-effects.js";

export async function introscreen() {
  textclrscr(context);
  clrscr(context);

  const lines = [
    "BB - The portable demo",
    "(C) 1997 by AA-group (aa@horac.ta.jcu.cz)",
    "Version: 1.2 [web edition]",
    "",
    "Precalculating tables and initializing aalib.js...",
  ];

  for (let i = 0; i < lines.length; i++) {
    aa_puts(context, 2, 3 + i, AA_NORMAL, lines[i]);
    aa_render(context);
    await bbwait(200000);
  }

  // Quick simulated hex memory dump matching original demo initialization
  for (let row = 0; row < 12; row++) {
    let hex = "0x" + (0x1000 + row * 16).toString(16).toUpperCase() + ": ";
    for (let c = 0; c < 8; c++) {
      const b = Math.floor(Math.random() * 256).toString(16).padStart(2, "0").toUpperCase();
      hex += b + " ";
    }
    hex += " |..........|";
    aa_puts(context, 2, 9 + row, AA_NORMAL, hex);
    aa_render(context);
    await bbwait(60000);
  }

  await bbwait(800000);
  textclrscr(context);
  clrscr(context);
  aa_render(context);
}

export async function scene1() {
  const w = aa_imgwidth(context);
  const h = aa_imgheight(context);

  params.bright = 0;
  params.randomval = 0;

  // 1. "AA PRESENTS"
  strobikstart(90);
  await timestuff(
    60,
    null,
    (elapsed, maxDuration) => {
      clrscr(context);
      // Fade out brightness quickly
      params.bright = Math.max(0, Math.round(90 * (1 - elapsed / 800000)));
      centerprint(w / 2, h / 2, 3.2, 255, "AA PRESENTS");
      aa_render(context);
      aa_flush(context);
    },
    2500000
  );

  strobikend();
  params.bright = 0;
  params.randomval = 0;

  // 2. Bouncing first 'B'
  await timestuff(
    60,
    null,
    (elapsed, maxTime) => {
      clrscr(context);
      const progress = elapsed / maxTime;
      const bounce = Math.abs(Math.sin(progress * Math.PI * 3)) * (h / 3);
      centerprint(w / 2 - 30, h / 2 - bounce, 5.0, 255, "B");
      aa_render(context);
      aa_flush(context);
    },
    2000000
  );

  // 3. Bouncing second 'B' to form 'BB'
  await timestuff(
    60,
    null,
    (elapsed, maxTime) => {
      clrscr(context);
      centerprint(w / 2 - 30, h / 2, 5.0, 255, "B");
      const progress = elapsed / maxTime;
      const bounce = Math.abs(Math.sin(progress * Math.PI * 3)) * (h / 3);
      centerprint(w / 2 + 30, h / 2 - bounce, 5.0, 255, "B");
      aa_render(context);
      aa_flush(context);
    },
    2000000
  );

  // 4. Strobe title 'BB'
  await timestuff(
    60,
    null,
    (elapsed) => {
      clrscr(context);
      centerprint(w / 2, h / 2, 6.0, 255, "BB");
      aa_render(context);
      aa_flush(context);
    },
    1500000
  );

  // 5. Blazinec quote bursts from scene1.c
  const quotes = [
    "WHAT DID YOU EXPECT?",
    "3D ACCELERATION?",
    "OPENGL?",
    "DIRECTX?",
    "NO!",
    "JUST TEXT!",
    "WELCOME TO BB",
    "THE PORTABLE DEMO",
    "BY AA-GROUP",
  ];

  for (let q = 0; q < quotes.length; q++) {
    blazinec(quotes[q]);
    await bbwait(300000);
  }

  strobikend();
  params.bright = 0;
  params.randomval = 0;
  clrscr(context);
  aa_render(context);
}
