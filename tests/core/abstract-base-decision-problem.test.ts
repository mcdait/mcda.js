import { describe, expect, it } from "@jest/globals";
import {
  AbstractBaseDecisionProblem,
  AbstractDecisionProblem,
  AhpDecisionProblem,
  SawDecisionProblem,
  sumNormalizationCallback,
} from "../../src";

describe("AbstractBaseDecisionProblem", () => {
  function problems(): AbstractBaseDecisionProblem[] {
    const ahp = new AhpDecisionProblem();
    ahp.matrix = [
      [
        [1, 3],
        [1 / 3, 1],
      ],
    ];
    const saw = new SawDecisionProblem();
    saw.matrix = [[3], [1]];
    saw.types = [1];
    saw.normalizationCallback = sumNormalizationCallback;
    return [ahp, saw];
  }

  it("shares names, weights and scores across different matrix formats", () => {
    for (const problem of problems()) {
      expect(problem).toBeInstanceOf(AbstractBaseDecisionProblem);
      problem.weights = [1];
      problem.alternatives = ["A", "B"];
      problem.criteria = ["Quality"];
      expect(problem.weights).toEqual([1]);
      expect(problem.alternatives).toEqual(["A", "B"]);
      expect(problem.criteria).toEqual(["Quality"]);
      expect(problem.scores).toEqual([0.75, 0.25]);
    }
    expect(new SawDecisionProblem()).toBeInstanceOf(AbstractDecisionProblem);
    expect(new AhpDecisionProblem()).not.toBeInstanceOf(AbstractDecisionProblem);
  });

  it("shares the debug lifecycle without changing scores", () => {
    for (const problem of problems()) {
      problem.weights = [1];
      const scores = problem.scores;
      problem.addToDebugBag("note", "ignored");
      expect(problem.debugBag).toBeUndefined();
      problem.enableDebug(true);
      problem.addToDebugBag("note", "recorded");
      expect(problem.scores).toEqual(scores);
      expect(problem.debugBag?.note).toBe("recorded");
      problem.enableDebug(false);
      expect(problem.scores).toEqual(scores);
      expect(problem.debugBag).toBeUndefined();
      problem.enableDebug(true);
      expect(problem.debugBag).toEqual({});
    }
  });
});
