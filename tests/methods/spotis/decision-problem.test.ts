import { round4 } from "../../helpers/round-four-decimals";
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

  problem.alternatives = [...alternatives];
  problem.criteria = [...criteria];
  problem.matrix = matrix.map((row) => [...row]);
  problem.weights = [...weights];
  problem.types = [...types];
  problem.bounds = bounds.map((row) => [...row]);

  return problem;
}

describe("SpotisDecisionProblem", () => {
  test("calculates scores for independently specified criterion bounds", () => {
    const problem = createSpotisProblem();
    problem.bounds = [
      [0, 10],
      [0, 12],
      [800, 1600],
    ];
    expect(round4(problem.scores)).toEqual([0.3508, 0.27, 0.4025]);
  });

  test("assigns zero distance at the ideal and unit distance at the opposite bounds", () => {
    const problem = new SpotisDecisionProblem();
    problem.matrix = [
      [10, 2],
      [0, 8],
    ];
    problem.weights = [0.3, 0.7];
    problem.types = [CriterionType.BENEFIT, CriterionType.COST];
    problem.bounds = [
      [0, 10],
      [2, 8],
    ];
    expect(problem.isp).toEqual([10, 2]);
    expect(round4(problem.scores)).toEqual([0, 1]);
  });

  test("calculates scores", () => {
    const problem = createSpotisProblem();

    expect(round4(problem.scores)).toEqual([0.2532, 0.1777, 0.2936]);
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
