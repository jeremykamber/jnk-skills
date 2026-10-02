"""Visible tests.

A representative subset of the behaviour the exercise asks for: enough to tell
a student whether they are on track, not the whole specification. The cases the
student never sees live in teacher/hidden/.

Every assertion here reads through the public function and checks what a caller
can observe — a returned value, a raised error, a mutated argument. Never a
private helper, never the text of the source.
"""

import os
import sys
import unittest

# The tests run with tests/ as the discovery root, so src/ has to be on the
# path explicitly for the import below to resolve.
sys.path.insert(0, os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "src"))

import exercise


class TestPlaceholder(unittest.TestCase):
    # Author: replace this class with tests for the real function. This case
    # fails on purpose, so a fresh copy of the template already behaves the way
    # a started exercise should.
    def test_placeholder_doubles_each_value(self):
        self.assertEqual(exercise.placeholder([1, 2, 3]), [2, 4, 6])


if __name__ == "__main__":
    unittest.main()
