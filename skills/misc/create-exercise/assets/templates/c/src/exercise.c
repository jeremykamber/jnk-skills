/* __TITLE__
 *
 * __OBJECTIVE__
 *
 * Replace this file with the exercise's own starter code. It has to compile,
 * and the visible tests have to fail against it.
 */

#include "exercise.h"

/* A plausible first attempt, so the failure is a failed check rather than a
 * crash. A starter that aborts tells the student nothing about the problem.
 *
 * Author: replace this function with the exercise's real work, and give it the
 * wrong answer a first attempt actually produces.
 */
size_t count_equal(const int *values, size_t n, int target)
{
    size_t count = 0;

    for (size_t i = 0; i < n; i++) {
        if (values[i] >= target) {
            count++;
        }
    }

    return count;
}
