/**
 * mock-slides.mjs — a fake Slides service, runnable in a VM.
 *
 *   import { runSource } from './mock-slides.mjs';
 *
 * Apps Script code can only be exercised end to end inside Apps
 * Script, so this stands in for the service: the real .gs source is
 * executed against it, and it fails on any misuse of the documented
 * API — a method the service does not have, a PageElement reached
 * without asShape(), notes that never land, a shape type or an arrow
 * style that is not in the enum, a theme color the slide's scheme
 * does not carry. That is exactly the class of bug that otherwise
 * turns up as a TypeError in the user's editor after they have pasted
 * the script.
 *
 * Everything the engine inserts is recorded on the slide, so
 * tools/preview-figure.mjs can draw the same figure outside Google.
 */
import vm from 'node:vm';
import assert from 'node:assert/strict';

/* ------------------------- mock service ------------------------- */

const PlaceholderType = {
  NONE: 'NONE', BODY: 'BODY', CHART: 'CHART', CLIP_ART: 'CLIP_ART',
  CENTERED_TITLE: 'CENTERED_TITLE', DIAGRAM: 'DIAGRAM', DATE_AND_TIME: 'DATE_AND_TIME',
  FOOTER: 'FOOTER', HEADER: 'HEADER', MEDIA: 'MEDIA', OBJECT: 'OBJECT', PICTURE: 'PICTURE',
  SLIDE_NUMBER: 'SLIDE_NUMBER', SUBTITLE: 'SUBTITLE', TABLE: 'TABLE', TITLE: 'TITLE',
  SLIDE_IMAGE: 'SLIDE_IMAGE'
};
const PageElementType = { SHAPE: 'SHAPE', IMAGE: 'IMAGE', VIDEO: 'VIDEO', TABLE: 'TABLE', LINE: 'LINE' };
const ListPreset = { DISC_CIRCLE_SQUARE: 'DISC_CIRCLE_SQUARE' };

/* The figure enum values the engine may use. A name outside these is
 * a typo that would fail in the editor, so the mock refuses it. */
const ShapeType = {
  TEXT_BOX: 'TEXT_BOX', RECTANGLE: 'RECTANGLE', ROUND_RECTANGLE: 'ROUND_RECTANGLE',
  ELLIPSE: 'ELLIPSE'
};
const LineCategory = { STRAIGHT: 'STRAIGHT', BENT: 'BENT', CURVED: 'CURVED' };
const ArrowStyle = {
  NONE: 'NONE', STEALTH_ARROW: 'STEALTH_ARROW', OPEN_ARROW: 'OPEN_ARROW',
  FILL_ARROW: 'FILL_ARROW', FILL_CIRCLE: 'FILL_CIRCLE', FILL_SQUARE: 'FILL_SQUARE',
  FILL_DIAMOND: 'FILL_DIAMOND'
};
const ThemeColorType = {
  DARK1: 'DARK1', LIGHT1: 'LIGHT1', DARK2: 'DARK2', LIGHT2: 'LIGHT2',
  ACCENT1: 'ACCENT1', ACCENT2: 'ACCENT2', ACCENT3: 'ACCENT3', ACCENT4: 'ACCENT4',
  ACCENT5: 'ACCENT5', ACCENT6: 'ACCENT6', TEXT1: 'TEXT1', BACKGROUND1: 'BACKGROUND1',
  TEXT2: 'TEXT2', BACKGROUND2: 'BACKGROUND2', HYPERLINK: 'HYPERLINK',
  FOLLOWED_HYPERLINK: 'FOLLOWED_HYPERLINK'
};
const ContentAlignment = { TOP: 'TOP', MIDDLE: 'MIDDLE', BOTTOM: 'BOTTOM' };
const ParagraphAlignment = { START: 'START', CENTER: 'CENTER', END: 'END', JUSTIFY: 'JUSTIFY' };

const SCHEME = [
  ThemeColorType.DARK1, ThemeColorType.LIGHT1, ThemeColorType.DARK2, ThemeColorType.LIGHT2,
  ThemeColorType.ACCENT1, ThemeColorType.ACCENT2, ThemeColorType.ACCENT3,
  ThemeColorType.ACCENT4, ThemeColorType.ACCENT5, ThemeColorType.ACCENT6,
  ThemeColorType.TEXT1, ThemeColorType.BACKGROUND1, ThemeColorType.TEXT2,
  ThemeColorType.BACKGROUND2, ThemeColorType.HYPERLINK, ThemeColorType.FOLLOWED_HYPERLINK
];

const TEXTLY = [PlaceholderType.TITLE, PlaceholderType.CENTERED_TITLE, PlaceholderType.SUBTITLE,
  PlaceholderType.BODY, PlaceholderType.OBJECT];

const numeric = (value, what) =>
  assert.equal(typeof value, 'number', `${what} must be a number`) ||
  assert.ok(Number.isFinite(value), `${what} must be finite`);

/** A theme color, as getConcreteColor() hands it back. */
class Color {
  constructor(type) { this.type = type; }
  toString() { return this.type; }
}

class ColorScheme {
  constructor(colors = SCHEME) { this.colors = colors.slice(); }
  getThemeColors() { return this.colors.slice(); }
  getConcreteColor(type) {
    assert.ok(this.colors.includes(type),
      `getConcreteColor(${type}) is not one of this scheme's ${this.colors.length} colors`);
    return new Color(type);
  }
}

/** A fill: no fill, or a solid one with an optional alpha. */
class Fill {
  constructor() { this.kind = 'NONE'; this.color = null; this.alpha = null; }
  setSolidFill(color, alpha) {
    assert.ok(color instanceof Color || typeof color === 'string' || typeof color === 'number',
      'setSolidFill wants a Color, a hex string or rgb numbers');
    if (alpha !== undefined) {
      assert.equal(typeof alpha, 'number', 'alpha must be a number');
      assert.ok(alpha >= 0 && alpha <= 1, `alpha must be between 0 and 1, got ${alpha}`);
    }
    this.kind = 'SOLID';
    this.color = color;
    this.alpha = alpha === undefined ? 1 : alpha;
    return this;
  }
  setTransparent() { this.kind = 'NONE'; this.color = null; this.alpha = null; return this; }
  isVisible() { return this.kind !== 'NONE'; }
  getSolidFill() { return this.kind === 'SOLID' ? { color: this.color, alpha: this.alpha } : null; }
}

class LineFill extends Fill {}

class Border {
  constructor() { this.lineFill = new LineFill(); this.weight = 1; }
  setTransparent() { this.lineFill.setTransparent(); return this; }
  isVisible() { return this.lineFill.getSolidFill() !== null; }
  getLineFill() { return this.lineFill; }
  setWeight(points) {
    numeric(points, 'border weight');
    assert.ok(points > 0, 'border weight must be positive');
    this.weight = points;
    return this;
  }
  getWeight() { return this.weight; }
}

class TextStyle {
  constructor(shape, span = null) { this.shape = shape; this.span = span; }
  setFontSize(size) {
    numeric(size, 'font size');
    assert.ok(size > 0, 'font size must be positive');
    this.shape.fontSize = size;
    return this;
  }
  getFontSize() { return this.shape.fontSize; }
  // Real Slides styles a range, and the engine marks spans rather than
  // whole placeholders, so the span is what gets recorded here.
  setBold(value) {
    assert.equal(typeof value, 'boolean', 'setBold wants a boolean');
    if (value) this.shape.bold.push(this.span || [0, this.shape.text().length]);
    return this;
  }
}

class ParagraphStyle {
  constructor(shape) { this.shape = shape; }
  setParagraphAlignment(alignment) {
    assert.ok(Object.values(ParagraphAlignment).includes(alignment),
      `${alignment} is not a ParagraphAlignment`);
    this.shape.paragraphAlignment = alignment;
    return this;
  }
  getParagraphAlignment() { return this.shape.paragraphAlignment; }
}

class ListStyle {
  constructor(line) { this.line = line; }
  isInList() { return this.line.inList; }
  removeFromList() { this.line.inList = false; this.line.preset = null; return this; }
  applyListPreset(preset) { this.line.inList = true; this.line.preset = preset; return this; }
}

class Paragraph {
  constructor(shape, index) { this.shape = shape; this.index = index; }
  getRange() { return new TextRange(this.shape, this.index); }
}

class TextRange {
  constructor(shape, index, span = null) { this.shape = shape; this.index = index; this.span = span; }
  setText(text) {
    assert.equal(typeof text, 'string', 'setText requires a string');
    this.shape.lines = text.split('\n').map(line => ({
      text: line,
      inList: line === '' ? false : this.shape.inListFromLayout,
      preset: null
    }));
    this.shape.lines.push({ text: '', inList: false, preset: null });
    return this;
  }
  getParagraphs() { return this.shape.lines.map((_, i) => new Paragraph(this.shape, i)); }
  getListStyle() { return new ListStyle(this.shape.lines[this.index]); }
  // Offsets are taken from the start of the range they are derived
  // from, exactly as Apps Script documents them.
  getRange(startOffset, endOffset) {
    numeric(startOffset, 'start offset');
    numeric(endOffset, 'end offset');
    assert.ok(startOffset >= 0 && endOffset > startOffset,
      'a sub-range needs a start at or after 0 and an end past it');
    return new TextRange(this.shape, this.index, [startOffset, endOffset]);
  }
  getTextStyle() { return new TextStyle(this.shape, this.span); }
  getParagraphStyle() { return new ParagraphStyle(this.shape); }
  asString() { return this.shape.lines.map(l => l.text).join('\n'); }
}

class Shape {
  constructor(spec, inheritedList) {
    this.type = spec.type;
    this.shapeType = spec.shapeType || null;
    this.left = spec.left ?? 0;
    this.top = spec.top ?? 100;
    this.width = spec.width ?? 320;
    this.height = spec.height ?? 200;
    this.inListFromLayout = spec.listInLayout ?? inheritedList;
    this.hasText = spec.text === true;
    this.lines = [];
    this.fill = new Fill();
    this.border = new Border();
    this.contentAlignment = ContentAlignment.TOP;
    this.paragraphAlignment = null;
    this.fontSize = null;
    this.bold = [];
  }
  getPageElementType() { return PageElementType.SHAPE; }
  asShape() { return this; }
  getPlaceholderType() { return this.type; }
  getShapeType() { return this.shapeType; }
  getLeft() { return this.left; }
  getTop() { return this.top; }
  getWidth() { return this.width; }
  getHeight() { return this.height; }
  setLeft(left) { numeric(left, 'left'); this.left = left; return this; }
  setTop(top) { numeric(top, 'top'); this.top = top; return this; }
  setWidth(width) { numeric(width, 'width'); this.width = width; return this; }
  setHeight(height) { numeric(height, 'height'); this.height = height; return this; }
  getFill() { return this.fill; }
  getBorder() { return this.border; }
  setContentAlignment(alignment) {
    assert.ok(Object.values(ContentAlignment).includes(alignment),
      `${alignment} is not a ContentAlignment`);
    this.contentAlignment = alignment;
    return this;
  }
  getContentAlignment() { return this.contentAlignment; }
  getAutofit() { return TEXTLY.includes(this.type) ? {} : null; }
  getText() { return (this.hasText || TEXTLY.includes(this.type)) ? new TextRange(this, null) : null; }
  // assertions
  text() { return this.lines.slice(0, -1).map(l => l.text).join('\n'); }
  paragraphs() { return this.lines.slice(0, -1); }
  // What the reader sees in bold, so a test can assert on the rendered
  // emphasis rather than on the offsets that produced it.
  boldRuns() { return this.bold.map(([from, to]) => this.text().slice(from, to)); }
}

class LineElement {
  constructor(category, x1, y1, x2, y2) {
    this.category = category;
    this.x1 = x1; this.y1 = y1; this.x2 = x2; this.y2 = y2;
    this.weight = 1;
    this.startArrow = ArrowStyle.NONE;
    this.endArrow = ArrowStyle.NONE;
    this.lineFill = new LineFill();
    this.startSite = null;
    this.endSite = null;
  }
  getPageElementType() { return PageElementType.LINE; }
  asShape() { throw new Error('a line is not a shape'); }
  getLineCategory() { return this.category; }
  getLineFill() { return this.lineFill; }
  setWeight(points) {
    numeric(points, 'line weight');
    assert.ok(points > 0, 'line weight must be positive');
    this.weight = points;
    return this;
  }
  getWeight() { return this.weight; }
  arrow(style) {
    assert.ok(Object.values(ArrowStyle).includes(style), `${style} is not an ArrowStyle`);
    return style;
  }
  setStartArrow(style) { this.startArrow = this.arrow(style); return this; }
  setEndArrow(style) { this.endArrow = this.arrow(style); return this; }
  getStartArrow() { return this.startArrow; }
  getEndArrow() { return this.endArrow; }
  point(x, y) { return { getX: () => x, getY: () => y }; }
  getStart() { return this.point(this.x1, this.y1); }
  getEnd() { return this.point(this.x2, this.y2); }
  setStart(left, top) { this.x1 = left; this.y1 = top; return this; }
  setEnd(left, top) { this.x2 = left; this.y2 = top; return this; }
  setStartConnection(site) { this.startSite = site; return this; }
  setEndConnection(site) { this.endSite = site; return this; }
  isConnector() { return this.startSite !== null || this.endSite !== null; }
}

// getPlaceholders() hands back PageElements: shape methods exist only
// behind asShape(), as in the real service.
class PageElement {
  constructor(shape) { this.shape = shape; }
  getPageElementType() { return PageElementType.SHAPE; }
  asShape() { return this.shape; }
}

class ImageElement {
  constructor(blob, left, top, width, height) {
    this.blob = blob;
    this.left = left;
    this.top = top;
    this.width = width;
    this.height = height;
    this.description = null;
  }
  getPageElementType() { return PageElementType.IMAGE; }
  asShape() { throw new Error('an image element is not a shape'); }
  getLeft() { return this.left; }
  getTop() { return this.top; }
  getWidth() { return this.width; }
  getHeight() { return this.height; }
  asImage() { return this; }
  setDescription(description) {
    assert.equal(typeof description, 'string', 'setDescription wants a string');
    this.description = description;
    return this;
  }
  getDescription() { return this.description; }
}

class NotesPage {
  constructor() {
    this.notes = new Shape({ type: PlaceholderType.BODY, listInLayout: false });
  }
  getSpeakerNotesShape() { return this.notes; }
  getPlaceholders() { return [new PageElement(this.notes)]; }
}

let slideSeq = 0;

class Slide {
  constructor(presentation, layout, opts) {
    this.presentation = presentation;
    this.layout = layout;
    this.id = 'slide' + (++slideSeq);
    this.elements = [];
    this.placeholders = layout.shapes.map(spec => {
      const shape = new Shape({
        type: spec.type,
        left: spec.left, top: spec.top, width: spec.width, height: spec.height,
        listInLayout: spec.inListFromLayout
      });
      return shape;
    });
    if (opts.reverseBodyOrder) {
      const bodies = this.placeholders.filter(s =>
        s.type === PlaceholderType.BODY || s.type === PlaceholderType.OBJECT);
      if (bodies.length === 2) {
        const swap = bodies[0].left;
        bodies[0].left = bodies[1].left;
        bodies[1].left = swap;
      }
    }
    if (opts.imagePlaceholder) {
      this.placeholders = this.placeholders.concat([new ImageElement()]);
    }
    this.images = [];
    this.notesPage = new NotesPage();
  }
  getPlaceholders() {
    return this.placeholders.map(p => (p instanceof PageElement || p instanceof ImageElement)
      ? p : new PageElement(p));
  }
  getColorScheme() { return this.presentation.colorScheme; }
  getPageWidth() { return this.presentation.pageWidth; }
  getPageHeight() { return this.presentation.pageHeight; }
  insertShape(shapeType, left, top, width, height) {
    assert.ok(Object.values(ShapeType).includes(shapeType),
      `insertShape(${shapeType}) is not a SlidesApp.ShapeType`);
    [left, top, width, height].forEach((value, i) =>
      numeric(value, `insertShape argument ${i + 2}`));
    assert.ok(width > 0 && height > 0, 'insertShape needs a positive size');
    const shape = new Shape({
      type: PlaceholderType.NONE, shapeType, left, top, width, height, text: true
    });
    this.elements.push(shape);
    return shape;
  }
  insertTextBox(text, left, top, width, height) {
    assert.equal(typeof text, 'string', 'insertTextBox wants a string');
    const shape = this.insertShape(ShapeType.TEXT_BOX, left, top, width, height);
    shape.getText().setText(text);
    return shape;
  }
  insertLine(category, ...rest) {
    assert.ok(Object.values(LineCategory).includes(category),
      `insertLine(${category}) is not a SlidesApp.LineCategory`);
    assert.equal(rest.length, 4, 'insertLine wants a start and an end point');
    rest.forEach((value, i) => numeric(value, `insertLine argument ${i + 2}`));
    const line = new LineElement(category, ...rest);
    this.elements.push(line);
    return line;
  }
  getShapes() { return this.elements.filter(e => e instanceof Shape); }
  getLines() { return this.elements.filter(e => e instanceof LineElement); }
  getPageElements() { return this.elements.slice(); }
  insertImage(blob, left, top, width, height) {
    assert.ok(blob && blob.type === 'image/png', 'insertImage wants an image/png blob');
    [left, top, width, height].forEach(value =>
      assert.equal(typeof value, 'number', 'insertImage position and size must be numbers'));
    assert.ok(Number.isFinite(left) && Number.isFinite(top), 'position must be finite');
    assert.ok(width > 0 && height > 0, 'size must be positive');
    const image = new ImageElement(blob, left, top, width, height);
    this.images.push(image);
    this.elements.push(image);
    return image;
  }
  getImages() { return this.images.slice(); }
  getLayout() { return this.layout; }
  getNotesPage() { return this.notesPage; }
  remove() {
    const i = this.presentation.slides.indexOf(this);
    if (i >= 0) { this.presentation.slides.splice(i, 1); }
  }
}

class Layout {
  constructor(spec, inheritedList) {
    this.name = spec.name;
    this.shapes = (spec.placeholders || []).map(p =>
      new Shape({ type: p.type, left: p.left, top: p.top, width: p.width, height: p.height, listInLayout: inheritedList }));
  }
  getLayoutName() { return this.name; }
  getPlaceholders() { return this.shapes.map(s => new PageElement(s)); }
}

const PAGE = { width: 720, height: 405 };

class Presentation {
  constructor(theme, opts) {
    this.layouts = theme.map(spec => new Layout(spec, opts.listInLayout));
    this.slides = [];
    this.opts = opts;
    this.closed = false;
    this.pageWidth = opts.pageWidth || PAGE.width;
    this.pageHeight = opts.pageHeight || PAGE.height;
    this.colorScheme = new ColorScheme(opts.scheme);
  }
  getLayouts() { return this.layouts.slice(); }
  getSlides() { return this.slides.slice(); }
  getPageWidth() { return this.pageWidth; }
  getPageHeight() { return this.pageHeight; }
  appendSlide(layout) {
    assert.ok(this.layouts.includes(layout), 'appendSlide with a layout from another deck');
    const slide = new Slide(this, layout, this.opts);
    this.slides.push(slide);
    return slide;
  }
  saveAndClose() { this.closed = true; }
}

/* ------------------------- runner ------------------------- */

/**
 * Run an engine source against the mock and hand back the deck it
 * built. `source` is what build-deck.mjs produces: the .gs file with
 * its DECK constant replaced.
 */
export function runSource(source, theme, opts = {}) {
  const logs = [];
  const presentation = new Presentation(theme, opts);
  const sandbox = {
    SlidesApp: {
      PlaceholderType, PageElementType, ListPreset, ShapeType, LineCategory,
      ArrowStyle, ThemeColorType, ContentAlignment, ParagraphAlignment,
      openById: () => presentation
    },
    DriveApp: {
      getFileById: () => ({
        getName: () => 'template',
        makeCopy: () => ({ getId: () => 'copy-id', getUrl: () => 'https://docs.google.com/presentation/d/copy-id/edit' })
      })
    },
    Utilities: {
      formatDate: () => '2026-09-19 20:00',
      base64Decode: value => {
        assert.equal(typeof value, 'string', 'base64Decode wants a string');
        assert.ok(/^[A-Za-z0-9+/=]+$/.test(value), 'base64Decode wants base64');
        return { base64: value };
      },
      newBlob: (bytes, type, name) => {
        assert.ok(bytes && typeof bytes.base64 === 'string',
          'newBlob wants what base64Decode handed back');
        assert.equal(type, 'image/png', 'images are declared as image/png');
        // The bytes keep their base64 form, so the preview can embed them.
        return { bytes: bytes.base64, type, name };
      }
    },
    Session: { getScriptTimeZone: () => 'America/Los_Angeles' },
    Logger: { log: message => logs.push(String(message)) },
    console
  };

  const context = vm.createContext(sandbox);
  new vm.Script(source, { filename: 'deck-builder.gs' }).runInContext(context);

  const url = context.createDeck();
  return { presentation, logs, url, context };
}

export {
  PlaceholderType, PageElementType, ShapeType, LineCategory,
  ArrowStyle, ThemeColorType, ContentAlignment, ParagraphAlignment
};
