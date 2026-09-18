// Ported from tex.c and torus.h
// 3D Torus (donut) wireframe and Gouraud/flat shaded polygon rendering

import { TORUS_FACES } from "./torusData.js";
import {
  context,
  aa_imgwidth,
  aa_imgheight,
  aa_putpixel,
  aa_render,
  aa_flush,
} from "../aalib-setup.js";

// Precalculated sine and cosine lookup tables (0..359)
const coss = new Int32Array(360);
const sinn = new Int32Array(360);

for (let i = 0; i < 360; i++) {
  const rad = (i * Math.PI) / 180;
  coss[i] = Math.round(Math.cos(rad) * 65536);
  sinn[i] = Math.round(Math.sin(rad) * 65536);
}

export class Torus3D {
  constructor() {
    this.faces = TORUS_FACES;
    this.alfa = 0;
    this.beta = 0;
    this.gama = 0;
    this.centerX = 0;
    this.centerY = 0;
    this.centerZ = 160;
    this.zoom = 1.0;
  }

  setRotation(a, b, g) {
    this.alfa = ((Math.round(a) % 360) + 360) % 360;
    this.beta = ((Math.round(b) % 360) + 360) % 360;
    this.gama = ((Math.round(g) % 360) + 360) % 360;
  }

  setCenter(x, y, z) {
    this.centerX = x;
    this.centerY = y;
    this.centerZ = z;
  }

  setZoom(z) {
    this.zoom = z;
  }

  draw() {
    const width = aa_imgwidth(context);
    const height = aa_imgheight(context);
    const halfW = width / 2;
    const halfH = height / 2;

    const ca = coss[this.alfa],
      sa = sinn[this.alfa];
    const cb = coss[this.beta],
      sb = sinn[this.beta];
    const cg = coss[this.gama],
      sg = sinn[this.gama];

    // Clear buffer
    context.imagebuffer.fill(0);

    const projectedFaces = [];

    for (let f = 0; f < this.faces.length; f++) {
      const poly = this.faces[f];
      const pts = [];
      let avgZ = 0;

      for (let j = 0; j < 3; j++) {
        let x = poly[j].x + this.centerX;
        let y = poly[j].y + this.centerY;
        let z = poly[j].z + this.centerZ;

        // Rotation around alfa (Z-X)
        let rx = (z * ca - x * sa) >> 16;
        let rz = (z * sa + x * ca) >> 16;

        // Rotation around beta (Y-Z)
        let ry = y;
        let ry2 = (ry * cb - rz * sb) >> 16;
        rz = (ry * sb + rz * cb) >> 16;

        // Rotation around gama (Y-X)
        let rx2 = (ry2 * cg - rx * sg) >> 16;
        ry = (ry2 * sg + rx * cg) >> 16;
        rx = rx2;

        const depth = rz + 180;
        if (depth <= 10) continue;

        const fov = 140 * this.zoom;
        const sx = Math.round(halfW + (rx * fov) / depth);
        const sy = Math.round(halfH + (ry * fov) / depth);

        // Light normal dot product for shading
        let nx = poly[j].nx;
        let ny = poly[j].ny;
        let nz = poly[j].nz;
        let shade = Math.max(0, Math.min(255, Math.round(128 + (nx * 50 + ny * 50 - nz * 80) / 8192)));

        pts.push({ x: sx, y: sy, z: depth, shade });
        avgZ += depth;
      }

      if (pts.length === 3) {
        // Backface culling
        const cross = (pts[1].x - pts[0].x) * (pts[2].y - pts[0].y) - (pts[1].y - pts[0].y) * (pts[2].x - pts[0].x);
        if (cross > 0) {
          projectedFaces.push({ pts, z: avgZ / 3 });
        }
      }
    }

    // Painter's algorithm sort
    projectedFaces.sort((a, b) => b.z - a.z);

    // Render triangles into imagebuffer
    for (let i = 0; i < projectedFaces.length; i++) {
      const { pts } = projectedFaces[i];
      this.rasterizeTriangle(pts[0], pts[1], pts[2], width, height);
    }

    aa_render(context);
    aa_flush(context);
  }

  rasterizeTriangle(p0, p1, p2, width, height) {
    // Wireframe edges + solid scanline fill
    const avgShade = Math.round((p0.shade + p1.shade + p2.shade) / 3);
    const edgeShade = Math.min(255, avgShade + 50);

    // Draw lines
    this.drawLine(p0.x, p0.y, p1.x, p1.y, edgeShade, width, height);
    this.drawLine(p1.x, p1.y, p2.x, p2.y, edgeShade, width, height);
    this.drawLine(p2.x, p2.y, p0.x, p0.y, edgeShade, width, height);

    // Simple rasterization
    const minY = Math.max(0, Math.min(p0.y, p1.y, p2.y));
    const maxY = Math.min(height - 1, Math.max(p0.y, p1.y, p2.y));

    for (let y = minY; y <= maxY; y++) {
      let xMin = width,
        xMax = -1;

      // Find scanline intersections
      const edges = [
        [p0, p1],
        [p1, p2],
        [p2, p0],
      ];
      for (let e = 0; e < 3; e++) {
        const [a, b] = edges[e];
        if ((a.y <= y && b.y > y) || (b.y <= y && a.y > y)) {
          const t = (y - a.y) / (b.y - a.y);
          const x = Math.round(a.x + t * (b.x - a.x));
          if (x < xMin) xMin = x;
          if (x > xMax) xMax = x;
        }
      }

      xMin = Math.max(0, xMin);
      xMax = Math.min(width - 1, xMax);

      for (let x = xMin; x <= xMax; x++) {
        aa_putpixel(context, x, y, avgShade);
      }
    }
  }

  drawLine(x0, y0, x1, y1, color, width, height) {
    const dx = Math.abs(x1 - x0);
    const dy = Math.abs(y1 - y0);
    const sx = x0 < x1 ? 1 : -1;
    const sy = y0 < y1 ? 1 : -1;
    let err = dx - dy;

    let x = x0;
    let y = y0;

    while (true) {
      if (x >= 0 && x < width && y >= 0 && y < height) {
        aa_putpixel(context, x, y, color);
      }
      if (x === x1 && y === y1) break;
      const e2 = 2 * err;
      if (e2 > -dy) {
        err -= dy;
        x += sx;
      }
      if (e2 < dx) {
        err += dx;
        y += sy;
      }
    }
  }
}

export const torusEffect = new Torus3D();
