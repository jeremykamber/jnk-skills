export function simple(x: number): number {
  return x + 1;
}

export function branchy(a: number, b: number): number {
  if (a > b && b > 0) {
    return a;
  }
  for (let i = 0; i < a; i++) {
    b += i;
  }
  return b;
}

export function uncovered(a: number): number {
  if (a > 0) {
    return 1;
  } else if (a < 0) {
    return -1;
  }
  return 0;
}
