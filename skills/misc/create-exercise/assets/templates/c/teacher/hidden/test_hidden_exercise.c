/* Tests the student never sees.
 *
 * Author: each check here has to reject an answer the visible tests accept. If
 * a hidden check repeats a visible one it adds nothing but grading work. The
 * usual sources are the edge the student forgot (length zero, a single
 * element), the buffer they were handed by pointer rather than as an array,
 * and the error case.
 *
 * Run them against the starter and against teacher/solution/. Against the
 * starter at least one check must fail, otherwise the exercise can be solved
 * by leaving the file alone.
 */

#include <stdio.h>

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
        int values[] = {7, 7, 7};
        check(count_equal(values, 3, 7) == 3, "every value can match");
    }
    {
        int values[] = {1, 2, 3};
        check(count_equal(values, 3, 2) == 1, "larger values are not matches");
    }

    if (failures > 0) {
        printf("\n%d check(s) failed\n", failures);
        return 1;
    }

    printf("\nall checks passed\n");
    return 0;
}
