import { describe, expect, it } from "@jest/globals";
import { CriterionType } from "../../../src/types";
import type { DecisionMatrix } from "../../../src/types";
import { vectorNormalizationCallback } from "../../../src/utils/normalization";
import { VikorDecisionProblem } from "../../../src/methods/vikor";

const matrix: DecisionMatrix = [
  [8, 7, 1200],
  [7, 9, 1000],
  [9, 6, 1400],
];
const alternatives = ["Laptop A", "Laptop B", "Laptop C"];
const criteria = ["Performance", "Battery", "Price"];
const weights = [0.4, 0.35, 0.25];
const types = [CriterionType.BENEFIT, CriterionType.BENEFIT, CriterionType.COST];

function createVikorProblem(): VikorDecisionProblem {
  const problem = new VikorDecisionProblem();

  problem.alternatives = alternatives;
  problem.criteria = criteria;
  problem.matrix = matrix;
  problem.weights = weights;
  problem.types = types;
  problem.normalizationCallback = vectorNormalizationCallback;

  return problem;
}

describe("VikorDecisionProblem", () => {
  it("calculates scores", () => {
    const problem = createVikorProblem();

    const roundedScores = problem.scores.map((s) => Math.round(s * 10000) / 10000);
    expect(roundedScores).toEqual([0.3958, 0.5, 0.85]);
  });

  describe("validations", () => {
    it("requires normalization callback", () => {
      const problem = createVikorProblem();

      problem.normalizationCallback = undefined;

      expect(() => problem.scores).toThrow(
        "This VIKOR implementation requires a normalization callback.",
      );
    });

    it("throws when v < 0", () => {
      const problem = createVikorProblem();

      problem.v = -0.1;

      expect(() => problem.scores).toThrow("VIKOR parameter v must be between 0 and 1.");
    });

    it("throws when v > 1", () => {
      const problem = createVikorProblem();

      problem.v = 1.1;

      expect(() => problem.scores).toThrow("VIKOR parameter v must be between 0 and 1.");
    });

    it("accepts when v = 0", () => {
      const problem = createVikorProblem();

      problem.v = 0;

      expect(() => problem.scores).not.toThrow();
    });

    it("accepts when v = 1", () => {
      const problem = createVikorProblem();

      problem.v = 1;

      expect(() => problem.scores).not.toThrow();
    });
  });

  it("optionally provides debug", () => {
    const problem = createVikorProblem();

    problem.enableDebug(true);

    problem.scores;
    const debugBag = problem.debugBag;
    expect(debugBag).not.toBeUndefined();
  });
});
