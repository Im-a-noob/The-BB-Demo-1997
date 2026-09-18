// Ported from original messager.c
// Original function: void messager(int author)

import {
  context,
  aa_scrwidth,
  aa_scrheight,
  aa_puts,
  aa_render,
  clrscr,
  textclrscr,
  AA_NORMAL,
  AA_REVERSE,
  AA_BOLD,
  params,
} from "../aalib-setup.js";
import { bbwait, timestuff } from "../timer.js";
import { vezen } from "./portraits.js";

// Author biographies verbatim from messager.c
export const AUTHOR_BIOS = [
  // 0: Filip Kupsa
  [
    "FILIP KUPSA known as FK, Tingle Notions, Dawn Music",
    "birth: June 22 1979, Tabor, Czech Republic, sex: male",
    "",
    "1992 - Changed his piano for 386/mp.com/pc-speaker music",
    "1993 - Got his first Sound Blaster",
    "1995 - Changed his SB for a new GUS technology",
    "1996 - Composed his first great hits",
    "1996 - FAT recomposition made by Windows 95",
    "1997 - Released his musac in BB",
    "",
    "1998 - Got retired",
    "",
    "Contact address: via KT",
  ],
  // 1: Mojmir Svoboda
  [
    "MOJMIR SVOBODA known as MS, TiTania, MSS, Bill",
    "birth: ??, Tabor, Czech Republic, sex: ? male ?",
    "",
    "1993 - Installed Linux on his 386sx/25 + 40MB HDD",
    "1994 - Removed Linux to make space for Doom",
    "1995 - Reinstalled Linux on his 486Dx4/120 + 850MB",
    "1996 - Removed Linux to make space for Windows 95",
    "",
    "1997 - Removed Windows 95 to make space for aalib",
    "",
    "Contact address: titania@mbox.vol.cz",
  ],
  // 2: Kamil Toman
  [
    "KAMIL TOMAN known as KT, Kato, Whale, Bart",
    "birth: May 19 1979, Tabor, Czech Republic, sex: male",
    "",
    "1993 - Became a linux extremist",
    "1993 - Successful attempt to establish a secret organization",
    "       Commandline Brotherhood",
    "1995 - Action 'koules' - a secret project to train brotherhood",
    "       members - covered under a game design",
    "",
    "1998 - Heading a new wave of command line revolution",
    "",
    "Contact address: toman@horac.ta.jcu.cz",
  ],
  // 3: Jan Hubicka
  [
    "JAN HUBICKA known as HH, Jahusoft, HuJaSoft, JHS, UNIX, Honza",
    "birth: Apr 1 1978, Tabor, Czech Republic, sex: male",
    "",
    "1991 - Installed underground hackers OS Linux",
    "1995 - Headed Action 'koules'",
    "1996 - Famous troan XaoS to convert all windows instalations",
    "       into Linux",
    "",
    "1998 - Secret plan to make `Text Windows` system to confuse users",
    "2001 - Planning an assassination of dictator Bill G.",
    "",
    "Contact address: hubicka@paru.cas.cz",
  ],
];

/**
 * Typewriter message display ported from messager() in messager.c.
 * Displays member biography text directly BELOW member picture (starting at row 19).
 * Preserves the virtual framebuffer image so the member portrait stays visible.
 */
export async function messager(authorIndex = 0) {
  // Clear only textbuffer so the member portrait in imagebuffer stays visible
  textclrscr(context);

  const lines = AUTHOR_BIOS[authorIndex] || AUTHOR_BIOS[0];
  const startRow = 19;
  const startCol = 4;

  for (let l = 0; l < lines.length; l++) {
    const line = lines[l];
    for (let c = 0; c < line.length; c++) {
      aa_puts(context, startCol + c, startRow + l, l === 0 ? AA_BOLD : AA_NORMAL, line[c]);
      // Blinking cursor
      aa_puts(context, startCol + c + 1, startRow + l, AA_REVERSE, " ");
      aa_render(context);
      await bbwait(14000);
      // Erase cursor character slot
      aa_puts(context, startCol + c + 1, startRow + l, AA_NORMAL, " ");
    }
    aa_render(context);
    await bbwait(50000);
  }

  // Allow audience to read biography
  await bbwait(3500000);
}

/**
 * Combined member scene: portrait sequence + biography text typed below picture + authentic transition.
 * Avoids creating a separate scene for the biography text.
 */
export async function runMemberScene(memberIndex = 0) {
  const members = [
    { prefix: "fk", transition: devezen2 },
    { prefix: "ms", transition: devezen3 },
    { prefix: "kt", transition: devezen1 },
    { prefix: "hh", transition: devezen4 },
  ];

  const m = members[memberIndex] || members[0];

  // 1. Play portrait sequence and keep 4th photo visible in upper half of the screen
  await vezen(`${m.prefix}1`, `${m.prefix}2`, `${m.prefix}3`, `${m.prefix}4`);

  // 2. Typewriter member biography text directly BELOW the member picture
  await messager(memberIndex);

  // 3. Authentic scene transition effect (fade / wipe)
  if (m.transition) {
    await m.transition();
  }
}

/**
 * devezen1() - Vertical gradient sweep wipe
 * Ported from messager.c
 */
export async function devezen1() {
  const scrH = aa_scrheight(context);
  const scrW = aa_scrwidth(context);

  for (let y = 0; y < scrH; y++) {
    for (let x = 0; x < scrW; x++) {
      context.textbuffer[y * scrW + x] = " ";
    }
    aa_render(context);
    await bbwait(40000);
  }
  textclrscr(context);
  clrscr(context);
  aa_render(context);
}

/**
 * devezen2() - Contrast fade to black
 * Ported from messager.c
 */
export async function devezen2() {
  await timestuff(
    60,
    null,
    (elapsed, maxtime) => {
      const p = elapsed / maxtime;
      params.bright = Math.round(-p * 255);
      aa_render(context);
    },
    1500000
  );
  params.bright = 0;
  textclrscr(context);
  clrscr(context);
  aa_render(context);
}

/**
 * devezen3() - Randomize noise burst and fade out
 * Ported from messager.c
 */
export async function devezen3() {
  await timestuff(
    60,
    null,
    (elapsed, maxtime) => {
      const p = elapsed / maxtime;
      params.randomval = Math.round(p * 200);
      params.bright = Math.round(-p * 150);
      aa_render(context);
    },
    1500000
  );
  params.randomval = 0;
  params.bright = 0;
  textclrscr(context);
  clrscr(context);
  aa_render(context);
}

/**
 * devezen4() - Decontrast and flash white to black
 * Ported from messager.c
 */
export async function devezen4() {
  // Flash white
  params.bright = 200;
  aa_render(context);
  await bbwait(300000);

  // Fade to black
  await timestuff(
    60,
    null,
    (elapsed, maxtime) => {
      const p = elapsed / maxtime;
      params.bright = Math.round(200 - p * 455);
      aa_render(context);
    },
    1000000
  );

  params.bright = 0;
  textclrscr(context);
  clrscr(context);
  aa_render(context);
}
