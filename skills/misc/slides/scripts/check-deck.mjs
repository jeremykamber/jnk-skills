#!/usr/bin/env node
/**
 * check-deck.mjs — enforce the deck design rules on an authored deck.
 *
 *   node scripts/check-deck.mjs <deck.json> [--mode teach|inform]
 *
 * This is the skill's completion criterion: it is the only way to tell
 * a finished deck from a plausible one without presenting it. It
 * checks the rules that hold for any deck (working-memory budget,
 * assertion headlines, notes carrying the delivery) plus the ones the
 * mode adds (Teach: retrieval cadence; Inform: navigable structure).
 *
 * Errors are design violations the deck must not ship with. Warnings
 * are judgement calls: read them, then either fix them or decide they
 * are deliberate. Exit code is 1 when there is at least one error.
 *
 * The thresholds encode the reasoning in references/slide-craft.md;
 * change them there and here together.
 */
import { readFileSync, realpathSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const TYPES = ['title', 'section', 'statement', 'body', 'twoColumn', 'prompt', 'activity', 'figure'];

// Working memory holds ~4 chunks (Cowan 2001), and a slide competes
// with the presenter's speech for it, so these budgets are tight.
const LIMITS = {
  teach: { bulletsError: 5, bulletsWarn: 4, bulletWordsError: 18, bulletWordsWarn: 14 },
  inform: { bulletsError: 6, bulletsWarn: 5, bulletWordsError: 20, bulletWordsWarn: 16 }
};

const SLIDE_WORDS_ERROR = 55;
const SLIDE_WORDS_WARN = 40;
const PROMPT_GAP_ERROR = 10;
const PROMPT_GAP_WARN = 7;
// Attention lapses in short cycles that lengthen as a session runs;
// a question or a change of mode cuts the lapse (Bunce et al. 2010).
const ENGAGE_GAP = 6;
const LONG_DECK = 60;
const LABEL_WORDS = 3;

/*
 * A headline is one line of display type, and the engine cannot make one
 * fit. Writing text into a placeholder deactivates that shape's autofit
 * (Slides does this on any request that can affect text fitting), and
 * neither Apps Script's Autofit class nor the Slides REST API accepts
 * TEXT_AUTOFIT on a write — only NONE and AUTOFIT_TYPE_UNSPECIFIED. So
 * the shrink-to-fit a theme sets on its title is gone the moment the
 * engine writes the text, and the title box never shrinks. A headline
 * longer than the box therefore draws outside it, over the body.
 *
 * Characters, not words, are what overflow: ~48 characters is one line
 * at a typical display size, and 64 is past what a title box holds.
 * Retune both against the theme in use.
 */
const HEADLINE_CHARS_WARN = 48;
const HEADLINE_CHARS_ERROR = 64;

// A figure carries one idea. Working memory holds about four chunks
// (Cowan 2001) and comprehension falls off past seven (Miller 1956),
// so every kind has a ceiling and a floor: [fewest, most]. Quadrant is
// exactly four by definition. The reasoning per kind, and which
// cognitive job each one does, is in references/figures.md.
const FIGURE_KINDS = {
  flow: [2, 5],
  cycle: [3, 5],
  scatter: [2, 8],
  tree: [2, 7],
  quadrant: [4, 4],
  matrix: [4, 9],
  stack: [2, 5],
  timeline: [2, 5],
  bars: [2, 6],
  network: [3, 7]
};
const FIGURE_CROWDED = 5;      // warn above this, even where the ceiling allows more
const FIGURE_LABEL_WORDS = 4;  // a node label is a name, not a sentence
const FIGURE_DETAIL_WORDS = 8; // a second line inside a node is a phrase at most

const words = text => String(text || '').trim().split(/\s+/).filter(Boolean);

/*
 * `**text**` is authoring syntax the engine turns into bold; the marks
 * themselves never reach the slide. So every measurement here is taken
 * on the stripped text — a marked span must not read as a longer
 * headline, or as words the room never sees.
 */
const BOLD_MARK = /\*\*([^*]+)\*\*/g;
const stripMarks = text => String(text || '').replace(BOLD_MARK, '$1');
const countMarks = text => (String(text || '').match(BOLD_MARK) || []).length;

// Signalling is scarce: a slide that shouts everywhere says nothing
// (Mayer 2021, signalling). One or two spans is a point; five is noise.
const BOLD_SPANS_WARN = 3;

function textLists(slide) {
  switch (slide.type) {
    case 'body':
      return [slide.bullets || []];
    case 'twoColumn':
      return [slide.left?.bullets || [], slide.right?.bullets || []];
    case 'prompt':
      return [slide.bullets || []];
    default:
      return [];
  }
}

function rawSlideText(slide) {
  const lists = textLists(slide).flat();
  const parts = [slide.title, slide.subtitle, ...lists];
  if (slide.type === 'twoColumn') {
    parts.push(slide.left?.heading, slide.right?.heading);
  }
  if (slide.type === 'figure') {
    parts.push(...figureTexts(slide));
  }
  return parts.filter(Boolean);
}

function onSlideText(slide) {
  return rawSlideText(slide).map(stripMarks);
}

/**
 * Everything a figure puts on screen: its labels, its axis labels and
 * the numbers on its bars. A figure is text too, and it spends the
 * same working-memory budget a bullet list does.
 */
function figureTexts(slide) {
  const figure = slide.figure || {};
  const nodes = Array.isArray(figure.nodes) ? figure.nodes : [];
  const labels = nodes.map(node => (typeof node === 'string' ? node : node && node.label));
  const numbers = nodes.map(node => node && node.display);
  const axes = figure.axes ? [figure.axes.x, figure.axes.y] : [];
  return [...labels, ...numbers, ...axes].filter(Boolean);
}

export function checkDeck(deck, modeOverride) {
  const findings = [];
  const error = (at, rule, message) => findings.push({ at, rule, severity: 'error', message });
  const warn = (at, rule, message) => findings.push({ at, rule, severity: 'warn', message });

  const meta = deck?.meta || {};
  const mode = modeOverride || meta.mode;
  const limits = LIMITS[mode] || LIMITS.inform;

  if (!meta.title) error('meta', 'missing-meta', 'meta.title is required (it names the copied deck)');
  if (!meta.audience) error('meta', 'missing-meta', 'meta.audience is required (what they already know — it sets how much scaffolding stays)');
  if (!meta.objective) error('meta', 'missing-meta', 'meta.objective is required (what they should be able to do afterwards)');
  if (!meta.templateId) error('meta', 'missing-meta', 'meta.templateId is required (the themed template to copy)');
  if (!LIMITS[mode]) error('meta', 'missing-meta', `meta.mode must be teach or inform, got ${JSON.stringify(meta.mode)}`);

  const slides = Array.isArray(deck?.slides) ? deck.slides : null;
  if (!slides || slides.length === 0) {
    error('slides', 'no-slides', 'deck.slides must be a non-empty array');
    return findings;
  }

  slides.forEach((slide, index) => {
    const at = index + 1;
    const where = `slide ${at}`;

    if (!TYPES.includes(slide.type)) {
      error(at, 'bad-type', `${where}: unknown type ${JSON.stringify(slide.type)} (${TYPES.join(', ')})`);
      return;
    }

    if (!slide.title) error(at, 'missing-title', `${where} (${slide.type}): title is required`);
    if (!slide.notes) error(at, 'missing-notes', `${where} (${slide.type}): notes are required — the detail lives in the notes, not on the slide`);

    if (slide.type === 'body' && !(slide.bullets || []).length) {
      error(at, 'empty-body', `${where}: body slides need bullets (use statement for a claim with nothing under it)`);
    }
    if (slide.type === 'prompt' && !slide.answer) {
      error(at, 'unanswered-prompt', `${where}: a prompt needs answer — a question you never resolve is a dead end`);
    }
    if (slide.type === 'twoColumn') {
      for (const side of ['left', 'right']) {
        const col = slide[side];
        if (!col || !col.heading) error(at, 'bad-column', `${where}: ${side} column needs a heading`);
        if (!col || !(col.bullets || []).length) error(at, 'bad-column', `${where}: ${side} column needs bullets`);
      }
    }

    textLists(slide).forEach(list => {
      if (list.length > limits.bulletsError) {
        error(at, 'too-many-bullets', `${where}: ${list.length} bullets — one idea per slide, max ${limits.bulletsError} here`);
      } else if (list.length > limits.bulletsWarn) {
        warn(at, 'many-bullets', `${where}: ${list.length} bullets — check each one earns its place`);
      }
      list.forEach(line => {
        const count = words(line).length;
        if (count > limits.bulletWordsError) {
          error(at, 'long-bullet', `${where}: a ${count}-word bullet is a sentence to read, not a cue: "${line.slice(0, 60)}…"`);
        } else if (count > limits.bulletWordsWarn) {
          warn(at, 'long-bullet', `${where}: a ${count}-word bullet — say it instead of showing it`);
        }
      });
    });

    const total = onSlideText(slide).reduce((sum, part) => sum + words(part).length, 0);
    if (total > SLIDE_WORDS_ERROR) {
      error(at, 'slide-too-wordy', `${where}: ${total} words on screen — the room reads instead of listens`);
    } else if (total > SLIDE_WORDS_WARN) {
      warn(at, 'slide-wordy', `${where}: ${total} words on screen`);
    }

    // Assertion headlines: a claim, not a topic label. Section
    // dividers and prompts are exempt — a divider is a label by
    // design, and a short question is still a question.
    if (['body', 'twoColumn', 'statement', 'figure'].includes(slide.type) && slide.title) {
      if (words(slide.title).length < LABEL_WORDS) {
        warn(at, 'label-headline', `${where}: "${slide.title}" reads as a topic label — make it a claim or a question`);
      }
    }

    // Every slide type renders its title as display type in the theme's
    // title box, so the ceiling applies to all of them and to a section
    // divider too. See HEADLINE_CHARS_* for why the box cannot shrink.
    if (slide.title) {
      const headline = stripMarks(slide.title);
      const length = headline.length;
      if (length > HEADLINE_CHARS_ERROR) {
        error(at, 'headline-too-long', `${where}: a ${length}-character headline cannot fit the title box, and the theme's shrink-to-fit is off, so it spills over the slide — cut it to a claim: "${headline.slice(0, HEADLINE_CHARS_WARN)}…"`);
      } else if (length > HEADLINE_CHARS_WARN) {
        warn(at, 'headline-long', `${where}: ${length} characters — a headline fits one line best; cut it, or move the rest into the notes`);
      }
    }

    /*
     * A mark the engine has no closing pair for is not emphasis: it is
     * two asterisks the room will read off the screen.
     */
    rawSlideText(slide).forEach(part => {
      if (stripMarks(part).includes('**')) {
        error(at, 'bold-unclosed', `${where}: a "**" is never closed, so it renders on the slide as asterisks: "${part.slice(0, 60)}"`);
      }
    });

    const marks = rawSlideText(slide).reduce((sum, part) => sum + countMarks(part), 0);
    if (marks > BOLD_SPANS_WARN) {
      warn(at, 'bold-many', `${where}: ${marks} emphasised spans — when everything shouts, nothing does`);
    }

    // Redundancy: notes that repeat the slide get read out loud.
    if (slide.notes) {
      onSlideText(slide).forEach(part => {
        if (part && part.length >= 12 && slide.notes.includes(part)) {
          warn(at, 'redundant-notes', `${where}: the notes repeat on-screen text — the slide is not what you say`);
        }
      });
    }
  });

  if (slides[0]?.type !== 'title') {
    warn(1, 'no-title-slide', 'the deck should open with a title slide');
  }

  if (slides.length > LONG_DECK) {
    warn('slides', 'long-deck', `${slides.length} slides — split it, or cut what the room does not need`);
  }

  /*
   * An activity slide is a brief. A half-briefed activity is a break:
   * they need to know what to do, with whom, for how long, what to hand
   * back, and what happens to it afterwards. These are structural
   * checks — the fields are the contract, not the prose.
   */
  slides.forEach((slide, index) => {
    if (slide.type !== 'activity') return;
    const at = index + 1;
    const activity = slide.activity || {};
    if (!activity.task) error(at, 'activity-task', 'the activity slide never says what they actually do');
    if (!activity.timeMinutes) error(at, 'activity-time', 'no time box — an activity without a clock eats the next section');
    if (!activity.deliverable) error(at, 'activity-deliverable', 'nothing to hand back: pairs stall at the first hard step and drift');
    if (!activity.debrief) error(at, 'activity-debrief', 'no debrief in the notes — what you do with their work is where the learning consolidates');
    if (!activity.successCriterion) warn(at, 'activity-criterion', 'say how they know they are done, or you will answer it table by table');
    if (!activity.grouping) warn(at, 'activity-grouping', 'say who works with whom — alone, pairs, table groups — the social setup changes what they learn');
    if (activity.artifact && !activity.artifact.url) {
      error(at, 'activity-artifact', 'the artifact has no resolvable url — run the create-exercise skill, or drop the artifact');
    }
  });

  /*
   * A figure is the one place a deck draws instead of listing. The
   * rules here are the ones that decide whether the drawing can be
   * read at all: the right form for the job, few enough elements to
   * hold at once, every element named, and no field that the engine
   * would silently drop. Which form does which job, and why, is in
   * references/figures.md.
   */
  slides.forEach((slide, index) => {
    const at = index + 1;
    const where = `slide ${at}`;

    if (slide.figure && slide.type !== 'figure') {
      error(at, 'figure-on-slide', `${where}: the figure on this ${slide.type} slide is never drawn — give it a slide of type "figure"`);
    }
    if (slide.type !== 'figure') return;

    if (slide.qr) {
      error(at, 'figure-qr', `${where}: a figure and a QR code compete for the same space — put the QR on an activity slide`);
    }

    const figure = slide.figure;
    if (!figure || typeof figure !== 'object') {
      error(at, 'figure-missing', `${where}: a figure slide needs figure: { kind, nodes }`);
      return;
    }

    /*
     * The raster exception: a picture of something shapes cannot show
     * honestly. It has no nodes, so it is checked on its own terms —
     * a source, and the alt text that stands in for it.
     */
    if (figure.kind === 'image') {
      if (!figure.alt) {
        error(at, 'figure-alt', `${where}: an image figure needs alt — what a screen reader reads in place of the picture`);
      }
      if (!figure.svgFile && !figure.pngFile && !figure.png) {
        error(at, 'figure-source', `${where}: an image figure names no svgFile or pngFile — there is nothing to draw`);
      }
      ['nodes', 'edges', 'axes'].forEach(field => {
        if (figure[field] !== undefined) {
          error(at, 'figure-source', `${where}: an image figure carries ${field} — an image is drawn as it is; that field is dropped`);
        }
      });
      return;
    }

    const nodes = Array.isArray(figure.nodes) ? figure.nodes : null;
    if (!nodes || nodes.length === 0) {
      error(at, 'figure-nodes', `${where}: a figure needs nodes — the labelled elements it shows`);
      return;
    }

    const ceilings = FIGURE_KINDS[figure.kind];
    if (!ceilings) {
      error(at, 'figure-kind', `${where}: unknown figure kind ${JSON.stringify(figure.kind)} (${Object.keys(FIGURE_KINDS).join(', ')})`);
    } else {
      const [fewest, most] = ceilings;
      if (nodes.length < fewest) {
        error(at, 'figure-size', `${where}: a ${figure.kind} needs at least ${fewest} labelled elements, got ${nodes.length}`);
      } else if (nodes.length > most) {
        error(at, 'figure-size', `${where}: ${nodes.length} labelled elements — a ${figure.kind} takes at most ${most}; past that nobody reads them (see references/figures.md)`);
      } else if (nodes.length > FIGURE_CROWDED && figure.kind !== 'quadrant') {
        warn(at, 'figure-crowded', `${where}: ${nodes.length} labelled elements — check each one earns its place`);
      }
    }

    nodes.forEach((node, position) => {
      const place = `${where}: element ${position + 1}`;
      const name = (typeof node === 'string' ? node : (node && node.label) || '').trim();
      if (!name) {
        error(at, 'figure-node', `${place} has no label — an unnamed element is decoration`);
        return;
      }
      const count = words(name).length;
      if (count > FIGURE_LABEL_WORDS) {
        warn(at, 'figure-label', `${place} is ${count} words — a node label is a name, not a sentence`);
      }
      const detail = (node && node.detail) || '';
      if (detail && words(detail).length > FIGURE_DETAIL_WORDS) {
        warn(at, 'figure-detail', `${place} carries a ${words(detail).length}-word second line — say it from the notes`);
      }
    });

    const highlighted = nodes.filter(node => node && node.highlight === true).length;
    if (highlighted > 1) {
      warn(at, 'figure-highlight', `${where}: ${highlighted} elements are highlighted — when two things shout, neither is heard`);
    }

    if ((figure.kind === 'quadrant' || figure.kind === 'scatter') && !(figure.axes && figure.axes.x && figure.axes.y)) {
      warn(at, 'figure-axes', `${where}: label both axes — the two axes are what make a ${figure.kind} readable`);
    }

    if (figure.kind === 'bars') {
      nodes.forEach((node, position) => {
        const value = node && node.value;
        if (typeof value !== 'number' || !(value > 0) || value > 1) {
          error(at, 'figure-value', `${where}: bar ${position + 1} needs value — its share of the tallest bar, above 0 and at most 1`);
        }
        if (node && !node.display) {
          error(at, 'figure-display', `${where}: bar ${position + 1} has no display — a bar with no number on it makes the room guess`);
        }
      });
    }

    if (figure.kind === 'network') {
      nodes.forEach((node, position) => {
        const at_ = node && node.at;
        const placed = Array.isArray(at_) && at_.length === 2 &&
          at_.every(value => typeof value === 'number' && value >= 0 && value <= 1);
        if (!placed) {
          error(at, 'figure-at', `${where}: network element ${position + 1} needs at: [x, y] between 0 and 1 — that is where you are putting it on the page`);
        }
      });
    }

    if (figure.kind === 'tree') {
      nodes.forEach((node, position) => {
        if (position === 0) return;
        const parent = node && node.parent;
        if (parent !== undefined && (!Number.isInteger(parent) || parent < 0 || parent >= position)) {
          error(at, 'figure-parent', `${where}: element ${position + 1} names parent ${parent} — a parent is a node that comes before it`);
        }
      });
    }

    if (Array.isArray(figure.edges)) {
      figure.edges.forEach((edge, position) => {
        const place = `${where}: relation ${position + 1}`;
        if (!edge || !Number.isInteger(edge.from) || !Number.isInteger(edge.to)) {
          error(at, 'figure-edge', `${place} needs from and to — the elements it joins, by number`);
          return;
        }
        [edge.from, edge.to].forEach(end => {
          if (end < 0 || end >= nodes.length) {
            error(at, 'figure-edge', `${place} points at element ${end + 1}, and this figure has ${nodes.length}`);
          }
        });
        if (edge.from === edge.to) {
          error(at, 'figure-edge', `${place} joins an element to itself`);
        }
      });
      if (['matrix', 'stack', 'bars', 'timeline', 'scatter'].includes(figure.kind)) {
        warn(at, 'figure-relations', `${where}: a ${figure.kind} draws its own structure — a line between its cells says nothing`);
      }
    }
  });

  const activities = slides.filter(slide => slide.type === 'activity').length;
  if (activities > 6) {
    warn('slides', 'activity-many', `${activities} activities — each needs setup and a debrief; that is a workshop, not a deck`);
  }

  if (mode === 'teach') {
    const prompts = slides
      .map((slide, index) => ({ index: index + 1, type: slide.type }))
      .filter(entry => entry.type === 'prompt')
      .map(entry => entry.index);

    if (prompts.length === 0) {
      if (slides.length >= 8) {
        error('slides', 'no-retrieval', 'a teaching deck needs prompts: retrieval is what makes the deck change what they can do');
      } else {
        warn('slides', 'no-retrieval', 'no prompt in this deck — retrieval is what makes teaching stick');
      }
    } else {
      // An activity is the room doing something, so it breaks a gap
      // even though it is not a retrieval check.
      const engagements = slides
        .map((slide, index) => ({ index: index + 1, type: slide.type }))
        .filter(entry => entry.type === 'prompt' || entry.type === 'activity')
        .map(entry => entry.index);

      const checkpoints = [0, ...engagements, slides.length + 1];
      for (let i = 1; i < checkpoints.length; i++) {
        const gap = checkpoints[i] - checkpoints[i - 1];
        if (gap > PROMPT_GAP_ERROR) {
          error(checkpoints[i], 'retrieval-gap', `${gap} slides with nothing to retrieve — insert a prompt`);
        } else if (gap > PROMPT_GAP_WARN) {
          warn(checkpoints[i], 'retrieval-gap', `${gap} slides since the last prompt`);
        }
      }
      if (!prompts.some(index => index <= 4)) {
        warn(1, 'no-opening-prompt', 'a public guess before the explanation (pretesting) improves learning even when the guess is wrong');
      }
    }

    const last = slides[slides.length - 1];
    if (last && last.type === 'section') {
      warn(slides.length, 'no-close', 'the deck ends on a divider — end on something the room acts on');
    } else if (last && last.type !== 'prompt' && last.type !== 'activity') {
      warn(slides.length, 'weak-close', 'a retrieval prompt closes better than a recap: the room produces the summary, you do not read it');
    }
  }

  if (mode === 'inform') {
    if (slides.length > 12 && !slides.some(slide => slide.type === 'section')) {
      warn('slides', 'no-sections', 'a deck this long needs section dividers to stay navigable');
    }

    const last = slides[slides.length - 1];
    if (last && last.type === 'section') {
      warn(slides.length, 'no-close', 'the deck ends on a divider — end on the point they should leave with');
    }
  }

  return findings;
}

function main() {
  const [, , deckPath, ...rest] = process.argv;
  if (!deckPath) {
    console.error('usage: node scripts/check-deck.mjs <deck.json> [--mode teach|inform]');
    process.exit(2);
  }
  const modeIndex = rest.indexOf('--mode');
  const modeOverride = modeIndex >= 0 ? rest[modeIndex + 1] : undefined;

  const deck = JSON.parse(readFileSync(deckPath, 'utf8'));
  const findings = checkDeck(deck, modeOverride);

  const errors = findings.filter(f => f.severity === 'error');
  const warnings = findings.filter(f => f.severity === 'warn');

  for (const finding of [...errors, ...warnings]) {
    const label = finding.severity === 'error' ? 'ERROR' : 'warn ';
    console.log(`${label} ${finding.rule.padEnd(18)} ${finding.message}`);
  }

  console.log(
    `\n${deck.slides?.length || 0} slides · ${errors.length} errors · ${warnings.length} warnings`
  );
  process.exit(errors.length > 0 ? 1 : 0);
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
