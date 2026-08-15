#!/usr/bin/env node
"use strict";

/**
 * Spaced-repetition scheduler for the teach skill.
 *
 * Zero dependencies, one file, auditable. Implements an SM-2-style scheduler
 * (the classic SuperMemo/Anki approach): repetitions, ease, and interval, with
 * modifiers drawn from the learner model (cue dependence, transfer, importance,
 * difficulty). JSON in, JSON out — the agent never touches the math.
 *
 * Why SM-2 and not ts-fsrs (open-spaced-repetition/ts-fsrs)?
 * - FSRS's 19-parameter model earns its complexity with thousands of reviews
 *   per card. This skill schedules rich conceptual reviews — a handful per
 *   concept over months — where FSRS converges to its default parameters anyway.
 * - ts-fsrs would add a Node dependency and an install step to a skill that
 *   should run anywhere pi runs, with zero setup.
 * - The interface is shaped like ts-fsrs's (rating in, next-review state out),
 *   so swapping to FSRS later is a change to this one file, not to the skill.
 *
 * Usage (run from the skill directory):
 *   node scripts/scheduler.js schedule [input.json]   # JSON via stdin or file
 *   node scripts/scheduler.js due [cards.json]        # list cards due on/before today
 *   node scripts/scheduler.js test                    # self-check assertions
 */

const fs = require("fs");
const assert = require("assert");

// --- dates (UTC arithmetic so timezones can't skew intervals) ---
const DAY_MS = 86400000;

function parseIso(s) {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(String(s || ""));
  if (!m) throw new Error(`bad date "${s}", expected YYYY-MM-DD`);
  return Date.UTC(+m[1], +m[2] - 1, +m[3]);
}

function formatIso(utc) {
  return new Date(utc).toISOString().slice(0, 10);
}

const todayIso = () => formatIso(Date.now());

// --- algorithm constants ---
const RATINGS = ["again", "hard", "good", "easy"];
const EASE_FLOOR = 1.3;
const EASE_CEIL = 3.0;
const FIRST_INTERVAL = 1;   // days until first review of a new concept
const SECOND_INTERVAL = 6;  // SM-2's second gap
const HARD_BONUS = 1.2;     // Anki-style hard multiplier
const EASY_BONUS = 1.3;
const EASE_DELTA = { again: -0.2, hard: -0.15, good: 0, easy: 0.15 };
const IMPORTANCE_SCALE = { low: 0.75, medium: 1.0, high: 1.25 };
const DIFFICULTY_SCALE = { easy: 1.15, medium: 1.0, hard: 0.85 };

/**
 * Pedagogical modifiers from the learner model:
 * - cuesNeeded: a success that needed scaffolding counts one step weaker.
 * - transferDemonstrated: applying the idea in a novel setting counts one step
 *   stronger — but only upgrades successes, never rescues a failure.
 */
function effectiveRating(rating, cuesNeeded, transferDemonstrated) {
  let r = rating;
  if (cuesNeeded) {
    if (r === "easy") r = "good";
    else if (r === "good") r = "hard";
    // "hard" and "again" are already weak outcomes; no further downgrade.
  }
  if (transferDemonstrated && (r === "good" || r === "easy")) r = "easy";
  return r;
}

/**
 * schedule(input) -> { effectiveRating, card, note }
 *
 * input:
 *   rating: "again" | "hard" | "good" | "easy"   (required)
 *   cuesNeeded: boolean            (default false)
 *   transferDemonstrated: boolean  (default false)
 *   importance: low|medium|high    (default medium)
 *   difficulty: easy|medium|hard   (default medium)
 *   reviewedOn: "YYYY-MM-DD"       (actual date of this review; default today)
 *   card: { repetitions, ease, interval, lastReview }  (omit for a new concept)
 */
function schedule(input) {
  const rating = String(input.rating || "").toLowerCase();
  if (!RATINGS.includes(rating)) {
    throw new Error(`bad rating "${input.rating}", expected ${RATINGS.join("|")}`);
  }

  const eff = effectiveRating(rating, !!input.cuesNeeded, !!input.transferDemonstrated);

  const card = input.card || {};
  const reps = Number(card.repetitions) || 0;
  const ease = Math.min(EASE_CEIL, Math.max(EASE_FLOOR, Number(card.ease) || 2.5));
  const interval = Math.max(0, Number(card.interval) || 0);
  const reviewedOn = input.reviewedOn || todayIso();

  let newReps, newEase, newInterval;

  newEase = Math.min(EASE_CEIL, Math.max(EASE_FLOOR, ease + EASE_DELTA[eff]));

  if (eff === "again") {
    newReps = 0;
    newInterval = FIRST_INTERVAL; // relearn tomorrow
  } else if (reps === 0) {
    newReps = 1;
    newInterval = FIRST_INTERVAL;
  } else if (reps === 1) {
    newReps = 2;
    newInterval = SECOND_INTERVAL;
  } else {
    newReps = reps + 1;
    let multiplier = newEase;
    if (eff === "hard") multiplier = HARD_BONUS;
    if (eff === "easy") multiplier = newEase * EASY_BONUS;
    newInterval = Math.round(interval * multiplier);
  }

  const importance = IMPORTANCE_SCALE[String(input.importance || "medium").toLowerCase()] ?? 1.0;
  const difficulty = DIFFICULTY_SCALE[String(input.difficulty || "medium").toLowerCase()] ?? 1.0;
  newInterval = Math.max(1, Math.round(newInterval * importance * difficulty));

  const base = parseIso(reviewedOn);
  const nextReview = formatIso(base + newInterval * DAY_MS);

  return {
    effectiveRating: eff,
    card: {
      repetitions: newReps,
      ease: Math.round(newEase * 100) / 100,
      interval: newInterval,
      lastReview: reviewedOn,
      nextReview,
    },
    note: `${eff} → ${newInterval} day${newInterval === 1 ? "" : "s"}, next ${nextReview}`,
  };
}

/**
 * due(input) -> { due: [names], notDue: [names] }
 * input: { today?: "YYYY-MM-DD", cards: [{ name, nextReview, ... }] }
 * A card without a nextReview (never scheduled) counts as due.
 */
function due(input) {
  const today = parseIso(input.today || todayIso());
  const due = [];
  const notDue = [];
  for (const c of input.cards || []) {
    const isDue = !c.nextReview || parseIso(c.nextReview) <= today;
    (isDue ? due : notDue).push(c.name);
  }
  return { due, notDue };
}

// --- CLI ---
function readInput(file) {
  const raw = file ? fs.readFileSync(file, "utf8") : fs.readFileSync(0, "utf8");
  return JSON.parse(raw);
}

function main(argv) {
  const [cmd, file] = argv;
  if (cmd === "schedule") {
    process.stdout.write(JSON.stringify(schedule(readInput(file)), null, 2) + "\n");
  } else if (cmd === "due") {
    process.stdout.write(JSON.stringify(due(readInput(file)), null, 2) + "\n");
  } else if (cmd === "test") {
    runTests();
  } else {
    console.error("usage: node scheduler.js <schedule|due|test> [input.json]");
    process.exit(1);
  }
}

// --- self-check ---
function runTests() {
  const d = "2026-06-01";
  const card2 = { repetitions: 2, ease: 2.5, interval: 6 };

  // new concept, good → first review tomorrow
  let r = schedule({ rating: "good", reviewedOn: d });
  assert.strictEqual(r.card.interval, 1);
  assert.strictEqual(r.card.nextReview, "2026-06-02");

  // second success → 6 days
  r = schedule({ rating: "good", reviewedOn: "2026-06-02", card: { repetitions: 1, ease: 2.5, interval: 1 } });
  assert.strictEqual(r.card.interval, 6);
  assert.strictEqual(r.card.nextReview, "2026-06-08");

  // third success → interval × ease = 6 × 2.5 = 15
  r = schedule({ rating: "good", reviewedOn: "2026-06-08", card: card2 });
  assert.strictEqual(r.card.interval, 15);
  assert.strictEqual(r.card.nextReview, "2026-06-23");

  // again → reset, lower ease
  r = schedule({ rating: "again", reviewedOn: "2026-06-08", card: card2 });
  assert.strictEqual(r.card.repetitions, 0);
  assert.strictEqual(r.card.ease, 2.3);
  assert.strictEqual(r.card.interval, 1);

  // cues downgrade easy → good
  r = schedule({ rating: "easy", cuesNeeded: true, reviewedOn: d, card: card2 });
  assert.strictEqual(r.effectiveRating, "good");
  assert.strictEqual(r.card.interval, 15);

  // transfer upgrades good → easy (ease rises to 2.65 first, then 6 × 2.65 × 1.3 = 20.67 → 21)
  r = schedule({ rating: "good", transferDemonstrated: true, reviewedOn: d, card: card2 });
  assert.strictEqual(r.effectiveRating, "easy");
  assert.strictEqual(r.card.interval, 21);

  // importance + difficulty scale intervals
  const low = schedule({ rating: "good", importance: "low", reviewedOn: d, card: card2 });
  const high = schedule({ rating: "good", importance: "high", difficulty: "easy", reviewedOn: d, card: card2 });
  assert.strictEqual(low.card.interval, 11);  // 15 × 0.75 = 11.25 → 11
  assert.strictEqual(high.card.interval, 22); // 15 × 1.25 × 1.15 = 21.6 → 22

  // ease clamps at the floor
  r = schedule({ rating: "again", reviewedOn: d, card: { repetitions: 0, ease: 1.3, interval: 1 } });
  assert.strictEqual(r.card.ease, 1.3);

  // due filtering: unscheduled cards count as due
  const res = due({
    today: "2026-06-10",
    cards: [
      { name: "a", nextReview: "2026-06-08" },
      { name: "b", nextReview: "2026-06-15" },
      { name: "c" },
    ],
  });
  assert.deepStrictEqual(res, { due: ["a", "c"], notDue: ["b"] });

  console.log("all tests passed");
}

if (require.main === module) main(process.argv.slice(2));
