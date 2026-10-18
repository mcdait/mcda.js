import { round4 } from "../../helpers/round-four-decimals";
import { describe, expect, it } from "@jest/globals";
import { ArasDecisionProblem, CriterionType, sumNormalizationCallback } from "../../../src";
import { rank } from "../../../src/utils/ranking";

function createProblem(second = false): ArasDecisionProblem {
  const problem = new ArasDecisionProblem();
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
  problem.normalizationCallback = sumNormalizationCallback;
  return problem;
}

describe("ArasDecisionProblem", () => {
  it("calculates scores for three alternatives", () => {
    expect(round4(createProblem().scores)).toEqual([0.8348, 0.9138, 0.8079]);
  });
  it("calculates scores with four criteria and unequal weights", () => {
    expect(round4(createProblem(true).scores)).toEqual([0.8157, 0.6727, 0.7412, 0.6429]);
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
  it("adds the ideal before normalizing", () => {
    const problem = createProblem();
    problem.normalizationCallback = (matrix, types) => {
      expect(matrix[0]).toEqual([9, 9, 1000]);
      expect(matrix).toHaveLength(4);
      return sumNormalizationCallback(matrix, types);
    };
    expect(round4(problem.scores)).toEqual([0.8348, 0.9138, 0.8079]);
  });
});

it("ranks three alternatives using unrounded scores", () => {
  expect(rank(createProblem(false).scores, true)).toEqual([2, 1, 3]);
});

it("ranks alternatives with four criteria using unrounded scores", () => {
  expect(rank(createProblem(true).scores, true)).toEqual([1, 3, 2, 4]);
});

it("exposes the extended matrix and normalized ideal in debug", () => {
  const problem = createProblem();
  problem.enableDebug(true);
  problem.scores;
  expect(problem.debugBag?.ideal).toEqual([9, 9, 1000]);
  const normalized = problem.debugBag?.normalizedMatrix as number[][];
  expect(round4(normalized[0][0])).toBe(round4(9 / 33));
  expect(round4(normalized[0][1])).toBe(round4(9 / 31));
  expect(round4(normalized[0][2])).toBe(
    round4(1 / 1000 / (1 / 1000 + 1 / 1200 + 1 / 1000 + 1 / 1400)),
  );
});
