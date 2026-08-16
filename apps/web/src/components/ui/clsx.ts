/** Tiny classnames joiner — avoids pulling in the `clsx` package for
 * something this small. Falsy values are dropped. */
export function clsx(...parts: Array<string | false | null | undefined>): string {
  return parts.filter(Boolean).join(" ");
}
