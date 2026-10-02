/**
 * Reference solution. Never published.
 *
 * Same file name as src/exercise.js, same signature and same export. The only
 * difference is the behaviour.
 */

export function chunk(items, size) {
  if (!Number.isInteger(size) || size < 1) {
    throw new RangeError(`size must be a positive integer, got ${size}`);
  }

  const batches = [];
  for (let i = 0; i < items.length; i += size) {
    batches.push(items.slice(i, i + size));
  }

  return batches;
}
