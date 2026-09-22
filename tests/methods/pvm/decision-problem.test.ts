import { describe, expect, it } from "@jest/globals";
import { CriterionType, PvmCriterionType, PvmDecisionProblem } from "../../../src";
import { rank } from "../../../src/utils/ranking";

// Expected values from konkurencja/python/pyrepo_mcda_check-pvm.py (pyrepo_mcda 0.1.8).
const rounded = (values: number[]) => values.map((x) => Math.round(x * 10000) / 10000);
function createProblem(second = false): PvmDecisionProblem {
  const problem = new PvmDecisionProblem();
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
  problem.pvmTypes = second
    ? [
        PvmCriterionType.STIMULANT,
        PvmCriterionType.DESTIMULANT,
        PvmCriterionType.DESIRED,
        PvmCriterionType.UNDESIRED,
      ]
    : [PvmCriterionType.STIMULANT, PvmCriterionType.DESIRED, PvmCriterionType.DESTIMULANT];
  return problem;
}

describe("PvmDecisionProblem", () => {
  it("matches the Python example to four decimal places", () => {
    expect(rounded(createProblem().scores)).toEqual([-0.0126, 0.0061, -0.0222]);
  });
  it("matches the four-criterion Python example", () => {
    expect(rounded(createProblem(true).scores)).toEqual([-0.0116, 0.026, 0.0048, 0.0411]);
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
  it("matches Python with explicit psi and phi", () => {
    const problem = createProblem(true);
    problem.psi = [10, 4, 170, 6];
    problem.phi = [3, 10, 250, 2];
    expect(rounded(problem.scores)).toEqual([0.0235, 0.0553, 0.0339, 0.0619]);
  });
  it("matches Python for exclusively m criteria", () => {
    const problem = createProblem(true);
    problem.pvmTypes = Array(4).fill(PvmCriterionType.STIMULANT);
    expect(rounded(problem.scores)).toEqual([0.0061, 0.0604, 0.0365, 0.0651]);
  });
  it("matches Python for exclusively dm criteria", () => {
    const problem = createProblem(true);
    problem.pvmTypes = Array(4).fill(PvmCriterionType.DESTIMULANT);
    expect(rounded(problem.scores)).toEqual([0.0811, 0.0268, 0.0507, 0.022]);
  });
  it("matches Python for exclusively d criteria", () => {
    const problem = createProblem(true);
    problem.pvmTypes = Array(4).fill(PvmCriterionType.DESIRED);
    expect(rounded(problem.scores)).toEqual([-0.1401, -0.0862, -0.0911, -0.0861]);
  });
  it("matches Python for exclusively nd criteria", () => {
    const problem = createProblem(true);
    problem.pvmTypes = Array(4).fill(PvmCriterionType.UNDESIRED);
    expect(rounded(problem.scores)).toEqual([0.0874, 0.119, 0.0851, 0.1323]);
  });
  it("keeps two-type and four-type configuration synchronized", () => {
    const problem = createProblem();
    problem.types = [1, -1, 1];
    expect(problem.pvmTypes).toEqual(["m", "dm", "m"]);
    problem.pvmTypes = [
      PvmCriterionType.DESIRED,
      PvmCriterionType.UNDESIRED,
      PvmCriterionType.STIMULANT,
    ];
    expect(problem.types).toEqual([1, -1, 1]);
  });
  it("requires paired patterns and a nonzero direction", () => {
    const problem = createProblem();
    problem.psi = [1, 2, 3];
    expect(() => problem.scores).toThrow(/together/);
    problem.phi = [1, 2, 3];
    expect(() => problem.scores).toThrow(/divisor/);
  });
});

it("pvm default ranking matches the unrounded Python preferences", () => {
  expect(rank(createProblem(false).scores, true)).toEqual([2, 1, 3]);
});

it("pvm second ranking matches the unrounded Python preferences", () => {
  expect(rank(createProblem(true).scores, true)).toEqual([4, 2, 3, 1]);
});
