"""Visible tests.

A representative subset of the behaviour the exercise asks for: enough to tell
a student whether they are on track, not the whole specification. The cases the
student never sees live in teacher/hidden/.

Every assertion here reads through `normalize` and checks what a caller can
observe — a returned value, a raised error, a mutated argument. Never a private
helper, never the text of the source.
"""

import os
import sys
import unittest

# The tests run with tests/ as the discovery root, so src/ has to be on the
# path explicitly for the import below to resolve.
sys.path.insert(0, os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "src"))

import exercise


class TestNormalize(unittest.TestCase):
    def test_rounds_each_reading_to_one_decimal_place(self):
        self.assertEqual(exercise.normalize([12.34, 5.67], 0.0, 100.0), [12.3, 5.7])

    def test_clamps_readings_above_the_upper_bound(self):
        self.assertEqual(exercise.normalize([42.46, 18.24], 0.0, 40.0), [40.0, 18.2])

    def test_clamps_readings_below_the_lower_bound(self):
        self.assertEqual(exercise.normalize([-3.14, 7.04], 0.0, 40.0), [0.0, 7.0])

    def test_an_empty_series_normalizes_to_an_empty_series(self):
        self.assertEqual(exercise.normalize([], 0.0, 40.0), [])


if __name__ == "__main__":
    unittest.main()
