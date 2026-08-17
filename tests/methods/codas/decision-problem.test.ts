import { describe, expect, it } from "@jest/globals";
import { CodasDecisionProblem } from "../../../src/methods/codas";
import type { CodasDebugResults } from "../../../src/methods/codas";
import { CriterionType } from "../../../src/types";

function createCodasProblem(): CodasDecisionProblem {
  const problem = new CodasDecisionProblem();

  problem.alternatives = ["Laptop A", "Laptop B", "Laptop C"];
  problem.criteria = ["Performance", "Battery", "Price"];
  problem.matrix = [
    [8, 7, 1200],
    [7, 9, 1000],
    [9, 6, 1400],
  ];
  problem.weights = [0.4, 0.35, 0.25];
  problem.types = [CriterionType.BENEFIT, CriterionType.BENEFIT, CriterionType.COST];
  problem.normalizationCallback = () => [
    [8 / 9, 7 / 9, 1000 / 1200],
    [7 / 9, 1, 1],
    [1, 6 / 9, 1000 / 1400],
  ];

  return problem;
}

describe("CodasDecisionProblem", () => {
  it("ranks alternatives by their distance from the negative ideal solution", () => {
    const problem = createCodasProblem();
    const scores = problem.scores;
    const roundedScores = scores.map((score) => Math.round(score * 10000) / 10000);
    const rankedAlternatives = problem.alternatives
      .map((alternative, index) => ({ alternative, score: scores[index] ?? 0 }))
      .sort((left, right) => right.score - left.score)
      .map(({ alternative }) => alternative);

    expect(roundedScores).toEqual([-0.1442, 0.2928, -0.1486]);
    expect(rankedAlternatives).toEqual(["Laptop B", "Laptop A", "Laptop C"]);
  });

  it("uses taxicab distance only when the Euclidean difference reaches tau", () => {
    const problem = new CodasDecisionProblem();
    problem.matrix = [[1], [0.98]];
    problem.weights = [1];
    problem.types = [CriterionType.BENEFIT];
    problem.normalizationCallback = () => [[0.5], [0.49]];

    const scoresWithoutTaxicabDistance = problem.scores.map(
      (score) => Math.round(score * 10000) / 10000,
    );
    expect(scoresWithoutTaxicabDistance).toEqual([0.01, -0.01]);

    problem.tau = 0.005;

    const scoresWithTaxicabDistance = problem.scores.map(
      (score) => Math.round(score * 10000) / 10000,
    );
    expect(scoresWithTaxicabDistance).toEqual([0.02, -0.02]);
  });

  describe("validations", () => {
    it("requires a normalization callback", () => {
      const problem = createCodasProblem();
      problem.normalizationCallback = undefined;

      expect(() => problem.scores).toThrow(
        "This CODAS implementation requires a normalization callback.",
      );
    });

    it("requires a non-negative finite tau", () => {
      const problem = createCodasProblem();
      problem.tau = -0.01;

      expect(() => problem.scores).toThrow(
        "CODAS threshold tau must be a non-negative finite number.",
      );
    });

    it("requires the normalized matrix to preserve its dimensions", () => {
      const problem = createCodasProblem();
      problem.normalizationCallback = () => [[1, 1, 1]];

      expect(() => problem.scores).toThrow(
        "CODAS normalized matrix must contain one row per alternative.",
      );
    });
  });

  it("optionally provides debug results", () => {
    const problem = createCodasProblem();
    problem.enableDebug(true);

    const scores = problem.scores;
    const debugBag = problem.debugBag as CodasDebugResults | undefined;

    expect(debugBag?.negativeIdealSolution).toHaveLength(3);
    expect(debugBag?.euclideanDistances).toHaveLength(3);
    expect(debugBag?.taxicabDistances).toHaveLength(3);
    expect(debugBag?.relativeAssessmentMatrix).toHaveLength(3);
    expect(debugBag?.assessmentScores).toEqual(scores);
  });
});
