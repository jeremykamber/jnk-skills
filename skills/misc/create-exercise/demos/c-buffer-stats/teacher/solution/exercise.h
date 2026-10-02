/* Reference solution. Never published.
 *
 * Same file name as src/exercise.h, same signatures. The only difference is
 * the behaviour.
 */

#ifndef EXERCISE_H
#define EXERCISE_H

#include <stddef.h>

size_t count_above(const int *values, size_t n, int threshold);
int max_value(const int *values, size_t n, int *out);

#endif
