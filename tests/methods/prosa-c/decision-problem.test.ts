import { describe, expect, it } from "@jest/globals";
import {
  CriterionType,
  gaussianPreference,
  levelPreference,
  linearPreference,
  ProsaCDecisionProblem,
  uShapePreference,
  usualPreference,
  vShapePreference,
} from "../../../src";
import { rank } from "../../../src/utils/ranking";

// Expected values from konkurencja/python/pyrepo_mcda_check-prosa-c.py (pyrepo_mcda 0.1.8).
const rounded = (values: number[]) => values.map((x) => Math.round(x * 10000) / 10000);
function createProblem(second = false): ProsaCDecisionProblem {
  const problem = new ProsaCDecisionProblem();
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
  problem.preferenceFunctions = problem.weights.map(() => usualPreference);
  return problem;
}

describe("ProsaCDecisionProblem", () => {
  it("matches the Python example to four decimal places", () => {
    expect(rounded(createProblem().scores)).toEqual([0.0, -0.088, -0.488]);
  });
  it("matches the four-criterion Python example", () => {
    expect(rounded(createProblem(true).scores)).toEqual([-0.0197, -0.2547, 0.0917, -0.5333]);
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
  it("matches Python _usual_function with custom s and thresholds", () => {
    const problem = createProblem();
    problem.s = [0.137, 0.293, 0.419];
    problem.preferenceFunctions = [3, 4, 500].map((p, j) => {
      const q = [0.5, 1, 100][j];
      return usualPreference;
    });
    expect(rounded(problem.scores)).toEqual([0.0, -0.0316, -0.4316]);
  });
  it("matches Python _ushape_function with custom s and thresholds", () => {
    const problem = createProblem();
    problem.s = [0.137, 0.293, 0.419];
    problem.preferenceFunctions = [3, 4, 500].map((p, j) => {
      const q = [0.5, 1, 100][j];
      return uShapePreference(q);
    });
    expect(rounded(problem.scores)).toEqual([-0.2362, -0.0316, -0.232]);
  });
  it("matches Python _vshape_function with custom s and thresholds", () => {
    const problem = createProblem();
    problem.s = [0.137, 0.293, 0.419];
    problem.preferenceFunctions = [3, 4, 500].map((p, j) => {
      const q = [0.5, 1, 100][j];
      return vShapePreference(p);
    });
    expect(rounded(problem.scores)).toEqual([-0.0591, 0.0401, -0.2475]);
  });
  it("matches Python _level_function with custom s and thresholds", () => {
    const problem = createProblem();
    problem.s = [0.137, 0.293, 0.419];
    problem.preferenceFunctions = [3, 4, 500].map((p, j) => {
      const q = [0.5, 1, 100][j];
      return levelPreference(p, q);
    });
    expect(rounded(problem.scores)).toEqual([-0.1181, -0.0158, -0.116]);
  });
  it("matches Python _linear_function with custom s and thresholds", () => {
    const problem = createProblem();
    problem.s = [0.137, 0.293, 0.419];
    problem.preferenceFunctions = [3, 4, 500].map((p, j) => {
      const q = [0.5, 1, 100][j];
      return linearPreference(p, q);
    });
    expect(rounded(problem.scores)).toEqual([-0.0787, 0.0358, -0.1777]);
  });
  it("matches Python _gaussian_function with custom s and thresholds", () => {
    const problem = createProblem();
    problem.s = [0.137, 0.293, 0.419];
    problem.preferenceFunctions = [3, 4, 500].map((p, j) => {
      const q = [0.5, 1, 100][j];
      return gaussianPreference(p, q);
    });
    expect(rounded(problem.scores)).toEqual([-0.0465, 0.0281, -0.153]);
  });
  it("reduces to PROMETHEE net flows when s=0", () => {
    const problem = createProblem();
    problem.s = [0, 0, 0];
    expect(rounded(problem.scores)).toEqual([0, 0.2, -0.2]);
  });
  it("rejects invalid s, preference functions and a single alternative", () => {
    const problem = createProblem();
    problem.s = [0.3];
    expect(() => problem.scores).toThrow();
    problem.s = undefined;
    problem.preferenceFunctions = [() => 2, () => 0, () => 0];
    expect(() => problem.scores).toThrow();
    problem.matrix = [problem.matrix[0]];
    expect(() => problem.scores).toThrow(/two alternatives/);
  });
});

it("prosa-c default ranking matches the unrounded Python preferences", () => {
  expect(rank(createProblem(false).scores, true)).toEqual([1, 2, 3]);
});

it("prosa-c second ranking matches the unrounded Python preferences", () => {
  expect(rank(createProblem(true).scores, true)).toEqual([2, 3, 1, 4]);
});

it("distinguishes NumPy ties-to-even from Math.round at a rounding boundary", () => {
  const problem = createProblem();
  problem.s = [0.1, 0.3, 0.5];
  problem.preferenceFunctions = [0.5, 1, 100].map(uShapePreference);
  // Python raw: [-0.238, -0.032000000000000056, -0.23775].
  // NumPy round(4) gives -0.2378; JS-compatible rounding in the Python example gives -0.2377.
  expect(rounded(problem.scores)).toEqual([-0.238, -0.032, -0.2377]);
  expect(problem.scores[2]).toBeCloseTo(-0.23775, 12);
});

it("exposes criterion flows and weighted sustainability penalties", () => {
  const problem = createProblem();
  problem.enableDebug(true);
  problem.scores;
  expect(problem.debugBag?.criterionFlows).toEqual([
    [0, 0, 0],
    [-1, 1, 1],
    [1, -1, -1],
  ]);
  expect(rounded(problem.debugBag?.deviations as number[])).toEqual([0, 0.288, 0.288]);
});
