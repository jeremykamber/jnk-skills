/* Tests the student never sees.
 *
 * Each check here rejects an answer the visible tests accept. The visible set
 * uses a locally declared buffer, buffers whose largest value is positive, and
 * never calls max_value with a length of zero. These checks use a heap buffer,
 * a pointer into the middle of one, an all-negative buffer, and the empty case.
 *
 * Run them against the starter and against teacher/solution/. Against the
 * starter five of the six fail, otherwise the exercise can be solved by
 * deleting the bodies.
 */

#include <stdio.h>
#include <stdlib.h>

#include "exercise.h"

static int failures;

static void check(int condition, const char *name)
{
    printf("%s  %s\n", condition ? "ok  " : "FAIL", name);
    if (!condition) {
        failures++;
    }
}

int main(void)
{
    {
        int *window = malloc(10 * sizeof *window);
        if (window == NULL) {
            printf("FAIL  could not allocate the test buffer\n");
            return 1;
        }
        for (size_t i = 0; i < 10; i++) {
            window[i] = (int)i;
        }
        check(count_above(window, 10, 3) == 6, "reads a heap buffer to its last element");
        check(count_above(window + 5, 4, 3) == 4, "reads a sub-buffer to its last element");
        free(window);
    }
    {
        int values[] = {5, 5, 5};
        check(count_above(values, 3, 5) == 0, "a value equal to the threshold is not above it");
    }
    {
        int values[] = {-8, -3, -11};
        int out = 0;
        check(max_value(values, 3, &out) == 0 && out == -3, "reports the largest of an all-negative buffer");
    }
    {
        int values[] = {-1, -2};
        int out = 42;
        check(max_value(values, 0, &out) == -1, "an empty buffer reports failure");
        check(out == 42, "an empty buffer leaves the out-parameter alone");
    }

    if (failures > 0) {
        printf("\n%d check(s) failed\n", failures);
        return 1;
    }

    printf("\nall checks passed\n");
    return 0;
}
