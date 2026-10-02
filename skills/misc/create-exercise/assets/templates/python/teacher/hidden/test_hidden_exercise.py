"""Tests the student never sees.

Author: each case here has to reject an answer the visible tests accept. If a
hidden test repeats a visible one it adds nothing but grading work. The usual
sources are the edge the student forgot (empty input, a single element), the
argument they were told not to touch, and the error case.

Run them against the starter and against teacher/solution/exercise.py. Against
the starter at least one case must fail, otherwise the exercise can be solved
by leaving the file alone.
"""

import os
import sys
import unittest

sys.path.insert(0, os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))), "src"))

import exercise


class TestPlaceholderHidden(unittest.TestCase):
    def test_placeholder_is_not_a_passthrough(self):
        self.assertNotEqual(exercise.placeholder([5]), [5])


if __name__ == "__main__":
    unittest.main()
