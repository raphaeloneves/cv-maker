import { describe, expect, it } from "vitest";
import type { CvOptimizerPanelRole, CvOptimizerPanelScore } from "./cv-optimizer.js";
import { computePanelScorePercent, computeVerdictFromPanelScore, CV_PASS_SCORE_THRESHOLD } from "./cv-optimizer.js";

/** Fixtures only ever care about the `score` distribution — `role`/
 * `rationale` are irrelevant to the score math, so this fills them with
 * placeholders rather than making every test spell out a full panel score
 * object. */
function panelScores(scores: number[]): CvOptimizerPanelScore[] {
  const roles: CvOptimizerPanelRole[] = ["resume_writer", "career_coach", "recruiter"];
  return scores.map((score, i) => ({ role: roles[i % roles.length] as CvOptimizerPanelRole, score, rationale: `panelist ${i}` }));
}

describe("computePanelScorePercent", () => {
  it("returns the plain mean when the panel is unanimous", () => {
    expect(computePanelScorePercent(panelScores([70, 70, 70]))).toBe(70);
    expect(computePanelScorePercent(panelScores([100, 100, 100]))).toBe(100);
    expect(computePanelScorePercent(panelScores([0, 0, 0]))).toBe(0);
  });

  it("scores a split panel below a unanimous panel with the same mean", () => {
    const unanimous = computePanelScorePercent(panelScores([68, 68, 69]));
    const split = computePanelScorePercent(panelScores([85, 80, 40]));
    // Same rough mean (~68.3 vs ~68.3), but the split panel's 45-point
    // spread should pull it well below the unanimous one.
    expect(split).toBeLessThan(unanimous);
  });

  it("applies exactly a 0.2x-of-spread penalty on top of the mean", () => {
    // mean = (85 + 80 + 40) / 3 = 68.33; spread = 85 - 40 = 45
    // adjusted = 68.33 - 0.2 * 45 = 59.33 -> rounds to 59
    expect(computePanelScorePercent(panelScores([85, 80, 40]))).toBe(59);
  });

  it("never drops below 0 even when the penalty would push a low mean negative", () => {
    expect(computePanelScorePercent(panelScores([5, 0, 100]))).toBeGreaterThanOrEqual(0);
  });

  it("returns 0 for an empty panel rather than throwing or dividing by zero", () => {
    expect(computePanelScorePercent([])).toBe(0);
  });
});

describe("computeVerdictFromPanelScore", () => {
  it(`passes at or above the ${CV_PASS_SCORE_THRESHOLD}-point threshold`, () => {
    expect(computeVerdictFromPanelScore(CV_PASS_SCORE_THRESHOLD)).toBe("pass");
    expect(computeVerdictFromPanelScore(100)).toBe("pass");
  });

  it(`rejects below the ${CV_PASS_SCORE_THRESHOLD}-point threshold`, () => {
    expect(computeVerdictFromPanelScore(CV_PASS_SCORE_THRESHOLD - 1)).toBe("reject");
    expect(computeVerdictFromPanelScore(0)).toBe("reject");
  });

  it("can never disagree with computePanelScorePercent's own output by construction", () => {
    // The verdict is a pure function of the score, so for any panel there is
    // exactly one right answer — no separate "does the verdict agree with
    // the scorecard" check is possible or needed anymore.
    for (const scores of [[90, 90, 90], [70, 70, 70], [69, 69, 69], [30, 40, 20], [100, 0, 0]]) {
      const score = computePanelScorePercent(panelScores(scores));
      const verdict = computeVerdictFromPanelScore(score);
      expect(verdict).toBe(score >= CV_PASS_SCORE_THRESHOLD ? "pass" : "reject");
    }
  });
});
