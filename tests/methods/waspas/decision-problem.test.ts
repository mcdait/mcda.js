import { round4 } from "../../helpers/round-four-decimals";
import { describe, expect, it } from "@jest/globals";
import { WaspasDecisionProblem } from "../../../src/methods/waspas";
import type { WaspasDebugResults } from "../../../src/methods/waspas";
import { CriterionType } from "../../../src/types";

function createWaspasProblem(): WaspasDecisionProblem {
  const problem = new WaspasDecisionProblem();

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

describe("WaspasDecisionProblem", () => {
  it("isolates normalization callback mutations", () => {
    const problem = new WaspasDecisionProblem();
    problem.matrix = [[1], [2]];
    problem.weights = [1];
    problem.types = [1];
    problem.normalizationCallback = (matrix, types) => {
      matrix[0][0] = 3;
      types[0] = -1;
      return [[0.5], [1]];
    };
    problem.scores;
    expect({ matrix: problem.matrix, types: problem.types }).toEqual({
      matrix: [[1], [2]],
      types: [1],
    });
  });

  it("calculates appraisal scores and ranks alternatives", () => {
    const problem = createWaspasProblem();
    const scores = problem.scores;
    const rankedAlternatives = problem.alternatives
      .map((alternative, index) => ({ alternative, score: scores[index] ?? 0 }))
      .sort((left, right) => right.score - left.score)
      .map(({ alternative }) => alternative);

    expect(round4(scores)).toEqual([0.8354, 0.9077, 0.8048]);
    expect(rankedAlternatives).toEqual(["Laptop B", "Laptop A", "Laptop C"]);
  });

  it("uses lambda to balance the weighted sum and weighted product models", () => {
    const problem = createWaspasProblem();
    problem.enableDebug(true);

    problem.lambda = 1;
    expect(round4(problem.scores)).toEqual([0.8361, 0.9111, 0.8119]);
    expect(problem.scores).toEqual((problem.debugBag as WaspasDebugResults).weightedSumScores);

    problem.lambda = 0;
    expect(round4(problem.scores)).toEqual([0.8347, 0.9044, 0.7977]);
    expect(problem.scores).toEqual((problem.debugBag as WaspasDebugResults).weightedProductScores);
  });

  describe("validations", () => {
    it("requires a normalization callback", () => {
      const problem = createWaspasProblem();
      problem.normalizationCallback = undefined;

      expect(() => problem.scores).toThrow(
        new Error("This WASPAS implementation requires a normalization callback."),
      );
    });

    it("requires lambda to be between 0 and 1", () => {
      const problem = createWaspasProblem();
      problem.lambda = 1.01;

      expect(() => problem.scores).toThrow(
        new Error("WASPAS parameter lambda must be between 0 and 1."),
      );
    });

    it("requires the normalized matrix to preserve its dimensions", () => {
      const problem = createWaspasProblem();
      problem.normalizationCallback = () => [[1, 1, 1]];

      expect(() => problem.scores).toThrow(
        new Error("WASPAS normalized matrix must contain one row per alternative."),
      );
    });

    it("rejects negative normalized values", () => {
      const problem = createWaspasProblem();
      problem.normalizationCallback = () => [
        [-1, 1, 1],
        [1, 1, 1],
        [1, 1, 1],
      ];

      expect(() => problem.scores).toThrow(
        new Error("WASPAS normalized matrix values must be non-negative and finite."),
      );
    });
  });

  it("optionally provides debug results", () => {
    const problem = createWaspasProblem();
    problem.enableDebug(true);

    const scores = problem.scores;
    const debugBag = problem.debugBag as WaspasDebugResults | undefined;

    expect(debugBag?.normalizedMatrix).toHaveLength(3);
    expect(debugBag?.weightedSumScores).toHaveLength(3);
    expect(debugBag?.weightedProductScores).toHaveLength(3);
    expect(debugBag?.appraisalScores).toEqual(scores);
  });
});
