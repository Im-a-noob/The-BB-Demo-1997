// aalib-setup.js - Initialization and bridge for aalib.js
// Provides the virtual framebuffer, Floyd-Steinberg dithering, and original AA-lib C API emulation

export const AA_NORMAL = 0;
export const AA_BOLD = 1;
export const AA_DIM = 2;
export const AA_REVERSE = 3;
export const AA_SPECIAL = 4;

export const AA_NONE = 0;
export const AA_FLOYD_S = 1;

export class AAContext {
  constructor(cols = 80, rows = 35) {
    this.cols = cols;
    this.rows = rows;
    
    // Virtual image buffer resolution (2x character grid for crisp sampling)
    this.imgWidth = cols * 2;
    this.imgHeight = rows * 2;

    this.imagebuffer = new Uint8Array(this.imgWidth * this.imgHeight);
    this.textbuffer = new Array(cols * rows).fill("");
    this.attrbuffer = new Uint8Array(cols * rows).fill(AA_NORMAL);

    this.params = {
      bright: 0,
      contrast: 100,
      dither: AA_FLOYD_S,
      randomval: 0,
    };

    // Offscreen rendering canvas & ImageData
    if (typeof document !== "undefined") {
      this.canvas = document.createElement("canvas");
      this.canvas.width = this.imgWidth;
      this.canvas.height = this.imgHeight;
      this.ctx = this.canvas.getContext("2d", { willReadFrequently: true });
      this.imageData = this.ctx.createImageData(this.imgWidth, this.imgHeight);
    } else {
      this.canvas = null;
      this.ctx = null;
      this.imageData = null;
    }

    // Target HTML elements
    this.preElement = null;
    this.screenContainer = null;
    this.phosphor = "white"; // 'white' | 'green' | 'amber'
    this.scanlines = true;

    // Direct character render cache
    this.cachedChars = null;
    this.fontMap = null;
  }

  init(preElement, screenContainer) {
    this.preElement = preElement;
    this.screenContainer = screenContainer;
    this.setupFontMap();
  }

  // Precompute ASCII character brightnesses matching aalib
  setupFontMap() {
    const charset = " .'`^\",:;Il!i><~+_-?][}{1)(|\\/tfjrxnuvczXYUJCLQ0OZmwqpdbkhao*#MW&8%B@$";
    this.fontMap = charset.split("");
  }

  setPhosphor(theme) {
    this.phosphor = theme;
    if (this.screenContainer) {
      this.screenContainer.classList.remove("theme-white", "theme-green", "theme-amber");
      this.screenContainer.classList.add(`theme-${theme}`);
    }
  }

  toggleScanlines() {
    this.scanlines = !this.scanlines;
    if (this.screenContainer) {
      this.screenContainer.classList.toggle("scanlines-enabled", this.scanlines);
    }
    return this.scanlines;
  }
}

export let context = new AAContext(80, 35);
export const params = context.params;

export function aa_imgwidth(ctx = context) {
  return ctx.imgWidth;
}

export function aa_imgheight(ctx = context) {
  return ctx.imgHeight;
}

export function aa_scrwidth(ctx = context) {
  return ctx.cols;
}

export function aa_scrheight(ctx = context) {
  return ctx.rows;
}

export function aa_putpixel(ctx, x, y, color) {
  if (x < 0 || x >= ctx.imgWidth || y < 0 || y >= ctx.imgHeight) return;
  ctx.imagebuffer[y * ctx.imgWidth + x] = Math.max(0, Math.min(255, color));
}

export function aa_getpixel(ctx, x, y) {
  if (x < 0 || x >= ctx.imgWidth || y < 0 || y >= ctx.imgHeight) return 0;
  return ctx.imagebuffer[y * ctx.imgWidth + x];
}

export function aa_puts(ctx, x, y, attr, text) {
  if (y < 0 || y >= ctx.rows) return;
  const str = String(text);
  for (let i = 0; i < str.length; i++) {
    const px = x + i;
    if (px >= 0 && px < ctx.cols) {
      const idx = y * ctx.cols + px;
      ctx.textbuffer[idx] = str[i];
      ctx.attrbuffer[idx] = attr;
    }
  }
}

export function clrscr(ctx = context) {
  ctx.imagebuffer.fill(0);
  ctx.textbuffer.fill("");
  ctx.attrbuffer.fill(AA_NORMAL);
  if (ctx.ctx) {
    ctx.ctx.clearRect(0, 0, ctx.imgWidth, ctx.imgHeight);
  }
}

export function textclrscr(ctx = context) {
  ctx.textbuffer.fill("");
  ctx.attrbuffer.fill(AA_NORMAL);
}

// Convert ASCII text buffer back to imagebuffer (used in scene4 before fire!)
export function backconvert(x1, y1, x2, y2, ctx = context) {
  const pixelW = Math.floor(ctx.imgWidth / ctx.cols);
  const pixelH = Math.floor(ctx.imgHeight / ctx.rows);

  for (let y = y1; y < y2; y++) {
    for (let x = x1; x < x2; x++) {
      const ch = ctx.textbuffer[y * ctx.cols + x];
      if (ch && ch !== " ") {
        const val = 220;
        for (let dy = 0; dy < pixelH; dy++) {
          for (let dx = 0; dx < pixelW; dx++) {
            const py = y * pixelH + dy;
            const px = x * pixelW + dx;
            if (px < ctx.imgWidth && py < ctx.imgHeight) {
              ctx.imagebuffer[py * ctx.imgWidth + px] = val;
            }
          }
        }
      }
    }
  }
}

// Emulate centerprint from original AA-lib
export function centerprint(x, y, size, color, text, font = 0, ctx = context) {
  if (!text || !ctx.ctx) return;
  const str = String(text);
  const pxSize = Math.max(1, Math.round(size * 12));
  
  // Clear canvas before drawing this text to avoid accumulating old pixels
  ctx.ctx.clearRect(0, 0, ctx.imgWidth, ctx.imgHeight);
  ctx.ctx.save();
  ctx.ctx.font = `bold ${pxSize}px monospace`;
  ctx.ctx.textAlign = "center";
  ctx.ctx.textBaseline = "middle";
  ctx.ctx.fillStyle = `rgb(${color}, ${color}, ${color})`;
  ctx.ctx.fillText(str, x, y);
  ctx.ctx.restore();

  // Copy drawn canvas region to imagebuffer
  const imgData = ctx.ctx.getImageData(0, 0, ctx.imgWidth, ctx.imgHeight);
  for (let i = 0; i < ctx.imagebuffer.length; i++) {
    if (imgData.data[i * 4] > 0) {
      ctx.imagebuffer[i] = Math.max(ctx.imagebuffer[i], imgData.data[i * 4]);
    }
  }

  // Clear canvas immediately after copying so subsequent calls start clean
  ctx.ctx.clearRect(0, 0, ctx.imgWidth, ctx.imgHeight);
}

// Print text directly into imagebuffer with specified width and height
export function print(x, y, width, height, font, color, text, ctx = context) {
  if (!text || width <= 0 || height <= 0 || !ctx.ctx) return;
  const str = String(text);

  ctx.ctx.clearRect(0, 0, ctx.imgWidth, ctx.imgHeight);
  ctx.ctx.save();
  const fontSize = Math.max(6, Math.round(height));
  ctx.ctx.font = `bold ${fontSize}px monospace`;
  ctx.ctx.textAlign = "left";
  ctx.ctx.textBaseline = "top";
  ctx.ctx.fillStyle = `rgb(${color}, ${color}, ${color})`;
  ctx.ctx.fillText(str, x, y);
  ctx.ctx.restore();

  const imgData = ctx.ctx.getImageData(0, 0, ctx.imgWidth, ctx.imgHeight);
  for (let i = 0; i < ctx.imagebuffer.length; i++) {
    if (imgData.data[i * 4] > 0) {
      ctx.imagebuffer[i] = Math.max(ctx.imagebuffer[i], imgData.data[i * 4]);
    }
  }

  ctx.ctx.clearRect(0, 0, ctx.imgWidth, ctx.imgHeight);
}

/**
 * Floyd-Steinberg error diffusion dithering on 2D grayscale grid
 */
function applyFloydSteinberg(src, width, height, contrast, bright, randomVal) {
  const buf = new Float32Array(width * height);
  const cMul = contrast / 100;
  
  // Apply contrast, bright, and noise
  for (let i = 0; i < src.length; i++) {
    let val = (src[i] - 128) * cMul + 128 + bright;
    if (randomVal > 0) {
      val += (Math.random() - 0.5) * randomVal * 0.8;
    }
    buf[i] = Math.max(0, Math.min(255, val));
  }

  const out = new Uint8Array(width * height);
  const numLevels = 16;
  const step = 255 / (numLevels - 1);

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const idx = y * width + x;
      const oldVal = buf[idx];
      const quantized = Math.round(oldVal / step) * step;
      const clamped = Math.max(0, Math.min(255, quantized));
      out[idx] = clamped;
      const error = oldVal - clamped;

      if (x + 1 < width) {
        buf[idx + 1] += (error * 7) / 16;
      }
      if (y + 1 < height) {
        if (x - 1 >= 0) {
          buf[idx + width - 1] += (error * 3) / 16;
        }
        buf[idx + width] += (error * 5) / 16;
        if (x + 1 < width) {
          buf[idx + width + 1] += (error * 1) / 16;
        }
      }
    }
  }

  return out;
}

/**
 * Main rendering routine: converts imagebuffer to ASCII using aalib.js
 * and composites over the textbuffer
 */
export function aa_render(ctx = context, p = ctx.params) {
  if (!ctx.preElement) return;

  const cols = ctx.cols;
  const rows = ctx.rows;
  const imgW = ctx.imgWidth;
  const imgH = ctx.imgHeight;

  // Detect if styled text attributes (reverse, bold, dim) are active
  let hasSpecialAttrs = false;
  for (let i = 0; i < ctx.attrbuffer.length; i++) {
    if (ctx.attrbuffer[i] !== AA_NORMAL && ctx.textbuffer[i]) {
      hasSpecialAttrs = true;
      break;
    }
  }

  // Process imagebuffer with Floyd-Steinberg or direct scaling
  let processedPixels;
  if (p.dither === AA_FLOYD_S) {
    processedPixels = applyFloydSteinberg(ctx.imagebuffer, imgW, imgH, p.contrast, p.bright, p.randomval);
  } else {
    processedPixels = new Uint8Array(imgW * imgH);
    const cMul = p.contrast / 100;
    for (let i = 0; i < ctx.imagebuffer.length; i++) {
      let val = (ctx.imagebuffer[i] - 128) * cMul + 128 + p.bright;
      if (p.randomval > 0) {
        val += (Math.random() - 0.5) * p.randomval;
      }
      processedPixels[i] = Math.max(0, Math.min(255, val));
    }
  }

  // Downsample to cols x rows character blocks
  const blockW = imgW / cols;
  const blockH = imgH / rows;
  const chars = ctx.fontMap || " .:-=+*#%@".split("");
  const charCount = chars.length;

  function escapeChar(c) {
    if (c === "&") return "&amp;";
    if (c === "<") return "&lt;";
    if (c === ">") return "&gt;";
    if (c === '"') return "&quot;";
    return c;
  }

  let output = "";
  let currentAttr = -1;
  let spanOpen = false;

  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const textIdx = r * cols + c;
      const textChar = ctx.textbuffer[textIdx];

      // If textbuffer has an explicit character (non-empty string), render it
      if (textChar !== undefined && textChar !== null && textChar !== "") {
        const attr = ctx.attrbuffer[textIdx];
        if (hasSpecialAttrs) {
          if (attr !== currentAttr) {
            if (spanOpen) {
              output += "</span>";
              spanOpen = false;
            }
            if (attr === AA_REVERSE) {
              output += `<span class="aa-rev">`;
              spanOpen = true;
            } else if (attr === AA_BOLD || attr === AA_SPECIAL) {
              output += `<span class="aa-bold">`;
              spanOpen = true;
            } else if (attr === AA_DIM) {
              output += `<span class="aa-dim">`;
              spanOpen = true;
            }
            currentAttr = attr;
          }
          output += escapeChar(textChar);
        } else {
          output += textChar;
        }
      } else {
        // Sample pixel block from imagebuffer
        if (hasSpecialAttrs && currentAttr !== AA_NORMAL) {
          if (spanOpen) {
            output += "</span>";
            spanOpen = false;
          }
          currentAttr = AA_NORMAL;
        }

        let sum = 0;
        let count = 0;
        const startY = Math.floor(r * blockH);
        const endY = Math.floor((r + 1) * blockH);
        const startX = Math.floor(c * blockW);
        const endX = Math.floor((c + 1) * blockW);

        for (let py = startY; py < endY; py++) {
          const rowOff = py * imgW;
          for (let px = startX; px < endX; px++) {
            sum += processedPixels[rowOff + px];
            count++;
          }
        }

        const avg = count > 0 ? sum / count : 0;
        const charIdx = Math.min(charCount - 1, Math.floor((avg / 255) * charCount));
        const asciiChar = chars[charIdx] || " ";

        if (hasSpecialAttrs) {
          output += escapeChar(asciiChar);
        } else {
          output += asciiChar;
        }
      }
    }
    if (spanOpen) {
      output += "</span>";
      spanOpen = false;
      currentAttr = -1;
    }
    output += "\n";
  }

  if (hasSpecialAttrs) {
    ctx.preElement.innerHTML = output;
  } else {
    ctx.preElement.textContent = output;
  }
}

export function aa_flush(ctx = context) {
  if (ctx.ctx) {
    ctx.ctx.clearRect(0, 0, ctx.imgWidth, ctx.imgHeight);
  }
}
