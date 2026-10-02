#!/usr/bin/env node
/**
 * test-engine.mjs — run the engine against a mock Slides service.
 *
 *   node scripts/test-engine.mjs
 *
 * The engine can only be exercised end to end inside Apps Script, so
 * this mocks the documented Slides/Drive API surface (PageElements,
 * text ranges, list styles, notes pages) and executes the real .gs
 * file in a VM. It fails on any API misuse — a method the service does
 * not have, a PageElement reached without asShape(), notes that never
 * land — which is exactly the class of bug that otherwise surfaces as
 * a TypeError in the user's editor after they have pasted the script.
 *
 * Run it after editing assets/deck-builder.gs.
 */
import { readFileSync, writeFileSync, mkdtempSync } from 'node:fs';
import { dirname, resolve, join } from 'node:path';
import { tmpdir } from 'node:os';
import { fileURLToPath } from 'node:url';
import vm from 'node:vm';
import assert from 'node:assert/strict';
import { buildSource, hydrate } from './build-deck.mjs';
import { checkDeck } from './check-deck.mjs';

const clone = value => JSON.parse(JSON.stringify(value));
const rules = deck => checkDeck(deck);
const ruleIds = deck => rules(deck).map(f => f.rule);

import { FIGURE_THEME, FIGURE_SAMPLES, FIGURE_TITLES } from './figure-fixtures.mjs';
import {
  runSource, PlaceholderType, PageElementType,
  ShapeType, ArrowStyle, ThemeColorType
} from './mock-slides.mjs';

/* ------------------------- fixtures ------------------------- */

const FIXTURE = {
  meta: {
    title: 'Fixture deck',
    mode: 'teach',
    templateId: '1X0NwsMtqwpGdcwk0QqlFYHlpKYwdXW-rh5j0vZSN7-U',
    audience: 'new residents',
    objective: 'name the two rules that matter most',
    sources: ['HFS Handbook 2026']
  },
  slides: [
    { type: 'title', title: 'Community Orientation', subtitle: 'MERCER HALL', notes: 'Welcome them.' },
    { type: 'section', title: 'Get Involved', subtitle: 'Find your people.', notes: 'Transition.' },
    {
      type: 'body',
      title: 'Hall Council decides how your hall spends its budget',
      bullets: ['Weekly meetings: Mondays, 6–7 PM.', 'Executive, rep, and general member roles.', ''],
      cite: 'HFS Handbook 2026',
      citeUrl: 'https://hfs.example.edu/handbook',
      notes: 'Name the three roles you will be recruiting for.'
    },
    {
      type: 'twoColumn',
      title: 'Noise rules protect sleep and study',
      left: { heading: 'Noise', bullets: ['Quiet hours start at 10 PM.', 'Courtesy hours are 24/7.'] },
      right: { heading: 'Guests', bullets: ['You are responsible for your guests.', 'Guests stay at most 3 nights.'] },
      notes: 'Ask which rule they break most often.'
    },
    { type: 'statement', title: 'Everyone taps in every time', notes: 'Say it once, slowly.' },
    {
      type: 'prompt',
      title: 'Which of these is a fixed cost?',
      bullets: ['Rent', 'Groceries'],
      answer: 'Rent — it does not change with usage.',
      notes: 'Cold call two people before revealing.'
    },
    {
      type: 'prompt',
      title: 'Why does a short line work better than no line?',
      answer: 'It gives the other person a way to comply without losing face.',
      notes: 'Elaborative interrogation: make them explain the mechanism.'
    },
    {
      type: 'activity',
      title: 'Fix the off-by-one in pairs',
      activity: {
        task: 'Run the tests, find the wrong line, and fix it.',
        grouping: 'pairs',
        timeMinutes: 8,
        deliverable: 'one passing test run',
        successCriterion: 'all four cases pass, including n = 0',
        debrief: 'Ask two pairs which line was wrong before you show the fix.',
        artifact: {
          mode: 'code',
          displayUrl: 'github.com/you/cs1-off-by-one',
          url: 'https://github.com/you/cs1-off-by-one'
        }
      },
      qr: { png: 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==', url: 'https://github.com/you/cs1-off-by-one' },
      notes: 'Hands on keyboards before you say another word.'
    }
  ]
};

const CUSTOM_THEME = [
  { name: 'Title', placeholders: [{ type: PlaceholderType.TITLE, left: 100 }, { type: PlaceholderType.SUBTITLE, left: 100 }] },
  { name: 'Section', placeholders: [{ type: PlaceholderType.CENTERED_TITLE, left: 100 }, { type: PlaceholderType.SUBTITLE, left: 100 }] },
  { name: 'Title + Body', placeholders: [{ type: PlaceholderType.TITLE, left: 100 }, { type: PlaceholderType.BODY, left: 80 }] },
  { name: 'Two Column', placeholders: [{ type: PlaceholderType.TITLE, left: 100 }, { type: PlaceholderType.BODY, left: 80 }, { type: PlaceholderType.BODY, left: 500 }] }
];

const GOOGLE_THEME = [
  { name: 'Title Slide', placeholders: [{ type: PlaceholderType.CENTERED_TITLE }, { type: PlaceholderType.SUBTITLE }] },
  { name: 'Title and Body', placeholders: [{ type: PlaceholderType.TITLE }, { type: PlaceholderType.BODY }] },
  { name: 'Title Only', placeholders: [{ type: PlaceholderType.TITLE }] },
  { name: 'Blank', placeholders: [] },
  { name: 'Section Header', placeholders: [{ type: PlaceholderType.CENTERED_TITLE }, { type: PlaceholderType.SUBTITLE }] },
  { name: 'Two Content', placeholders: [{ type: PlaceholderType.TITLE }, { type: PlaceholderType.BODY }, { type: PlaceholderType.OBJECT }] },
  { name: 'Picture with Caption', placeholders: [{ type: PlaceholderType.TITLE }, { type: PlaceholderType.PICTURE }, { type: PlaceholderType.BODY }] }
];

const UNNAMED_THEME = [
  { name: 'Cover', placeholders: [{ type: PlaceholderType.TITLE }, { type: PlaceholderType.SUBTITLE }] },
  { name: 'Divider', placeholders: [{ type: PlaceholderType.CENTERED_TITLE }, { type: PlaceholderType.SUBTITLE }] },
  { name: 'Content', placeholders: [{ type: PlaceholderType.TITLE }, { type: PlaceholderType.BODY }] },
  { name: 'Split', placeholders: [{ type: PlaceholderType.TITLE }, { type: PlaceholderType.BODY }, { type: PlaceholderType.BODY }] }
];

/* ------------------------- runner ------------------------- */

function run(deck, theme, opts = {}) {
  return runSource(buildSource(deck), theme, opts);
}

const shapes = page => page.getPlaceholders()
  .filter(element => element.getPageElementType() === PageElementType.SHAPE)
  .map(element => element.asShape());

const byType = (slide, type) => shapes(slide).find(shape => shape.getPlaceholderType() === type);
const titleOf = slide => shapes(slide).find(shape =>
  shape.getPlaceholderType() === PlaceholderType.TITLE ||
  shape.getPlaceholderType() === PlaceholderType.CENTERED_TITLE);

const checks = [];
const check = (name, fn) => checks.push({ name, fn });

/* ------------------------- checks ------------------------- */

check('builds every slide type and writes the notes', () => {
  const { presentation, logs, url } = run(FIXTURE, CUSTOM_THEME);
  const slides = presentation.getSlides();

  assert.equal(slides.length, 8, 'slide count');
  assert.equal(presentation.closed, true, 'presentation must be closed');
  assert.match(url, /docs\.google\.com/, 'returns the deck URL');
  assert.ok(logs.some(l => /DECK CREATED — 8 slides/.test(l)), 'logs the slide count');
  assert.ok(logs.some(l => /^Layouts used: /.test(l)), 'logs the resolved layouts');

  // title slide
  assert.equal(titleOf(slides[0]).text(), 'Community Orientation');
  assert.equal(byType(slides[0], PlaceholderType.SUBTITLE).text(), 'MERCER HALL');

  // section slide
  assert.equal(titleOf(slides[1]).text(), 'Get Involved');
  assert.equal(byType(slides[1], PlaceholderType.SUBTITLE).text(), 'Find your people.');

  // body: real lines bulleted, blank separator blank and unlisted
  const body = byType(slides[2], PlaceholderType.BODY);
  const bodyParagraphs = body.paragraphs();
  assert.equal(bodyParagraphs[0].text, 'Weekly meetings: Mondays, 6–7 PM.');
  assert.equal(bodyParagraphs[0].inList, true, 'a bullet must be in a list');
  assert.equal(bodyParagraphs[1].inList, true, 'a bullet must be in a list');
  assert.equal(bodyParagraphs[2].text, '', 'blank separator kept');
  assert.equal(bodyParagraphs[2].inList, false, 'blank separator must not be a bullet');
  assert.ok(!bodyParagraphs.some(p => p.text.startsWith('•')), 'glyphs come from the theme, not the text');

  // two column: headings out of the list, columns left to right
  const columns = shapes(slides[3])
    .filter(shape => shape.getPlaceholderType() === PlaceholderType.BODY)
    .sort((a, b) => a.getLeft() - b.getLeft());
  assert.equal(columns.length, 2, 'two body placeholders');
  const left = columns[0].paragraphs();
  const right = columns[1].paragraphs();
  assert.equal(left[0].text, 'Noise');
  assert.equal(left[0].inList, false, 'a column heading must not be bulleted');
  assert.equal(left[2].text, 'Quiet hours start at 10 PM.');
  assert.equal(left[2].inList, true);
  assert.equal(right[0].text, 'Guests');
  assert.equal(right[3].text, 'Guests stay at most 3 nights.');

  // statement slide: title layout, no body content
  assert.equal(titleOf(slides[4]).text(), 'Everyone taps in every time');

  // prompt: question on the slide, answer only in the notes
  assert.equal(titleOf(slides[5]).text(), 'Which of these is a fixed cost?');
  const promptText = shapes(slides[5]).map(s => s.text()).join('\n');
  assert.ok(!promptText.includes('does not change with usage'), 'the answer must not be on the slide');
  const notes = slides[5].getNotesPage().getSpeakerNotesShape().text();
  assert.match(notes, /Rent — it does not change with usage\./, 'the answer lands in the notes');
  assert.match(notes, /Cold call two people/, 'the author notes survive');

  // a bullet-less prompt: question on the slide, no body content
  assert.equal(titleOf(slides[6]).text(), 'Why does a short line work better than no line?');
  assert.equal(shapes(slides[6]).filter(s => s.getPlaceholderType() === PlaceholderType.BODY).length, 1,
    'the layout still has its body placeholder');
  assert.equal(byType(slides[6], PlaceholderType.BODY).text(), '',
    'a bullet-less prompt leaves the body empty');
  assert.match(slides[6].getNotesPage().getSpeakerNotesShape().text(), /way to comply without losing face/);

  // every slide carries notes
  presentation.getSlides().forEach((slide, index) => {
    assert.ok(
      slide.getNotesPage().getSpeakerNotesShape().text().trim().length > 0,
      `slide ${index + 1} has no notes`
    );
  });
});

check('resolves layouts by name, alias and shape', () => {
  const google = run(FIXTURE, GOOGLE_THEME);
  assert.ok(google.logs.some(l => /twoColumn="Two Content"/.test(l)), 'alias match');
  assert.equal(google.presentation.getSlides().length, 8);

  const unnamed = run(FIXTURE, UNNAMED_THEME);
  assert.ok(unnamed.logs.some(l => /WARNING: the theme names no/.test(l)), 'fallback is logged');
  assert.equal(unnamed.presentation.getSlides().length, 8);
  const twoCol = unnamed.presentation.getSlides()[3];
  assert.equal(shapes(twoCol).filter(s => s.getPlaceholderType() === PlaceholderType.BODY).length, 2,
    'shape fallback found the two-column layout');
});

check('survives awkward themes', () => {
  // lists already supplied by the layout: no preset is applied
  const listed = run(FIXTURE, CUSTOM_THEME, { listInLayout: true });
  const listedBody = byType(listed.presentation.getSlides()[2], PlaceholderType.BODY).paragraphs();
  assert.equal(listedBody[0].inList, true);
  assert.equal(listedBody[0].preset, null, 'a themed list must not be overwritten');

  // an image placeholder on the slide must not be mistaken for text
  const withImage = run(FIXTURE, CUSTOM_THEME, { imagePlaceholder: true });
  assert.equal(withImage.presentation.getSlides().length, 8);

  // columns returned right-to-left must still render left-to-right
  const reversed = run(FIXTURE, CUSTOM_THEME, { reverseBodyOrder: true });
  const reversedColumns = shapes(reversed.presentation.getSlides()[3])
    .filter(s => s.getPlaceholderType() === PlaceholderType.BODY)
    .sort((a, b) => a.getLeft() - b.getLeft());
  assert.equal(reversedColumns[0].paragraphs()[0].text, 'Noise',
    'the left column must hold the left content');

  // a two-column layout with a single body placeholder takes both columns
  const single = run(FIXTURE, [
    ...CUSTOM_THEME.filter(l => l.name !== 'Two Column'),
    { name: 'Two Column', placeholders: [{ type: PlaceholderType.TITLE }, { type: PlaceholderType.BODY }] }
  ]);
  const singleBody = byType(single.presentation.getSlides()[3], PlaceholderType.BODY).paragraphs();
  assert.equal(singleBody[0].text, 'Noise');
  assert.equal(singleBody[0].inList, false);
  assert.ok(singleBody.some(p => p.text === 'Guests'), 'both headings survive');
  assert.ok(singleBody.some(p => /3 nights/.test(p.text)), 'both columns survive');
});

check('a theme with no typed title still gets its headlines', () => {
  /*
   * A hand-built theme: every box comes back as a body, and the API lists the
   * content box before the one at the top. The headline used to be written
   * into that first box and then overwritten by the body, which left every
   * slide in such a theme with no headline at all.
   */
  const untyped = [
    { name: 'Title', placeholders: [{ type: PlaceholderType.BODY, top: 40, left: 60, width: 600, height: 100 }] },
    { name: 'Section', placeholders: [{ type: PlaceholderType.BODY, top: 40, left: 60, width: 600, height: 100 }] },
    { name: 'Title + Body', placeholders: [
      { type: PlaceholderType.BODY, top: 150, left: 60, width: 600, height: 200 },
      { type: PlaceholderType.BODY, top: 40, left: 60, width: 600, height: 80 }
    ] },
    { name: 'Two Column', placeholders: [
      { type: PlaceholderType.BODY, top: 150, left: 60, width: 600, height: 200 },
      { type: PlaceholderType.BODY, top: 40, left: 60, width: 600, height: 80 }
    ] }
  ];
  const { presentation, logs } = run(FIXTURE, untyped);

  const content = shapes(presentation.getSlides()[2]).sort((a, b) => a.getTop() - b.getTop());
  assert.equal(content[0].paragraphs()[0].text, 'Hall Council decides how your hall spends its budget',
    'the headline goes in the box at the top of the slide');
  assert.match(content[1].text(), /Weekly meetings/, 'and the body goes in the box below it');
  assert.ok(!/Hall Council/.test(content[1].text()), 'the body does not carry the headline');

  const split = shapes(presentation.getSlides()[3]).sort((a, b) => a.getTop() - b.getTop());
  assert.equal(split[0].paragraphs()[0].text, 'Noise rules protect sleep and study',
    'a two-column slide keeps its headline too');
  assert.ok(/Noise/.test(split[1].text()) && /Guests/.test(split[1].text()),
    'stacked boxes take both columns rather than writing one over the headline');

  const activity = presentation.getSlides()[7];
  const qr = activity.getImages()[0];
  const brief = shapes(activity).filter(s => s.getPlaceholderType() === PlaceholderType.BODY)
    .sort((a, b) => b.getWidth() * b.getHeight() - a.getWidth() * a.getHeight())[0];
  assert.equal(brief.paragraphs()[0].text.startsWith('Run the tests'), true,
    'the brief lands in the content box, not the headline box');
  assert.ok(qr.getTop() >= brief.getTop(), 'and the QR stays inside that box, off the headline');
  assert.ok(logs.some(l => /content boxes are stacked/.test(l)), 'the stacked fallback is never silent');
});

check('fails loudly when the theme cannot serve the deck', () => {
  assert.throws(() => run(FIXTURE, [{ name: 'Blank', placeholders: [] }]),
    /No layout can serve as: title, section, body, twoColumn/);
  assert.throws(() => run(FIXTURE, []), /contains no layouts/);
  assert.throws(() => run({ ...FIXTURE, slides: [{ type: 'nonsense', title: 'x', notes: 'y' }] }, CUSTOM_THEME),
    /Unknown slide type "nonsense"/);
});

check('diagnostics run against the template', () => {
  const result = run(FIXTURE, CUSTOM_THEME);
  result.context.listTemplateLayouts();
  const text = result.logs.join('\n');
  assert.match(text, /TEMPLATE LAYOUTS/);
  assert.match(text, /Title \+ Body\s+\[TITLE, BODY\]/);
});


check('an activity slide briefs the room, QR included', () => {
  const { presentation, logs } = run(FIXTURE, CUSTOM_THEME);
  const slide = presentation.getSlides()[7];
  assert.equal(titleOf(slide).text(), 'Fix the off-by-one in pairs');

  const columns = shapes(slide)
    .filter(s => s.getPlaceholderType() === PlaceholderType.BODY)
    .sort((a, b) => a.getLeft() - b.getLeft());
  const brief = columns[0].text();
  assert.match(brief, /Run the tests, find the wrong line/, 'the task is on the slide');
  assert.match(brief, /pairs · 8 minutes/, 'grouping and time are part of the brief');
  assert.match(brief, /Hand in: one passing test run/);
  assert.match(brief, /Done when: all four cases pass/);
  assert.match(brief, /github\.com\/you\/cs1-off-by-one/, 'the link is printed for anyone who cannot scan');

  assert.equal(slide.getImages().length, 1, 'one QR');
  const qr = slide.getImages()[0];
  assert.equal(qr.width, qr.height, 'a QR must stay square');
  assert.ok(qr.left > columns[0].getLeft(), 'the QR sits right of the brief, in the theme grid');
  assert.ok(logs.some(l => /QR inserted: \d+pt square/.test(l)), 'the run log says what it placed');

  const notes = slide.getNotesPage().getSpeakerNotesShape().text();
  assert.match(notes, /Debrief: Ask two pairs/, 'the debrief is what the presenter does afterwards');
  assert.match(notes, /Link: https:\/\/github\.com\/you\/cs1-off-by-one/);
});

check('a citation lands on the slide and its reference in the notes', () => {
  const { presentation } = run(FIXTURE, CUSTOM_THEME);
  const paragraphs = byType(presentation.getSlides()[2], PlaceholderType.BODY).paragraphs();
  assert.equal(paragraphs[3].text, 'Source: HFS Handbook 2026');
  assert.equal(paragraphs[3].inList, false, 'a citation is not a bullet');
  assert.match(
    presentation.getSlides()[2].getNotesPage().getSpeakerNotesShape().text(),
    /Source: https:\/\/hfs\.example\.edu\/handbook/,
    'the notes carry the resolvable reference'
  );
});

check('a marked span comes out bold, and the marks never reach the slide', () => {
  const deck = clone(FIXTURE);
  deck.slides[2].bullets = [
    'Weekly meetings: **Mondays, 6–7 PM**.',
    'Roles: **exec, rep, general**.'
  ];
  const { presentation } = run(deck, CUSTOM_THEME);
  const body = byType(presentation.getSlides()[2], PlaceholderType.BODY);

  assert.equal(body.paragraphs()[0].text, 'Weekly meetings: Mondays, 6–7 PM.',
    'the markers are authoring syntax, not text the room reads');
  assert.equal(body.paragraphs()[1].text, 'Roles: exec, rep, general.',
    'and the mark is stripped from every paragraph it appears in');
  assert.deepEqual(body.boldRuns(), ['Mondays, 6–7 PM', 'exec, rep, general'],
    'each span is bold, and the second lands in the paragraph it was written in');
});

check('lists the deck sources in the run log', () => {
  const { logs } = run(FIXTURE, CUSTOM_THEME);
  assert.ok(logs.some(l => /Sources: HFS Handbook 2026/.test(l)), 'a grounded deck can be audited from the log');
});

check('a theme with no two-column layout still places the QR, and says so', () => {
  const narrow = [
    ...CUSTOM_THEME.filter(l => l.name !== 'Two Column'),
    { name: 'Two Column', placeholders: [{ type: PlaceholderType.TITLE }, { type: PlaceholderType.BODY, left: 80, width: 400, height: 300 }] }
  ];
  const { presentation, logs } = run(FIXTURE, narrow);
  const slide = presentation.getSlides()[7];
  assert.equal(slide.getImages().length, 1, 'the QR is still placed');
  const qr = slide.getImages()[0];
  assert.equal(qr.width, qr.height, 'still square');
  assert.ok(qr.width < 300, 'scaled into the space it shares with the brief');
  assert.ok(logs.some(l => /no two-column layout/.test(l)), 'the fallback is never silent');
});


/* ------------------------- deck rules ------------------------- */

const claim = (title, bullet = '') => ({
  type: 'body',
  title,
  bullets: bullet ? [bullet] : ['One short cue'],
  notes: 'Talk track.'
});

check('deck rules: the fixture passes clean', () => {
  const findings = rules(FIXTURE);
  assert.deepEqual(findings.filter(f => f.severity === 'error'), [], 'errors in the fixture');
  assert.ok(!ruleIds(FIXTURE).includes('no-close'), 'an activity is a legitimate close');
  assert.ok(!ruleIds(FIXTURE).includes('weak-close'), 'activities close a deck fine');
  assert.ok(!ruleIds(FIXTURE).includes('retrieval-gap'), 'gaps are measured across prompts and activities');
});

/*
 * The title box never shrinks, so a headline that is too long does not
 * get smaller — it draws outside the box, over the body. Length is the
 * only thing standing between the two, which is why it is bounded here
 * rather than fixed in the engine: Slides disables a shape's autofit on
 * any write that can affect text fitting, and no API accepts
 * TEXT_AUTOFIT on a write, so the theme's shrink-to-fit cannot be
 * restored.
 */
check('deck rules: a headline too long for the title box is an error', () => {
  const severities = title =>
    rules({
      ...clone(FIXTURE),
      slides: [
        { type: 'title', title: 'Deck', notes: 'Open.' },
        { type: 'body', title, bullets: ['A short cue'], notes: 'Talk track.' }
      ]
    })
      .filter(f => f.rule.startsWith('headline-'))
      .map(f => f.severity);

  assert.deepEqual(severities('Hall Council decides your budget'), [],
    'a headline that fits one line is left alone');
  assert.deepEqual(severities('Hall Council decides how your hall spends its budget'), ['warn'],
    'a headline heading for a second line warns');
  assert.deepEqual(
    severities('Hall Council decides how your hall spends its entire programming budget for the year'),
    ['error'],
    'a headline past the box is an error, not a surprise on the projector');
});

/*
 * Marks are authoring syntax. What the room reads, and what the title
 * box has to hold, is the text between them.
 */
check('deck rules: marks are measured as the text they render', () => {
  const severities = title =>
    rules({
      ...clone(FIXTURE),
      slides: [
        { type: 'title', title: 'Deck', notes: 'Open.' },
        { type: 'body', title, bullets: ['A short cue'], notes: 'Talk track.' }
      ]
    })
      .filter(f => f.rule.startsWith('headline-'))
      .map(f => f.severity);

  // 48 characters: fits. Four asterisks of mark would push it to 52.
  const line = 'Leadership is what running the other two teaches';
  assert.deepEqual(severities(line), [], 'a headline that fits is left alone');
  assert.deepEqual(severities(`**${line}**`), [],
    'the marks are not characters the title box has to hold');
});

check('deck rules: an unclosed mark renders as asterisks', () => {
  const deck = clone(FIXTURE);
  deck.slides[2].bullets = ['Weekly meetings: **Mondays, 6–7 PM.'];
  assert.ok(ruleIds(deck).includes('bold-unclosed'),
    'a mark the engine cannot close is two asterisks on the slide, not emphasis');
});

check('deck rules: a slide that emphasises everything emphasises nothing', () => {
  const deck = clone(FIXTURE);
  deck.slides[2].bullets = [
    '**One** thing', '**Two** things', '**Three** things', '**Four** things'
  ];
  assert.ok(ruleIds(deck).includes('bold-many'),
    'four marked spans on one slide is noise, not signalling');
});

check('deck rules: a half-briefed activity is an error', () => {
  const deck = clone(FIXTURE);
  delete deck.slides[7].activity.task;
  delete deck.slides[7].activity.debrief;
  const ids = ruleIds(deck);
  assert.ok(ids.includes('activity-task'), 'the task is the one field nobody can guess');
  assert.ok(ids.includes('activity-debrief'), 'an activity with no debrief is a break');
});

check('deck rules: an activity needs a resolvable artifact when it has one', () => {
  const deck = clone(FIXTURE);
  delete deck.slides[7].activity.artifact.url;
  assert.ok(ruleIds(deck).includes('activity-artifact'));
});

check('deck rules: an activity breaks a retrieval gap', () => {
  const bodies = Array.from({ length: 5 }, (_, i) => claim(`Bodies accumulate before the room does anything ${i + 1}`));
  const withActivity = {
    ...FIXTURE,
    slides: [
      FIXTURE.slides[0],
      ...bodies,
      clone(FIXTURE.slides[7]),
      clone(FIXTURE.slides[5])
    ]
  };
  assert.ok(!ruleIds(withActivity).includes('retrieval-gap'), 'the activity should break the gap');

  const withoutActivity = {
    ...FIXTURE,
    slides: [
      FIXTURE.slides[0],
      ...bodies,
      claim('One more claim before anything happens'),
      clone(FIXTURE.slides[5])
    ]
  };
  assert.ok(ruleIds(withoutActivity).includes('retrieval-gap'), 'and without it, the gap is long enough to warn');
});

check('deck rules: hydration fills URLs and QR bytes from the activity JSON', () => {
  const dir = mkdtempSync(join(tmpdir(), 'hydrate-'));
  const activityJson = join(dir, 'demo.activity.json');
  const png = join(dir, 'demo.qr.png');
  writeFileSync(activityJson, JSON.stringify({ slug: 'demo', mode: 'code', url: 'https://github.com/you/demo', qrPng: png }));
  writeFileSync(png, Buffer.from('89504e470d0a1a0a', 'hex'));
  const deck = clone(FIXTURE);
  const spec = join(dir, 'demo.deck.json');
  writeFileSync(spec, JSON.stringify(deck));
  deck.slides[7].activity.artifact = { mode: 'code', activityJson };
  delete deck.slides[7].qr;

  const hydrated = hydrate(deck, spec);
  const artifact = hydrated.slides[7].activity.artifact;
  assert.equal(artifact.url, 'https://github.com/you/demo');
  assert.equal(artifact.displayUrl, 'github.com/you/demo', 'the short form is what prints on the slide');
  assert.ok(hydrated.slides[7].qr.png.length > 0, 'the QR bytes are inlined');
  assert.equal(hydrated.slides[7].qr.url, 'https://github.com/you/demo');
});

check('deck rules: a missing QR file fails the build', () => {
  const deck = clone(FIXTURE);
  deck.slides[7].qr = { pngFile: '/nope/does-not-exist.png', url: 'https://example.com' };
  assert.throws(() => hydrate(deck, join(tmpdir(), 'x.deck.json')), /cannot read the QR image/);
});

/* ------------------------- figures ------------------------- */

const PAGE = { width: 720, height: 405 };

const figureDeck = figure => ({
  meta: {
    title: 'Figure check', mode: 'teach', templateId: 'template-id',
    audience: 'residents', objective: 'see the shape of the argument', sources: []
  },
  slides: [{ type: 'figure', title: 'The claim the figure makes', figure, notes: 'Say it once.' }]
});

const builtFigure = (figure, theme = FIGURE_THEME) =>
  run(figureDeck(figure), theme).presentation.getSlides()[0];

const nodesOf = slide => slide.getShapes().filter(shape => shape.getShapeType() !== ShapeType.TEXT_BOX);
const labelsOf = slide => slide.getShapes().filter(shape => shape.getShapeType() === ShapeType.TEXT_BOX);
const boxOf = element => ({
  left: element.getLeft(), top: element.getTop(),
  width: element.getWidth(), height: element.getHeight()
});
const lineBox = line => ({
  left: Math.min(line.getStart().getX(), line.getEnd().getX()),
  top: Math.min(line.getStart().getY(), line.getEnd().getY()),
  width: Math.abs(line.getEnd().getX() - line.getStart().getX()),
  height: Math.abs(line.getEnd().getY() - line.getStart().getY())
});

check('a figure draws one shape per node and one line per relation', () => {
  const flow = builtFigure(FIGURE_SAMPLES.flow);
  assert.equal(nodesOf(flow).length, 4);
  assert.equal(flow.getLines().length, 3, 'one relation between each pair in the row');
  assert.equal(titleOf(flow).text(), 'The claim the figure makes');

  const cycle = builtFigure(FIGURE_SAMPLES.cycle);
  assert.equal(nodesOf(cycle).length, 4);
  assert.equal(cycle.getLines().length, 4, 'a ring has as many relations as nodes');

  const tree = builtFigure(FIGURE_SAMPLES.tree);
  assert.equal(nodesOf(tree).length, 5, 'including the grandchild');
  assert.equal(tree.getLines().length, 4, 'one link per node that has a parent');

  const stack = builtFigure(FIGURE_SAMPLES.stack);
  assert.equal(nodesOf(stack).length, 4);
  assert.equal(stack.getLines().length, 0, 'layers are held by the stack itself, not by arrows');

  const matrix = builtFigure(FIGURE_SAMPLES.matrix);
  assert.equal(nodesOf(matrix).length, 9, 'every cell in the grid is a node');
});

check('a flow node holds the label it was given', () => {
  const flow = builtFigure(FIGURE_SAMPLES.flow);
  const texts = nodesOf(flow).map(shape => shape.text());
  assert.deepEqual(texts, ['Measure', 'Find the slow query', 'Add the index', 'Measure again']);
});

check('a figure slide keeps its citation on the slide', () => {
  const deck = figureDeck({
    kind: 'bars',
    nodes: [
      { label: 'Programs', value: 1, display: '60%' },
      { label: 'Travel', value: 0.4, display: '25%' }
    ]
  });
  deck.slides[0].cite = 'HFS Handbook 2026';
  deck.slides[0].citeUrl = 'https://hfs.example.edu/handbook';

  const slide = run(deck, FIGURE_THEME).presentation.getSlides()[0];
  assert.ok(labelsOf(slide).some(shape => shape.text() === 'Source: HFS Handbook 2026'),
    'a figure slide has no body box, so its source is drawn as annotation rather than dropped');
});

check('every element a figure draws stays on the page', () => {
  Object.keys(FIGURE_SAMPLES).forEach(kind => {
    const slide = builtFigure(FIGURE_SAMPLES[kind]);
    const boxes = [
      ...nodesOf(slide).map(boxOf),
      ...labelsOf(slide).map(boxOf),
      ...slide.getLines().map(lineBox)
    ];
    assert.ok(boxes.length > 0, `${kind} drew nothing`);
    boxes.forEach(box => {
      assert.ok(box.width >= 0 && box.height >= 0, `${kind} drew a negative box`);
      assert.ok(box.left >= -0.5 && box.top >= -0.5, `${kind} drew past the top-left corner`);
      assert.ok(box.left + box.width <= PAGE.width + 0.5,
        `${kind} drew to ${Math.round(box.left + box.width)} on a ${PAGE.width} point page`);
      assert.ok(box.top + box.height <= PAGE.height + 0.5,
        `${kind} drew to ${Math.round(box.top + box.height)} on a ${PAGE.height} point page`);
    });
  });
});

check('node fills and outlines come from the slide color scheme', () => {
  const slide = builtFigure({
    kind: 'flow', nodes: [{ label: 'Before' }, { label: 'After', highlight: true }]
  });
  const [plain, highlighted] = nodesOf(slide);

  assert.equal(plain.getFill().isVisible(), false, 'an unhighlighted node is unfilled');
  const outline = plain.getBorder().getLineFill().getSolidFill();
  assert.equal(outline.color.type, ThemeColorType.TEXT1, 'the outline is the theme text color');
  assert.ok(outline.alpha < 1, 'faint enough that the outline does not compete with the labels');

  const fill = highlighted.getFill().getSolidFill();
  assert.equal(fill.color.type, ThemeColorType.ACCENT1, 'the highlighted node takes the theme accent');
  assert.ok(fill.alpha > 0 && fill.alpha < 0.5, 'at low alpha, so the theme text still reads on it');
  assert.equal(highlighted.getBorder().getLineFill().getSolidFill().color.type, ThemeColorType.ACCENT1);
});

check('a theme without a Title Only layout draws the figure in the body box and says so', () => {
  const { presentation, logs } = run(figureDeck(FIGURE_SAMPLES.flow), CUSTOM_THEME);
  const slide = presentation.getSlides()[0];
  assert.equal(slide.getLayout().getLayoutName(), 'Title + Body');

  const body = slide.getPlaceholders()
    .map(element => element.asShape())
    .find(shape => shape.getPlaceholderType() === PlaceholderType.BODY);
  const area = boxOf(body);

  nodesOf(slide).forEach(node => {
    const box = boxOf(node);
    assert.ok(box.left >= area.left && box.left + box.width <= area.left + area.width,
      'a node overlaps the body box edge');
    assert.ok(box.top >= area.top && box.top + box.height <= area.top + area.height,
      'a node overlaps the body box edge');
  });

  assert.match(logs.join('\n'), /figures draw in the body box/, 'the fallback is visible in the run log');
});

check('authored relations win, and their labels and arrows are drawn', () => {
  const slide = builtFigure({
    kind: 'flow',
    nodes: ['Draft', 'Ship'],
    edges: [{ from: 0, to: 1, label: 'because', arrow: false }]
  });

  const lines = slide.getLines();
  assert.equal(lines.length, 1, 'the authored relation replaces the implied one');
  assert.equal(lines[0].getEndArrow(), ArrowStyle.NONE, 'a relation asked for no arrowhead gets none');
  assert.ok(labelsOf(slide).some(shape => shape.text() === 'because'), 'the label is on the slide');

  const implied = builtFigure({ kind: 'flow', nodes: ['Draft', 'Ship'] });
  assert.equal(implied.getLines()[0].getEndArrow(), ArrowStyle.STEALTH_ARROW,
    'an implied relation keeps its arrowhead');
});

check('a network places nodes where the spec says and joins them as asked', () => {
  const slide = builtFigure(FIGURE_SAMPLES.network);
  const nodes = nodesOf(slide);
  assert.equal(nodes.length, 3);
  assert.ok(boxOf(nodes[0]).top < boxOf(nodes[2]).top, 'the node at y = 1 sits below the nodes at y = 0');
  assert.ok(boxOf(nodes[0]).left < boxOf(nodes[1]).left, 'the node at x = 0 sits left of the node at x = 1');

  const lines = slide.getLines();
  assert.equal(lines.length, 2, 'two authored relations');
  lines.forEach(line => assert.equal(line.getEndArrow(), ArrowStyle.STEALTH_ARROW,
    'these relations were authored with arrows'));
  assert.ok(labelsOf(slide).some(shape => shape.text() === 'enqueue'), 'the edge label is drawn');

  const plain = builtFigure({
    kind: 'network',
    nodes: [{ label: 'A', at: [0, 0] }, { label: 'B', at: [1, 1] }],
    edges: [{ from: 0, to: 1 }]
  });
  assert.equal(plain.getLines()[0].getEndArrow(), ArrowStyle.NONE,
    'a network relation means adjacency unless it claims cause');
});

check('only annotation is sized; node labels keep the theme type size', () => {
  const slide = builtFigure(FIGURE_SAMPLES.quadrant);
  assert.equal(nodesOf(slide).length, 0, 'quadrant cells are text, not boxes');

  const axis = labelsOf(slide).filter(shape => shape.text() === 'what it costs >');
  assert.equal(axis.length, 1, 'the x axis label is drawn');
  assert.equal(axis[0].getText().getTextStyle().getFontSize(), 10, 'axis labels are annotation size');

  const cell = labelsOf(slide).find(shape => shape.text() === 'Cheap and slow');
  assert.equal(cell.getText().getTextStyle().getFontSize(), null,
    'a cell label is content, so its size stays with the theme');
});

check('bar heights follow their values and share a baseline', () => {
  const slide = builtFigure(FIGURE_SAMPLES.bars);
  const bars = nodesOf(slide);
  const baseline = bars[0].getTop() + bars[0].getHeight();
  bars.forEach(bar => assert.equal(bar.getTop() + bar.getHeight(), baseline,
    'every bar sits on the same baseline'));

  // 1.0, 0.42, 0.18, 0.25 in the fixture: the third is the shortest.
  assert.ok(bars[0].getHeight() > bars[1].getHeight(), 'a bigger value draws a longer bar');
  assert.ok(bars[1].getHeight() > bars[3].getHeight(), 'a bigger value draws a longer bar');
  assert.ok(bars[3].getHeight() > bars[2].getHeight(), 'the smallest value draws the shortest bar');
  assert.ok(labelsOf(slide).some(shape => shape.text() === '$1,200'), 'the value is printed above its bar');
  assert.ok(labelsOf(slide).some(shape => shape.text() === 'Rent'), 'the category is printed below the axis');

  const pointed = builtFigure({
    kind: 'bars',
    nodes: [
      { label: 'Rent', value: 1, display: '$20,500' },
      { label: 'Programs', value: 0.2, display: '$4,100', highlight: true }
    ]
  });
  const [compared, chosen] = nodesOf(pointed).map(bar => bar.getFill().getSolidFill());
  assert.equal(chosen.color.type, ThemeColorType.ACCENT1, 'a highlighted bar takes the accent');
  assert.equal(compared.color.type, ThemeColorType.ACCENT1, 'bars are the same color, at different strengths');
  assert.ok(compared.alpha < chosen.alpha, 'the bar that is only for comparison recedes');
});

/* ------------------------- figure rules ------------------------- */

const figureRuleDeck = figure => ({
  meta: {
    title: 'Figure rules', mode: 'inform', templateId: 'template-id',
    audience: 'residents', objective: 'see the shape of the argument', sources: []
  },
  slides: [
    { type: 'title', title: 'Figure rules', notes: 'Open.' },
    { type: 'figure', title: 'A slow page has four causes you can see', figure, notes: 'Say it once.' }
  ]
});

check('deck rules: every figure kind the preview draws passes clean', () => {
  Object.keys(FIGURE_SAMPLES).forEach(kind => {
    const findings = rules({
      ...figureRuleDeck(FIGURE_SAMPLES[kind]),
      slides: [
        { type: 'title', title: 'Figure rules', notes: 'Open.' },
        { type: 'figure', title: FIGURE_TITLES[kind], figure: FIGURE_SAMPLES[kind], notes: 'Say it once.' }
      ]
    }).filter(f => f.severity === 'error');
    assert.deepEqual(findings.map(f => `${kind}: ${f.rule} ${f.message}`), []);
  });
});

check('deck rules: a figure is only drawn on a figure slide', () => {
  const onBody = figureRuleDeck(FIGURE_SAMPLES.flow);
  onBody.slides[1] = { type: 'body', title: 'A slow page has causes', bullets: ['Measure', 'Index'], figure: FIGURE_SAMPLES.flow, notes: 'x' };
  assert.ok(ruleIds(onBody).includes('figure-on-slide'), 'a figure on a body slide is never drawn');

  const withQr = figureRuleDeck(FIGURE_SAMPLES.flow);
  withQr.slides[1].qr = { png: 'x', url: 'https://example.com' };
  assert.ok(ruleIds(withQr).includes('figure-qr'), 'a QR and a figure compete for the box');
});

check('deck rules: an unknown kind is an error', () => {
  const findings = rules(figureRuleDeck({ kind: 'chalkboard', nodes: ['A', 'B'] }));
  assert.ok(findings.some(f => f.rule === 'figure-kind' && f.severity === 'error'));
});

check('deck rules: each kind has a floor and a ceiling', () => {
  const sizes = {
    quadrant: ['Question the frame', 'Name the tradeoff', 'Pick the cheap win'],
    flow: ['One', 'Two', 'Three', 'Four', 'Five', 'Six'],
    cycle: ['Round', 'Again'],
    matrix: ['A', 'B', 'C'],
    network: [{ label: 'A', at: [0, 0] }, { label: 'B', at: [1, 1] }],
    tree: ['Root', 'A', 'B', 'C', 'D', 'E', 'F', 'G']
  };
  Object.keys(sizes).forEach(kind => {
    const findings = rules(figureRuleDeck({ kind, nodes: sizes[kind] }));
    assert.ok(findings.some(f => f.rule === 'figure-size' && f.severity === 'error'),
      `${kind} with ${sizes[kind].length} elements should be an error`);
  });

  const crowded = rules(figureRuleDeck({
    kind: 'tree', nodes: ['Root', 'A', 'B', 'C', 'D', 'E', 'F']
  }));
  assert.ok(crowded.some(f => f.rule === 'figure-crowded' && f.severity === 'warn'),
    'six elements is allowed but worth a second look');
});

check('deck rules: every element is named and every relation lands in range', () => {
  const unnamed = rules(figureRuleDeck({ kind: 'flow', nodes: ['Measure', { detail: 'no label' }] }));
  assert.ok(unnamed.some(f => f.rule === 'figure-node' && f.severity === 'error'));

  const offRange = rules(figureRuleDeck({
    kind: 'flow', nodes: ['A', 'B'], edges: [{ from: 0, to: 7 }]
  }));
  assert.ok(offRange.some(f => f.rule === 'figure-edge' && f.severity === 'error'));

  const selfJoin = rules(figureRuleDeck({
    kind: 'flow', nodes: ['A', 'B'], edges: [{ from: 1, to: 1 }]
  }));
  assert.ok(selfJoin.some(f => f.rule === 'figure-edge' && f.severity === 'error'));

  const forwardParent = rules(figureRuleDeck({
    kind: 'tree', nodes: ['Root', { label: 'Child', parent: 3 }, 'Other']
  }));
  assert.ok(forwardParent.some(f => f.rule === 'figure-parent' && f.severity === 'error'),
    'a parent that comes after its child is silently reparented, so say so');
});

check('deck rules: bars carry a value and a number, network nodes carry a place', () => {
  const noValue = rules(figureRuleDeck({ kind: 'bars', nodes: [{ label: 'Rent', display: '1200' }, { label: 'Bus', value: 0.2, display: '240' }] }));
  assert.ok(noValue.some(f => f.rule === 'figure-value' && f.severity === 'error'));

  const noNumber = rules(figureRuleDeck({ kind: 'bars', nodes: [{ label: 'Rent', value: 1 }, { label: 'Bus', value: 0.2, display: '240' }] }));
  assert.ok(noNumber.some(f => f.rule === 'figure-display' && f.severity === 'error'),
    'a bar with no number on it makes the room guess');

  const noPlace = rules(figureRuleDeck({
    kind: 'network', nodes: [{ label: 'Web' }, { label: 'Queue', at: [0.5, 1] }, { label: 'Worker', at: [1, 0] }]
  }));
  assert.ok(noPlace.some(f => f.rule === 'figure-at' && f.severity === 'error'));
});

check('deck rules: what a figure puts on screen spends the slide word budget', () => {
  const wordy = figureRuleDeck({
    kind: 'flow',
    nodes: [
      'Measure the page with the profiler before you change anything at all',
      'Find the one query that spends most of the request time on this page',
      'Add the missing index and check that the query plan uses it afterwards',
      'Measure the same page again and write down what actually changed'
    ]
  });
  assert.ok(ruleIds(wordy).includes('slide-too-wordy'),
    'a figure is text too: its labels count against the slide');
});

check('deck rules: two highlights shout over each other', () => {
  const findings = rules(figureRuleDeck({
    kind: 'flow',
    nodes: [{ label: 'Before', highlight: true }, { label: 'After', highlight: true }]
  }));
  assert.ok(findings.some(f => f.rule === 'figure-highlight' && f.severity === 'warn'));
});

/* ------------------------- image figures ------------------------- */

check('an image figure ships as bytes, fitted to its box, with its alt text', () => {
  const dir = mkdtempSync(join(tmpdir(), 'figure-test-'));
  const svg = join(dir, 'latency.svg');
  writeFileSync(svg, '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 600 300">' +
    '<rect width="600" height="300" fill="#1a73e8"/></svg>');

  const deck = {
    meta: {
      title: 'Image figure', mode: 'inform', templateId: 'template-id',
      audience: 'residents', objective: 'see the trend', sources: []
    },
    slides: [{
      type: 'figure',
      title: 'Latency fell by half after the index',
      figure: { kind: 'image', svgFile: svg, alt: 'Latency by stage, 2019 to 2024' },
      notes: 'Point at the knee.'
    }]
  };
  const spec = join(dir, 'deck.json');
  writeFileSync(spec, JSON.stringify(deck));

  const hydrated = hydrate(clone(deck), spec);
  const figure = hydrated.slides[0].figure;
  assert.equal(figure.aspect, 2, 'the picture keeps the proportions of its viewBox');
  assert.ok(figure.png.length > 100, 'the SVG is rasterized into the deck');
  assert.equal(figure.svgFile, undefined, 'the source path is not shipped to Apps Script');

  const slide = run(hydrated, FIGURE_THEME).presentation.getSlides()[0];
  const [image] = slide.getImages();
  assert.ok(image, 'the picture is placed on the slide');
  assert.equal(image.getWidth() / image.getHeight(), 2, 'the picture is not stretched to fill the box');
  assert.ok(image.getWidth() > 0 && image.getHeight() > 0);
  assert.equal(image.getDescription(), 'Latency by stage, 2019 to 2024', 'the alt text travels with the picture');
});

check('deck rules: an image figure needs a source and its alt text', () => {
  const noAlt = figureRuleDeck({ kind: 'image', png: 'AAAA' });
  assert.ok(ruleIds(noAlt).includes('figure-alt'), 'a picture with no alt text is invisible to a screen reader');

  const nothing = figureRuleDeck({ kind: 'image', alt: 'A trend line' });
  assert.ok(ruleIds(nothing).includes('figure-source'), 'a picture with no source has nothing to draw');

  const both = figureRuleDeck({
    kind: 'image', png: 'AAAA', alt: 'A trend line', nodes: ['A', 'B']
  });
  assert.ok(ruleIds(both).includes('figure-source'),
    'nodes on an image figure would be silently dropped, so say so');

  const missingFile = clone(figureRuleDeck({
    kind: 'image', svgFile: '/nope/missing.svg', alt: 'A trend line'
  }));
  assert.throws(() => hydrate(missingFile, join(tmpdir(), 'x.json')), /cannot read the figure image/);
});

/* ------------------------- main ------------------------- */

let failed = 0;
for (const { name, fn } of checks) {
  try {
    fn();
    console.log(`ok   ${name}`);
  } catch (error) {
    failed++;
    console.log(`FAIL ${name}\n     ${error.message.split('\n')[0]}`);
  }
}

console.log(`\n${checks.length - failed}/${checks.length} engine checks passed`);
process.exit(failed > 0 ? 1 : 0);
