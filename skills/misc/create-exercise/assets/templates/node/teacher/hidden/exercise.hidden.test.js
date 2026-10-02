/**
 * Tests the student never sees.
 *
 * Author: each case here has to reject an answer the visible tests accept. If a
 * hidden test repeats a visible one it adds nothing but grading work. The usual
 * sources are the edge the student forgot (empty input, a single element), the
 * argument they were told not to touch, and the error case.
 *
 * Run them against the starter and against teacher/solution/exercise.js.
 * Against the starter at least one case must fail, otherwise the exercise can
 * be solved by leaving the file alone.
 */

import test from 'node:test';
import assert from 'node:assert/strict';

import { placeholder } from '../../src/exercise.js';

test('placeholder is not a passthrough', () => {
  assert.notDeepEqual(placeholder([5]), [5]);
});
