#!/usr/bin/env node
/**
 * test-shell.mjs — drive the built exercise page's own script.
 *
 * The engine tests cover grading. Nothing covered the **wiring**: which
 * control enables the submit, what a click does, whether the second pass
 * shows the right steps. Two shipped bugs lived in exactly that gap —
 * the submit handler referenced a block-scoped variable (every Check
 * threw), and `explain` steps never enabled their own button (the
 * exercise could not be finished). Both are invisible to engine tests
 * and obvious to a reader of the page.
 *
 * So this runs the real artifact — the page new-exercise.mjs builds —
 * in a stub DOM just big enough for the shell, and asserts what a
 * student would see. No browser, no dependencies.
 */
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import vm from 'node:vm';
import { buildWeb } from './new-exercise.mjs';

const HERE = dirname(fileURLToPath(import.meta.url));
const FIXTURE = JSON.parse(readFileSync(join(HERE, 'fixtures', 'spec.json'), 'utf8'));
const PAGE_IDS = ['title', 'objective', 'progress', 'pos', 'score', 'pass', 'stage', 'footer'];

/* --------------------------- a DOM, barely --------------------------- */

const matches = (node, part) => {
  const tag = part.match(/^[a-z]+/i)?.[0];
  if (tag && node.tagName !== tag.toUpperCase()) return false;
  const nots = [...part.matchAll(/:not\(\.([\w-]+)\)/g)].map(m => m[1]);
  const classes = [...part.matchAll(/\.([\w-]+)/g)].map(m => m[1]).filter(c => !nots.includes(c));
  const own = (node.attributes.class || '').split(/\s+/).filter(Boolean);
  return !nots.some(c => own.includes(c)) && classes.every(c => own.includes(c));
};

const walk = node => node.children.flatMap(child => [child, ...walk(child)]);

function createNode(tag) {
  const node = {
    tagName: String(tag).toUpperCase(),
    attributes: {},
    children: [],
    parent: null,
    disabled: false,
    value: '',
    style: {},
    dataset: {},
    _text: '',
    setAttribute(name, value) {
      this.attributes[name] = String(value);
      if (name === 'disabled') this.disabled = true;   // `disabled: true` in the shell's el()
      if (name === 'value') this.value = String(value);
    },
    getAttribute(name) { return name in this.attributes ? this.attributes[name] : null; },
    append(...kids) { kids.filter(Boolean).forEach(kid => { kid.parent = this; this.children.push(kid); }); },
    replaceChildren(...kids) { this.children = []; this.append(...kids); },
    focus() {},
    click() { if (!this.disabled) this.onclick?.(); },
    querySelectorAll(selector) {
      const parts = selector.split(',').map(part => part.trim());
      return walk(this).filter(node => parts.some(part => matches(node, part)));
    },
    get textContent() { return this._text + this.children.map(child => child.textContent).join(''); },
    set textContent(value) { this._text = String(value); this.children = []; }
  };
  return node;
}

/** Load the real page for `spec` and run its script against the stub DOM. */
function load(spec) {
  const html = buildWeb(spec);
  const open = '<script type="module">';
  const script = html.slice(html.indexOf(open) + open.length, html.lastIndexOf('</script>'));

  const byId = new Map(PAGE_IDS.map(id => [id, createNode(id === 'stage' ? 'main' : 'span')]));
  const document = {
    createElement: createNode,
    getElementById: id => byId.get(id) || null,
    body: createNode('body')
  };
  const context = vm.createContext({ document, console });
  vm.runInContext(script, context);
  const page = {};
  PAGE_IDS.forEach(id => { page[id] = byId.get(id); });
  return page;
}

/* ------------------------ driving it like a person ------------------------ */

const buttons = root => walk(root).filter(node => node.tagName === 'BUTTON');
const byText = (root, text) => buttons(root).find(node => node.textContent.trim() === text);
const feedback = root => walk(root).find(node => (node.attributes.class || '').includes('fb'));
const feedbackText = root => feedback(root)?.textContent || '';
const nextButton = root => buttons(root).find(node => (node.attributes.class || '').includes('next'));
const submitButton = root => buttons(root).find(node => ['Check', 'Compare with the model answer', 'Show me'].includes(node.textContent.trim()));

const typeInto = (node, value) => { node.value = value; node.oninput?.(); };

/** Fill in the answer the spec says is right (or a deliberately wrong one). */
function answerStage(root, step, wrong = false) {
  switch (step.kind) {
    case 'choice': {
      const option = step.options.find(candidate => candidate.correct === !wrong);
      byText(root.stage, option.text).click();
      break;
    }
    case 'multi': {
      const wanted = step.options.filter(candidate => candidate.correct === !wrong);
      (wrong ? wanted.slice(0, 1) : wanted).forEach(option => byText(root.stage, option.text).click());
      break;
    }
    case 'classify': {
      const buckets = walk(root.stage).filter(node => (node.attributes.class || '').includes('bucket'))[0];
      const pool = walk(root.stage).filter(node => (node.attributes.class || '').includes('pool'))[0];
      step.items.forEach((item, index) => {
        byText(pool, item.text).click();
        const target = wrong && index === 0 ? step.buckets.find(b => b !== item.bucket) : item.bucket;
        byText(buckets, target).click();
      });
      break;
    }
    case 'order': {
      const pool = walk(root.stage).filter(node => (node.attributes.class || '').includes('pool'))[0];
      const sequence = wrong ? [...step.order].reverse() : step.order;
      sequence.forEach(entry => byText(pool, entry.text).click());
      break;
    }
    case 'match': {
      walk(root.stage).filter(node => node.tagName === 'SELECT').forEach(select => {
        const left = walk(select.parent).find(node => node.tagName === 'SPAN').textContent;
        const pair = step.pairs.find(p => p.left === left);
        const options = walk(select).filter(node => node.tagName === 'OPTION');
        select.value = (wrong ? options.find(o => o.value && o.value !== pair.right) : options.find(o => o.value === pair.right)).value;
        select.onchange?.();
      });
      break;
    }
    case 'numeric': typeInto(walk(root.stage).find(node => node.tagName === 'INPUT'), wrong ? String(Number(step.answer) + 7) : String(step.answer)); break;
    case 'text': typeInto(walk(root.stage).find(node => node.tagName === 'INPUT'), wrong ? 'constant factors' : step.accept[0]); break;
    case 'explain': typeInto(walk(root.stage).find(node => node.tagName === 'TEXTAREA'), 'because each halving removes half the remaining range'); break;
    default: break; // reveal
  }
}

const summaryNode = root => walk(root.stage).find(node => (node.attributes.class || '').includes('summary'));
const promptNode = root => walk(root.stage).find(node => (node.attributes.class || '').includes('prompt'));

/** Answer every stage. Stops at the summary, or at the second pass if asked. */
function run(root, spec, { wrongIds = [], stopAtSecondPass = false } = {}) {
  const seen = [];
  for (let guard = 0; guard < 60; guard++) {
    if (summaryNode(root)) return { seen, summary: summaryNode(root).textContent };
    if (stopAtSecondPass && root.pass.textContent.includes('Second pass')) {
      return { seen, secondPass: true, pos: root.pos.textContent, prompt: promptNode(root).textContent.trim() };
    }
    const prompt = promptNode(root).textContent.trim();
    const step = spec.steps.find(candidate => candidate.prompt === prompt);
    answerStage(root, step, wrongIds.includes(step.id));
    const submit = submitButton(root.stage);
    if (!submit || submit.disabled) return { seen, stuck: prompt };
    submit.click();
    seen.push({ id: step.id, verdict: feedbackText(root.stage) });
    const next = nextButton(root.stage);
    if (!next) break;
    next.click();
  }
  return { seen };
}

/** Walk to a named step without grading anything. */
function runTo(root, spec, stepId) {
  const target = spec.steps.findIndex(step => step.id === stepId);
  for (let i = 0; i < target; i++) {
    answerStage(root, spec.steps[i], false);
    submitButton(root.stage).click();
    nextButton(root.stage).click();
  }
}

/* ------------------------------- checks ------------------------------- */

let passed = 0;
const failures = [];
const check = (name, run_) => {
  try { run_(); console.log(`ok   ${name}`); passed++; }
  catch (error) { failures.push(name); console.log(`FAIL ${name}\n     ${error.message}`); }
};
const assert = {
  ok(value, message) { if (!value) throw new Error(message); },
  equal(actual, expected, message) { if (actual !== expected) throw new Error(`${message}\n     expected: ${JSON.stringify(expected)}\n     actual:   ${JSON.stringify(actual)}`); },
  includes(haystack, needle, message) { if (!String(haystack).includes(needle)) throw new Error(`${message}\n     looked for: ${JSON.stringify(needle)}\n     in: ${JSON.stringify(String(haystack).slice(0, 300))}`); }
};

check('every step kind can be answered and reaches feedback', () => {
  const root = load(FIXTURE);
  const { seen, stuck } = run(root, FIXTURE);
  assert.ok(!stuck, `a step whose submit never enables: ${stuck}`);
  const kinds = seen.map(entry => FIXTURE.steps.find(step => step.id === entry.id).kind);
  ['choice', 'multi', 'classify', 'order', 'numeric', 'text', 'explain'].forEach(kind => {
    assert.ok(kinds.includes(kind), `never exercised a ${kind} step`);
  });
  seen.forEach(entry => assert.ok(/[✓✗]/.test(entry.verdict), `no verdict rendered for ${entry.id}`));
});

check('a wrong choice shows that option\'s own reason', () => {
  const root = load(FIXTURE);
  const step = FIXTURE.steps[0];
  const decoy = step.options.find(option => !option.correct);
  answerStage(root, step, true);
  submitButton(root.stage).click();
  assert.includes(feedbackText(root.stage), decoy.feedback, 'the feedback is that distractor\'s reason, not a verdict');
  assert.includes(feedbackText(root.stage), step.options.find(o => o.correct).text, 'the right answer is named once they have committed');
});

check('the compare button waits for their own words', () => {
  const root = load(FIXTURE);
  const step = FIXTURE.steps.find(candidate => candidate.kind === 'explain');
  runTo(root, FIXTURE, step.id);
  const compare = () => buttons(root.stage).find(node => node.textContent.trim() === 'Compare with the model answer');
  assert.ok(compare(), 'the explain step has no compare button');
  assert.ok(compare().disabled, 'nothing typed yet: the model answer stays shut');
  typeInto(walk(root.stage).find(node => node.tagName === 'TEXTAREA'), 'halving the range each time');
  assert.ok(!compare().disabled, 'typing is what opens it');
  compare().click();
  assert.includes(feedbackText(root.stage), step.reveal.slice(0, 40), 'their words are compared against the model');
});

check('the second pass is exactly what they missed', () => {
  const root = load(FIXTURE);
  const missed = FIXTURE.steps[0].id;
  const second = run(root, FIXTURE, { wrongIds: [missed], stopAtSecondPass: true });
  assert.ok(second.secondPass, 'a miss must come back');
  assert.equal(second.pos, 'Step 1 of 1', 'the second pass covers the missed step alone');
  assert.equal(second.prompt, FIXTURE.steps[0].prompt, 'and it is the step they actually missed');
});

check('the summary counts first tries and points at the misses', () => {
  const clean = load(FIXTURE);
  const cleanRun = run(clean, FIXTURE);
  assert.ok(cleanRun.summary, 'a clean run reaches the summary');
  assert.includes(cleanRun.summary, `${FIXTURE.steps.length} of ${FIXTURE.steps.length} right on the first try`, 'a clean run reports a clean run');
  const dirty = load(FIXTURE);
  const dirtyRun = run(dirty, FIXTURE, { wrongIds: [FIXTURE.steps[0].id] });
  assert.ok(dirtyRun.summary, 'a run with a miss still reaches the summary');
  assert.includes(dirtyRun.summary, `${FIXTURE.steps.length - 1} of ${FIXTURE.steps.length} right on the first try`, 'a miss is counted as a miss');
  assert.includes(dirtyRun.summary, 'missed step(s) again', 'and the missed step is offered again');
});

check('a hint shows itself and then retires', () => {
  const root = load(FIXTURE);
  const step = FIXTURE.steps.find(candidate => candidate.hint);
  runTo(root, FIXTURE, step.id);
  const hint = buttons(root.stage).find(node => node.textContent.trim() === 'Hint');
  assert.ok(hint, `${step.id} has a hint but no Hint button`);
  hint.click();
  assert.includes(feedbackText(root.stage), step.hint.slice(0, 30), 'the hint is shown');
  assert.ok(hint.disabled, 'and cannot be spent twice');
});

/* -------------------------------- report -------------------------------- */

const total = passed + failures.length;
console.log(`\n${passed}/${total} shell checks passed`);
if (failures.length) process.exit(1);
