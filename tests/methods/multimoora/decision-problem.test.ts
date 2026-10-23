import { describe, expect, it } from "@jest/globals";
import {
  copeland,
  CriterionType,
  improvedBorda,
  MultimooraDecisionProblem,
  rankPosition,
} from "../../../src";

function createProblem(second = false): MultimooraDecisionProblem {
  const problem = new MultimooraDecisionProblem();
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

describe("MultimooraDecisionProblem", () => {
  it("calculates scores for three alternatives", () => {
    expect(createProblem().scores).toEqual([2, 1, 3]);
  });
  it("calculates scores with four criteria and unequal weights", () => {
    expect(createProblem(true).scores).toEqual([1, 2, 1, 2]);
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
    expect(problem.debugBag?.ranks).toEqual(initial);
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
  it.each([
    {
      label: "empty matrix",
      matrix: [],
      weights: [0.4, 0.35, 0.25],
      error: "Decision problem requires at least one alternative.",
    },
    {
      label: "ragged row",
      matrix: [[1, 2]],
      weights: [0.4, 0.35, 0.25],
      error: "Decision problem matrix rows must match the weights length.",
    },
    {
      label: "NaN value",
      matrix: [[NaN, 2, 3]],
      weights: [0.4, 0.35, 0.25],
      error: "Matrix row must contain 3 finite values.",
    },
    {
      label: "negative weight",
      matrix: [[1, 2, 3]],
      weights: [-1, 1, 1],
      error: "Weights must be non-negative with a positive sum.",
    },
  ])("rejects $label", ({ matrix, weights, error }) => {
    const problem = createProblem();
    problem.matrix = matrix.map((row) => [...row]);
    problem.weights = [...weights];
    expect(() => problem.scores).toThrow(new Error(error));
  });
  it("combines component rankings using the Copeland method", () => {
    const problem = createProblem(true);
    problem.compromiseRankingCallback = copeland;
    expect(problem.ranks).toEqual([1, 2, 1, 2]);
  });
  it("combines component rankings using the rank position method", () => {
    const problem = createProblem(true);
    problem.compromiseRankingCallback = rankPosition;
    expect(problem.ranks).toEqual([1, 4, 2, 3]);
  });
  it("combines component rankings using the improved Borda rule", () => {
    const problem = createProblem(true);
    problem.compromiseRankingCallback = improvedBorda;
    expect(problem.ranks).toEqual([1, 4, 2, 3]);
  });
  it("ranks two alternatives using all three components", () => {
    const problem = createProblem();
    problem.matrix = [
      [1, 1, 10],
      [2, 2, 5],
    ];
    expect(problem.ranks).toEqual([2, 1]);
  });
  it("rejects invalid compromise callback output", () => {
    const problem = createProblem();
    problem.compromiseRankingCallback = () => [0, 0, 0];
    expect(() => problem.scores).toThrow(new Error("Compromise callback must return valid ranks."));
  });
});

it("ranks three alternatives using unrounded scores", () => {
  expect(createProblem(false).scores).toEqual([2, 1, 3]);
});

it("ranks alternatives with four criteria using unrounded scores", () => {
  expect(createProblem(true).scores).toEqual([1, 2, 1, 2]);
});
