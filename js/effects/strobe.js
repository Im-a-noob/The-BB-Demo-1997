// Ported from original bb.h and scene1.c
// Implements stroboscopic lighting, flashes, and attribute cycling

import { params } from "../aalib-setup.js";

let strobeActive = false;
let strobePhase = 0;

export function strobikstart(intensity = 80) {
  strobeActive = true;
  strobePhase = 0;
  params.bright = intensity;
}

export function strobikend() {
  strobeActive = false;
  params.bright = 0;
  params.randomval = 0;
}

export function updateStrobe(step = 1) {
  if (!strobeActive) return;
  // Smoothly decay flash towards normal brightness
  if (params.bright > 0) {
    params.bright = Math.max(0, params.bright - step * 12);
  } else if (params.bright < 0) {
    params.bright = Math.min(0, params.bright + step * 12);
  }
}

export function flash(intensity = 150) {
  params.bright = intensity;
}

export function decayFlash(rate = 10) {
  if (params.bright > 0) {
    params.bright = Math.max(0, params.bright - rate);
  } else if (params.bright < 0) {
    params.bright = Math.min(0, params.bright + rate);
  }
}

