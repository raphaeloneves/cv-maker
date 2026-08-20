import { describe, expect, it } from "vitest";
import type { CvOptimizerObjection, CvOptimizerObjectionStatus } from "./cv-optimizer.js";
import { computeObjectionsScorePercent, isVerdictConsistentWithObjections } from "./cv-optimizer.js";

/** Six-objection fixtures only ever care about the `status` distribution —
 * the other fields are irrelevant to score/verdict math, so this fills them
 * with placeholders rather than making every test spell out a full
 * objection object. */
function objections(statuses: CvOptimizerObjectionStatus[]): CvOptimizerObjection[] {
  return statuses.map((status, i) => ({
    key: "wasting_time",
    status,
    summary: `objection ${i}`,
    analysis: "",
    examples: [],
    actionItems: [],
  }));
}

describe("computeObjectionsScorePercent", () => {
  it("scores a clean sweep at 100", () => {
    expect(computeObjectionsScorePercent(objections(["pass", "pass", "pass", "pass", "pass", "pass"]))).toBe(100);
  });

  it("scores the one partial the panel's bar still tolerates at 85, not a middling average", () => {
    expect(computeObjectionsScorePercent(objections(["pass", "pass", "pass", "pass", "pass", "partial"]))).toBe(85);
  });

  it("keeps a real-world case from this app's own bug report — four passes and two partials, zero rejects — strictly below the pass band, not the naive 83 a plain average would produce", () => {
    const score = computeObjectionsScorePercent(
      objections(["pass", "pass", "partial", "pass", "partial", "pass"]),
    );
    expect(score).toBeLessThan(85);
    expect(score).toBe(65);
  });

  it("drops further as partials pile up, but never below the reject band's ceiling", () => {
    const threePartials = computeObjectionsScorePercent(objections(["pass", "pass", "pass", "partial", "partial", "partial"]));
    const fourPartials = computeObjectionsScorePercent(objections(["pass", "pass", "partial", "partial", "partial", "partial"]));
    expect(threePartials).toBeLessThan(65);
    expect(fourPartials).toBeLessThan(threePartials);
  });

  it("caps a CV with any outright reject well below the pass-eligible partial-only band", () => {
    const oneReject = computeObjectionsScorePercent(objections(["pass", "pass", "pass", "pass", "pass", "reject"]));
    const twoPartialsNoReject = computeObjectionsScorePercent(
      objections(["pass", "pass", "partial", "pass", "partial", "pass"]),
    );
    expect(oneReject).toBeLessThan(twoPartialsNoReject);
  });

  it("scores worse as rejects pile up, floored at 0", () => {
    const oneReject = computeObjectionsScorePercent(objections(["pass", "pass", "pass", "pass", "pass", "reject"]));
    const allRejects = computeObjectionsScorePercent(objections(["reject", "reject", "reject", "reject", "reject", "reject"]));
    expect(allRejects).toBeLessThan(oneReject);
    expect(allRejects).toBe(0);
  });

  it("never produces a number in the gap between the fail band's ceiling and the pass band's floor", () => {
    // Every reachable combination of six pass/partial/reject statuses.
    const statuses: CvOptimizerObjectionStatus[] = ["pass", "partial", "reject"];
    for (let mask = 0; mask < 3 ** 6; mask++) {
      const combo: CvOptimizerObjectionStatus[] = [];
      let m = mask;
      for (let i = 0; i < 6; i++) {
        // m % 3 is always 0, 1, or 2 — a valid index into the 3-element array.
        combo.push(statuses[m % 3] as CvOptimizerObjectionStatus);
        m = Math.floor(m / 3);
      }
      const score = computeObjectionsScorePercent(objections(combo));
      expect(score <= 65 || score >= 85).toBe(true);
    }
  });

  it("weighs an outright reject as strictly worse than the arithmetic mean alone would, not just the 50-point gap pass/partial/reject points already give it", () => {
    // Both combos below share the exact same raw mean (four passes' worth of
    // points out of six) — a plain average can't tell them apart. The panel
    // weight (the extra per-reject penalty) is what has to.
    const oneReject = computeObjectionsScorePercent(objections(["pass", "pass", "pass", "pass", "pass", "reject"]));
    const twoPartialsNoReject = computeObjectionsScorePercent(
      objections(["pass", "pass", "partial", "pass", "partial", "pass"]),
    );
    expect(oneReject).toBe(49);
    expect(twoPartialsNoReject).toBe(65);
  });

  it("spreads the fail band across far more than a handful of round multiples of 5 or 10", () => {
    // The old per-count lookup table could only ever land on {0, 5, 10, ...,
    // 65} — ten values, every one a multiple of 5. The arithmetic-mean-based
    // formula should do meaningfully better than that on both counts.
    const statuses: CvOptimizerObjectionStatus[] = ["pass", "partial", "reject"];
    const failScores = new Set<number>();
    for (let mask = 0; mask < 3 ** 6; mask++) {
      const combo: CvOptimizerObjectionStatus[] = [];
      let m = mask;
      for (let i = 0; i < 6; i++) {
        combo.push(statuses[m % 3] as CvOptimizerObjectionStatus);
        m = Math.floor(m / 3);
      }
      const objs = objections(combo);
      if (isVerdictConsistentWithObjections("reject", objs)) {
        failScores.add(computeObjectionsScorePercent(objs));
      }
    }
    expect(failScores.size).toBeGreaterThan(10);
    const nonMultiplesOf5 = [...failScores].filter((score) => score % 5 !== 0);
    expect(nonMultiplesOf5.length).toBeGreaterThan(0);
  });
});

describe("isVerdictConsistentWithObjections", () => {
  it("agrees with reject when two objections are only partial, even with no outright reject", () => {
    const objs = objections(["pass", "pass", "partial", "pass", "partial", "pass"]);
    expect(isVerdictConsistentWithObjections("reject", objs)).toBe(true);
    expect(isVerdictConsistentWithObjections("pass", objs)).toBe(false);
  });

  it("agrees with pass for a clean sweep or a single partial", () => {
    const cleanSweep = objections(["pass", "pass", "pass", "pass", "pass", "pass"]);
    const onePartial = objections(["pass", "pass", "pass", "pass", "pass", "partial"]);
    expect(isVerdictConsistentWithObjections("pass", cleanSweep)).toBe(true);
    expect(isVerdictConsistentWithObjections("pass", onePartial)).toBe(true);
  });

  it("agrees with reject whenever any objection is an outright reject", () => {
    const objs = objections(["pass", "pass", "pass", "pass", "pass", "reject"]);
    expect(isVerdictConsistentWithObjections("reject", objs)).toBe(true);
    expect(isVerdictConsistentWithObjections("pass", objs)).toBe(false);
  });
});
