import { describe, expect, it } from "@jest/globals";
import { CocosoDecisionProblem, CriterionType, minMaxNormalizationCallback } from "../../../src";
import { rank } from "../../../src/utils/ranking";

// Expected values from konkurencja/python/pyrepo_mcda_check-cocoso.py (pyrepo_mcda 0.1.8).
const rounded = (values: number[]) => values.map((x) => Math.round(x * 10000) / 10000);
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
  it("matches the Python example to four decimal places", () => {
    expect(rounded(createProblem().scores)).toEqual([2.6677, 2.6658, 1.4854]);
  });
  it("matches the four-criterion Python example", () => {
    expect(rounded(createProblem(true).scores)).toEqual([2.6162, 2.0877, 2.9233, 1.4068]);
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
  it("matches Python with lambda=0", () => {
    const problem = createProblem();
    problem.lambda = 0;
    expect(rounded(problem.scores)).toEqual([2.7068, 2.6471, 1.4498]);
  });
  it("matches Python with lambda=0.25", () => {
    const problem = createProblem();
    problem.lambda = 0.25;
    expect(rounded(problem.scores)).toEqual([2.6918, 2.6544, 1.4638]);
  });
  it("matches Python with lambda=1", () => {
    const problem = createProblem();
    problem.lambda = 1;
    expect(rounded(problem.scores)).toEqual([2.511, 2.7352, 1.6108]);
  });
  it.each([-0.1, 1.1, NaN, Infinity])("rejects lambda=%s", (value) => {
    const problem = createProblem();
    problem.lambda = value;
    expect(() => problem.scores).toThrow(/lambda/);
  });
});

it("cocoso default ranking matches the unrounded Python preferences", () => {
  expect(rank(createProblem(false).scores, true)).toEqual([1, 2, 3]);
});

it("cocoso second ranking matches the unrounded Python preferences", () => {
  expect(rank(createProblem(true).scores, true)).toEqual([2, 3, 1, 4]);
});
