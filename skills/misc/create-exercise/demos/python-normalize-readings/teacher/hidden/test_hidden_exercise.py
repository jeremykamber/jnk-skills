"""Tests the student never sees.

Each case here rejects an answer the visible tests accept: the visible set never
looks at the caller's list after the call, never asks for a distinct result
object, and never passes an impossible range.

Run them against the starter and against teacher/solution/exercise.py. Against
the starter at least one case must fail, otherwise the exercise can be solved
by deleting the body.
"""

import os
import sys
import unittest

sys.path.insert(0, os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))), "src"))

import exercise


class TestTheCallersList(unittest.TestCase):
    def test_does_not_modify_the_list_it_was_handed(self):
        readings = [42.46, -3.14, 18.24]
        exercise.normalize(readings, 0.0, 40.0)
        self.assertEqual(readings, [42.46, -3.14, 18.24])

    def test_returns_a_different_list(self):
        readings = [42.46, -3.14, 18.24]
        self.assertIsNot(exercise.normalize(readings, 0.0, 40.0), readings)


class TestRangeAndOrder(unittest.TestCase):
    def test_rejects_a_range_whose_bounds_are_inverted(self):
        with self.assertRaises(ValueError):
            exercise.normalize([1.0], 40.0, 0.0)

    def test_keeps_length_and_order_when_values_repeat(self):
        self.assertEqual(exercise.normalize([9.99, 9.99, 0.01], 0.0, 10.0), [10.0, 10.0, 0.0])

    def test_a_range_of_one_value_clamps_both_ways(self):
        self.assertEqual(exercise.normalize([-5.55, 5.55], 2.0, 2.0), [2.0, 2.0])


if __name__ == "__main__":
    unittest.main()
