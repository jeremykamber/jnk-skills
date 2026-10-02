/**
 * engine.mjs — the pure core of a practice exercise.
 *
 * No DOM, no network, no clock. The shell renders; this decides. Keeping
 * the decisions here is what makes an exercise testable without a
 * browser, and what lets every exercise share one behaviour: commit
 * before reveal, elaborated feedback, first-try scoring, and a second
 * pass over what was missed.
 *
 * Spec shape (see references/general-mode.md):
 *   { meta: { title, objective, audience, mode, source? },
 *     steps: [ { id, kind, prompt, why, difficulty, hint?, source?, ... } ] }
 *
 * Step kinds: choice, multi, order, match, classify, numeric, text,
 * explain, reveal. Each carries its own answer fields; see validate().
 */

export const KINDS = ['choice', 'multi', 'order', 'match', 'classify', 'numeric', 'text', 'explain', 'reveal'];

const norm = value => String(value ?? '').trim().toLowerCase().replace(/\s+/g, ' ');
const num = value => {
  const n = Number(String(value ?? '').replace(/[,_\s]/g, '').replace(/%$/, ''));
  return Number.isFinite(n) ? n : null;
};

/* ---------------------------------------------------------------- spec */

/** Structural rules a spec must satisfy before it is worth publishing. */
export function validate(spec) {
  const errors = [];
  const warnings = [];
  const meta = spec?.meta || {};
  const steps = spec?.steps;

  if (!meta.title) errors.push('meta.title is required (it names the page and the repo)');
  if (!meta.objective) errors.push('meta.objective is required (what they can do afterwards)');
  if (!meta.audience) errors.push('meta.audience is required (what they already know)');
  if (!Array.isArray(steps) || steps.length === 0) {
    errors.push('steps must be a non-empty array');
    return { errors, warnings };
  }

  const ids = new Set();
  const seen = new Set();
  steps.forEach((step, i) => {
    const at = `step ${i + 1}`;
    if (!step.id) errors.push(`${at}: id is required`);
    if (ids.has(step.id)) errors.push(`${at}: duplicate id "${step.id}"`);
    ids.add(step.id);
    if (!KINDS.includes(step.kind)) errors.push(`${at}: unknown kind "${step.kind}"`);
    if (!step.prompt) errors.push(`${at}: prompt is required — one sentence, the thing they answer`);
    if (!step.why) warnings.push(`${at}: no "why" — say what this step checks so the feedback can land`);
    if (!step.difficulty) warnings.push(`${at}: no difficulty (1-3) — useful for balancing the set`);

    if (step.kind === 'choice' || step.kind === 'multi') {
      const options = step.options || [];
      if (options.length < 2) errors.push(`${at}: needs at least two options`);
      const correct = options.filter(o => o.correct);
      if (step.kind === 'choice' && correct.length !== 1) errors.push(`${at}: choice needs exactly one correct option`);
      if (step.kind === 'multi' && correct.length < 1) errors.push(`${at}: multi needs at least one correct option`);
      options.forEach((o, j) => {
        if (!o.text) errors.push(`${at}: option ${j + 1} has no text`);
        if (!o.feedback) {
          // The single most important rule in this file: a wrong option
          // teaches only if the feedback says why it is wrong.
          errors.push(`${at}: option ${j + 1} has no feedback — every option explains itself`);
        }
      });
    }
    if (step.kind === 'order') {
      const order = step.order || step.items || [];
      if (order.length < 3) errors.push(`${at}: order needs at least three items`);
    }
    if (step.kind === 'match') {
      const pairs = step.pairs || [];
      if (pairs.length < 3) errors.push(`${at}: match needs at least three pairs`);
      pairs.forEach((p, j) => {
        if (!p.left || !p.right) errors.push(`${at}: pair ${j + 1} needs both sides`);
      });
    }
    if (step.kind === 'classify') {
      if ((step.buckets || []).length < 2) errors.push(`${at}: classify needs at least two buckets`);
      (step.items || []).forEach((item, j) => {
        if (!item.text || !item.bucket) errors.push(`${at}: item ${j + 1} needs text and a bucket`);
        else if (!(step.buckets || []).includes(item.bucket)) errors.push(`${at}: item ${j + 1} names an unknown bucket`);
      });
    }
    if (step.kind === 'numeric' && typeof step.answer !== 'number') errors.push(`${at}: numeric needs a numeric answer`);
    if ((step.kind === 'text' || step.kind === 'numeric') && !(step.accept || []).length && step.kind === 'text') {
      warnings.push(`${at}: text step with no accept list accepts anything (use it only for opinion)`);
    }
    if ((step.kind === 'explain' || step.kind === 'reveal') && !step.reveal) {
      errors.push(`${at}: ${step.kind} needs the model explanation in "reveal"`);
    }
  });

  // Difficulty ramp: a set that never rises is a set that never teaches
  // the last mile (fading guidance — Renkl & Atkinson 2003).
  const levels = steps.map(s => Number(s.difficulty) || 0).filter(Boolean);
  if (levels.length > 2 && levels[levels.length - 1] < Math.max(...levels)) {
    warnings.push('the last step is not the hardest — end the set at its peak difficulty');
  }
  if (levels.length > 2 && !levels.some(l => l >= 2)) {
    warnings.push('every step is difficulty 1 — add at least one that needs real work');
  }

  const explained = steps.filter(s => s.kind === 'explain').length;
  if (steps.length >= 6 && explained === 0) {
    warnings.push('no self-explanation step — a "why does this hold?" prompt is what turns recognition into understanding');
  }
  return { errors, warnings };
}

/* --------------------------------------------------------------- grade */

/** Grade one answer. Returns correctness plus the feedback to show. */
export function grade(step, answer) {
  switch (step.kind) {
    case 'choice':
    case 'multi': {
      const chosen = new Set([].concat(answer ?? []).map(String));
      const correct = new Set((step.options || []).filter(o => o.correct).map(o => o.id));
      const same = chosen.size === correct.size && [...chosen].every(c => correct.has(c));
      if (same) {
        const picked = (step.options || []).find(o => o.correct && chosen.has(o.id));
        return { correct: true, feedback: picked?.feedback || step.why || 'Correct.' };
      }
      const firstWrong = (step.options || []).find(o => chosen.has(o.id) && !o.correct);
      return {
        correct: false,
        feedback: firstWrong?.feedback || step.hint || 'Not this one.',
        answer: (step.options || []).filter(o => o.correct).map(o => o.text).join(', ')
      };
    }
    case 'order': {
      const truth = (step.order || step.items || []).map(x => (typeof x === 'string' ? x : x.id ?? x.text));
      const given = [].concat(answer ?? []).map(String);
      const hits = given.filter((g, i) => g === String(truth[i])).length;
      return {
        correct: hits === truth.length && given.length === truth.length,
        feedback: hits === truth.length ? (step.feedback || 'That is the right order.') : step.feedback || `First ${hits} of ${truth.length} positions are right — the failure is further along.`,
        answer: truth.join(' → ')
      };
    }
    case 'match': {
      const pairs = step.pairs || [];
      const given = answer || {};
      const wrong = pairs.filter(p => String(given[p.left]) !== String(p.right));
      return {
        correct: wrong.length === 0,
        feedback: wrong.length === 0 ? (step.feedback || 'All matched.') : `Still unmatched: ${wrong.map(p => p.left).join(', ')}`,
        answer: pairs.map(p => `${p.left} → ${p.right}`).join('; ')
      };
    }
    case 'classify': {
      const bucketOf = new Map((step.items || []).map(i => [i.text, i.bucket]));
      const given = answer || {};
      const wrong = [...bucketOf.entries()].filter(([text, bucket]) => String(given[text]) !== String(bucket));
      return {
        correct: wrong.length === 0,
        feedback: wrong.length === 0 ? (step.feedback || 'Every item is in the right bucket.') : `Look again at: ${wrong.map(([t]) => t).join(', ')}`,
        answer: [...bucketOf.entries()].map(([t, b]) => `${t} → ${b}`).join('; ')
      };
    }
    case 'numeric': {
      const value = num(answer);
      if (value === null) return { correct: false, feedback: 'That is not a number.', answer: String(step.answer) };
      const tol = Number(step.tolerance ?? 0);
      const ok = Math.abs(value - step.answer) <= tol;
      return {
        correct: ok,
        feedback: ok ? (step.feedback || 'Right.') : step.feedback || `Close is not it — check your units and the boundary case. The answer is ${step.answer}.`,
        answer: String(step.answer)
      };
    }
    case 'text': {
      const given = norm(answer);
      const ok = (step.accept || []).some(a => norm(a) === given);
      return {
        correct: ok,
        feedback: ok ? (step.feedback || 'Right.') : step.feedback || `Compare with: ${(step.accept || [])[0] ?? step.reveal ?? ''}`,
        answer: (step.accept || [])[0]
      };
    }
    case 'explain':
    case 'reveal':
      return { correct: true, feedback: step.reveal, answer: null, explained: true };
    default:
      return { correct: false, feedback: 'Unknown step kind.', answer: null };
  }
}

/* ------------------------------------------------------------- session */

/**
 * A session is the whole run: the steps in order, what was missed, and
 * the second pass. Answers are graded on the *first* attempt so that a
 * lucky guess stays visible in the summary.
 */
export function createSession(spec, options = {}) {
  const steps = spec.steps.map(step => ({ ...step }));
  const byId = new Map(steps.map(step => [step.id, step]));
  const state = {
    order: steps.map(s => s.id),
    index: 0,
    pass: 1,
    results: new Map(),      // id -> { firstTry, attempts, hints, correct }
    misses: []
  };

  const current = () => byId.get(state.order[state.index]) || null;

  function submit(stepId, answer) {
    const step = byId.get(stepId);
    const prior = state.results.get(stepId) || { firstTry: null, attempts: 0, hints: 0, correct: false };
    const graded = grade(step, answer);
    prior.attempts += 1;
    if (prior.firstTry === null) prior.firstTry = graded.correct;
    prior.correct = graded.correct;
    state.results.set(stepId, prior);
    if (!graded.correct && state.pass === 1 && !state.misses.includes(stepId)) state.misses.push(stepId);
    return graded;
  }

  function next() {
    if (state.index < state.order.length - 1) {
      state.index += 1;
      return { done: false, step: current(), pass: state.pass };
    }
    if (options.retryMissed !== false && state.pass === 1 && state.misses.length) {
      state.pass = 2;
      state.order = [...state.misses];
      state.index = 0;
      return { done: false, step: current(), pass: 2, review: true };
    }
    return { done: true, summary: summary() };
  }

  function hint(stepId) {
    const prior = state.results.get(stepId) || { firstTry: null, attempts: 0, hints: 0, correct: false };
    prior.hints += 1;
    state.results.set(stepId, prior);
    return byId.get(stepId)?.hint || 'No hint for this one — try the step before it.';
  }

  function progress() {
    const total = state.pass === 1 ? steps.length : state.misses.length;
    return { pass: state.pass, position: state.index + 1, total, answered: [...state.results.values()].filter(r => r.correct).length };
  }

  function summary() {
    const rows = steps.map(step => {
      const r = state.results.get(step.id) || { firstTry: null, attempts: 0, hints: 0 };
      return {
        id: step.id,
        prompt: step.prompt,
        difficulty: step.difficulty || 1,
        firstTry: r.firstTry === true,
        attempts: r.attempts,
        hints: r.hints,
        source: step.source || null
      };
    });
    const firstTry = rows.filter(r => r.firstTry).length;
    return {
      total: rows.length,
      firstTry,
      firstTryRate: rows.length ? firstTry / rows.length : 0,
      missed: rows.filter(r => !r.firstTry).map(r => r.id),
      hinted: rows.filter(r => r.hints > 0).map(r => r.id),
      rows
    };
  }

  return { current, submit, next, hint, progress, summary, state: () => state };
}
