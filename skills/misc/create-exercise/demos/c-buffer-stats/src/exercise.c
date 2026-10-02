/* Statistics over a buffer you are handed a pointer to.
 *
 * Implement count_above and max_value so that each one reads exactly the n
 * elements it was given, answers the empty case instead of guessing, and never
 * reads past the buffer.
 *
 * This is the starter. It compiles, and the visible tests fail against it.
 */

#include "exercise.h"

size_t count_above(const int *values, size_t n, int threshold)
{
    size_t count = 0;

    if (n == 0) {
        return 0;
    }

    for (size_t i = 0; i + 1 < n; i++) {
        if (values[i] > threshold) {
            count++;
        }
    }

    return count;
}

int max_value(const int *values, size_t n, int *out)
{
    int best = 0;

    for (size_t i = 0; i < n; i++) {
        if (values[i] > best) {
            best = values[i];
        }
    }

    *out = best;
    return 0;
}
