/* Reference solution. Never published. */

#include "exercise.h"

size_t count_equal(const int *values, size_t n, int target)
{
    size_t count = 0;

    for (size_t i = 0; i < n; i++) {
        if (values[i] == target) {
            count++;
        }
    }

    return count;
}
