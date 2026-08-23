// Mirrors --danger / --orange / --success in tokens.css — hardcoded here
// since interpolating a color gradient needs actual RGB triples, not CSS
// custom-property strings. Red at the bottom, the brand's own orange as the
// natural midpoint, green at the top: low score reads as risk, high score
// reads as a real pass, and the accent color it lands on at 50 is still the
// same orange used everywhere else in the app, not an arbitrary new hue.
// Shared by every place a score is rendered (currently just ScoreBar) so the
// same score always renders the same color no matter where it's shown.
const COLOR_STOPS: Array<{ at: number; rgb: [number, number, number] }> = [
  { at: 0, rgb: [194, 59, 59] }, // --danger
  { at: 50, rgb: [232, 100, 12] }, // --orange
  { at: 100, rgb: [31, 138, 95] }, // --success
];

export function scoreColor(score: number): string {
  const clamped = Math.max(0, Math.min(100, score));
  let lower = COLOR_STOPS[0];
  let upper = COLOR_STOPS[COLOR_STOPS.length - 1];
  for (let i = 0; i < COLOR_STOPS.length - 1; i++) {
    if (clamped >= COLOR_STOPS[i].at && clamped <= COLOR_STOPS[i + 1].at) {
      lower = COLOR_STOPS[i];
      upper = COLOR_STOPS[i + 1];
      break;
    }
  }
  const span = upper.at - lower.at || 1;
  const t = (clamped - lower.at) / span;
  const [r, g, b] = lower.rgb.map((channel, i) => Math.round(channel + (upper.rgb[i] - channel) * t));
  return `rgb(${r}, ${g}, ${b})`;
}
