// Ported from scene7.c, julia.c, and XaoS fast fractal algorithms
// Real-time Mandelbrot zoomer and morphing Julia sets

import {
  context,
  aa_imgwidth,
  aa_imgheight,
  aa_putpixel,
  aa_render,
  aa_flush,
} from "../aalib-setup.js";

export class FractalEngine {
  constructor() {
    this.zoomLevel = 1.0;
    this.centerX = -0.743643887037158704752191506114774;
    this.centerY = 0.131825904205311970493132056385139;
    this.targetCenterX = -0.743643887037158704752191506114774;
    this.targetCenterY = 0.131825904205311970493132056385139;
    this.juliaCr = -0.7;
    this.juliaCi = 0.27015;
    this.colorCycle = 0;
  }

  resetMandelbrot() {
    this.zoomLevel = 1.0;
    this.colorCycle = 0;
  }

  stepMandelbrot(zoomSpeed = 1.04) {
    this.zoomLevel *= zoomSpeed;
    this.colorCycle += 2;
  }

  renderMandelbrot(maxIter = 60) {
    const width = aa_imgwidth(context);
    const height = aa_imgheight(context);

    const aspect = width / height;
    const rangeY = 2.4 / this.zoomLevel;
    const rangeX = rangeY * aspect;

    const minX = this.centerX - rangeX / 2;
    const minY = this.centerY - rangeY / 2;

    const dx = rangeX / width;
    const dy = rangeY / height;

    for (let y = 0; y < height; y++) {
      const cy = minY + y * dy;
      for (let x = 0; x < width; x++) {
        const cx = minX + x * dx;
        let zx = 0;
        let zy = 0;
        let iter = 0;

        while (zx * zx + zy * zy < 4.0 && iter < maxIter) {
          const xtemp = zx * zx - zy * zy + cx;
          zy = 2.0 * zx * zy + cy;
          zx = xtemp;
          iter++;
        }

        let val = 0;
        if (iter < maxIter) {
          // Continuous coloring
          val = ((iter * 8 + this.colorCycle) % 255) + 1;
        }

        aa_putpixel(context, x, y, val);
      }
    }

    aa_render(context);
    aa_flush(context);
  }

  renderJulia(cr, ci, maxIter = 50) {
    const width = aa_imgwidth(context);
    const height = aa_imgheight(context);

    const aspect = width / height;
    const rangeY = 2.4;
    const rangeX = rangeY * aspect;

    const minX = -rangeX / 2;
    const minY = -rangeY / 2;

    const dx = rangeX / width;
    const dy = rangeY / height;

    this.colorCycle++;

    for (let y = 0; y < height; y++) {
      const cy = minY + y * dy;
      for (let x = 0; x < width; x++) {
        let zx = minX + x * dx;
        let zy = cy;
        let iter = 0;

        while (zx * zx + zy * zy < 4.0 && iter < maxIter) {
          const xtemp = zx * zx - zy * zy + cr;
          zy = 2.0 * zx * zy + ci;
          zx = xtemp;
          iter++;
        }

        let val = 0;
        if (iter < maxIter) {
          val = ((iter * 12 + this.colorCycle) % 255) + 1;
        }

        aa_putpixel(context, x, y, val);
      }
    }

    aa_render(context);
    aa_flush(context);
  }
}

export const fractalEngine = new FractalEngine();
