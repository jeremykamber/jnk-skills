"""Reference solution. Never published.

Same file name as src/exercise.py, same signature. The only difference is the
behaviour.
"""


def normalize(readings, lo, hi):
    if lo > hi:
        raise ValueError(f"lo ({lo}) must not be greater than hi ({hi})")

    normalized = []
    for value in readings:
        clamped = min(max(value, lo), hi)
        normalized.append(round(clamped, 1))

    return normalized
