import { round4 } from "../../helpers/round-four-decimals";
import { describe, expect, it } from "@jest/globals";
import { CocosoDecisionProblem, CriterionType, minMaxNormalizationCallback } from "../../../src";
import { rank } from "../../../src/utils/ranking";

function createProblem(second = false): CocosoDecisionProblem {
  const problem = new CocosoDecisionProblem();
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
  problem.normalizationCallback = minMaxNormalizationCallback;
  return problem;
}

describe("CocosoDecisionProblem", () => {
  it("calculates scores for three alternatives", () => {
    expect(round4(createProblem().scores)).toEqual([2.6677, 2.6658, 1.4854]);
  });
  it("calculates scores with four criteria and unequal weights", () => {
    expect(round4(createProblem(true).scores)).toEqual([2.6162, 2.0877, 2.9233, 1.4068]);
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
  it.each([
    {
      label: "empty matrix",
      matrix: [],
      weights: [0.4, 0.35, 0.25],
      error: /at least one alternative/,
    },
    { label: "ragged row", matrix: [[1, 2]], weights: [0.4, 0.35, 0.25], error: /rows must match/ },
    { label: "NaN value", matrix: [[NaN, 2, 3]], weights: [0.4, 0.35, 0.25], error: /finite/ },
    {
      label: "negative weight",
      matrix: [[1, 2, 3]],
      weights: [-1, 1, 1],
      error: /Weights must be non-negative/,
    },
  ])("rejects $label", ({ matrix, weights, error }) => {
    const problem = createProblem();
    problem.matrix = matrix.map((row) => [...row]);
    problem.weights = [...weights];
    expect(() => problem.scores).toThrow(error);
  });
  it("requires a normalization callback", () => {
    const problem = createProblem();
    problem.normalizationCallback = undefined;
    expect(() => problem.scores).toThrow(/normalization callback/);
  });
  it.each([
    { label: "missing rows", callback: () => [[1]], error: /dimensions/ },
    {
      label: "non-finite values",
      callback: (matrix: number[][]) => matrix.map((row) => row.map(() => Infinity)),
      error: /finite/,
    },
  ])("rejects normalization with $label", ({ callback, error }) => {
    const problem = createProblem();
    problem.normalizationCallback = callback;
    expect(() => problem.scores).toThrow(error);
  });
  it("calculates scores with lambda set to zero", () => {
    const problem = createProblem();
    problem.lambda = 0;
    expect(round4(problem.scores)).toEqual([2.7068, 2.6471, 1.4498]);
  });
  it("calculates scores with lambda set to 0.25", () => {
    const problem = createProblem();
    problem.lambda = 0.25;
    expect(round4(problem.scores)).toEqual([2.6918, 2.6544, 1.4638]);
  });
  it("calculates scores with lambda set to one", () => {
    const problem = createProblem();
    problem.lambda = 1;
    expect(round4(problem.scores)).toEqual([2.511, 2.7352, 1.6108]);
  });
  it.each([-0.1, 1.1, NaN, Infinity])("rejects lambda=%s", (value) => {
    const problem = createProblem();
    problem.lambda = value;
    expect(() => problem.scores).toThrow(/lambda/);
  });
});

it("ranks three alternatives using unrounded scores", () => {
  expect(rank(createProblem(false).scores, true)).toEqual([1, 2, 3]);
});

it("ranks alternatives with four criteria using unrounded scores", () => {
  expect(rank(createProblem(true).scores, true)).toEqual([2, 3, 1, 4]);
});
