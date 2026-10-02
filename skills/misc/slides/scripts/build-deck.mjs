#!/usr/bin/env node
/**
 * build-deck.mjs — splice a deck spec into the engine.
 *
 *   node scripts/build-deck.mjs <deck.json> <out.gs>
 *
 * Reads the authored deck (JSON), writes the single .gs file the user
 * pastes into script.google.com. The engine is never re-derived: this
 * replaces the marked DECK block inside assets/deck-builder.gs, so
 * every deck ships the same tested machinery.
 */
import { readFileSync, writeFileSync, mkdtempSync, realpathSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { tmpdir } from 'node:os';
import { fileURLToPath } from 'node:url';
import { rasterize } from './rasterize.mjs';

const SKILL_DIR = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const ENGINE = join(SKILL_DIR, 'assets', 'deck-builder.gs');

const START = '/* >>> DECK */';
const END = '/* <<< DECK */';

/** The short form of a URL, for printing on a slide. */
const shortUrl = url => String(url).replace(/^https?:\/\//, '').replace(/\/$/, '');

/**
 * Fills in what the author should not have to paste: a QR's image
 * bytes, an activity's URL, and the bytes of a figure that is an
 * image rather than a drawing.
 *
 * Resolution happens once, before the splice, and every missing file
 * is an error: a deck that ships with an empty QR frame, a slide
 * telling students to scan a URL that does not exist, or a figure
 * frame with nothing in it, is worse than a failed build.
 */
export function hydrate(deck, deckPath) {
  const base = dirname(resolve(deckPath));
  const at = file => resolve(base, file);

  (deck.slides || []).forEach((slide, index) => {
    const where = `slide ${index + 1} (${slide.type})`;
    const artifact = slide.activity && slide.activity.artifact;

    if (artifact && artifact.activityJson) {
      let meta;
      try {
        meta = JSON.parse(readFileSync(at(artifact.activityJson), 'utf8'));
      } catch (error) {
        throw new Error(`${where}: cannot read the activity JSON (${artifact.activityJson}): ${error.message}`);
      }
      if (!meta.url) throw new Error(`${where}: ${artifact.activityJson} has no url — was it published?`);
      artifact.mode = artifact.mode || meta.mode;
      artifact.url = meta.url;
      artifact.displayUrl = shortUrl(meta.url);
      if (meta.qrPng && !slide.qr) {
        slide.qr = { pngFile: meta.qrPng, url: meta.url, label: slide.title };
      }
    }

    if (slide.qr && slide.qr.pngFile && !slide.qr.png) {
      try {
        slide.qr.png = readFileSync(at(slide.qr.pngFile)).toString('base64');
      } catch (error) {
        throw new Error(`${where}: cannot read the QR image (${slide.qr.pngFile}): ${error.message}`);
      }
      delete slide.qr.pngFile;
    }

    if (slide.figure && slide.figure.kind === 'image' && !slide.figure.png) {
      hydrateFigure(slide.figure, at, where);
    }
  });

  return deck;
}

/**
 * An image figure ships as bytes. An SVG is rasterized at 1600px wide
 * — wide enough for a projector, and the numbers on it stay legible —
 * and the picture's proportions travel with it, so the engine can fit
 * it to the box instead of stretching it.
 */
function hydrateFigure(figure, at, where) {
  const source = figure.svgFile || figure.pngFile;
  if (!source) {
    throw new Error(`${where}: the image figure names no svgFile or pngFile`);
  }

  let bytes;
  try {
    bytes = readFileSync(at(source));
  } catch (error) {
    throw new Error(`${where}: cannot read the figure image (${source}): ${error.message}`);
  }

  if (figure.svgFile) {
    figure.aspect = figure.aspect || svgAspect(bytes.toString('utf8')) || null;
    const out = join(mkdtempSync(join(tmpdir(), 'figure-')), 'figure.png');
    try {
      rasterize(at(source), out, { width: 1600 });
    } catch (error) {
      throw new Error(`${where}: cannot rasterize ${source}: ${error.message}`);
    }
    figure.png = readFileSync(out).toString('base64');
  } else {
    figure.aspect = figure.aspect || pngAspect(bytes) || null;
    figure.png = bytes.toString('base64');
  }

  delete figure.svgFile;
  delete figure.pngFile;
}

/** An SVG's proportions, from its viewBox or its width and height. */
function svgAspect(svg) {
  const viewBox = svg.match(/viewBox\s*=\s*["']([^"']+)["']/);
  if (viewBox) {
    const parts = viewBox[1].trim().split(/[\s,]+/).map(Number);
    if (parts.length === 4 && parts[2] > 0 && parts[3] > 0) {
      return parts[2] / parts[3];
    }
  }
  const width = svg.match(/\bwidth\s*=\s*["']([\d.]+)/);
  const height = svg.match(/\bheight\s*=\s*["']([\d.]+)/);
  if (width && height && Number(height[1]) > 0) {
    return Number(width[1]) / Number(height[1]);
  }
  return null;
}

/** A PNG's proportions, read from its header. */
function pngAspect(bytes) {
  if (bytes.length < 24) { return null; }
  const width = bytes.readUInt32BE(16);
  const height = bytes.readUInt32BE(20);
  return height > 0 ? width / height : null;
}

/** Source for a .gs file whose DECK block holds `deck`. Throws on a malformed engine. */
export function buildSource(deck) {
  const engine = readFileSync(ENGINE, 'utf8');
  const start = engine.indexOf(START);
  const end = engine.indexOf(END);

  if (start < 0 || end < 0 || end < start) {
    throw new Error(`engine is missing its ${START} / ${END} markers`);
  }

  const body = JSON.stringify(deck, null, 2);
  const spliced =
    engine.slice(0, start + START.length) +
    '\n\nconst DECK = ' + body + ';\n\n' +
    engine.slice(end);

  // Parse-only compile: catches a syntax error here rather than in the
  // user's Apps Script editor. The body never runs.
  new Function(spliced);

  return spliced;
}

function main() {
  const [, , deckPath, outPath] = process.argv;
  if (!deckPath || !outPath) {
    console.error('usage: node scripts/build-deck.mjs <deck.json> <out.gs>');
    process.exit(2);
  }

  const deck = hydrate(JSON.parse(readFileSync(deckPath, 'utf8')), deckPath);
  const source = buildSource(deck);
  writeFileSync(outPath, source);

  const slides = Array.isArray(deck.slides) ? deck.slides.length : 0;
  const withQr = (deck.slides || []).filter(slide => slide.qr && slide.qr.png).length;
  console.log(`wrote ${outPath} — ${slides} slides, ${withQr} QR image(s), ${source.length} bytes`);
  (deck.slides || []).forEach((slide, index) => {
    const artifact = slide.activity && slide.activity.artifact;
    if (artifact && artifact.url) console.log(`  slide ${index + 1}: ${artifact.mode} activity → ${artifact.url}`);
  });
}

/*
 * Run only when invoked as a script, not when imported by the tests.
 * import.meta.url is always the real path, but argv[1] arrives as typed,
 * and this skill is routinely run through the ~/.agents/skills symlink.
 * Comparing resolve(argv[1]) fails under a symlink: main() never runs,
 * the CLI prints nothing and exits 0, and a dead build looks successful.
 * Compare real paths instead.
 */
const isEntryPoint = () => {
  if (!process.argv[1]) return false;
  try {
    return realpathSync(process.argv[1]) === fileURLToPath(import.meta.url);
  } catch {
    return false;
  }
};

if (isEntryPoint()) {
  main();
}
