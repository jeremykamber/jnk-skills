"use client";

import { BANNER_BACKGROUND, bannerStyle } from "./banner";

// Figure 2.1(c): the darker tone this page needs, written out by hand.
const EMPHASIS_SHADE = "#223355";
const RETRY_LIMIT = 2500;
const SCALE = 1.5;

export function pageAStyle(): string {
  const shade = EMPHASIS_SHADE;
  const delay = RETRY_LIMIT;
  return `${BANNER_BACKGROUND} ${shade} ${delay} ${SCALE} ${bannerStyle()}`;
}
