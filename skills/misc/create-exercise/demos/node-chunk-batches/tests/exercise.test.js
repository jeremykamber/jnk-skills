/**
 * Visible tests.
 *
 * A representative subset of the behaviour the exercise asks for: enough to
 * tell a student whether they are on track, not the whole specification. The
 * cases the student never sees live in teacher/hidden/.
 *
 * Every assertion here reads through `chunk` and checks what a caller can
 * observe — a returned value, a thrown error, a mutated argument. Never a
 * private helper, never the text of the source.
 */

import test from 'node:test';
import assert from 'node:assert/strict';

import { chunk } from '../src/exercise.js';

test('keeps the final short batch', () => {
  assert.deepEqual(chunk([1, 2, 3, 4, 5], 2), [[1, 2], [3, 4], [5]]);
});

test('a queue that divides evenly produces full batches', () => {
  assert.deepEqual(chunk([1, 2, 3, 4], 2), [[1, 2], [3, 4]]);
});

test('a batch size larger than the queue produces one batch', () => {
  assert.deepEqual(chunk([1, 2], 5), [[1, 2]]);
});

test('an empty queue produces no batches', () => {
  assert.deepEqual(chunk([], 3), []);
});
