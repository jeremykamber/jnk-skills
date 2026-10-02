/* Visible tests.
 *
 * A representative subset of the behaviour the exercise asks for: enough to
 * tell a student whether they are on track, not the whole specification. The
 * cases the student never sees live in teacher/hidden/.
 *
 * Every check here calls through the header and looks at what a caller can
 * observe — a returned value, a written out-parameter, the exit code. Never a
 * private helper, never the text of the source.
 *
 * Author: replace these checks with the real ones. This one fails on purpose,
 * so a fresh copy of the template already behaves the way a started exercise
 * should.
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
        int values[] = {1, 2, 1};
        check(count_equal(values, 3, 1) == 2, "counts the values equal to the target");
    }
    {
        int values[] = {1, 2, 3};
        check(count_equal(values, 3, 9) == 0, "returns zero when nothing matches");
    }
    {
        check(count_equal(NULL, 0, 1) == 0, "a length of zero reads nothing");
    }

    if (failures > 0) {
        printf("\n%d check(s) failed\n", failures);
        return 1;
    }

    printf("\nall checks passed\n");
    return 0;
}
