// Ported from original scene3.c
// Multi-frequency plasma interference calculation with cosine zoom tables

import {
  context,
  aa_imgwidth,
  aa_imgheight,
  aa_putpixel,
  aa_render,
  aa_flush,
  params,
  centerprint,
} from "../aalib-setup.js";

const MINZOOM = 0.8;
const MAXZOOM = 2.7;
const ZOOMSTEP = 0.01;
const ZTABSIZE = Math.floor((MAXZOOM - MINZOOM) / ZOOMSTEP); // 190

let PlasmaTbl = null;
let Pal = [new Uint8Array(256), new Uint8Array(256)];
let TempPal = new Uint8Array(256);

let pos1 = 0,
  pos2 = 0,
  pos3 = 0,
  pos4 = 0;
let pnum = 0;
let dir = 1;
let m = 0,
  n = 0,
  f = 0;

function compute_custom_palette() {
  for (let i = 0; i < 64; i++) {
    Pal[0][i] = i * 4;
    Pal[1][i] = i * 1;
  }
  for (let i = 64; i < 128; i++) {
    Pal[0][i] = (128 - i) * 4;
    Pal[1][i] = (128 - i) * 1;
  }
  for (let i = 128; i < 192; i++) {
    Pal[0][i] = (i - 128) * 1;
    Pal[1][i] = (i - 128) * 4;
  }
  for (let i = 192; i < 256; i++) {
    Pal[0][i] = (256 - i) * 1;
    Pal[1][i] = (256 - i) * 4;
  }
}

export function initPlasma() {
  compute_custom_palette();
  PlasmaTbl = new Int8Array(ZTABSIZE * 256);

  let p = 0;
  for (let czoom = MINZOOM; p < ZTABSIZE; czoom += ZOOMSTEP, p++) {
    const p4 = czoom * czoom * czoom * czoom;
    for (let i = 0; i < 256; i++) {
      const angle = (i * 256) / 180;
      const rad = (angle * Math.PI) / 180;
      PlasmaTbl[(p << 8) + i] = Math.round((Math.cos(rad) * 256) / p4);
    }
  }

  pos1 = 0;
  pos2 = 0;
  pos3 = 0;
  pos4 = 0;
  pnum = 0;
  dir = 1;
  m = 0;
  n = 0;
  f = 0;
}

function move_plasma() {
  pos1 = (pos1 - 4 - Math.floor(Math.random() * 2) + 256) % 256;
  pos3 = (pos3 + 4 + Math.floor(Math.random() * 1)) % 256;
  pos2 = (pos2 - Math.floor(Math.random() * 2) + 256) % 256;
  pos4 = (pos4 - Math.floor(Math.random() * 2) + 256) % 256;

  pnum += dir;
  if (pnum >= ZTABSIZE - 2) dir = -1;
  else if (pnum <= 0) dir = 1;
}

function cplasma(dest, src, temp, step) {
  for (let j = 0; j < 256; j++) {
    temp[j] = src[j] + Math.round(((dest[j] - src[j]) * step) / 64);
  }
}

export function stepPlasma(step = 1, remainingTime = 10000000) {
  if (remainingTime < 3000000) {
    params.bright -= step * 2;
  } else {
    params.bright -= step * 2;
    if (params.bright < 0) params.bright = 0;
  }

  f += step;
  if (f > 64) {
    f = 0;
    m = n;
    n = Math.floor(Math.random() * 2);
  }
  cplasma(Pal[n], Pal[m], TempPal, f);

  for (let i = 0; i < step; i++) {
    move_plasma();
  }
}

export function drawPlasma(activeMessage = null) {
  if (!PlasmaTbl) initPlasma();

  const width = aa_imgwidth(context);
  const height = aa_imgheight(context);
  let p3 = pos3;
  let p4 = pos4;

  const pOff = pnum << 8;

  for (let i = 0; i < width; i++) {
    let p1 = pos1;
    let p2 = pos2;
    for (let j = 0; j < height; j++) {
      const idx =
        (PlasmaTbl[pOff + p1] +
          PlasmaTbl[pOff + p2] +
          PlasmaTbl[pOff + p3] +
          PlasmaTbl[pOff + p4] +
          PlasmaTbl[pOff + (i & 0xff)] +
          PlasmaTbl[pOff + (j & 0xff)]) &
        0xff;

      const color = TempPal[idx] || 0;
      aa_putpixel(context, i, j, color);

      p1 = (p1 + 3) & 0xff;
      p2 = (p2 + 1) & 0xff;
    }
    p3 = (p3 + 2) & 0xff;
    p4 = (p4 + 3) & 0xff;
  }

  if (activeMessage) {
    centerprint(width / 2, height / 2, 2.5, 255, activeMessage);
  }

  aa_render(context);
  aa_flush(context);
}
