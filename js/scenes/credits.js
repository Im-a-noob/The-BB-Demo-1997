// Ported from original credits.c
// Original function: void credits(void)

import {
  context,
  aa_imgwidth,
  aa_imgheight,
  aa_putpixel,
  aa_render,
  aa_flush,
  clrscr,
  centerprint,
  params,
} from "../aalib-setup.js";
import { timestuff } from "../timer.js";
import { load_song, play } from "../audio.js";

const MAXSTARS = 450;
const MAXFAR = 1000;

export async function credits() {
  load_song("bb2.s3m");
  play();

  clrscr(context);

  // Initialize 3D starfield
  const stars = [];
  for (let i = 0; i < MAXSTARS; i++) {
    stars.push({
      x: (Math.random() - 0.5) * 2000,
      y: (Math.random() - 0.5) * 2000,
      z: Math.random() * MAXFAR + 1,
      speed: Math.random() * 8 + 4,
    });
  }

  // Credits text lines from credits.c
  const creditsList = [
    "Thank you",
    "For",
    "watching",
    "BB",
    ".",
    "...",
    ".",
    "CREDITS:",
    " ",
    "FK:",
    "Music",
    " ",
    "MS:",
    "3d engine",
    "tyre",
    " ",
    "KT:",
    "Sound engine",
    "Sound synchro",
    "Intro",
    "Plasma",
    "Guard stone",
    "Texts",
    "Titles",
    "Stars",
    " ",
    "HH:",
    "AAlib",
    "Intro",
    "Invaders",
    "Fire",
    "Greetings",
    "Photos",
    "XaoS",
    "Zebra",
    "Titeling",
    "Timing system",
    "Outro",
    " ",
    "Special Thanks to:",
    "Eva Hubickova (for photos)",
    "Texas Linux users group",
    "Thomas Marsh (fractals)",
    "IBM (for MDA primary gfx)",
    "Jiri Matousek",
    "0rfelyus (dithering)",
    "DJ (for DJGPP)",
    "MikMak (for MikMod)",
    "Richard Stallman (for GNU)",
    "Linus Torvalds (for Linux)",
    ".",
    "...",
    ".",
    "This demo and ascii art library",
    "is free software (GPL v2)",
    " ",
    "! WARNING !",
    "Do NOT read the sources",
    "unless you really know",
    "what you are doing",
    ".",
    "...",
    ".",
    "(C) 1997 AA-Group",
  ];

  const w = aa_imgwidth(context);
  const h = aa_imgheight(context);

  let currentCreditIdx = 0;
  let creditProgress = 0;

  await timestuff(
    60,
    null,
    (elapsed, maxtime) => {
      context.imagebuffer.fill(0);

      // Advance starfield
      const warp = Math.sin(elapsed / 2000000.0) * 8;

      for (let i = 0; i < MAXSTARS; i++) {
        const s = stars[i];
        s.z -= s.speed + warp;
        if (s.z <= 2) {
          s.x = (Math.random() - 0.5) * 2000;
          s.y = (Math.random() - 0.5) * 2000;
          s.z = MAXFAR;
        }

        const screenX = Math.round(w / 2 + (s.x * 120) / s.z);
        const screenY = Math.round(h / 2 + (s.y * 120) / s.z);

        if (screenX >= 0 && screenX < w && screenY >= 0 && screenY < h) {
          const brightness = Math.max(0, Math.min(255, Math.round(255 * (1 - s.z / MAXFAR))));
          aa_putpixel(context, screenX, screenY, brightness);
        }
      }

      // Display scrolling / fading credits
      const itemDuration = 2200000;
      const idx = Math.floor(elapsed / itemDuration);
      if (idx < creditsList.length) {
        const itemElapsed = elapsed % itemDuration;
        const fade = Math.sin((itemElapsed / itemDuration) * Math.PI);
        const bright = Math.round(fade * 255);
        if (bright > 20) {
          centerprint(w / 2, h / 2, 2.8, bright, creditsList[idx]);
        }
      }

      aa_render(context);
      aa_flush(context);
    },
    55000000
  );

  clrscr(context);
  aa_render(context);
}
