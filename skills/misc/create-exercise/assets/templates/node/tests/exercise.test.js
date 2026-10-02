/**
 * Visible tests.
 *
 * A representative subset of the behaviour the exercise asks for: enough to
 * tell a student whether they are on track, not the whole specification. The
 * cases the student never sees live in teacher/hidden/.
 *
 * Every assertion here reads through the exported function and checks what a
 * caller can observe — a returned value, a thrown error, a mutated argument.
 * Never a private helper, never the text of the source.
 */

import test from 'node:test';
import assert from 'node:assert/strict';

import { placeholder } from '../src/exercise.js';

// Author: replace this case with tests for the real function. It fails on
// purpose, so a fresh copy of the template already behaves the way a started
// exercise should.
test('placeholder doubles each value', () => {
  assert.deepEqual(placeholder([1, 2, 3]), [2, 4, 6]);
});
