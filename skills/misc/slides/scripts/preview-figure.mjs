#!/usr/bin/env node
/**
 * preview-figure.mjs — draw a deck's figures as one SVG, without
 * Google Slides.
 *
 *   node scripts/preview-figure.mjs                        # one of every figure kind
 *   node scripts/preview-figure.mjs deck.json              # a real deck
 *   node scripts/preview-figure.mjs deck.json --slide 4    # one slide
 *   node scripts/preview-figure.mjs --out figure.svg --png figure.png
 *
 * The geometry is the engine's: this runs the real .gs file against
 * the mock Slides service and paints the elements the engine asked
 * for. What the preview cannot know is the theme, so pages are drawn
 * with one modern theme's colors and a body size of 14 — enough to
 * judge whether a figure reads, and nothing more. Open the .svg when
 * you want to zoom into one.
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildSource, hydrate } from './build-deck.mjs';
import { runSource, PlaceholderType, PageElementType, ShapeType, ArrowStyle } from './mock-slides.mjs';
import { FIGURE_THEME, FIGURE_SAMPLES, FIGURE_TITLES } from './figure-fixtures.mjs';
import { rasterize, rasterizer } from './rasterize.mjs';

const HERE = dirname(fileURLToPath(import.meta.url));
const DECK_PATH = process.argv[2] && !process.argv[2].startsWith('--') ? process.argv[2] : null;
const option = name => {
  const i = process.argv.indexOf('--' + name);
  return i >= 0 ? process.argv[i + 1] : null;
};
const SVG_OUT = resolve(option('out') || 'figure-preview.svg');
const PNG_OUT = option('png') ? resolve(option('png')) : null;
const ONLY_SLIDE = option('slide') ? Number(option('slide')) - 1 : null;

/* One modern theme, so the drawings can be looked at. The engine
 * never picks these; it passes theme colors through. */
const COLORS = {
  DARK1: '#202124', LIGHT1: '#ffffff', DARK2: '#3c4043', LIGHT2: '#f1f3f4',
  ACCENT1: '#1a73e8', ACCENT2: '#188038', ACCENT3: '#f9ab00', ACCENT4: '#d93025',
  ACCENT5: '#9334e6', ACCENT6: '#12b5cb',
  TEXT1: '#202124', BACKGROUND1: '#ffffff', TEXT2: '#5f6368', BACKGROUND2: '#f8f9fa',
  HYPERLINK: '#1a73e8', FOLLOWED_HYPERLINK: '#9334e6'
};

const PAGE = { width: 720, height: 405 };
const GAP = 24;
const COLUMNS = 3;
const BODY_SIZE = 14;

const round = value => Math.round(value * 10) / 10;
const escapeText = value => String(value)
  .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

/** A fill or a line fill, as SVG paint attributes. */
function paint(fill) {
  if (!fill || fill.kind !== 'SOLID') { return 'fill="none"'; }
  const color = typeof fill.color === 'string'
    ? fill.color
    : COLORS[fill.color.type] || '#888888';
  return `fill="${color}" fill-opacity="${fill.alpha}"`;
}

function stroke(border) {
  if (!border || !border.isVisible()) { return 'stroke="none"'; }
  const fill = border.getLineFill().getSolidFill();
  const color = fill ? COLORS[fill.color.type] || '#888888' : '#888888';
  return `stroke="${color}" stroke-opacity="${fill ? fill.alpha : 1}" stroke-width="${border.getWeight()}"`;
}

function textBlock(text, box, options = {}) {
  const listed = options.bullets || [];
  const lines = String(text).split('\n')
    .map((line, index) => (listed[index] ? '• ' + line : line))
    .filter(line => line !== '');
  if (lines.length === 0) { return ''; }
  const size = options.size || BODY_SIZE;
  const anchor = options.align === 'CENTER' ? 'middle' : options.align === 'END' ? 'end' : 'start';
  const x = options.align === 'CENTER' ? box.left + box.width / 2
    : options.align === 'END' ? box.left + box.width : box.left;
  const lineHeight = size * 1.3;
  const first = options.valign === 'MIDDLE'
    ? box.top + box.height / 2 - ((lines.length - 1) * lineHeight) / 2 + size * 0.35
    : box.top + size;
  const fill = options.color || '#202124';
  const weight = options.bold ? ' font-weight="600"' : '';
  const spans = lines.map((line, index) =>
    `<tspan x="${round(x)}" y="${round(first + index * lineHeight)}">${escapeText(line)}</tspan>`
  ).join('');
  return `<text font-size="${size}"${weight} fill="${fill}" text-anchor="${anchor}" ` +
    `font-family="Helvetica, Arial, sans-serif">${spans}</text>`;
}

function arrowHead(line, color) {
  if (line.endArrow === ArrowStyle.NONE) { return ''; }
  const angle = Math.atan2(line.y2 - line.y1, line.x2 - line.x1);
  const size = 7;
  const tip = { x: line.x2, y: line.y2 };
  const back = {
    x: tip.x - Math.cos(angle) * size,
    y: tip.y - Math.sin(angle) * size
  };
  const side = { x: -Math.sin(angle) * size * 0.42, y: Math.cos(angle) * size * 0.42 };
  const points = [
    `${round(tip.x)},${round(tip.y)}`,
    `${round(back.x + side.x)},${round(back.y + side.y)}`,
    `${round(back.x - side.x)},${round(back.y - side.y)}`
  ].join(' ');
  return `<polygon points="${points}" fill="${color}"/>`;
}

function lineSvg(line) {
  const paint = line.lineFill.getSolidFill();
  const color = paint ? COLORS[paint.color.type] || '#888888' : '#888888';
  return `<line x1="${round(line.x1)}" y1="${round(line.y1)}" x2="${round(line.x2)}" y2="${round(line.y2)}" ` +
    `stroke="${color}" stroke-opacity="${paint ? paint.alpha : 1}" stroke-width="${line.weight}" ` +
    `stroke-linecap="round"/>` + arrowHead(line, color);
}

const boxOf = element => ({
  left: element.left, top: element.top, width: element.width, height: element.height
});

function shapeSvg(shape) {
  const box = boxOf(shape);
  const attributes =
    `x="${round(box.left)}" y="${round(box.top)}" ` +
    `width="${round(box.width)}" height="${round(box.height)}" ` +
    `${paint(shape.getFill())} ${stroke(shape.getBorder())}`;
  const body = shape.getShapeType() === ShapeType.ELLIPSE
    ? `<ellipse cx="${round(box.left + box.width / 2)}" cy="${round(box.top + box.height / 2)}" ` +
      `rx="${round(box.width / 2)}" ry="${round(box.height / 2)}" ${paint(shape.getFill())} ${stroke(shape.getBorder())}/>`
    : shape.getShapeType() === ShapeType.ROUND_RECTANGLE
      ? `<rect ${attributes} rx="8"/>`
      : `<rect ${attributes}/>`;
  const size = shape.fontSize || BODY_SIZE;
  return body + textBlock(shape.text(), box, {
    size: size, align: shape.paragraphAlignment || 'START',
    bullets: shape.paragraphs().map(paragraph => paragraph.inList === true),
    valign: shape.contentAlignment === 'MIDDLE' ? 'MIDDLE' : 'TOP',
    color: shape.getFill().isVisible() ? '#202124' : COLORS.TEXT1
  });
}

/** A rasterized figure, embedded as a data URI so the preview shows it. */
function imageSvg(image) {
  const box = boxOf(image);
  const href = image.blob && image.blob.bytes
    ? `data:${image.blob.type};base64,${image.blob.bytes}`
    : null;
  if (!href) {
    return `<rect x="${round(box.left)}" y="${round(box.top)}" width="${round(box.width)}" ` +
      `height="${round(box.height)}" fill="none" stroke="#9aa0a6" stroke-dasharray="4 4"/>`;
  }
  return `<image x="${round(box.left)}" y="${round(box.top)}" width="${round(box.width)}" ` +
    `height="${round(box.height)}" href="${href}" preserveAspectRatio="none"/>`;
}

function slideSvg(slide) {
  const parts = [];
  slide.placeholders.forEach(placeholder => {
    const shape = placeholder.asShape();
    const text = shape.text();
    if (!text) { return; }
    const isTitle = shape.getPlaceholderType() === PlaceholderType.TITLE ||
      shape.getPlaceholderType() === PlaceholderType.CENTERED_TITLE;
    parts.push(textBlock(text, boxOf(shape), {
      size: isTitle ? 24 : BODY_SIZE,
      align: isTitle ? 'CENTER' : 'START',
      bullets: shape.paragraphs().map(paragraph => paragraph.inList === true),
      bold: isTitle,
      color: COLORS.TEXT1
    }));
  });
  slide.getPageElements()
    .filter(element => element.getPageElementType() === PageElementType.IMAGE)
    .forEach(image => parts.push(imageSvg(image)));
  slide.getLines().forEach(line => parts.push(lineSvg(line)));
  slide.getShapes().forEach(shape => parts.push(shapeSvg(shape)));
  return parts.join('\n');
}

/* ------------------------- build ------------------------- */

/* A deck is previewed as it was written: hydrate fills in the QR and
 * figure image bytes from the files beside it, the same way the build
 * does, so what you look at is what will be built. */
const deck = DECK_PATH
  ? hydrate(JSON.parse(readFileSync(DECK_PATH, 'utf8')), DECK_PATH)
  : {
    meta: {
      title: 'Figure vocabulary', mode: 'teach', templateId: 'preview',
      audience: 'the review', objective: 'see every figure kind', sources: []
    },
    slides: Object.keys(FIGURE_SAMPLES).map(kind => ({
      type: 'figure',
      title: FIGURE_TITLES[kind],
      figure: FIGURE_SAMPLES[kind],
      notes: 'Preview only.'
    }))
  };

const { presentation } = runSource(buildSource(deck), FIGURE_THEME, {});
const slides = presentation.getSlides()
  .map((slide, index) => ({ slide, index }))
  .filter(entry => ONLY_SLIDE === null || entry.index === ONLY_SLIDE);

if (slides.length === 0) {
  console.error(`No slide ${ONLY_SLIDE + 1} in this deck (${presentation.getSlides().length} slides).`);
  process.exit(1);
}

const rows = Math.ceil(slides.length / COLUMNS);
const pages = slides.map(({ slide, index }, position) => {
  const column = position % COLUMNS;
  const row = Math.floor(position / COLUMNS);
  const kinds = (deck.slides[index] && deck.slides[index].figure && deck.slides[index].figure.kind) || '';
  return `<g transform="translate(${column * (PAGE.width + GAP)},${row * (PAGE.height + GAP)})">` +
    `<rect width="${PAGE.width}" height="${PAGE.height}" fill="#ffffff" stroke="#dadce0"/>` +
    slideSvg(slide) +
    `<text x="${PAGE.width - 10}" y="${PAGE.height - 10}" font-size="10" fill="#9aa0a6" ` +
    `text-anchor="end" font-family="Helvetica, Arial, sans-serif">slide ${index + 1} · ${escapeText(kinds)}</text>` +
    '</g>';
}).join('\n');

const svg = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="${COLUMNS * PAGE.width + (COLUMNS - 1) * GAP}" height="${rows * PAGE.height + (rows - 1) * GAP}" viewBox="0 0 ${COLUMNS * PAGE.width + (COLUMNS - 1) * GAP} ${rows * PAGE.height + (rows - 1) * GAP}">
<rect width="100%" height="100%" fill="#f1f3f4"/>
${pages}
</svg>
`;

writeFileSync(SVG_OUT, svg);
console.log(`${slides.length} slide${slides.length === 1 ? '' : 's'} → ${SVG_OUT}`);

if (PNG_OUT) {
  rasterize(SVG_OUT, PNG_OUT, { width: COLUMNS * PAGE.width * 2 });
  console.log(`rasterized → ${PNG_OUT} (${rasterizer().name})`);
}
