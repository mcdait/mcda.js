import { describe, expect, test } from "@jest/globals";
import { CriterionType } from "../../src/types";
import { linearNormalizationCallback, vectorNormalizationCallback } from "../../src/utils";

describe("vectorNormalizationCallback", () => {
  test("normalizes benefit criteria by vector divisor", () => {
    const normalizedMatrix = vectorNormalizationCallback([[3], [4]], [CriterionType.BENEFIT]);

    expect(normalizedMatrix).toEqual([[0.6], [0.8]]);
  });

  test("normalizes cost criteria by inverted vector divisor", () => {
    const normalizedMatrix = vectorNormalizationCallback([[4], [3]], [CriterionType.COST]);

    expect(normalizedMatrix).toEqual([[0.19999999999999996], [0.4]]);
  });

  test("throws when matrix has no alternatives", () => {
    expect(() => vectorNormalizationCallback([], [])).toThrow(
      "Decision problem matrix requires at least one alternative.",
    );
  });

  test("throws when criterion divisor is zero", () => {
    expect(() => vectorNormalizationCallback([[0], [0]], [CriterionType.BENEFIT])).toThrow(
      "Cannot normalize criterion at index 0 because the divisor is zero.",
    );
  });
});

describe("linearNormalizationCallback", () => {
  test("normalizes benefit criteria from min to max", () => {
    const normalizedMatrix = linearNormalizationCallback([[10], [8], [6]], [CriterionType.BENEFIT]);

    expect(normalizedMatrix).toEqual([[1], [0.5], [0]]);
  });

  test("normalizes cost criteria from max to min", () => {
    const normalizedMatrix = linearNormalizationCallback([[5], [7], [4]], [CriterionType.COST]);

    expect(normalizedMatrix).toEqual([[2 / 3], [0], [1]]);
  });

  test("returns zero for criteria with identical values", () => {
    const normalizedMatrix = linearNormalizationCallback([[5], [5]], [CriterionType.BENEFIT]);

    expect(normalizedMatrix).toEqual([[0], [0]]);
  });
});
