import { describe, expect, it } from "@jest/globals";
import { ArasDecisionProblem, CriterionType, sumNormalizationCallback } from "../../../src";
import { rank } from "../../../src/utils/ranking";

// Expected values from konkurencja/python/pyrepo_mcda_check-aras.py (pyrepo_mcda 0.1.8).
const rounded = (values: number[]) => values.map((x) => Math.round(x * 10000) / 10000);
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
  it("matches the Python example to four decimal places", () => {
    expect(rounded(createProblem().scores)).toEqual([0.8348, 0.9138, 0.8079]);
  });
  it("matches the four-criterion Python example", () => {
    expect(rounded(createProblem(true).scores)).toEqual([0.8157, 0.6727, 0.7412, 0.6429]);
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
  it("requires a callback and rejects malformed callback results", () => {
    const problem = createProblem();
    problem.normalizationCallback = undefined;
    expect(() => problem.scores).toThrow(/normalization callback/);
    problem.normalizationCallback = () => [[1]];
    expect(() => problem.scores).toThrow();
    problem.normalizationCallback = (matrix) => matrix.map((row) => row.map(() => Infinity));
    expect(() => problem.scores).toThrow();
  });
  it("adds the ideal before normalizing", () => {
    const problem = createProblem();
    problem.normalizationCallback = (matrix, types) => {
      expect(matrix[0]).toEqual([9, 9, 1000]);
      expect(matrix).toHaveLength(4);
      return sumNormalizationCallback(matrix, types);
    };
    expect(rounded(problem.scores)).toEqual([0.8348, 0.9138, 0.8079]);
  });
});

it("aras default ranking matches the unrounded Python preferences", () => {
  expect(rank(createProblem(false).scores, true)).toEqual([2, 1, 3]);
});

it("aras second ranking matches the unrounded Python preferences", () => {
  expect(rank(createProblem(true).scores, true)).toEqual([1, 3, 2, 4]);
});

it("exposes the extended matrix and normalized ideal in debug", () => {
  const problem = createProblem();
  problem.enableDebug(true);
  problem.scores;
  expect(problem.debugBag?.ideal).toEqual([9, 9, 1000]);
  const normalized = problem.debugBag?.normalizedMatrix as number[][];
  expect(normalized[0][0]).toBeCloseTo(9 / 33, 12);
  expect(normalized[0][1]).toBeCloseTo(9 / 31, 12);
  expect(normalized[0][2]).toBeCloseTo(1 / 1000 / (1 / 1000 + 1 / 1200 + 1 / 1000 + 1 / 1400), 12);
});
