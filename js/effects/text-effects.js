// Ported from scene1.c and scene2.c
// Text transformations, scrollers, zoomers, and blazinec strobe bursts

import {
  context,
  aa_imgwidth,
  aa_imgheight,
  centerprint,
  print,
  clrscr,
  aa_render,
  aa_flush,
  params,
} from "../aalib-setup.js";

const MAXPOS = 2500000;

export function dvojprujezd(elapsed, totalDuration, text1, text2) {
  const width = aa_imgwidth(context);
  const height = aa_imgheight(context);

  const t = Math.max(0, Math.min(1, elapsed / totalDuration));
  const span = width * 1.5;

  const x1 = Math.round(-span / 4 + span * t);
  const x2 = Math.round(width + span / 4 - span * t);

  centerprint(x1, Math.round((2 * height) / 3), 2.2, 255, text1);
  centerprint(x2, Math.round(height / 3), 2.2, 255, text2);
}

export function dvojprujezd2(elapsed, totalDuration, text1, text2) {
  const width = aa_imgwidth(context);
  const height = aa_imgheight(context);

  const t = Math.max(0, Math.min(1, elapsed / totalDuration));
  const span = width * 1.5;

  const x1 = Math.round(-span / 4 + span * t);
  const x2 = Math.round(width + span / 4 - span * t);

  centerprint(x1, Math.round(height / 3), 2.2, 255, text1);
  centerprint(x2, Math.round((2 * height) / 3), 2.2, 255, text2);
}

export function drawzoomer(text, elapsed, posRow) {
  if (!text) return;
  const state = Math.max(1, elapsed);
  const widthFactor = 1000000.0 / state;

  if (widthFactor > 1.0) {
    let color = Math.min(255, Math.round((widthFactor - 1) * 255));
    const width = aa_imgwidth(context);
    const height = aa_imgheight(context);
    const y = Math.round((posRow * height) / 6);
    centerprint(width / 2, y, widthFactor * 0.8, color, text);
  }
}

export function message(text, state) {
  if (state > 0 && state < MAXPOS) {
    const width = aa_imgwidth(context);
    const height = aa_imgheight(context);
    const pp = (state * Math.PI * 2) / MAXPOS;
    const size = (1 + Math.cos(pp)) * 4 + 2;
    const pos = Math.round(height - (height * state) / MAXPOS);
    const color = Math.round(Math.sin(pp / 2) * 255);
    centerprint(width / 2, pos, size, color, text);
  }
}

export function blazinec(quote, count = 1) {
  const width = aa_imgwidth(context);
  const height = aa_imgheight(context);
  clrscr();

  // Random flashing background noise
  params.randomval = Math.random() > 0.5 ? 80 : 0;
  params.bright = Math.random() > 0.5 ? 40 : -40;

  centerprint(width / 2, height / 2, 3.0, 255, quote);
  aa_render(context);
  aa_flush(context);
}
