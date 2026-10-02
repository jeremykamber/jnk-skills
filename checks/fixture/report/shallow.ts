// Chapter 4.5: a shallow module. Two exported methods and their parameters are
// as much to hold in mind as the two statements behind them.
export class EmptyIsland {
  isEmpty(value: string): boolean {
    return value.length === 0;
  }

  isBlank(value: string): boolean {
    return value.trim().length === 0;
  }
}
