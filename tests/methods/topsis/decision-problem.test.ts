import { round4 } from "../../helpers/round-four-decimals";
import { describe, expect, test } from "@jest/globals";
import { CriterionType } from "../../../src/types";
import type { DecisionMatrix } from "../../../src/types";
import { vectorNormalizationCallback } from "../../../src/utils/normalization";
import { TopsisDecisionProblem } from "../../../src/methods/topsis";
import { rank } from "../../../src";

const matrix: DecisionMatrix = [
  [8, 7, 1200],
  [7, 9, 1000],
  [9, 6, 1400],
];
const alternatives = ["Laptop A", "Laptop B", "Laptop C"];
const criteria = ["Performance", "Battery", "Price"];
const weights = [0.4, 0.35, 0.25];
const types = [CriterionType.BENEFIT, CriterionType.BENEFIT, CriterionType.COST];

function createTopsisProblem(): TopsisDecisionProblem {
  const problem = new TopsisDecisionProblem();

  problem.alternatives = [...alternatives];
  problem.criteria = [...criteria];
  problem.matrix = matrix.map((row) => [...row]);
  problem.weights = [...weights];
  problem.types = [...types];
  problem.normalizationCallback = vectorNormalizationCallback;

  return problem;
}

describe("TopsisDecisionProblem", () => {
  test("preserves alternative order under row permutation", () => {
    const original = createTopsisProblem();
    const permuted = createTopsisProblem();
    const order = [2, 0, 1];
    permuted.matrix = order.map((index) => [...original.matrix[index]]);
    permuted.alternatives = order.map((index) => original.alternatives[index]);
    expect(round4(permuted.scores)).toEqual(round4(order.map((index) => original.scores[index])));
    expect(rank(permuted.scores)).toEqual([3, 2, 1]);
  });

  test("recomputes after changing weights without mutating input data", () => {
    const problem = createTopsisProblem();
    const before = structuredClone(problem.matrix);
    const initial = problem.scores;
    problem.weights = [0.2, 0.3, 0.5];
    expect(problem.scores).not.toEqual(initial);
    const fresh = createTopsisProblem();
    fresh.weights = [0.2, 0.3, 0.5];
    expect(round4(problem.scores)).toEqual(round4(fresh.scores));
    expect(problem.matrix).toEqual(before);
    expect(createTopsisProblem().weights).toEqual(weights);
  });

  test("reports distances in debug without changing scores", () => {
    const problem = createTopsisProblem();
    const initial = problem.scores;
    expect(problem.debugBag).toBeUndefined();
    problem.enableDebug(true);
    expect(problem.scores).toEqual(initial);
    const best = problem.debugBag?.distanceToBest as number[];
    const worst = problem.debugBag?.distanceToWorst as number[];
    expect(best).toHaveLength(3);
    expect(worst).toHaveLength(3);
    expect(round4(worst.map((distance, i) => distance / (distance + best[i])))).toEqual(
      round4(initial),
    );
    problem.enableDebug(false);
    expect(problem.scores).toEqual(initial);
    expect(problem.debugBag).toBeUndefined();
  });

  test("calculates scores", () => {
    const problem = createTopsisProblem();

    expect(round4(problem.scores)).toEqual([0.4119, 0.6218, 0.3782]);
  });

  test("requires normalization callback", () => {
    const problem = new TopsisDecisionProblem();

    problem.alternatives = [...alternatives];
    problem.criteria = [...criteria];
    problem.matrix = matrix.map((row) => [...row]);
    problem.weights = [...weights];
    problem.types = [...types];

    expect(() => problem.scores).toThrow("TOPSIS requires a normalization callback.");
  });
});
