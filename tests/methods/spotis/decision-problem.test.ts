import { describe, expect, it, test } from "@jest/globals";
import type { DecisionMatrix } from "../../../src/types";
import { CriterionType } from "../../../src/types";
import { SpotisDecisionProblem } from "../../../src";

const matrix: DecisionMatrix = [
  [8, 7, 1200],
  [7, 9, 1000],
  [9, 6, 1400],
];
const alternatives = ["Laptop A", "Laptop B", "Laptop C"];
const criteria = ["Performance", "Battery", "Price"];
const weights = [0.4, 0.35, 0.25];
const types = [CriterionType.BENEFIT, CriterionType.BENEFIT, CriterionType.COST];
const bounds = [
  [0, 10],
  [0, 10],
  [900, 2000],
];

function createSpotisProblem(): SpotisDecisionProblem {
  const problem = new SpotisDecisionProblem();

  problem.alternatives = alternatives;
  problem.criteria = criteria;
  problem.matrix = matrix;
  problem.weights = weights;
  problem.types = types;
  problem.bounds = bounds;

  return problem;
}

describe("SpotisDecisionProblem", () => {
  test("calculates scores", () => {
    const problem = createSpotisProblem();
    const roundedScores = problem.scores.map((s) => Math.round(s * 10000) / 10000);

    expect(roundedScores).toEqual([0.2532, 0.1777, 0.2936]);
  });

  describe("validations", () => {
    it("requires bounds", () => {
      const problem = createSpotisProblem();

      problem.bounds = [];

      expect(() => problem.scores).toThrow(
        "The number of bounds (0) must match the number of criteria (3).",
      );
    });
  });

  it("optionally provides debug", () => {
    const problem = createSpotisProblem();

    problem.enableDebug(true);

    problem.scores;
    const debugBag = problem.debugBag;
    expect(debugBag).not.toBeUndefined();
  });
});
