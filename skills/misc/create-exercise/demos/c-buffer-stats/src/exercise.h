/* Statistics over a buffer you are handed a pointer to.
 *
 * Implement count_above and max_value so that each one reads exactly the n
 * elements it was given, answers the empty case instead of guessing, and never
 * reads past the buffer.
 *
 * The tests include this header and call through it, so these signatures are
 * the contract.
 */

#ifndef EXERCISE_H
#define EXERCISE_H

#include <stddef.h>

/* Return how many of the n values are strictly greater than threshold. */
size_t count_above(const int *values, size_t n, int threshold);

/* Write the largest value through out and return 0.
 * With n of 0 there is no largest value: return -1 and leave *out untouched.
 */
int max_value(const int *values, size_t n, int *out);

#endif
