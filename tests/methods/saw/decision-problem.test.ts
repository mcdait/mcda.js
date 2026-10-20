import { round4 } from "../../helpers/round-four-decimals";
import { describe, expect, it } from "@jest/globals";
import { SawDecisionProblem } from "../../../src/methods/saw";
import type { SawDebugResults } from "../../../src/methods/saw";
import { CriterionType } from "../../../src/types";
import { sumNormalizationCallback, vectorNormalizationCallback } from "../../../src/utils";

function createSawProblem(): SawDecisionProblem {
  const problem = new SawDecisionProblem();

  problem.alternatives = ["Laptop A", "Laptop B", "Laptop C"];
  problem.criteria = ["Performance", "Battery", "Price"];
  problem.matrix = [
    [8, 7, 1200],
    [7, 9, 1000],
    [9, 6, 1400],
  ];
  problem.weights = [0.4, 0.35, 0.25];
  problem.types = [CriterionType.BENEFIT, CriterionType.BENEFIT, CriterionType.COST];
  problem.normalizationCallback = sumNormalizationCallback;

  return problem;
}

describe("SawDecisionProblem", () => {
  it("SAW rejects NaN weights before calculating scores", () => {
    const problem = new SawDecisionProblem();
    problem.matrix = [[1], [2]];
    problem.weights = [NaN];
    problem.types = [1];
    problem.normalizationCallback = vectorNormalizationCallback;
    expect(() => problem.scores).toThrow(new Error("Weights must contain 1 finite values."));
  });

  it.each([
    { label: "infinite", weights: [Infinity], error: "Weights must contain 1 finite values." },
    {
      label: "negative",
      weights: [-1],
      error: "Weights must be non-negative with a positive sum.",
    },
    { label: "all zero", weights: [0], error: "Weights must be non-negative with a positive sum." },
  ])("SAW rejects $label weights", ({ weights, error }) => {
    const problem = new SawDecisionProblem();
    problem.matrix = [[1], [2]];
    problem.weights = weights;
    problem.types = [1];
    problem.normalizationCallback = vectorNormalizationCallback;
    expect(() => problem.scores).toThrow(new Error(error));
  });

  it("isolates normalization callback mutations", () => {
    const problem = new SawDecisionProblem();
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

  it("calculates preference scores and ranks alternatives", () => {
    const problem = createSawProblem();
    const scores = problem.scores;
    const rankedAlternatives = problem.alternatives
      .map((alternative, index) => ({ alternative, score: scores[index] ?? 0 }))
      .sort((left, right) => right.score - left.score)
      .map(({ alternative }) => alternative);

    expect(round4(scores)).toEqual([0.3265, 0.358, 0.3155]);
    expect(rankedAlternatives).toEqual(["Laptop B", "Laptop A", "Laptop C"]);
  });

  describe("validations", () => {
    it("requires a normalization callback", () => {
      const problem = createSawProblem();
      problem.normalizationCallback = undefined;

      expect(() => problem.scores).toThrow(
        new Error("This SAW implementation requires a normalization callback."),
      );
    });

    it("requires the normalized matrix to preserve the alternative count", () => {
      const problem = createSawProblem();
      problem.normalizationCallback = () => [[1, 1, 1]];

      expect(() => problem.scores).toThrow(
        new Error("SAW normalized matrix must contain one row per alternative."),
      );
    });

    it("requires normalized rows to preserve the criteria count", () => {
      const problem = createSawProblem();
      problem.normalizationCallback = () => [[], [], []];

      expect(() => problem.scores).toThrow(
        new Error("SAW normalized matrix rows must match the weights length."),
      );
    });

    it("rejects non-finite normalized values", () => {
      const problem = createSawProblem();
      problem.normalizationCallback = () => [
        [Number.NaN, 1, 1],
        [1, 1, 1],
        [1, 1, 1],
      ];

      expect(() => problem.scores).toThrow(
        new Error("SAW normalized matrix values must be finite."),
      );
    });
  });

  it("optionally provides debug results", () => {
    const problem = createSawProblem();
    problem.enableDebug(true);

    const scores = problem.scores;
    const debugBag = problem.debugBag as SawDebugResults | undefined;

    expect(debugBag?.normalizedMatrix).toHaveLength(3);
    expect(debugBag?.weightedNormalizedMatrix).toHaveLength(3);
    expect(debugBag?.preferenceScores).toEqual(scores);
  });
});
