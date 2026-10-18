import { round4 } from "../../helpers/round-four-decimals";
import { describe, expect, it } from "@jest/globals";
import { CriterionType } from "../../../src/types";
import type { DecisionMatrix } from "../../../src/types";
import { linearNormalizationCallback } from "../../../src/utils";
import { MabacDecisionProblem } from "../../../src/methods/mabac";
import type { MabacDebugResults } from "../../../src/methods/mabac";

const matrix: DecisionMatrix = [
  [8, 7, 1200],
  [7, 9, 1000],
  [9, 6, 1400],
];
const alternatives = ["Laptop A", "Laptop B", "Laptop C"];
const criteria = ["Performance", "Battery", "Price"];
const weights = [0.4, 0.35, 0.25];
const types = [CriterionType.BENEFIT, CriterionType.BENEFIT, CriterionType.COST];

function createMabacProblem(): MabacDecisionProblem {
  const problem = new MabacDecisionProblem();

  problem.alternatives = [...alternatives];
  problem.criteria = [...criteria];
  problem.matrix = matrix.map((row) => [...row]);
  problem.weights = [...weights];
  problem.types = [...types];
  problem.normalizationCallback = linearNormalizationCallback;

  return problem;
}

describe("MabacDecisionProblem", () => {
  it("calculates scores", () => {
    const problem = createMabacProblem();

    expect(round4(problem.scores)).toEqual([0.0189, 0.1772, -0.0228]);
  });

  describe("validations", () => {
    it("requires normalization callback", () => {
      const problem = createMabacProblem();

      problem.normalizationCallback = undefined;

      expect(() => problem.scores).toThrow(
        "This MABAC implementation requires a normalization callback.",
      );
    });

    it("throws when normalization returns more criteria than weights", () => {
      const problem = createMabacProblem();

      problem.normalizationCallback = () => [
        [0.5, 1 / 3, 0.5, 1],
        [0, 1, 1, 1],
        [1, 0, 0, 1],
      ];

      expect(() => problem.scores).toThrow("MABAC criterion weight is required.");
    });

    it("throws when normalization returns too few weighted values", () => {
      const problem = createMabacProblem();

      problem.normalizationCallback = () => [[], [], []];

      expect(() => problem.scores).toThrow("MABAC weighted normalized value is required.");
    });
  });

  it("optionally provides debug", () => {
    const problem = createMabacProblem();

    problem.enableDebug(true);

    problem.scores;
    const debugBag = problem.debugBag as MabacDebugResults | undefined;
    expect(debugBag).not.toBeUndefined();
  });
});
