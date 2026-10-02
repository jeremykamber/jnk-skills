"""Normalize a series of sensor readings.

Return a new list of readings clamped into range and rounded to one decimal
place, leaving the caller's list untouched.

This is the starter. It runs, and the visible tests fail against it.
"""


def normalize(readings, lo, hi):
    for index, value in enumerate(readings):
        if value < lo:
            readings[index] = lo
        elif value > hi:
            readings[index] = hi

    return readings
