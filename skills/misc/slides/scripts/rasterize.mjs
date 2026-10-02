/**
 * rasterize.mjs — SVG to PNG, for figures that cannot be drawn with
 * shapes (a photo, a scanned schematic, anything a chart would lie
 * about).
 *
 *   import { rasterize, rasterizer } from './rasterize.mjs';
 *
 * Tries resvg, then rsvg-convert, and otherwise fails with the install
 * line to run. One implementation, so the deck builder and the preview
 * tool cannot disagree about what a rasterized figure looks like.
 */
import { execFileSync } from 'node:child_process';
import { existsSync } from 'node:fs';

const CANDIDATES = [
  { name: 'resvg', binary: '/opt/homebrew/bin/resvg', args: (svg, png, width) => ['-w', String(width), svg, png] },
  { name: 'resvg', binary: '/usr/local/bin/resvg', args: (svg, png, width) => ['-w', String(width), svg, png] },
  { name: 'resvg', binary: 'resvg', args: (svg, png, width) => ['-w', String(width), svg, png] },
  { name: 'rsvg-convert', binary: 'rsvg-convert', args: (svg, png, width) => ['-w', String(width), '-o', png, svg] }
];

let cached = null;

/** The rasterizer that is on this machine, or null. */
function rasterizer() {
  if (cached) { return cached; }
  for (const candidate of CANDIDATES) {
    const path = candidate.binary.includes('/') ? candidate.binary : null;
    if (path && !existsSync(path)) { continue; }
    try {
      execFileSync(candidate.binary, ['--version'], { stdio: 'ignore' });
      cached = candidate;
      return cached;
    } catch (error) {
      // Not installed, or not runnable: try the next one.
    }
  }
  return null;
}

/**
 * Rasterize an SVG at `width` pixels wide. Returns the PNG path.
 * Throws with the command to run when no rasterizer is installed.
 */
function rasterize(svgPath, pngPath, options = {}) {
  const width = options.width || 1600;
  const tool = rasterizer();
  if (!tool) {
    throw new Error(
      'No SVG rasterizer found. Install one:\n' +
      '  brew install resvg        (or: npm install -g @resvg/resvg-js)\n' +
      '  apt-get install librsvg2-bin\n' +
      'Then re-run: ' + svgPath + ' -> ' + pngPath
    );
  }
  execFileSync(tool.binary, tool.args(svgPath, pngPath, width), { stdio: 'pipe' });
  return pngPath;
}

export { rasterize, rasterizer };
