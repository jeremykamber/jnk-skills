/* Reference solution. Never published. */

#include "exercise.h"

size_t count_above(const int *values, size_t n, int threshold)
{
    size_t count = 0;

    for (size_t i = 0; i < n; i++) {
        if (values[i] > threshold) {
            count++;
        }
    }

    return count;
}

int max_value(const int *values, size_t n, int *out)
{
    if (n == 0) {
        return -1;
    }

    int best = values[0];

    for (size_t i = 1; i < n; i++) {
        if (values[i] > best) {
            best = values[i];
        }
    }

    *out = best;
    return 0;
}
