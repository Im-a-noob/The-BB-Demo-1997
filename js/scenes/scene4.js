// Ported from original scene4.c
// Original function: void scene4(void)

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
  backconvert,
  AA_NORMAL,
  params,
} from "../aalib-setup.js";
import { bbflushwait, timestuff } from "../timer.js";

function clrinvaz() {
  const scrW = aa_scrwidth(context);
  const scrH = Math.min(15, aa_scrheight(context));
  for (let y = 0; y < scrH; y++) {
    for (let x = 0; x < scrW; x++) {
      context.textbuffer[y * scrW + x] = " ";
    }
  }
}

export async function scene4() {
  textclrscr(context);
  const scrW = aa_scrwidth(context);
  const scrH = aa_scrheight(context);
  const N1 = 20;

  // 1. Line of invaders intro
  const n1 = Math.floor((scrW - 5 - N1 + 5) / 6);
  const wtime1 = Math.round((1.0 * 1000000) / (n1 || 1));
  for (let x = 0; x < scrW - 5 - N1; x += 6) {
    for (let y = 0; y < 10; y += 3) {
      aa_puts(context, x, y, AA_NORMAL, " ----");
    }
    aa_render(context);
    await bbflushwait(wtime1);
  }

  // 2. Defensive bunkers
  const n2 = Math.floor((scrW - 7 + 7) / 8);
  const wtime2 = Math.round((1.0 * 1000000) / (n2 || 1));
  for (let x = 0; x < scrW - 7; x += 8) {
    aa_puts(context, x, scrH - 3, AA_NORMAL, "/~~\\");
    aa_render(context);
    await bbflushwait(wtime2);
  }

  // 3. Eyes open
  for (let y = 0; y < 10; y += 3) {
    for (let x = 0; x < scrW - 5 - N1; x += 6) {
      aa_puts(context, x, y, AA_NORMAL, " -oo-");
    }
    aa_render(context);
    await bbflushwait(100000);
  }
  await bbflushwait(200000);

  // 4. Invaders march left & right, player ship moves
  let p = Math.floor(scrW / 2);
  let d = 0;
  let k = 0;

  for (let q = 0; q < 4; q++) {
    // March right
    for (let i = 0; i < N1; i++) {
      clrinvaz();
      d++;
      if (d > 8) {
        k ^= 1;
        d = 0;
      }
      for (let x = 0; x < scrW - 5 - N1; x += 6) {
        for (let y = 0; y < 10; y += 3) {
          aa_puts(context, x + i, y + q, AA_NORMAL, k ? " \\oo/ " : " /OO\\ ");
        }
      }
      aa_puts(context, p, scrH - 1, AA_NORMAL, " [^] ");
      p += Math.floor(Math.random() * 3) - 1;
      p = Math.max(2, Math.min(scrW - 6, p));
      aa_render(context);
      await bbflushwait(20000);
    }
    q++;

    // March left
    for (let i = N1; i > 0; i--) {
      clrinvaz();
      d++;
      if (d > 8) {
        k ^= 1;
        d = 0;
      }
      for (let x = 0; x < scrW - 5 - N1; x += 6) {
        for (let y = 0; y < 10; y += 3) {
          aa_puts(context, x + i, y + q, AA_NORMAL, k ? " \\oo/ " : " /OO\\ ");
        }
      }
      aa_puts(context, p, scrH - 1, AA_NORMAL, " [^] ");
      p += Math.floor(Math.random() * 3) - 1;
      p = Math.max(2, Math.min(scrW - 6, p));
      aa_render(context);
      await bbflushwait(20000);
    }
  }

  // 5. Invaders descend closer and panic
  for (let i = 0; i < 4; i++) {
    for (let x = 0; x < scrW - 5 - N1; x += 6) {
      for (let y = 0; y < 10; y += 3) {
        aa_puts(context, x + 10, y + 4, AA_NORMAL, i % 2 === 0 ? " /OO\\" : " /**\\");
      }
    }
    aa_render(context);
    await bbflushwait(100000);
  }

  // 6. Convert screen to image buffer and BURN THE SCREEN DOWN WITH PROCEDURAL FIRE!
  backconvert(0, 0, scrW, scrH);
  textclrscr(context);

  const imgW = aa_imgwidth(context);
  const imgH = aa_imgheight(context);
  const table = new Uint8Array(256 * 5);
  const minus = Math.max(1, Math.floor(800 / imgH));
  for (let i = 0; i < table.length; i++) {
    table[i] = i > minus ? Math.floor((i - minus) / 5) : 0;
  }

  params.bright = 120;

  // Run fire burning loop for 6.5 seconds
  await timestuff(
    60,
    null,
    (elapsed, maxDuration) => {
      // Feed random flame sparks at the bottom
      const bottomRow = (imgH - 2) * imgW;
      for (let x = 0; x < imgW; x++) {
        if (Math.random() > 0.3) {
          context.imagebuffer[bottomRow + x] = Math.floor(Math.random() * 255);
        } else {
          context.imagebuffer[bottomRow + x] = 0;
        }
      }

      // Propagate fire upward
      for (let y = 0; y < imgH - 2; y++) {
        const row = y * imgW;
        const row1 = (y + 1) * imgW;
        const row2 = (y + 2) * imgW;

        for (let x = 1; x < imgW - 1; x++) {
          const sum =
            context.imagebuffer[row1 + x - 1] +
            context.imagebuffer[row1 + x + 1] +
            context.imagebuffer[row1 + x] +
            context.imagebuffer[row2 + x - 1] +
            context.imagebuffer[row2 + x + 1];
          context.imagebuffer[row + x] = table[Math.min(table.length - 1, sum)];
        }
      }

      params.bright = Math.max(0, params.bright - 1);
      aa_render(context);
      aa_flush(context);
    },
    6500000
  );

  clrscr(context);
  aa_render(context);
}
