/** ================================================================
 * THEMED DECK BUILDER — Google Apps Script
 * ================================================================
 *
 * Builds a new Google Slides deck by copying a TEMPLATE presentation
 * and appending slides built from the template's own layouts. The
 * template supplies every visual decision (fonts, colors,
 * backgrounds, list glyphs); this script supplies only text.
 *
 * HOW TO RUN
 *   1. https://script.google.com/  ->  New project
 *   2. Replace the default code with this whole file
 *   3. Save, select createDeck, Run, approve permissions
 *   4. The run log ends with the URL of the new deck
 *
 * The template itself is never modified.
 *
 * WHAT TO EDIT
 *   Only the DECK block between the markers below. Everything under
 *   "ENGINE" is machinery shared by every deck.
 *
 * THEME LAYOUTS
 *   Four layout roles are resolved, preferring these names:
 *     title      Title, Title Slide
 *     section    Section, Section Header, Section Title
 *     body       Title + Body, Title and Body, Title and Content
 *     twoColumn  Two Column, Two Columns, Two Content, Comparison
 *   Matching ignores case, spaces and punctuation. A role with no
 *   name match falls back to the first layout shaped like it, and
 *   the run log says so. Run listTemplateLayouts() to see every
 *   layout the template offers and what each role resolves to.
 *
 * SLIDE TYPES
 *   figure      one idea, drawn                   title + figure
 *   title       opening and closing cards         title + optional subtitle
 *   section     a divider before a section        title + optional subtitle
 *   statement   one claim standing alone          title + optional subtitle
 *   body        a claim with 2-5 cues             title + bullets
 *   twoColumn   a comparison or two lists         title + left/right
 *   prompt      a retrieval check                 title + bullets + answer
 *   activity    a thing the room does             title + activity + qr?
 *
 * A `cite` field on body, prompt and activity slides appends one
 * "Source: ..." line to the body, so the claim on the slide stays
 * checkable. On other types it is written to the notes instead.
 *
 * FIGURES
 *   A `figure` slide carries one drawn idea: `{ kind, nodes[], edges[] }`.
 *   Kinds are flow, cycle, tree, quadrant, matrix, stack, timeline,
 *   bars and network. Figures are built from Slides primitives —
 *   rounded rectangles, ellipses and lines with arrowheads — so they
 *   are vector, they stay editable, and they take their colors from
 *   the theme's own color scheme rather than a palette of ours. No
 *   font size is set anywhere except on the small labels (axis, edge
 *   and value) that have no theme style of their own.
 *
 *   Which form fits which idea, and why, is in
 *   references/figures.md. The limits (at most five labelled
 *   elements, one emphasized node, labels on the figure) are enforced
 *   by check-deck.mjs before a deck is built.
 *
 * QR CODES
 *   An activity slide may carry `qr` — { png, url, label } — where
 *   `png` is base64 image data. The image is placed in the theme's
 *   second column when the layout has one, so the QR lands inside the
 *   theme's own grid rather than bolted to a page corner. The URL also
 *   goes into the notes, so the deck still works when a QR will not
 *   scan. build-deck.mjs fills `qr.png` in from the activity JSON; you
 *   never paste base64 by hand.
 *
 * IF YOU CHANGE THE ENGINE
 *   Run: node scripts/test-engine.mjs   (in the skill directory)
 *   It executes this file against a mock Slides service and fails on
 *   any API misuse, so a broken engine is caught here rather than in
 *   the user's Apps Script editor.
 * ================================================================ */


/* >>> DECK */

const DECK = {
  "meta": {
    "title": "Example deck",
    "mode": "teach",
    "templateId": "1X0NwsMtqwpGdcwk0QqlFYHlpKYwdXW-rh5j0vZSN7-U",
    "audience": "who this is for and what they already know",
    "objective": "what they should be able to do afterwards"
  },
  "slides": [
    {
      "type": "title",
      "title": "Deck title",
      "subtitle": "Subtitle",
      "notes": "One line of talk track for this slide."
    },
    {
      "type": "body",
      "title": "A full-sentence claim that the bullets support",
      "bullets": [
        "Short line",
        "Short line"
      ],
      "cite": "Author 2021",
      "notes": "The explanation, the example, the caveat — everything that would otherwise be read off the slide."
    },
    {
      "type": "activity",
      "title": "Fix the off-by-one in pairs",
      "activity": {
        "task": "Run the tests, find the line that is wrong, and fix it before the timer ends.",
        "grouping": "pairs",
        "timeMinutes": 8,
        "deliverable": "one passing test run, on one laptop",
        "successCriterion": "all four cases pass, including n = 0",
        "debrief": "Ask two pairs which line was wrong before you show the fix.",
        "artifact": { "mode": "code", "displayUrl": "github.com/you/cs1-off-by-one" }
      },
      "notes": "Hands on keyboards before you say another word. Circulate, do not hover."
    },
    {
      "type": "prompt",
      "title": "A question that makes them retrieve the claim?",
      "bullets": [
        "Option A",
        "Option B"
      ],
      "answer": "The right answer, said out loud after they commit.",
      "notes": "What to do with the answers you get."
    }
  ]
};

/* <<< DECK */


/* ================================================================
   ENGINE — main
   ================================================================ */

function createDeck() {

  const templateFile =
    DriveApp.getFileById(DECK.meta.templateId);

  const timestamp =
    Utilities.formatDate(
      new Date(),
      Session.getScriptTimeZone(),
      "yyyy-MM-dd HH:mm"
    );

  const newFile =
    templateFile.makeCopy(DECK.meta.title + " — " + timestamp);

  const presentation =
    SlidesApp.openById(newFile.getId());

  const layouts =
    findLayouts_(presentation);

  Logger.log(
    "Template: " + templateFile.getName() +
    " | mode: " + DECK.meta.mode
  );

  Logger.log(
    "Objective: " + DECK.meta.objective
  );

  if (DECK.meta.sources && DECK.meta.sources.length > 0) {
    Logger.log(
      "Sources: " + DECK.meta.sources.join(" | ")
    );
  }

  // Remove the template's slides; its theme layouts stay.
  presentation.getSlides().forEach(slide => {
    slide.remove();
  });

  DECK.slides.forEach(spec => {
    buildSlide_(presentation, layouts, spec);
  });

  const slideCount =
    presentation.getSlides().length;

  presentation.saveAndClose();

  Logger.log(
    "=================================================="
  );

  Logger.log(
    "DECK CREATED — " + slideCount + " slides"
  );

  Logger.log(
    "Open it here:"
  );

  Logger.log(
    newFile.getUrl()
  );

  Logger.log(
    "=================================================="
  );

  return newFile.getUrl();
}


/* ================================================================
   ENGINE — theme layouts
   ================================================================ */

/*
 * Layout names to look for, most preferred first. Matching ignores
 * case, spaces and punctuation.
 */
const LAYOUT_NAMES = {
  title: ["Title", "Title Slide"],
  section: ["Section", "Section Header", "Section Title"],
  body: ["Title + Body", "Title and Body", "Title and Content"],
  twoColumn: ["Two Column", "Two Columns", "Two Content", "Comparison"],
  // A figure takes the whole page under its title, so "Title Only" is
  // the layout it wants; a theme without one falls back to body and
  // the figure is drawn inside the body box instead.
  figure: ["Title Only", "Title + Content", "Title Only + Caption"]
};

/*
 * The only placeholder types this script writes into. Pictures,
 * charts, tables, slide numbers, dates and footers are theme
 * furniture and are left alone.
 */
const TEXT_PLACEHOLDER_TYPES = [
  SlidesApp.PlaceholderType.TITLE,
  SlidesApp.PlaceholderType.CENTERED_TITLE,
  SlidesApp.PlaceholderType.SUBTITLE,
  SlidesApp.PlaceholderType.BODY,
  SlidesApp.PlaceholderType.OBJECT
];

const TITLE_PLACEHOLDER_TYPES = [
  SlidesApp.PlaceholderType.TITLE,
  SlidesApp.PlaceholderType.CENTERED_TITLE
];

const BODY_PLACEHOLDER_TYPES = [
  SlidesApp.PlaceholderType.BODY,
  SlidesApp.PlaceholderType.OBJECT
];


/**
 * Resolves the layouts the deck is built from.
 *
 * Each role is matched by name first, then by shape, so a theme that
 * does not use our preferred layout names still produces a deck.
 * Every fallback is logged, so a surprising theme is visible in the
 * run log rather than in the slides.
 *
 * `figure` is the one optional role: a figure needs a title and
 * somewhere to draw, so a theme without a Title Only layout uses its
 * body layout and the figure draws inside the body box.
 *
 * Returns { title, section, body, twoColumn, figure }.
 */
function findLayouts_(presentation) {

  const layouts =
    presentation.getLayouts();

  if (!layouts || layouts.length === 0) {
    throw new Error(
      "The template presentation contains no layouts."
    );
  }

  const byName = {};

  layouts.forEach(layout => {
    const name =
      normalizeName_(layout.getLayoutName());
    if (name && !byName[name]) {
      byName[name] = layout;
    }
  });

  const chosen = {};
  const used = [];
  const fellBack = [];

  // Pass 1: names.
  Object.keys(LAYOUT_NAMES).forEach(role => {
    const layout =
      matchLayoutName_(role, byName);
    if (layout) {
      chosen[role] = layout;
      used.push(layout);
    }
  });

  /*
   * Pass 2: shape, for roles the theme does not name. Two-column runs
   * before body because a two-column layout also looks like a body
   * layout.
   */
  ["title", "section", "twoColumn", "body", "figure"].forEach(role => {

    if (chosen[role]) {
      return;
    }

    const layout =
      layouts.find(candidate =>
        used.indexOf(candidate) === -1 &&
        layoutFitsRole_(role, candidate)
      ) ||
      layouts.find(candidate => layoutFitsRole_(role, candidate));

    if (layout) {
      chosen[role] = layout;
      used.push(layout);
      fellBack.push(role);
    }
  });

  /*
   * A figure only needs a title and somewhere to draw, so it is the
   * one role a theme may simply not have.
   */
  if (!chosen.figure && chosen.body) {

    chosen.figure = chosen.body;

    Logger.log(
      "NOTE: the theme names no Title Only layout; figures draw in the " +
      "body box of \"" + chosen.body.getLayoutName() + "\"."
    );
  }

  const missing =
    Object.keys(LAYOUT_NAMES).filter(role => !chosen[role]);

  if (missing.length > 0) {
    throw new Error(
      "No layout can serve as: " + missing.join(", ") +
      ".\n\nLayouts in the template:\n" +
      listLayoutNames_(layouts)
    );
  }

  Logger.log(
    "Layouts used: " +
    Object.keys(LAYOUT_NAMES)
      .map(role => role + "=\"" + chosen[role].getLayoutName() + "\"")
      .join(", ")
  );

  if (fellBack.length > 0) {
    Logger.log(
      "WARNING: the theme names no " + fellBack.join(", ") +
      " layout; those roles matched by shape instead."
    );
  }

  return chosen;
}


function matchLayoutName_(role, byName) {

  const names =
    LAYOUT_NAMES[role];

  for (let i = 0; i < names.length; i++) {
    const layout =
      byName[normalizeName_(names[i])];
    if (layout) {
      return layout;
    }
  }

  return null;
}


/**
 * Whether a layout is shaped like the given role. Used only when the
 * role's preferred names are absent from the theme.
 */
function layoutFitsRole_(role, layout) {

  const types =
    getTextPlaceholders_(layout)
      .map(shape => shape.getPlaceholderType());

  const hasType = type => types.indexOf(type) !== -1;

  switch (role) {

    case "title":
      return hasType(SlidesApp.PlaceholderType.SUBTITLE);

    case "section":
      return (
        hasType(SlidesApp.PlaceholderType.CENTERED_TITLE) ||
        hasType(SlidesApp.PlaceholderType.SUBTITLE)
      );

    case "twoColumn":
      return bodyPlaceholderCount_(types) >= 2;

    case "body":
      return (
        TITLE_PLACEHOLDER_TYPES.some(hasType) &&
        bodyPlaceholderCount_(types) >= 1
      );

    case "figure":
      // A title, and nothing else competing for the page: that is
      // what "Title Only" looks like. A cover layout has a subtitle,
      // so it is not one.
      return (
        TITLE_PLACEHOLDER_TYPES.some(hasType) &&
        bodyPlaceholderCount_(types) === 0 &&
        !hasType(SlidesApp.PlaceholderType.SUBTITLE)
      );
  }

  return false;
}


function bodyPlaceholderCount_(types) {

  return types.filter(
    type => BODY_PLACEHOLDER_TYPES.indexOf(type) !== -1
  ).length;
}


function normalizeName_(name) {

  return String(name || "")
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "");
}


function listLayoutNames_(layouts) {

  return layouts
    .map(layout => "  " + layout.getLayoutName())
    .join("\n");
}


/* ================================================================
   ENGINE — slide builders
   ================================================================ */

/**
 * Builds one slide from its spec.
 *
 * Slide types: title, section, statement, body, twoColumn, prompt.
 * The spec's fields are documented in the skill's
 * references/deck-spec.md.
 */
function buildSlide_(presentation, layouts, spec) {

  let slide;

  switch (spec.type) {

    case "title":
    case "statement":
      slide = presentation.appendSlide(layouts.title);
      setTitle_(slide, spec.title);
      if (spec.subtitle) {
        setSubtitle_(slide, spec.subtitle);
      }
      break;

    case "section":
      slide = presentation.appendSlide(layouts.section);
      setTitle_(slide, spec.title);
      if (spec.subtitle) {
        setSubtitle_(slide, spec.subtitle);
      }
      break;

    case "body":
      slide = presentation.appendSlide(layouts.body);
      setTitle_(slide, spec.title);
      setBody_(slide, bullets_(spec.bullets).concat(sourceLine_(spec)));
      break;

    case "prompt":
      slide = presentation.appendSlide(layouts.body);
      setTitle_(slide, spec.title);
      if (spec.bullets && spec.bullets.length > 0) {
        setBody_(slide, bullets_(spec.bullets).concat(sourceLine_(spec)));
      }
      break;

    case "activity":
      slide = buildActivitySlide_(presentation, layouts, spec);
      break;

    case "figure":
      slide = buildFigureSlide_(presentation, layouts, spec);
      break;

    case "twoColumn":
      slide = buildTwoColumnSlide_(presentation, layouts, spec);
      break;

    default:
      throw new Error(
        "Unknown slide type \"" + spec.type + "\" at slide " +
        (DECK.slides.indexOf(spec) + 1) + "."
      );
  }

  setNotes_(slide, notesFor_(spec));

  return slide;
}


/**
 * What the presenter reads. A prompt's answer belongs here: it is said
 * after the room commits, so the slide never gives it away. An activity
 * keeps its debrief and its link here, and a citation keeps its full
 * reference here even when a short form is printed on the slide.
 */
function notesFor_(spec) {

  const parts = [];

  if (spec.type === "prompt" && spec.answer) {
    parts.push(spec.answer);
  }

  if (spec.type === "activity" && spec.activity) {

    const activity = spec.activity;

    if (activity.debrief) {
      parts.push("Debrief: " + activity.debrief);
    }

    if (activity.artifact && activity.artifact.url) {
      parts.push("Link: " + activity.artifact.url);
    }
  }

  if (spec.cite) {
    parts.push("Source: " + (spec.citeUrl || spec.cite));
  }

  if (spec.notes) {
    parts.push(spec.notes);
  }

  return parts.join("\n\n");
}


/**
 * Two headed columns. If the layout exposes fewer than two body
 * placeholders, both columns go into the one it has.
 */
function buildTwoColumnSlide_(presentation, layouts, spec) {

  const slide =
    presentation.appendSlide(layouts.twoColumn);

  setTitle_(slide, spec.title);

  const columns =
    getTextPlaceholders_(slide)
      .filter(shape =>
        BODY_PLACEHOLDER_TYPES.indexOf(shape.getPlaceholderType()) !== -1
      )
      // Column order follows the layout's element order, which is not
      // guaranteed to be left-to-right; sort by position across.
      .sort((a, b) => leftOf_(a) - leftOf_(b));

  const left =
    column_(spec.left.heading, spec.left.bullets);

  const right =
    column_(spec.right.heading, spec.right.bullets);

  /*
   * A second column has to be beside the first. A theme whose content boxes
   * are stacked has no second column — its other box is the headline's, and
   * a column written there erases the headline.
   */
  const beside =
    columns.length >= 2 && isBeside_(columns[1], columns[0])
      ? columns[1]
      : null;

  if (beside) {

    writeParagraphs_(columns[0], left);

    writeParagraphs_(beside, right);

  } else {

    writeParagraphs_(
      columns[0] || requireBodyPlaceholder_(slide),
      left.concat(right)
    );
  }

  return slide;
}


/* ================================================================
   ENGINE — activity slides
   ================================================================ */

/**
 * An activity slide is a brief, not a title: what they do, with whom,
 * for how long, what they hand back, how they know it is done. A
 * presenter who reads four fields and stops has still briefed it.
 */
function buildActivitySlide_(presentation, layouts, spec) {

  const hasQr =
    !!(spec.qr && spec.qr.png);

  const slide =
    presentation.appendSlide(hasQr ? layouts.twoColumn : layouts.body);

  setTitle_(slide, spec.title);

  const lines =
    activityLines_(spec).concat(sourceLine_(spec));

  if (!hasQr) {
    setBody_(slide, lines);
    return slide;
  }

  /*
   * The QR takes the second column, so the brief stays in the first
   * and the image lands inside the theme's own grid instead of bolted
   * to a page corner.
   */
  const columns =
    getTextPlaceholders_(slide)
      .filter(shape =>
        BODY_PLACEHOLDER_TYPES.indexOf(shape.getPlaceholderType()) !== -1
      )
      .sort((a, b) => leftOf_(a) - leftOf_(b));

  const brief =
    columns[0] || requireBodyPlaceholder_(slide);

  writeParagraphs_(brief, lines);

  /*
   * Same rule as the two-column builder: the QR only takes a second box if
   * the theme has one beside the brief. Stacked themes put it in the corner
   * of the content box instead of on top of the headline.
   */
  const briefBox =
    boxOf_(brief);

  const beside =
    columns.find(shape =>
      shape !== brief && isBeside_(shape, brief)
    );

  if (beside) {

    insertQr_(slide, spec.qr, boxOf_(beside));

  } else {

    insertQr_(slide, spec.qr, {
      left: briefBox.left + briefBox.width * 0.62,
      top: briefBox.top + briefBox.height * 0.42,
      width: briefBox.width * 0.38,
      height: briefBox.height * 0.58
    });

    Logger.log(
      (columns.length >= 2
        ? "NOTE: the theme's content boxes are stacked, not side by side, so the QR shares "
        : "WARNING: the theme has no two-column layout, so the QR shares ") +
      "the content box with the brief. Check this slide before you present."
    );
  }

  return slide;
}


/** The brief: what they do, then the terms they do it on. */
function activityLines_(spec) {

  const activity =
    spec.activity || {};

  const lines = [];

  if (activity.task) {
    lines.push({ text: activity.task, bullet: false });
    lines.push({ text: "", bullet: false });
  }

  const terms = [];

  if (activity.grouping && activity.timeMinutes) {
    terms.push(activity.grouping + " · " + activity.timeMinutes + " minutes");
  } else if (activity.timeMinutes) {
    terms.push(activity.timeMinutes + " minutes");
  } else if (activity.grouping) {
    terms.push(activity.grouping);
  }

  if (activity.deliverable) {
    terms.push("Hand in: " + activity.deliverable);
  }

  if (activity.successCriterion) {
    terms.push("Done when: " + activity.successCriterion);
  }

  if (activity.artifact && activity.artifact.displayUrl) {
    terms.push(activity.artifact.displayUrl);
  }

  return lines.concat(bullets_(terms));
}


/** The short citation that keeps a claim checkable on the slide. */
function sourceLine_(spec) {

  if (!spec.cite) {
    return [];
  }

  return [{ text: "Source: " + spec.cite, bullet: false }];
}


/**
 * Places the QR inside a box: square, centred, and slightly inside the
 * edges so it does not touch the theme's own content.
 */
function insertQr_(slide, qr, box) {

  const blob =
    Utilities.newBlob(
      Utilities.base64Decode(qr.png),
      "image/png",
      "qr-activity.png"
    );

  const size =
    Math.min(box.width, box.height) * 0.92;

  const image =
    slide.insertImage(
      blob,
      box.left + (box.width - size) / 2,
      box.top + (box.height - size) / 2,
      size,
      size
    );

  Logger.log(
    "QR inserted: " + Math.round(size) + "pt square for " +
    (qr.url || "an activity")
  );

  return image;
}


/** A placeholder's on-slide box, with the gaps filled in. */
function boxOf_(shape) {

  return {
    left: positiveOr_(shape.getLeft(), 0),
    top: positiveOr_(shape.getTop(), 0),
    width: positiveOr_(shape.getWidth(), 320),
    height: positiveOr_(shape.getHeight(), 240)
  };
}


function positiveOr_(value, fallback) {

  return (typeof value === "number" && value > 0) ? value : fallback;
}


/* ================================================================
   ENGINE — text
   ================================================================ */

/**
 * The writable text placeholders on a page (slide or layout).
 * Placeholders that cannot hold text, plus slide numbers, dates,
 * headers and footers, are filtered out.
 */
function getTextPlaceholders_(page) {

  return page
    .getPlaceholders()
    .filter(element =>
      element.getPageElementType() === SlidesApp.PageElementType.SHAPE
    )
    .map(element => element.asShape())
    .filter(shape =>
      TEXT_PLACEHOLDER_TYPES.indexOf(shape.getPlaceholderType()) !== -1
    );
}


/**
 * The boxes, topmost first.
 *
 * A theme assembled by hand often has no typed title at all: every box comes
 * back as a body, and the API's order says nothing about which box the
 * headline belongs in. Position does.
 */
function topmost_(placeholders) {

  return placeholders
    .slice()
    .sort((a, b) => (a.getTop() || 0) - (b.getTop() || 0))[0] || null;
}

/** Whether the theme tells a title box apart from the content boxes. */
function hasTypedTitle_(placeholders) {

  return placeholders.some(shape =>
    TITLE_PLACEHOLDER_TYPES.indexOf(shape.getPlaceholderType()) !== -1
  );
}

/** A box's area, for finding the content box in a theme that types none. */
function areaOf_(shape) {

  return (shape.getWidth() || 0) * (shape.getHeight() || 0);
}

/** Whether one box sits beside another, rather than under it. */
function isBeside_(shape, other) {

  const box =
    boxOf_(other);

  return leftOf_(shape) >= box.left + box.width * 0.4;
}


function setTitle_(slide, text) {

  const placeholders =
    getTextPlaceholders_(slide);

  const title =
    placeholders.find(shape =>
      TITLE_PLACEHOLDER_TYPES.indexOf(shape.getPlaceholderType()) !== -1
    );

  /*
   * With no typed title, the headline goes in the box at the top of the
   * slide. Taking the API's first box instead puts the headline in the
   * content box, where the body then overwrites it — which is exactly what a
   * hand-built theme looks like from here.
   */
  const target =
    title ||
    (hasTypedTitle_(placeholders) ? placeholders[0] : topmost_(placeholders));

  if (target) {
    writeParagraphs_(target, [{ text: text, bullet: false }]);
  }
}


function setSubtitle_(slide, text) {

  const placeholders =
    getTextPlaceholders_(slide);

  const subtitle =
    placeholders.find(shape =>
      shape.getPlaceholderType() === SlidesApp.PlaceholderType.SUBTITLE
    ) ||
    placeholders.find(shape =>
      BODY_PLACEHOLDER_TYPES.indexOf(shape.getPlaceholderType()) !== -1
    );

  if (subtitle) {
    writeParagraphs_(subtitle, [{ text: text, bullet: false }]);
  }
}


function setBody_(slide, paragraphs) {

  writeParagraphs_(
    requireBodyPlaceholder_(slide),
    paragraphs
  );
}


/** The slide's body placeholder, or an error naming the layout. */
function requireBodyPlaceholder_(slide) {

  const placeholders =
    getTextPlaceholders_(slide);

  const candidates =
    placeholders.filter(shape =>
      BODY_PLACEHOLDER_TYPES.indexOf(shape.getPlaceholderType()) !== -1
    );

  /*
   * Every box in a theme with no typed title counts as a body, so the first
   * one is the headline's box and writing content there erases the headline.
   * The content box is the largest of the rest.
   */
  const top =
    topmost_(placeholders);

  const body =
    hasTypedTitle_(placeholders)
      ? candidates[0]
      : candidates
          .filter(shape => !top || (shape.getTop() || 0) !== (top.getTop() || 0))
          .sort((a, b) => areaOf_(b) - areaOf_(a))[0];

  const chosen =
    body || candidates[0];

  if (!chosen) {
    throw new Error(
      "The layout \"" + layoutName_(slide) + "\" has no body " +
      "placeholder, so this slide's content cannot be written."
    );
  }

  return chosen;
}


function layoutName_(slide) {

  const layout =
    slide.getLayout();

  return layout ? layout.getLayoutName() : "unknown";
}


function leftOf_(shape) {

  const left =
    shape.getLeft();

  return left === null ? 0 : left;
}


/**
 * Speaker notes carry the delivery: the explanation, the worked
 * example, the caveat, the answer to the prompt. Only the speaker
 * notes shape is writable on a notes page, and every slide has a
 * notes page.
 */
function setNotes_(slide, text) {

  if (!text) {
    return;
  }

  slide
    .getNotesPage()
    .getSpeakerNotesShape()
    .getText()
    .setText(text);
}


/** One paragraph per line; blank lines stay blank and unbulleted. */
function bullets_(lines) {

  return lines.map(text => {
    return { text: text, bullet: text !== "" };
  });
}


/** A column: its heading, a blank line, then its bullets. */
function column_(heading, lines) {

  return [
    { text: heading, bullet: false },
    { text: "", bullet: false }
  ].concat(bullets_(lines));
}


/**
 * Writes paragraphs into a placeholder.
 *
 * Only text is written: fonts, sizes and colors come from the theme.
 * So do list glyphs — bullets stay in whatever list the theme already
 * puts them in, and get the default disc list only when the theme
 * defines no list at all. Headings and blank lines are kept out of
 * the list so they do not pick up a glyph.
 *
 * Bold is the one exception, and a deliberate one. `**text**` inside a
 * paragraph marks a span the author wants emphasized; the markers are
 * authoring syntax and never reach the slide, and what lands is the
 * theme's own bold face, so a re-themed deck keeps its emphasis.
 * Signalling is a scarce resource rather than a decoration — the
 * checker counts how much of a slide shouts.
 */
function writeParagraphs_(placeholder, paragraphs) {

  const range =
    placeholder.getText();

  const marked =
    paragraphs.map(paragraph => parseMarks_(paragraph.text));

  range.setText(
    marked.map(paragraph => paragraph.text).join("\n")
  );

  const targets =
    range.getParagraphs().map(paragraph => paragraph.getRange());

  /*
   * Back to front: changing a paragraph's list can shift the text that
   * follows it, which would move the ranges we have not used yet.
   */
  for (let i = paragraphs.length - 1; i >= 0; i--) {

    if (!targets[i]) {
      continue;
    }

    const listStyle =
      targets[i].getListStyle();

    if (!paragraphs[i].bullet) {

      listStyle.removeFromList();

    } else if (listStyle.isInList() !== true) {

      listStyle.applyListPreset(SlidesApp.ListPreset.DISC_CIRCLE_SQUARE);
    }
  }

  /*
   * Bold goes last, so nothing after it rewrites the runs. Offsets are
   * taken from the start of the range they are measured against, which
   * is the whole placeholder here — so each paragraph's spans are
   * shifted by the length of the lines above it, newline included.
   */
  let offset = 0;

  marked.forEach((paragraph, index) => {

    paragraph.spans.forEach(span => {

      range
        .getRange(offset + span[0], offset + span[1])
        .getTextStyle()
        .setBold(true);
    });

    offset += paragraph.text.length + 1;
  });
}


/** `**text**` — the only mark the engine gives meaning to. */
const BOLD_MARK = /\*\*([^*]+)\*\*/g;


/**
 * A paragraph's text with its marks removed, and the offsets, within
 * the stripped text, that the marks landed on. Kept as a pure function
 * so the checker can measure what the room will actually read.
 */
function parseMarks_(text) {

  const source =
    String(text);

  const spans = [];

  let out = "";
  let last = 0;
  let match;

  BOLD_MARK.lastIndex = 0;

  while ((match = BOLD_MARK.exec(source)) !== null) {

    out += source.slice(last, match.index);

    spans.push([out.length, out.length + match[1].length]);

    out += match[1];

    last = match.index + match[0].length;
  }

  return { text: out + source.slice(last), spans: spans };
}

/* ================================================================
   ENGINE — figures
   ================================================================ */

/*
 * A figure is drawn from Slides primitives: a shape for each node, a
 * line for each relation. It is vector, it stays editable in the
 * editor, and every color comes from the slide's own color scheme —
 * nothing here hardcodes a palette, so a figure re-themes with the
 * deck. Node fills are the theme's accent at low alpha rather than a
 * solid color, which keeps the theme's own text color readable on
 * top of them.
 *
 * The one deliberate exception is font size. Axis, edge and value
 * labels have no theme style of their own, so they are set to
 * FIGURE_LABEL_SIZE to sit below the node labels instead of
 * competing with them.
 *
 * Geometry is computed first (figureGeometry_) and drawn second
 * (drawFigure_). The layout is a pure function of the content and the
 * box it gets, which is what lets scripts/preview-figure.mjs draw the
 * same figure outside Google Slides.
 *
 * The engine refuses nothing: what a figure is allowed to contain is
 * check-deck.mjs's job, so a deck that builds is a deck that passed.
 */

const FIGURE_GAP = 14;            // points between nodes
const FIGURE_INSET = 8;           // points kept clear inside the box
const FIGURE_STANDOFF = 4;        // points between a line and the node it touches
const FIGURE_BORDER = 1;          // node outline weight, points
const FIGURE_EDGE_WEIGHT = 1.25;  // relation weight, points
const FIGURE_OUTLINE_ALPHA = 0.5; // node outlines, faint enough to recede
const FIGURE_FILL_ALPHA = 0.16;   // highlighted node fill
const FIGURE_SOLID_ALPHA = 0.85;  // bars, whose length is the datum
const FIGURE_MUTED_ALPHA = 0.4;   // bars that are there for comparison only
const FIGURE_LABEL_SIZE = 10;     // axis, edge and value labels, points

const NODE_SHAPES = {
  rounded: SlidesApp.ShapeType.ROUND_RECTANGLE,
  rect: SlidesApp.ShapeType.RECTANGLE,
  ellipse: SlidesApp.ShapeType.ELLIPSE
};

const LINE_CATEGORIES = {
  STRAIGHT: SlidesApp.LineCategory.STRAIGHT,
  BENT: SlidesApp.LineCategory.BENT,
  CURVED: SlidesApp.LineCategory.CURVED
};

/*
 * Which form fits which idea — flow for cause and effect, cycle for a
 * loop with no first step, tree for one parent with children,
 * quadrant for two judged axes, matrix for a labelled grid, stack for
 * layers, timeline for events on a line, bars for quantities, network
 * for arbitrary relations — and the evidence behind each, is in
 * references/figures.md.
 *
 * Edges: if `figure.edges` is given it wins, so relations can be
 * labeled ("because", "if") or drawn across a network. Without it,
 * flow and cycle join each node to the next and tree joins each node
 * to its parent. An authored relation carries an arrowhead unless it
 * says `arrow: false` — except in a network, where an edge means
 * adjacency until it claims cause.
 */
const FIGURE_EDGE_CATEGORY = {
  flow: "STRAIGHT",
  cycle: "CURVED",
  tree: "BENT",
  network: "STRAIGHT"
};


/**
 * One figure slide: a title that claims something, and the drawing
 * under it. The figure draws into the slide's body box when the theme
 * gives one, so it lands inside the theme's own margins.
 *
 * A figure whose kind is "image" is not drawn: its picture is placed
 * instead, fitted to the same box. That is the exception for what
 * shapes cannot show honestly — a photograph, a scan, a schematic
 * someone else drew.
 */
function buildFigureSlide_(presentation, layouts, spec) {

  const slide =
    presentation.appendSlide(layouts.figure);

  setTitle_(slide, spec.title);

  const box =
    figureBox_(slide, presentation);

  if ((spec.figure || {}).kind === "image") {

    insertFigureImage_(slide, spec.figure, box);

  } else {

    drawFigure_(
      slide,
      figureGeometry_(spec.figure, box)
    );
  }

  drawFigureSource_(slide, presentation, spec, box);

  return slide;
}


/**
 * The picture, at the size it fits: a figure that is stretched to
 * fill its box is a figure that has been drawn wrong.
 */
function insertFigureImage_(slide, figure, box) {

  const blob =
    Utilities.newBlob(
      Utilities.base64Decode(figure.png),
      "image/png",
      "figure"
    );

  const size =
    fitAspect_(figure.aspect, box);

  const image =
    slide.insertImage(
      blob,
      box.left + (box.width - size.width) / 2,
      box.top + (box.height - size.height) / 2,
      size.width,
      size.height
    );

  if (figure.alt) {

    image.setDescription(figure.alt);
  }

  return image;
}


/** The largest box-sized rectangle with the picture's proportions. */
function fitAspect_(aspect, box) {

  const ratio =
    (typeof aspect === "number" && aspect > 0)
      ? aspect
      : box.width / box.height;

  let width =
    box.width;

  let height =
    width / ratio;

  if (height > box.height) {

    height = box.height;
    width = height * ratio;
  }

  return { width: width, height: height };
}


/**
 * The rectangle the figure may draw in: the body placeholder's box
 * when the layout has one, otherwise the page under the title.
 */
function figureBox_(slide, presentation) {

  const page =
    pageSize_(presentation);

  const body =
    getTextPlaceholders_(slide).find(shape =>
      BODY_PLACEHOLDER_TYPES.indexOf(shape.getPlaceholderType()) !== -1
    );

  if (body) {

    const box =
      boxOf_(body);

    return inset_({
      left: box.left,
      top: box.top,
      width: box.width,
      height: box.height
    });
  }

  const top =
    titleBottom_(slide, page);

  return inset_({
    left: page.width * 0.06,
    top: top,
    width: page.width * 0.88,
    height: page.height * 0.94 - top
  });
}


/** The page, in points. Falls back to Google's 16:9 default. */
function pageSize_(presentation) {

  try {

    const width =
      presentation.getPageWidth();

    const height =
      presentation.getPageHeight();

    if (width > 0 && height > 0) {

      return { width: width, height: height };
    }

  } catch (error) {

    // Service versions without a page size: use the default below.
  }

  return { width: 720, height: 405 };
}


/** Just below the title — where a figure may start. */
function titleBottom_(slide, page) {

  const title =
    getTextPlaceholders_(slide).find(shape =>
      TITLE_PLACEHOLDER_TYPES.indexOf(shape.getPlaceholderType()) !== -1
    );

  if (!title) {

    return page.height * 0.2;
  }

  const box =
    boxOf_(title);

  return (
    Math.min(page.height * 0.55, box.top + box.height) + FIGURE_GAP
  );
}


/** Pull a box in by the gap the drawing keeps clear at the edges. */
function inset_(box) {

  return {
    left: box.left + FIGURE_INSET,
    top: box.top + FIGURE_INSET,
    width: Math.max(80, box.width - FIGURE_INSET * 2),
    height: Math.max(60, box.height - FIGURE_INSET * 2)
  };
}


/* ----------------------------------------------------------------
   Geometry — pure, no Slides calls
   ---------------------------------------------------------------- */

/**
 * The whole drawing as numbers: nodes, relations, and the small
 * labels. Every coordinate is in points, measured from the page's
 * top-left, which is the same space Slides uses.
 */
function figureGeometry_(figure, box) {

  const source =
    figure || {};

  const layout =
    figureLayout_(source, box);

  const shape =
    NODE_SHAPES[source.shape] || NODE_SHAPES.rounded;

  layout.nodes.forEach(node => {

    if (!node.shape) {

      node.shape = shape;
    }
  });

  layout.edges =
    layout.edges.concat(
      relationsFor_(source, layout.nodes)
    );

  return layout;
}


function figureLayout_(figure, box) {

  switch (figure.kind) {

    case "cycle":
      return cycleLayout_(figure, box);

    case "tree":
      return treeLayout_(figure, box);

    case "quadrant":
      return quadrantLayout_(figure, box);

    case "matrix":
      return matrixLayout_(figure, box);

    case "stack":
      return stackLayout_(figure, box);

    case "timeline":
      return timelineLayout_(figure, box);

    case "bars":
      return barsLayout_(figure, box);

    case "scatter":
      return scatterLayout_(figure, box);

    case "network":
      return networkLayout_(figure, box);

    default:
      return flowLayout_(figure, box);
  }
}


/** Left to right, one row: a sequence read in reading order. */
function flowLayout_(figure, box) {

  const nodes =
    figure.nodes || [];

  const count =
    Math.max(1, nodes.length);

  const width =
    Math.max(24, (box.width - FIGURE_GAP * (count - 1)) / count);

  const height =
    Math.max(24, Math.min(84, box.height * 0.42));

  const top =
    box.top + (box.height - height) / 2;

  const placed =
    nodes.map((node, index) => nodeBox_(node, {
      left: box.left + index * (width + FIGURE_GAP),
      top: top,
      width: width,
      height: height
    }));

  return { nodes: placed, edges: [], marks: [] };
}


/** Around a ring: a loop, so no node is the first one. */
function cycleLayout_(figure, box) {

  const nodes =
    figure.nodes || [];

  const count =
    Math.max(2, nodes.length);

  const middleX =
    box.left + box.width / 2;

  const middleY =
    box.top + box.height / 2;

  const radiusX =
    box.width * 0.33;

  const radiusY =
    box.height * 0.33;

  const width =
    Math.min(150, box.width * 0.26);

  const height =
    Math.min(54, box.height * 0.24);

  const placed =
    nodes.map((node, index) => {

      // Start at the top, then clockwise, the way the eye reads.
      const angle =
        -Math.PI / 2 + (index * 2 * Math.PI) / count;

      return nodeBox_(node, {
        left: middleX + radiusX * Math.cos(angle) - width / 2,
        top: middleY + radiusY * Math.sin(angle) - height / 2,
        width: width,
        height: height
      });
    });

  return { nodes: placed, edges: [], marks: [] };
}


/**
 * A root with children, then grandchildren. Children sit under the
 * parent they belong to and the parent is centered over them, so the
 * lines never cross and the shape of the tree is the shape of the
 * claim.
 */
function treeLayout_(figure, box) {

  const nodes =
    figure.nodes || [];

  const parents =
    nodes.map((node, index) => parentOf_(node, index));

  const children =
    nodes.map(() => []);

  parents.forEach((parent, index) => {

    if (parent !== null && children[parent]) {

      children[parent].push(index);
    }
  });

  // Each leaf takes the next free column, and a parent sits in the
  // middle of its children.
  const columns = [];
  let next = 0;

  const place = index => {

    if (columns[index] !== undefined) {

      return columns[index];
    }

    const kids =
      children[index];

    if (kids.length === 0) {

      columns[index] = next;
      next += 1;

      return columns[index];
    }

    const spots =
      kids.map(place);

    columns[index] =
      (spots[0] + spots[spots.length - 1]) / 2;

    return columns[index];
  };

  nodes.forEach((node, index) => place(index));

  const depth =
    depths_(nodes.length, parents);

  const levels =
    Math.max.apply(null, depth.concat([0])) + 1;

  const slot =
    box.width / Math.max(1, next);

  const width =
    Math.max(60, Math.min(170, slot - FIGURE_GAP));

  const height =
    Math.max(26, Math.min(48, (box.height - FIGURE_GAP * (levels - 1)) / levels));

  const placed =
    nodes.map((node, index) => nodeBox_(node, {
      left: box.left + (columns[index] + 0.5) * slot - width / 2,
      top: box.top + depth[index] * (height + FIGURE_GAP),
      width: width,
      height: height
    }));

  return { nodes: placed, edges: [], marks: [] };
}


/** The parent index of a node: the root, or what it names. */
function parentOf_(node, index) {

  if (index === 0) {

    return null;
  }

  if (node && typeof node.parent === "number" && node.parent < index) {

    return node.parent;
  }

  return 0;
}


/** How far each node sits from the root. */
function depths_(count, parents) {

  const depth = [];

  for (let index = 0; index < count; index++) {

    let steps = 0;

    let parent = parents[index];

    // A parent that points at or after its child would loop; stop.
    while (typeof parent === "number" && parent < index && steps < 4) {

      steps += 1;

      parent = parents[parent];
    }

    depth[index] = steps;
  }

  return depth;
}


/** Two axes, four cells, and the labels that make them mean something. */
function quadrantLayout_(figure, box) {

  const axes =
    figure.axes || {};

  const labelHeight =
    FIGURE_LABEL_SIZE + 6;

  const grid = {
    left: box.left,
    top: box.top + labelHeight,
    width: box.width,
    height: box.height - labelHeight * 2
  };

  const middleX =
    grid.left + grid.width / 2;

  const middleY =
    grid.top + grid.height / 2;

  const cellWidth =
    grid.width / 2 - FIGURE_GAP;

  const cellHeight =
    grid.height / 2 - FIGURE_GAP;

  const corners = [
    { left: grid.left, top: grid.top },
    { left: middleX + FIGURE_GAP / 2, top: grid.top },
    { left: grid.left, top: middleY + FIGURE_GAP / 2 },
    { left: middleX + FIGURE_GAP / 2, top: middleY + FIGURE_GAP / 2 }
  ];

  const placed =
    (figure.nodes || []).map((node, index) => {

      const corner =
        corners[index] || corners[corners.length - 1];

      const box_ = {
        left: corner.left,
        top: corner.top,
        width: Math.max(60, cellWidth),
        height: Math.max(30, cellHeight)
      };

      const placedNode =
        nodeBox_(node, box_);

      placedNode.textOnly = true;

      return placedNode;
    });

  const edges = [
    { category: "STRAIGHT", arrow: false, label: "", x1: middleX, y1: grid.top, x2: middleX, y2: grid.top + grid.height },
    { category: "STRAIGHT", arrow: false, label: "", x1: grid.left, y1: middleY, x2: grid.left + grid.width, y2: middleY }
  ];

  const marks = [
    {
      text: axes.y || "", size: FIGURE_LABEL_SIZE, align: "START",
      left: box.left, top: box.top, width: box.width, height: labelHeight
    },
    {
      text: axes.x || "", size: FIGURE_LABEL_SIZE, align: "END",
      left: box.left, top: box.top + box.height - labelHeight,
      width: box.width, height: labelHeight
    }
  ];

  return { nodes: placed, edges: edges, marks: marks };
}


/** A labelled grid: headers on the first row, cells in reading order. */
function matrixLayout_(figure, box) {

  const nodes =
    figure.nodes || [];

  const count =
    Math.max(1, nodes.length);

  const columns =
    Math.max(1, Math.min(count, figure.columns || Math.ceil(Math.sqrt(count))));

  const rows =
    Math.ceil(count / columns);

  const width =
    Math.max(24, (box.width - FIGURE_GAP * (columns - 1)) / columns);

  const height =
    Math.max(22, (box.height - FIGURE_GAP * (rows - 1)) / rows);

  const placed =
    nodes.map((node, index) => {

      const placedNode =
        nodeBox_(node, {
          left: box.left + (index % columns) * (width + FIGURE_GAP),
          top: box.top + Math.floor(index / columns) * (height + FIGURE_GAP),
          width: width,
          height: height
        });

      placedNode.header =
        figure.header === true && index < columns;

      return placedNode;
    });

  return { nodes: placed, edges: [], marks: [] };
}


/** Layers, top to bottom, in the order they were written. */
function stackLayout_(figure, box) {

  const nodes =
    figure.nodes || [];

  const count =
    Math.max(1, nodes.length);

  const height =
    Math.max(22, (box.height - FIGURE_GAP * (count - 1)) / count);

  const width =
    box.width * 0.74;

  const placed =
    nodes.map((node, index) => nodeBox_(node, {
      left: box.left + (box.width - width) / 2,
      top: box.top + index * (height + FIGURE_GAP),
      width: width,
      height: height
    }));

  return { nodes: placed, edges: [], marks: [] };
}


/** Events on a line, early to late, labelled above and below. */
function timelineLayout_(figure, box) {

  const nodes =
    figure.nodes || [];

  const count =
    Math.max(1, nodes.length);

  const middleY =
    box.top + box.height / 2;

  const labelHeight =
    Math.min(60, box.height * 0.32);

  const width =
    Math.min(150, (box.width - FIGURE_GAP * (count - 1)) / count);

  const step =
    count > 1 ? (box.width - width) / (count - 1) : 0;

  const edges = [
    {
      category: "STRAIGHT", arrow: false, label: "",
      x1: box.left, y1: middleY, x2: box.left + box.width, y2: middleY
    }
  ];

  const placed =
    nodes.map((node, index) => {

      const left =
        box.left + index * step;

      const above =
        index % 2 === 0;

      const placedNode =
        nodeBox_(node, {
          left: left,
          top: above ? middleY - FIGURE_GAP - labelHeight : middleY + FIGURE_GAP,
          width: width,
          height: labelHeight
        });

      placedNode.textOnly = true;

      edges.push({
        category: "STRAIGHT", arrow: false, label: "",
        x1: left + width / 2, y1: middleY - 6,
        x2: left + width / 2, y2: middleY + 6
      });

      return placedNode;
    });

  return { nodes: placed, edges: edges, marks: [] };
}


/** Quantities compared: bar length is the number, the label is the name. */
function barsLayout_(figure, box) {

  const nodes =
    figure.nodes || [];

  const count =
    Math.max(1, nodes.length);

  const baseline =
    box.top + box.height * 0.82;

  const tallest =
    box.height * 0.66;

  const slot =
    box.width / count;

  const width =
    slot * 0.56;

  const edges = [
    {
      category: "STRAIGHT", arrow: false, label: "",
      x1: box.left, y1: baseline, x2: box.left + box.width, y2: baseline
    }
  ];

  const marks = [];

  const highlighted =
    nodes.some(node => node && node.highlight === true);

  const placed =
    nodes.map((node, index) => {

      const share =
        share_(node);

      const height =
        Math.max(4, tallest * share);

      const left =
        box.left + index * slot + (slot - width) / 2;

      const placedNode =
        nodeBox_(node, {
          left: left, top: baseline - height, width: width, height: height
        });

      placedNode.bare = true;
      placedNode.solid = true;
      // One bar worth pointing at: the rest recede to comparison.
      placedNode.muted = highlighted && placedNode.highlight !== true;

      marks.push({
        text: (node && node.display) || "",
        size: FIGURE_LABEL_SIZE, align: "CENTER",
        left: left, top: baseline - height - FIGURE_LABEL_SIZE - 14,
        width: width, height: FIGURE_LABEL_SIZE + 4
      });

      marks.push({
        text: placedNode.label,
        size: FIGURE_LABEL_SIZE, align: "CENTER",
        left: box.left + index * slot, top: baseline + 5,
        width: slot, height: FIGURE_LABEL_SIZE + 4
      });

      return placedNode;
    });

  return { nodes: placed, edges: edges, marks: marks };
}


/** The bar's height as a share of the tallest bar. */
function share_(node) {

  const value =
    node && typeof node.value === "number" ? node.value : 0;

  return Math.max(0.02, Math.min(1, value));
}


/** Two variables: x and y position the point; the label sits beside it. */
function scatterLayout_(figure, box) {

  const nodes =
    figure.nodes || [];

  const count =
    Math.max(1, nodes.length);

  // Leave room for axis labels and value labels.
  const inset = {
    left: FIGURE_INSET + 24,
    top: FIGURE_INSET + 8,
    right: FIGURE_INSET + 8,
    bottom: FIGURE_INSET + 24
  };

  const area = {
    left: box.left + inset.left,
    top: box.top + inset.top,
    width: box.width - inset.left - inset.right,
    height: box.height - inset.top - inset.bottom
  };

  const pointSize = Math.min(8, Math.max(4, area.width / count * 0.18));

  const edges = [
    // x axis
    { category: "STRAIGHT", arrow: false, label: "",
      x1: area.left, y1: area.top + area.height,
      x2: area.left + area.width, y2: area.top + area.height },
    // y axis
    { category: "STRAIGHT", arrow: false, label: "",
      x1: area.left, y1: area.top,
      x2: area.left, y2: area.top + area.height }
  ];

  const marks = [];

  // Axis labels from figure.axes
  const axes = figure.axes || {};
  if (axes.x) {
    marks.push({
      text: axes.x, size: FIGURE_LABEL_SIZE, align: "CENTER",
      left: area.left, top: area.top + area.height + 6,
      width: area.width, height: FIGURE_LABEL_SIZE + 4
    });
  }
  if (axes.y) {
    // Vertical axis label: rotate not available in Slides, so place it
    // left-aligned at the top of the y axis.
    marks.push({
      text: axes.y, size: FIGURE_LABEL_SIZE, align: "END",
      left: area.left - 4, top: area.top - FIGURE_LABEL_SIZE - 2,
      width: 20, height: FIGURE_LABEL_SIZE + 4
    });
  }

  const placed =
    nodes.map((node, index) => {

      const xy = Array.isArray(node && node.value) ? node.value : [0.5, 0.5];
      const x = Math.max(0, Math.min(1, typeof xy[0] === "number" ? xy[0] : 0.5));
      const y = Math.max(0, Math.min(1, typeof xy[1] === "number" ? xy[1] : 0.5));

      const cx = area.left + x * area.width;
      const cy = area.top + (1 - y) * area.height;

      const placedNode = nodeBox_(node, {
        left: cx - pointSize / 2,
        top: cy - pointSize / 2,
        width: pointSize,
        height: pointSize
      });

      placedNode.bare = true;
      placedNode.solid = true;

      // Label beside the point: prefer right side, flip if too close to edge.
      const labelLeft = cx + pointSize + 3;
      const labelWidth = area.left + area.width - labelLeft;
      const useLeft = labelWidth < 40;
      const markLeft = useLeft ? area.left : labelLeft;
      const markWidth = useLeft ? cx - pointSize - 3 - area.left : labelWidth;

      marks.push({
        text: (node && node.display) || labelOf_(node),
        size: FIGURE_LABEL_SIZE, align: useLeft ? "END" : "START",
        left: markLeft, top: cy - (FIGURE_LABEL_SIZE + 4) / 2,
        width: Math.max(20, markWidth), height: FIGURE_LABEL_SIZE + 4
      });

      return placedNode;
    });

  return { nodes: placed, edges: edges, marks: marks };
}


/** Named nodes at chosen coordinates, joined by the edges given. */
function networkLayout_(figure, box) {

  const nodes =
    figure.nodes || [];

  const width =
    Math.min(150, box.width * 0.24);

  const height =
    Math.min(50, box.height * 0.22);

  const placed =
    nodes.map(node => {

      const at =
        (node && node.at) || [0.5, 0.5];

      return nodeBox_(node, {
        left: box.left + clamp01_(at[0]) * (box.width - width),
        top: box.top + clamp01_(at[1]) * (box.height - height),
        width: width,
        height: height
      });
    });

  return { nodes: placed, edges: [], marks: [] };
}


function clamp01_(value) {

  const number =
    typeof value === "number" ? value : 0.5;

  return Math.max(0, Math.min(1, number));
}


/** A node's box, its text, and how it should be drawn. */
function nodeBox_(node, box) {

  return {
    label: labelOf_(node),
    detail: (node && node.detail) || "",
    highlight: !!(node && node.highlight),
    left: box.left,
    top: box.top,
    width: box.width,
    height: box.height
  };
}


function labelOf_(node) {

  return typeof node === "string" ? node : String((node && node.label) || "");
}


/* ----------------------------------------------------------------
   Relations
   ---------------------------------------------------------------- */

/**
 * The lines between nodes. Authored edges win; flow, cycle and tree
 * derive them when none are given, because those forms already say
 * what connects to what.
 */
function relationsFor_(figure, nodes) {

  const authored =
    figure.edges;

  if (authored && authored.length > 0) {

    return authored.map(edge => {

      const from =
        nodes[edge.from];

      const to =
        nodes[edge.to];

      if (!from || !to) {

        return null;
      }

      return relation_(
        from, to,
        edgeCategory_(figure.kind, edge),
        arrowOf_(figure.kind, edge),
        edge.label
      );
    })
    .filter(edge => edge !== null);
  }

  if (figure.kind === "cycle" && nodes.length > 2) {

    return nodes.map((node, index) =>
      relation_(node, nodes[(index + 1) % nodes.length], "CURVED", true, "")
    );
  }

  if (figure.kind === "tree") {

    const parents =
      (figure.nodes || []).map((node, index) => parentOf_(node, index));

    return parents
      .map((parent, index) =>
        parent === null || !nodes[parent]
          ? null
          : relation_(nodes[parent], nodes[index], "BENT", true, "")
      )
      .filter(edge => edge !== null);
  }

  if (figure.kind === "flow" && nodes.length > 1) {

    return nodes.slice(0, -1).map((node, index) =>
      relation_(node, nodes[index + 1], "STRAIGHT", true, "")
    );
  }

  return [];
}


/**
 * Whether an authored relation gets an arrowhead. Flow, cycle and
 * tree say direction by their form, so their relations point; a
 * network edge is adjacency until it claims otherwise.
 */
function arrowOf_(kind, edge) {

  if (typeof edge.arrow === "boolean") {

    return edge.arrow;
  }

  return kind !== "network";
}


function edgeCategory_(kind, edge) {

  if (edge && LINE_CATEGORIES[edge.category]) {

    return edge.category;
  }

  return FIGURE_EDGE_CATEGORY[kind] || "STRAIGHT";
}


/**
 * One line between two boxes, drawn between their facing edges, with
 * a standoff so the arrowhead does not sit on the node's outline.
 */
function relation_(from, to, category, arrow, label) {

  const start =
    anchor_(from, to);

  const end =
    anchor_(to, from);

  const lineStart =
    pull_(start, end, FIGURE_STANDOFF);

  const lineEnd =
    pull_(end, start, FIGURE_STANDOFF);

  const edge = {
    category: category,
    arrow: arrow === true,
    label: label || "",
    x1: lineStart.x, y1: lineStart.y,
    x2: lineEnd.x, y2: lineEnd.y
  };

  if (edge.label) {

    /* Off the line, not on it: a label that sits on its own
     * relation is unreadable at the back of the room. */
    const length =
      Math.max(1, Math.hypot(edge.x2 - edge.x1, edge.y2 - edge.y1));

    const offset =
      FIGURE_LABEL_SIZE + 2;

    const middleX =
      (edge.x1 + edge.x2) / 2;

    const middleY =
      (edge.y1 + edge.y2) / 2;

    edge.labelBox = {
      text: edge.label,
      size: FIGURE_LABEL_SIZE,
      align: "CENTER",
      left: middleX - ((edge.y2 - edge.y1) / length) * offset - 45,
      top: middleY + ((edge.x2 - edge.x1) / length) * offset - (FIGURE_LABEL_SIZE + 4) / 2,
      width: 90,
      height: FIGURE_LABEL_SIZE + 4
    };
  }

  return edge;
}


/** Where the line from this box's centre to another box leaves this box. */
function anchor_(box, towards) {

  const middleX =
    box.left + box.width / 2;

  const middleY =
    box.top + box.height / 2;

  const deltaX =
    (towards.left + towards.width / 2) - middleX;

  const deltaY =
    (towards.top + towards.height / 2) - middleY;

  if (deltaX === 0 && deltaY === 0) {

    return { x: middleX, y: middleY };
  }

  const scaleX =
    deltaX === 0 ? Infinity : (box.width / 2) / Math.abs(deltaX);

  const scaleY =
    deltaY === 0 ? Infinity : (box.height / 2) / Math.abs(deltaY);

  const scale =
    Math.min(scaleX, scaleY);

  return {
    x: middleX + deltaX * scale,
    y: middleY + deltaY * scale
  };
}


/** Move a point away from `from`, along the line, by `distance`. */
function pull_(point, from, distance) {

  const deltaX =
    point.x - from.x;

  const deltaY =
    point.y - from.y;

  const length =
    Math.sqrt(deltaX * deltaX + deltaY * deltaY);

  if (length === 0) {

    return { x: point.x, y: point.y };
  }

  const step =
    Math.min(distance, length / 3) / length;

  return {
    x: point.x - deltaX * step,
    y: point.y - deltaY * step
  };
}


/* ----------------------------------------------------------------
   Drawing
   ---------------------------------------------------------------- */

/**
 * The source line, on a figure slide.
 *
 * A body slide carries its citation as the last line inside the body
 * box. A figure slide has no body placeholder, so the line is drawn as
 * annotation instead — otherwise a `cite` on a figure slide is dropped
 * without a word, and a number in a figure loses the source that makes
 * it checkable.
 */
function drawFigureSource_(slide, presentation, spec, box) {

  const line =
    sourceLine_(spec).map(paragraph => paragraph.text).join(" ");

  if (!line) {

    return;
  }

  const page =
    pageSize_(presentation);

  const height =
    FIGURE_LABEL_SIZE + 4;

  drawLabel_(slide, {
    text: line,
    align: "START",
    size: FIGURE_LABEL_SIZE,
    left: box.left,
    top: Math.min(box.top + box.height + FIGURE_GAP, page.height - height - 4),
    width: box.width,
    height: height
  }, themeColor_(slide, ["TEXT1", "DARK1", "LIGHT1"]));
}


function drawFigure_(slide, geometry) {

  const ink =
    themeColor_(slide, ["TEXT1", "DARK1", "LIGHT1"]);

  const accent =
    themeColor_(slide, ["ACCENT1", "ACCENT2"]);

  geometry.edges.forEach(edge => {

    drawRelation_(slide, edge, ink);
  });

  geometry.nodes.forEach(node => {

    drawNode_(slide, node, ink, accent);
  });

  geometry.marks.forEach(mark => {

    if (mark.text) {

      drawLabel_(slide, mark, ink);
    }
  });
}


/** A theme color by any of its names, or null when the theme has none. */
function themeColor_(slide, names) {

  const scheme =
    slide.getColorScheme();

  if (!scheme) {

    return null;
  }

  const types =
    scheme.getThemeColors() || [];

  for (let i = 0; i < names.length; i++) {

    const wanted =
      normalizeName_(names[i]);

    const match =
      types.filter(type => normalizeName_(String(type)) === wanted)[0];

    if (match) {

      return scheme.getConcreteColor(match);
    }
  }

  return null;
}


function drawNode_(slide, node, ink, accent) {

  if (node.textOnly === true) {

    const label =
      drawLabel_(slide, {
        text: node.label + (node.detail ? "\n" + node.detail : ""),
        align: "CENTER",
        valign: true,
        left: node.left, top: node.top,
        width: node.width, height: node.height
      }, ink);

    return label;
  }

  const shape =
    slide.insertShape(node.shape, node.left, node.top, node.width, node.height);

  shape.setContentAlignment(SlidesApp.ContentAlignment.MIDDLE);

  styleFill_(shape.getFill(), node, accent);

  styleBorder_(shape.getBorder(), node, ink, accent);

  if (node.bare !== true) {

    writeParagraphs_(
      shape,
      paragraphsFor_(node)
    );

    /* Where a label sits inside its node is part of the drawing, so
     * it is centered here rather than left to the theme's type. */
    alignText_(shape.getText(), SlidesApp.ParagraphAlignment.CENTER);
  }

  return shape;
}


function paragraphsFor_(node) {

  const paragraphs = [
    { text: node.label, bullet: false }
  ];

  if (node.detail) {

    paragraphs.push({ text: node.detail, bullet: false });
  }

  return paragraphs;
}


/** Highlighted nodes take the theme's accent; the rest stay unfilled. */
function styleFill_(fill, node, accent) {

  if (node.solid === true && accent) {

    fill.setSolidFill(accent, node.muted === true ? FIGURE_MUTED_ALPHA : FIGURE_SOLID_ALPHA);

    return;
  }

  if ((node.highlight === true || node.header === true) && accent) {

    fill.setSolidFill(accent, FIGURE_FILL_ALPHA);

    return;
  }

  fill.setTransparent();
}


function styleBorder_(border, node, ink, accent) {

  if (node.solid === true) {

    border.setTransparent();

    return;
  }

  const highlighted =
    node.highlight === true || node.header === true;

  const color =
    highlighted && accent ? accent : ink;

  if (!color) {

    border.setTransparent();

    return;
  }

  border.setWeight(FIGURE_BORDER);

  border
    .getLineFill()
    .setSolidFill(color, highlighted ? 1 : FIGURE_OUTLINE_ALPHA);
}


function drawRelation_(slide, edge, ink) {

  const line =
    slide.insertLine(
      LINE_CATEGORIES[edge.category] || LINE_CATEGORIES.STRAIGHT,
      edge.x1, edge.y1, edge.x2, edge.y2
    );

  if (ink) {

    line.getLineFill().setSolidFill(ink);
  }

  line.setWeight(FIGURE_EDGE_WEIGHT);

  line.setEndArrow(
    edge.arrow
      ? SlidesApp.ArrowStyle.STEALTH_ARROW
      : SlidesApp.ArrowStyle.NONE
  );

  if (edge.labelBox) {

    drawLabel_(slide, edge.labelBox, ink);
  }

  return line;
}


/** Set every paragraph of a range, since a range spans the shape. */
function alignText_(text, alignment) {

  if (!text) {

    return;
  }

  text
    .getParagraphs()
    .forEach(paragraph =>
      paragraph
        .getRange()
        .getParagraphStyle()
        .setParagraphAlignment(alignment)
    );
}


/**
 * A label Slides has no theme style for: axis, edge and value text.
 * Sized below the node labels so it reads as annotation.
 */
function drawLabel_(slide, mark, ink) {

  const box =
    slide.insertTextBox(mark.text, mark.left, mark.top, mark.width, mark.height);

  const text =
    box.getText();

  if (text) {

    if (mark.valign === true) {

      box.setContentAlignment(SlidesApp.ContentAlignment.MIDDLE);
    }

    if (typeof mark.size === "number") {

      text
        .getTextStyle()
        .setFontSize(mark.size);
    }

    if (mark.align === "CENTER") {

      alignText_(text, SlidesApp.ParagraphAlignment.CENTER);

    } else if (mark.align === "END") {

      alignText_(text, SlidesApp.ParagraphAlignment.END);
    }
  }

  return box;
}

/* ================================================================
   ENGINE — diagnostics
   ================================================================ */

/**
 * Prints every layout in the template, the placeholder types each one
 * exposes, and the layout each role resolves to. Run this when a deck
 * comes out in unexpected layouts.
 */
function listTemplateLayouts() {

  const presentation =
    SlidesApp.openById(DECK.meta.templateId);

  const layouts =
    presentation.getLayouts();

  Logger.log(
    "========== TEMPLATE LAYOUTS =========="
  );

  layouts.forEach(layout => {

    const types =
      getTextPlaceholders_(layout)
        .map(shape => shape.getPlaceholderType());

    Logger.log(
      "  " + layout.getLayoutName() +
      "  [" + types.join(", ") + "]"
    );
  });

  Logger.log(
    "======================================"
  );

  try {
    findLayouts_(presentation);
  } catch (error) {
    Logger.log(
      "LAYOUT RESOLUTION FAILED: " + error.message
    );
  }
}
