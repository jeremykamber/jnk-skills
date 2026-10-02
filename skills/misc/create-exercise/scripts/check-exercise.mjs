#!/usr/bin/env node
/**
 * check-exercise.mjs — the completion criterion for an exercise.
 *
 *   node scripts/check-exercise.mjs web  <spec.json>
 *   node scripts/check-exercise.mjs code <lang> <exercise-dir>
 *
 * Web specs go through the engine's own validator (one source of truth
 * for what a step may contain) plus the rules that only make sense for
 * a published exercise. Code exercises are checked structurally: the
 * student tree is complete, the teacher material is separated, and the
 * harness is runnable. Errors mean "do not publish"; warnings are
 * judgement calls to read and then accept or fix.
 */
import { readFileSync, statSync, readdirSync, accessSync, constants } from 'node:fs';
import { join, basename } from 'node:path';
import { validate } from '../assets/engine.mjs';

const findings = [];
const report = (level, where, id, message) => findings.push({ level, where, id, message });

function checkWeb(specPath) {
  const spec = JSON.parse(readFileSync(specPath, 'utf8'));
  const { errors, warnings } = validate(spec);
  errors.forEach(e => report('error', 'spec', 'design', e));
  warnings.forEach(w => report('warn', 'spec', 'design', w));

  const steps = spec.steps || [];
  const interactive = steps.filter(s => !['explain', 'reveal'].includes(s.kind));
  if (interactive.length === 0) report('error', 'spec', 'no-interaction', 'every step is a reveal — that is a document, not an exercise');
  if (steps.length > 20) report('warn', 'spec', 'long-set', `${steps.length} steps — a drill is 6-12 steps; split it or cut the padding`);
  if (steps.length < 4) report('warn', 'spec', 'short-set', `${steps.length} steps is not enough practice to move anything into memory`);
  if (!steps.some(s => s.kind === 'explain')) report('warn', 'spec', 'no-self-explanation', 'add a "why does this hold?" step — self-explanation is what turns recognition into understanding');
  if (!spec.meta.source) report('warn', 'meta', 'no-source', 'list your sources in meta.source — it is printed on the page and it is what makes the content checkable');
  const withSource = steps.filter(s => s.source).length;
  if (spec.meta.source && withSource === 0) report('warn', 'spec', 'no-step-source', 'no step carries a source — cite the claim that a student might doubt');
  const kinds = new Set(steps.map(s => s.kind));
  if (kinds.size === 1 && steps.length > 6) report('warn', 'spec', 'one-kind', 'every step is the same interaction — vary the format or the set becomes a rhythm to game');
}

function checkCode(lang, dir) {
  const required = ['README.md', 'HINTS.md', 'src', 'tests', 'run.sh', 'teacher'];
  required.forEach(name => {
    try {
      statSync(join(dir, name));
    } catch {
      report('error', dir, 'missing', `${name} is missing — the student tree is not complete`);
    }
  });
  ['solution', 'hidden', 'RUBRIC.md'].forEach(name => {
    try {
      statSync(join(dir, 'teacher', name));
    } catch {
      report('warn', dir, 'missing-teacher', `teacher/${name} is missing — you will want it when grading`);
    }
  });
  try {
    accessSync(join(dir, 'run.sh'), constants.X_OK);
  } catch {
    report('error', dir, 'not-executable', 'run.sh is not executable (chmod +x)');
  }
  const readmePath = join(dir, 'README.md');
  try {
    const readme = readFileSync(readmePath, 'utf8');
    if (!/run\.sh|make|npm test|unittest/.test(readme)) report('warn', readmePath, 'no-run-instructions', 'the README never says how to run the tests');
    if (!/object|done|acceptance|should/.test(readme)) report('warn', readmePath, 'no-success-criterion', 'the README does not state the observable success criterion');
    if (/solution/i.test(readme) && /teacher\/solution/.test(readme)) report('warn', readmePath, 'points-at-solution', 'the README points students at teacher/solution');
  } catch {
    // reported above
  }
  const hintsPath = join(dir, 'HINTS.md');
  try {
    const hints = readFileSync(hintsPath, 'utf8');
    const levelCount = (hints.match(/^##+\s/gm) || []).length;
    if (levelCount < 2) report('warn', hintsPath, 'thin-hints', 'HINTS.md should hold progressive hints (nudge → approach → near-answer), not one line');
  } catch {
    // reported above
  }
  try {
    const teacherSolution = join(dir, 'teacher', 'solution');
    const srcFiles = readdirSync(join(dir, 'src'));
    const solutionFiles = readdirSync(teacherSolution);
    const missing = srcFiles.filter(f => !solutionFiles.includes(f));
    if (missing.length) report('warn', teacherSolution, 'partial-solution', `no solution file for: ${missing.join(', ')}`);
  } catch {
    // teacher/solution already reported
  }
}

const [kind, ...rest] = process.argv.slice(2);
try {
  if (kind === 'web' && rest.length === 1) checkWeb(rest[0]);
  else if (kind === 'code' && rest.length === 2) checkCode(rest[0], rest[1]);
  else {
    console.error('usage: check-exercise.mjs web <spec.json>  |  check-exercise.mjs code <lang> <exercise-dir>');
    process.exit(1);
  }
} catch (error) {
  console.error(`error: ${error.message}`);
  process.exit(1);
}

const errors = findings.filter(f => f.level === 'error');
const warnings = findings.filter(f => f.level === 'warn');
warnings.forEach(f => console.log(`warn  ${f.id.padEnd(20)} ${f.where}: ${f.message}`));
errors.forEach(f => console.log(`ERROR ${f.id.padEnd(20)} ${f.where}: ${f.message}`));
const label = kind === 'web' ? 'spec' : basename(rest[1]);
console.log(`\n${label} · ${errors.length} errors · ${warnings.length} warnings`);
process.exit(errors.length ? 1 : 0);
