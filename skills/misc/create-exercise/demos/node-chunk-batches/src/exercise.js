/**
 * Split a job queue into fixed-size batches.
 *
 * Implement chunk(items, size) so that every item lands in exactly one batch
 * and the final short batch survives, without touching the caller's array.
 *
 * This is the starter. It runs, and the visible tests fail against it.
 */

export function chunk(items, size) {
  if (size < 1) {
    throw new RangeError(`size must be at least 1, got ${size}`);
  }

  const batches = [];
  for (let i = 0; i + size <= items.length; i += size) {
    batches.push(items.slice(i, i + size));
  }

  return batches;
}
