import { describe, expect, it } from "@jest/globals";
import {
  copeland,
  CriterionType,
  improvedBorda,
  MultimooraDecisionProblem,
  rankPosition,
} from "../../../src";

// Expected values from konkurencja/python/pyrepo_mcda_check-multimoora.py (pyrepo_mcda 0.1.8).
const rounded = (values: number[]) => values.map((x) => Math.round(x * 10000) / 10000);
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
  it("matches the Python example to four decimal places", () => {
    expect(rounded(createProblem().scores)).toEqual([2, 1, 3]);
  });
  it("matches the four-criterion Python example", () => {
    expect(rounded(createProblem(true).scores)).toEqual([1, 2, 1, 2]);
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
  it("matches Python copeland", () => {
    const problem = createProblem(true);
    problem.compromiseRankingCallback = copeland;
    expect(problem.ranks).toEqual([1, 2, 1, 2]);
  });
  it("matches Python rank_position_method", () => {
    const problem = createProblem(true);
    problem.compromiseRankingCallback = rankPosition;
    expect(problem.ranks).toEqual([1, 4, 2, 3]);
  });
  it("matches Python improved_borda_rule_adapter", () => {
    const problem = createProblem(true);
    problem.compromiseRankingCallback = improvedBorda;
    expect(problem.ranks).toEqual([1, 4, 2, 3]);
  });
  it("handles two alternatives without Python's graph allocation bug", () => {
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
    expect(() => problem.scores).toThrow(/valid ranks/);
  });
});

it("multimoora default ranking matches the unrounded Python preferences", () => {
  expect(createProblem(false).scores).toEqual([2, 1, 3]);
});

it("multimoora second ranking matches the unrounded Python preferences", () => {
  expect(createProblem(true).scores).toEqual([1, 2, 1, 2]);
});
