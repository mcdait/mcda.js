import * as mcda from "../src";
import { describe, expect, test } from "@jest/globals";

describe("MCDA Exports", () => {
  test("should export TopsisDecisionProblem", () => {
    expect(mcda.TopsisDecisionProblem).toBeDefined();
  });

  test("should export PrometheeDecisionProblem", () => {
    expect(mcda.PrometheeDecisionProblem).toBeDefined();
  });
});
