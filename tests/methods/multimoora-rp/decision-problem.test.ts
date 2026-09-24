import { describe, expect, it } from "@jest/globals";
import { CriterionType, MultimooraRpDecisionProblem } from "../../../src";
import { rank } from "../../../src/utils/ranking";

const rounded = (values: number[]) => values.map((x) => Math.round(x * 10000) / 10000);
function createProblem(second = false): MultimooraRpDecisionProblem {
  const problem = new MultimooraRpDecisionProblem();
  problem.matrix = second
    ? [
        [4, 9, 200, 3],
        [7, 6, 150, 8],
        [6, 8, 180, 5],
        [9, 5, 240, 7],
      ]
    : [
        [8, 7, 1200],
        [7, 9, 1000],
        [9, 6, 1400],
      ];
  problem.weights = second ? [0.25, 0.3, 0.2, 0.25] : [0.4, 0.35, 0.25];
  problem.types = second
    ? [CriterionType.BENEFIT, CriterionType.BENEFIT, CriterionType.COST, CriterionType.COST]
    : [CriterionType.BENEFIT, CriterionType.BENEFIT, CriterionType.COST];

  return problem;
}

describe("MultimooraRpDecisionProblem", () => {
  it("calculates scores for three alternatives", () => {
    expect(rounded(createProblem().scores)).toEqual([0.0543, 0.0574, 0.0815]);
  });
  it("calculates scores with four criteria and unequal weights", () => {
    expect(rounded(createProblem(true).scores)).toEqual([0.0927, 0.1031, 0.0556, 0.0836]);
  });
  it("supports matrixObj, recalculation and optional debug without mutating inputs", () => {
    const problem = createProblem();
    const original = problem.matrix.map((row) => [...row]);
    problem.matrixObj = {
      A: { performance: 8, battery: 7, price: 1200 },
      B: { performance: 7, battery: 9, price: 1000 },
      C: { performance: 9, battery: 6, price: 1400 },
    };
    const initial = problem.scores;
    expect(problem.debugBag).toBeUndefined();
    problem.enableDebug(true);
    expect(problem.scores).toEqual(initial);
    expect(problem.debugBag?.scores).toEqual(initial);
    expect(problem.matrix).toEqual(original);
    problem.weights = [0.2, 0.3, 0.5];
    const changed = problem.scores;
    const fresh = createProblem();
    fresh.weights = [...problem.weights];
    expect(changed).toEqual(fresh.scores);
    problem.enableDebug(false);
    problem.scores;
    expect(problem.debugBag).toBeUndefined();
  });
  it("rejects malformed matrices, non-finite data and invalid weights", () => {
    const problem = createProblem();
    problem.matrix = [];
    expect(() => problem.scores).toThrow();
    problem.matrix = [[1, 2]];
    expect(() => problem.scores).toThrow();
    problem.matrix = [[NaN, 2, 3]];
    expect(() => problem.scores).toThrow();
    problem.matrix = [[1, 2, 3]];
    problem.weights = [-1, 1, 1];
    expect(() => problem.scores).toThrow();
  });
});

it("ranks three alternatives using unrounded scores", () => {
  expect(rank(createProblem(false).scores, false)).toEqual([1, 2, 3]);
});

it("ranks alternatives with four criteria using unrounded scores", () => {
  expect(rank(createProblem(true).scores, false)).toEqual([3, 4, 1, 2]);
});
