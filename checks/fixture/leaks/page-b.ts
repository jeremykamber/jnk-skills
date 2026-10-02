"use client";

import { BANNER_BACKGROUND } from "./banner";

// Figure 2.1(c): the same darker tone again, written out a second time.
const EMPHASIS_SHADE = "#223355";
const RETRY_LIMIT = 2500;
const SCALE = 1.5;
const EMPHASIS_AGAIN = "#223355";

export function pageBStyle(): string {
  const shade = EMPHASIS_SHADE;
  const delay = RETRY_LIMIT;
  return `${BANNER_BACKGROUND} ${shade} ${delay} ${SCALE} ${EMPHASIS_AGAIN}`;
}
