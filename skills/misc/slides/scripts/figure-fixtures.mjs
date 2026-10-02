/**
 * figure-fixtures.mjs — one figure of every kind, and the theme they
 * are drawn in.
 *
 * Both the engine tests and scripts/preview-figure.mjs build from
 * these, so what a reviewer looks at in the preview is what the tests
 * assert on: nine slides, one per figure kind, with real content.
 */
import { PlaceholderType } from './mock-slides.mjs';

/* A 16:9 page's worth of theme: a title-only layout for figures, and
 * the three layouts a deck needs beside it. */
const FIGURE_THEME = [
  {
    name: 'Title',
    placeholders: [{ type: PlaceholderType.TITLE, left: 60, top: 150, width: 600, height: 90 }]
  },
  {
    name: 'Title Only',
    placeholders: [{ type: PlaceholderType.TITLE, left: 60, top: 40, width: 600, height: 70 }]
  },
  {
    name: 'Section',
    placeholders: [{ type: PlaceholderType.CENTERED_TITLE, left: 60, top: 150, width: 600, height: 90 }]
  },
  {
    name: 'Title + Body',
    placeholders: [
      { type: PlaceholderType.TITLE, left: 60, top: 40, width: 600, height: 70 },
      { type: PlaceholderType.BODY, left: 60, top: 130, width: 600, height: 240 }
    ]
  },
  {
    name: 'Two Column',
    placeholders: [
      { type: PlaceholderType.TITLE, left: 60, top: 40, width: 600, height: 70 },
      { type: PlaceholderType.BODY, left: 60, top: 130, width: 280, height: 240 },
      { type: PlaceholderType.BODY, left: 380, top: 130, width: 280, height: 240 }
    ]
  }
];

/* The claim goes in the title; the figure carries the evidence. */
const FIGURE_SAMPLES = {
  flow: {
    kind: 'flow',
    nodes: ['Measure', 'Find the slow query', 'Add the index', 'Measure again']
  },
  cycle: {
    kind: 'cycle',
    nodes: ['Draft', 'Rehearse', 'Cut', 'Ship']
  },
  tree: {
    kind: 'tree',
    nodes: [
      'A slow page',
      'Missing index',
      'Cold cache',
      'Chatty API',
      { label: 'Full scan', parent: 1 }
    ]
  },
  quadrant: {
    kind: 'quadrant',
    nodes: ['Cheap and slow', 'Cheap and fast', 'Dear and slow', 'Dear and fast'],
    axes: { x: 'what it costs >', y: '< what it buys' }
  },
  matrix: {
    kind: 'matrix',
    columns: 3,
    header: true,
    nodes: ['Cost', 'Now', 'Later', 'Cheap', 'Do it', 'Plan it', 'Dear', 'Skip it', 'Reconsider']
  },
  stack: {
    kind: 'stack',
    nodes: ['Network', 'Query', 'Index', 'Page']
  },
  timeline: {
    kind: 'timeline',
    nodes: ['Week 1: schema', 'Week 2: backfill', 'Week 3: cutover']
  },
  bars: {
    kind: 'bars',
    nodes: [
      { label: 'Rent', value: 1, display: '$1,200' },
      { label: 'Food', value: 0.42, display: '$500' },
      { label: 'Bus', value: 0.18, display: '$210' },
      { label: 'Other', value: 0.25, display: '$300' }
    ]
  },
  scatter: {
    kind: 'scatter',
    nodes: [
      { label: 'Rent', value: [0.2, 0.9], display: 'Rent' },
      { label: 'Food', value: [0.5, 0.6], display: 'Food' },
      { label: 'Bus', value: [0.8, 0.3], display: 'Bus' }
    ],
    axes: { x: 'frequency >', y: '< cost' }
  },
  network: {
    kind: 'network',
    nodes: [
      { label: 'Web', at: [0, 0] },
      { label: 'Worker', at: [1, 0] },
      { label: 'Queue', at: [0.5, 1] }
    ],
    edges: [
      { from: 0, to: 2, arrow: true, label: 'enqueue' },
      { from: 2, to: 1, arrow: true, label: 'dequeue' }
    ]
  }
};

const FIGURE_TITLES = {
  flow: 'A slow page has four causes you can see',
  cycle: 'The loop that keeps a deck honest',
  tree: 'One missing index explains most of the wait',
  quadrant: 'You can sort every fix by cost and by payoff',
  matrix: 'Two questions decide what to do about a bug',
  stack: 'A request spends its time in four places',
  timeline: 'This ships in three weeks',
  bars: 'Rent eats half the budget',
  scatter: 'Cost and frequency move in opposite directions',
  network: 'One queue keeps the web tier and the workers apart'
};

export { FIGURE_THEME, FIGURE_SAMPLES, FIGURE_TITLES };
