// Figure 2.1(c): the shade the whole site shares is specified once, here.
export const BANNER_BACKGROUND = "#4477aa";

export function bannerStyle(): string {
  const background = BANNER_BACKGROUND;
  return `background: ${background}`;
}

export function unusedBannerHelper(): string {
  const background = BANNER_BACKGROUND;
  return `padding: ${background}`;
}
