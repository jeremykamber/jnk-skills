/* Visible tests.
 *
 * A representative subset of the behaviour the exercise asks for: enough to
 * tell a student whether they are on track, not the whole specification. The
 * cases the student never sees live in teacher/hidden/.
 *
 * Every check here calls through the header and looks at what a caller can
 * observe — a returned value, a written out-parameter, the exit code. Never a
 * private helper, never the text of the source.
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
        int values[] = {1, 5, 9};
        check(count_above(values, 3, 4) == 2, "counts every value above the threshold");
    }
    {
        int values[] = {1, 2, 3};
        check(count_above(values, 3, 9) == 0, "counts nothing when the threshold is above every value");
    }
    {
        check(count_above(NULL, 0, 0) == 0, "a buffer of length zero has nothing above the threshold");
    }
    {
        int values[] = {4, 11, 7};
        int out = 0;
        check(max_value(values, 3, &out) == 0 && out == 11, "writes the largest value through the out parameter");
    }
    {
        int values[] = {6};
        int out = 0;
        check(max_value(values, 1, &out) == 0 && out == 6, "a buffer of one value reports that value");
    }

    if (failures > 0) {
        printf("\n%d check(s) failed\n", failures);
        return 1;
    }

    printf("\nall checks passed\n");
    return 0;
}
