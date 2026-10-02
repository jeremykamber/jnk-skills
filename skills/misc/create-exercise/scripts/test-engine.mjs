#!/usr/bin/env node
/**
 * test-engine.mjs — the exercise core, its builder, and its checker.
 *
 *   node scripts/test-engine.mjs
 *
 * Runs against the spec in fixtures/spec.json (a real exercise, not a
 * toy) and against deliberate mutations of it. Every check exists
 * because a plausible bug would otherwise ship: a distractor with no
 * feedback, a lucky guess scored as knowledge, the engine failing to
 * inline, the checker failing to bite.
 */
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { readFileSync, writeFileSync, mkdtempSync, existsSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, resolve, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { validate, grade, createSession } from '../assets/engine.mjs';

const here = dirname(fileURLToPath(import.meta.url));
const root = resolve(here, '..');
const node = process.execPath;
const fixture = JSON.parse(readFileSync(join(here, 'fixtures/spec.json'), 'utf8'));
const clone = value => JSON.parse(JSON.stringify(value));
const tmp = () => mkdtempSync(join(tmpdir(), 'exercise-test-'));

let passed = 0;
let failed = 0;
function check(name, fn) {
  try {
    fn();
    passed += 1;
    console.log(`ok   ${name}`);
  } catch (error) {
    failed += 1;
    console.log(`FAIL ${name}\n     ${error.message.split('\n')[0]}`);
  }
}
const run = (args, options = {}) => {
  const io = { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'], ...options };
  try {
    return { code: 0, out: execFileSync(node, args, io) };
  } catch (error) {
    return { code: error.status ?? 1, out: `${error.stdout || ''}${error.stderr || ''}` };
  }
};

/** The answer a student who understood it would give. */
const correctAnswer = step => {
  switch (step.kind) {
    case 'choice': return step.options.find(o => o.correct).id;
    case 'multi': return step.options.filter(o => o.correct).map(o => o.id);
    case 'order': return (step.order || []).map(o => o.id ?? o);
    case 'classify': return Object.fromEntries((step.items || []).map(i => [i.text, i.bucket]));
    case 'match': return Object.fromEntries((step.pairs || []).map(p => [p.left, p.right]));
    case 'numeric': return String(step.answer);
    case 'text': return step.accept[0];
    default: return null;   // explain and reveal have nothing to get wrong
  }
};

/* ------------------------------------------------------------- spec lint */

check('the fixture spec is valid', () => {
  const { errors } = validate(fixture);
  assert.deepEqual(errors, [], errors.join('; '));
});

check('an option without feedback is an error', () => {
  const spec = clone(fixture);
  delete spec.steps[0].options[1].feedback;
  const { errors } = validate(spec);
  assert.ok(errors.some(e => /option 2 has no feedback/.test(e)), errors.join('; '));
});

check('a choice with two correct options is an error', () => {
  const spec = clone(fixture);
  spec.steps[0].options[1].correct = true;
  assert.ok(validate(spec).errors.some(e => /exactly one correct/.test(e)));
});

check('a set that never rises in difficulty warns', () => {
  const spec = clone(fixture);
  spec.steps.forEach(s => { s.difficulty = 1; });
  assert.ok(validate(spec).warnings.some(w => /difficulty 1/.test(w)));
});

/* --------------------------------------------------------------- grading */

check('choice: the wrong option answers with its own feedback', () => {
  const step = fixture.steps.find(s => s.kind === 'choice');
  const wrong = step.options.find(o => !o.correct);
  const graded = grade(step, wrong.id);
  assert.equal(graded.correct, false);
  assert.equal(graded.feedback, wrong.feedback, 'the distractor explains itself');
});

check('multi: partial credit does not pass', () => {
  const step = fixture.steps.find(s => s.kind === 'multi');
  const correct = step.options.filter(o => o.correct).map(o => o.id);
  assert.equal(grade(step, correct).correct, true);
  assert.equal(grade(step, correct.slice(0, 1)).correct, false, 'half a multi is not a multi');
});

check('numeric: tolerance is honoured and text is not a number', () => {
  const step = fixture.steps.find(s => s.kind === 'numeric');
  assert.equal(grade(step, String(step.answer)).correct, true);
  assert.equal(grade(step, String(step.answer + (step.tolerance ?? 0))).correct, true);
  assert.equal(grade(step, String(step.answer + 99)).correct, false);
  assert.equal(grade(step, 'about ten').correct, false);
});

check('text: matching ignores case and spacing', () => {
  const step = fixture.steps.find(s => s.kind === 'text');
  assert.equal(grade(step, `  ${step.accept[0].toUpperCase()}  `).correct, true);
});

check('order: reports how much of the order is right', () => {
  const step = fixture.steps.find(s => s.kind === 'order');
  const truth = step.order.map(o => o.id || o);
  assert.equal(grade(step, truth).correct, true);
  const shuffled = [...truth.slice(0, 2), ...truth.slice(2).reverse()];
  const graded = grade(step, shuffled);
  assert.equal(graded.correct, false);
  assert.match(graded.feedback, /positions are right/);
});

/* --------------------------------------------------------------- session */

check('a lucky guess stays visible as a second attempt', () => {
  const session = createSession(fixture);
  const step = session.current();
  session.submit(step.id, 'nonsense');
  session.submit(step.id, step.options.find(o => o.correct).id);
  const row = session.summary().rows.find(r => r.id === step.id);
  assert.equal(row.firstTry, false, 'first-try is what the summary reports');
  assert.equal(row.attempts, 2);
});

check('missed steps come back, and only the missed ones', () => {
  const session = createSession(fixture);
  const missedId = session.current().id;
  fixture.steps.forEach(step => {
    const at = session.current();
    assert.equal(at.id, step.id, 'steps come in spec order');
    session.submit(at.id, at.id === missedId ? 'wrong' : correctAnswer(at));
    session.next();
  });
  assert.equal(session.progress().pass, 2, 'the second pass starts automatically');
  assert.equal(session.progress().total, 1, 'only the miss is re-asked');
  assert.equal(session.current().id, missedId);
});

check('hints are counted, not hidden', () => {
  const session = createSession(fixture);
  const step = session.current();
  session.hint(step.id);
  assert.equal(session.hint(step.id).length > 0, true);
  assert.equal(session.summary().rows.find(r => r.id === step.id).hints, 2);
});

check('the summary reports a first-try rate', () => {
  const session = createSession(fixture, { retryMissed: false });
  fixture.steps.forEach(step => {
    session.submit(step.id, correctAnswer(step));
    session.next();
  });
  const summary = session.summary();
  assert.equal(summary.total, fixture.steps.length);
  assert.equal(summary.firstTryRate, 1, 'a perfect run is a perfect first-try rate');
  assert.deepEqual(summary.missed, []);
});

/* -------------------------------------------------------------- builder */

check('new-exercise builds a self-contained page', () => {
  const out = tmp();
  const result = run([join(here, 'new-exercise.mjs'), 'web', join(here, 'fixtures/spec.json'), out]);
  assert.equal(result.code, 0, result.out);
  const page = readFileSync(join(out, 'index.html'), 'utf8');
  assert.ok(page.includes(fixture.meta.title), 'the title is baked in');
  assert.ok(page.includes(fixture.steps[0].prompt), 'the steps are baked in');
  assert.ok(!/^export /m.test(page), 'no module exports survive the inline');
  assert.ok(page.includes('createSession'), 'the engine is inlined');
  assert.ok(existsSync(join(out, '.nojekyll')), 'Pages needs .nojekyll');
  assert.ok(existsSync(join(out, 'README.md')), 'the repo gets a README');
  assert.ok(page.length > 20_000, 'a page this thin means the spec did not make it in');
});

check('new-exercise refuses a spec with a design error', () => {
  const out = tmp();
  const spec = clone(fixture);
  delete spec.steps[0].options[0].feedback;
  const specPath = join(out, 'bad.json');
  writeFileSync(specPath, JSON.stringify(spec));
  const result = run([join(here, 'new-exercise.mjs'), 'web', specPath, join(out, 'page')]);
  assert.equal(result.code, 1, 'an invalid spec must not build');
  assert.match(result.out, /no feedback/);
});

/* -------------------------------------------------------------- checker */

check('the checker passes the fixture', () => {
  const result = run([join(here, 'check-exercise.mjs'), 'web', join(here, 'fixtures/spec.json')]);
  assert.equal(result.code, 0, result.out);
  assert.match(result.out, /0 errors/);
});

check('the checker bites on a reveal-only spec', () => {
  const out = tmp();
  const spec = clone(fixture);
  spec.steps = spec.steps.map(s => ({
    id: s.id, kind: 'reveal', prompt: s.prompt, why: s.why, difficulty: s.difficulty, reveal: 'the answer'
  }));
  const specPath = join(out, 'reveal.json');
  writeFileSync(specPath, JSON.stringify(spec));
  const result = run([join(here, 'check-exercise.mjs'), 'web', specPath]);
  assert.equal(result.code, 1);
  assert.match(result.out, /no-interaction/);
});

console.log(`\n${passed}/${passed + failed} engine checks passed`);
process.exit(failed ? 1 : 0);
