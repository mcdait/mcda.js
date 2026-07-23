import * as mcda from "../src";
import { describe, expect, test } from "@jest/globals";

describe("MCDA Exports", () => {
  test("should export TopsisDecisionProblem", () => {
    expect(mcda.TopsisDecisionProblem).toBeDefined();
  });

  test("should export PrometheeDecisionProblem", () => {
    expect(mcda.PrometheeDecisionProblem).toBeDefined();
  });

  test("should export VikorDecisionProblem", () => {
    expect(mcda.VikorDecisionProblem).toBeDefined();
  });

  test("should export SpotisDecisionProblem", () => {
    expect(mcda.SpotisDecisionProblem).toBeDefined();
  });

  test("should export MabacDecisionProblem", () => {
    expect(mcda.MabacDecisionProblem).toBeDefined();
  });
});
