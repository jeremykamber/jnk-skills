/**
 * Tests the student never sees.
 *
 * Each case here rejects an answer the visible tests accept. The visible set
 * uses only whole-number sizes, so it never notices that the starter lets a
 * fraction through, and it never looks at the caller's array after the call,
 * so it cannot see a solution that drains the queue with splice.
 *
 * Run them against the starter and against teacher/solution/exercise.js.
 * Against the starter at least one case must fail, otherwise the exercise can
 * be solved by deleting the body.
 *
 * The sizes used here are all whole numbers or sizes the starter rejects, so
 * the starter cannot spin: its loop invariant (a size of at least one) holds
 * for every call the suite makes.
 */

import test from 'node:test';
import assert from 'node:assert/strict';

import { chunk } from '../../src/exercise.js';

test('leaves the caller\'s queue intact', () => {
  const queue = [1, 2, 3, 4, 5];
  chunk(queue, 2);
  assert.deepEqual(queue, [1, 2, 3, 4, 5]);
});

test('rejects a size that is not a whole number', () => {
  assert.throws(() => chunk([1, 2, 3], 1.5), RangeError);
});

test('rejects a size of zero', () => {
  assert.throws(() => chunk([1, 2, 3], 0), RangeError);
});

test('rejects a negative size', () => {
  assert.throws(() => chunk([1, 2, 3], -2), RangeError);
});
