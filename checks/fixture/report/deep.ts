// Chapter 4.4: a deep module. One exported method over a real implementation,
// so the interface is small and the work behind it is not.
export class ShallowCalculator {
  computeTotal(values: number[]): number {
    let total = 0;
    let index = 0;
    while (index < values.length) {
      const value = values[index];
      if (value > 0) {
        total += value;
      } else {
        total -= value;
      }
      index += 1;
    }
    const rounded = Math.round(total);
    return rounded;
  }
}
