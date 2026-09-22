import { describe, expect, it } from "@jest/globals";
import { CriterionType, determineVmcmPatterns, VmcmDecisionProblem } from "../../../src";
import { rank } from "../../../src/utils/ranking";

// Expected values from konkurencja/python/pyrepo_mcda_check-vmcm.py (pyrepo_mcda 0.1.8).
const rounded = (values: number[]) => values.map((x) => Math.round(x * 10000) / 10000);
function createProblem(second = false): VmcmDecisionProblem {
  const problem = new VmcmDecisionProblem();
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
  Object.assign(problem, determineVmcmPatterns(problem.matrix, problem.types));
  return problem;
}

describe("VmcmDecisionProblem", () => {
  it("matches the Python example to four decimal places", () => {
    expect(rounded(createProblem().scores)).toEqual([0.4928, 0.594, 0.4675]);
  });
  it("matches the four-criterion Python example", () => {
    expect(rounded(createProblem(true).scores)).toEqual([0.6021, 0.4584, 0.5704, 0.3968]);
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
  it("matches Python sample standardization and linear quantiles", () => {
    const problem = createProblem(true);
    expect(rounded(problem.pattern)).toEqual([0.4804, 0.6847, -0.5298, -0.5637]);
    expect(rounded(problem.antiPattern)).toEqual([-0.4804, -0.6847, 0.4636, 0.6765]);
  });
  it("matches Python with explicit patterns", () => {
    const problem = createProblem(true);
    problem.pattern = [1, 2, -1, -2];
    problem.antiPattern = [-1, -2, 1, 2];
    expect(rounded(problem.scores)).toEqual([0.5469, 0.4725, 0.5252, 0.4555]);
  });
  it("rejects constant columns and identical patterns", () => {
    const problem = createProblem();
    problem.matrix = [
      [1, 2, 3],
      [1, 3, 4],
    ];
    expect(() => problem.scores).toThrow(/constant/);
    const other = createProblem();
    other.pattern = [...other.antiPattern];
    expect(() => other.scores).toThrow(/divisor/);
  });
});

it("vmcm default ranking matches the unrounded Python preferences", () => {
  expect(rank(createProblem(false).scores, true)).toEqual([2, 1, 3]);
});

it("vmcm second ranking matches the unrounded Python preferences", () => {
  expect(rank(createProblem(true).scores, true)).toEqual([1, 3, 2, 4]);
});
