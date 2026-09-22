import { describe, expect, it } from "@jest/globals";
import { CriterionType } from "../../src/types";
import {
  linearNormalizationCallback,
  maxNormalizationCallback,
  minMaxNormalizationCallback,
  ratioNormalizationCallback,
  sumNormalizationCallback,
  vectorMagnitudeNormalizationCallback,
  vectorNormalizationCallback,
} from "../../src/utils";

describe("vectorNormalizationCallback", () => {
  it("normalizes benefit criteria by vector divisor", () => {
    const normalizedMatrix = vectorNormalizationCallback([[3], [4]], [CriterionType.BENEFIT]);

    expect(normalizedMatrix).toEqual([[0.6], [0.8]]);
  });

  it("normalizes cost criteria by inverted vector divisor", () => {
    const normalizedMatrix = vectorNormalizationCallback([[4], [3]], [CriterionType.COST]);

    expect(normalizedMatrix).toEqual([[0.19999999999999996], [0.4]]);
  });

  it("throws when matrix has no alternatives", () => {
    expect(() => vectorNormalizationCallback([], [])).toThrow(
      "Decision problem matrix requires at least one alternative.",
    );
  });

  it("throws when criterion divisor is zero", () => {
    expect(() => vectorNormalizationCallback([[0], [0]], [CriterionType.BENEFIT])).toThrow(
      "Cannot normalize criterion at index 0 because the divisor is zero.",
    );
  });
});

describe("linearNormalizationCallback", () => {
  it("normalizes benefit criteria from min to max", () => {
    const normalizedMatrix = linearNormalizationCallback([[10], [8], [6]], [CriterionType.BENEFIT]);

    expect(normalizedMatrix).toEqual([[1], [0.5], [0]]);
  });

  it("normalizes cost criteria from max to min", () => {
    const normalizedMatrix = linearNormalizationCallback([[5], [7], [4]], [CriterionType.COST]);

    expect(normalizedMatrix).toEqual([[2 / 3], [0], [1]]);
  });

  it("returns zero for criteria with identical values", () => {
    const normalizedMatrix = linearNormalizationCallback([[5], [5]], [CriterionType.BENEFIT]);

    expect(normalizedMatrix).toEqual([[0], [0]]);
  });
});

describe("maxNormalizationCallback", () => {
  it("normalizes benefit criteria by dividing by max", () => {
    const normalizedMatrix = maxNormalizationCallback([[1], [5], [10]], [CriterionType.BENEFIT]);

    expect(normalizedMatrix).toEqual([[0.1], [0.5], [1]]);
  });

  it("normalizes benefit criteria as 1 - x/max", () => {
    const normalizedMatrix = maxNormalizationCallback([[1], [5], [10]], [CriterionType.COST]);

    expect(normalizedMatrix).toEqual([[0.9], [0.5], [0]]);
  });

  it("returns 1 for criteria with identical values", () => {
    const normalizedMatrix = maxNormalizationCallback([[5], [5]], [CriterionType.BENEFIT]);

    expect(normalizedMatrix).toEqual([[1], [1]]);
  });

  it("normalizes data per criterion not per alternative", () => {
    const normalizedMatrix = maxNormalizationCallback(
      [
        [1, 1],
        [5, 5],
        [10, 10],
      ],
      [CriterionType.BENEFIT, CriterionType.COST],
    );

    expect(normalizedMatrix).toEqual([
      [0.1, 0.9],
      [0.5, 0.5],
      [1, 0],
    ]);
  });

  it("throws if any max is 0", () => {
    expect(() => maxNormalizationCallback([[0], [-5]], [CriterionType.BENEFIT])).toThrow(
      "Cannot normalize criterion at index 0 because the maximum value is zero.",
    );
  });
});

describe("minMaxNormalizationCallback", () => {
  it("normalizes data using min-max alg. per criterion not per alternative", () => {
    const normalizedMatrix = minMaxNormalizationCallback(
      [
        [1, 1],
        [5, 5],
        [9, 9],
      ],
      [CriterionType.BENEFIT, CriterionType.COST],
    );

    expect(normalizedMatrix).toEqual([
      [0, 1],
      [0.5, 0.5],
      [1, 0],
    ]);
  });

  it("throws for criteria with identical values", () => {
    expect(() => minMaxNormalizationCallback([[5], [5]], [CriterionType.BENEFIT])).toThrow(
      "Cannot normalize criterion at index 0 because all values are equal.",
    );
  });
});

describe("sumNormalizationCallback", () => {
  it("normalizes benefit criteria by dividing by sum", () => {
    const normalizedMatrix = sumNormalizationCallback(
      [[0.25], [0.25], [0.5]],
      [CriterionType.BENEFIT],
    );

    expect(normalizedMatrix).toEqual([[0.25], [0.25], [0.5]]);
  });
  it("normalizes cost criteria by dividing 1/x by sum(1/x)", () => {
    const normalizedMatrix = sumNormalizationCallback(
      [[0.25], [0.25], [0.5]],
      [CriterionType.COST],
    );

    expect(normalizedMatrix).toEqual([[0.4], [0.4], [0.2]]);
  });

  it("normalizes data per criterion not per alternative", () => {
    const normalizedMatrix = sumNormalizationCallback(
      [
        [0.25, 0.25],
        [0.25, 0.25],
        [0.5, 0.5],
      ],
      [CriterionType.BENEFIT, CriterionType.COST],
    );

    expect(normalizedMatrix).toEqual([
      [0.25, 0.4],
      [0.25, 0.4],
      [0.5, 0.2],
    ]);
  });

  it("throws if a cost criterion has any 0 value", () => {
    expect(() =>
      sumNormalizationCallback(
        [
          [5, 5],
          [0, 0],
        ],
        [CriterionType.BENEFIT, CriterionType.COST],
      ),
    ).toThrow("Cannot normalize criterion at index 1 because it contains zero values");
  });

  it("throws if any criterion has negative value", () => {
    expect(() =>
      sumNormalizationCallback(
        [
          [1, 1],
          [2, 2],
          [3, -3],
        ],
        [CriterionType.BENEFIT, CriterionType.BENEFIT],
      ),
    ).toThrow("Sum normalization requires that none of the values are negative");
  });
});

const matrix = [
  [8, 7, 1200],
  [7, 9, 1000],
  [9, 6, 1400],
];
const rounded = (matrix: number[][]) =>
  matrix.map((row) => row.map((x) => Math.round(x * 10000) / 10000));
describe("Additional normalizations", () => {
  it("matches Python linear normalization including costs", () => {
    expect(rounded(ratioNormalizationCallback(matrix, [1, 1, -1]))).toEqual([
      [0.8889, 0.7778, 0.8333],
      [0.7778, 1.0, 1.0],
      [1.0, 0.6667, 0.7143],
    ]);
  });
  it("matches Python MULTIMOORA normalization without cost inversion", () => {
    expect(rounded(vectorMagnitudeNormalizationCallback(matrix))).toEqual([
      [0.5744, 0.5433, 0.5721],
      [0.5026, 0.6985, 0.4767],
      [0.6462, 0.4657, 0.6674],
    ]);
  });
  it("rejects zero divisors and malformed matrices", () => {
    expect(() => ratioNormalizationCallback([[0, 1]], [1, -1])).toThrow();
    expect(() =>
      vectorMagnitudeNormalizationCallback([
        [0, 1],
        [0, 2],
      ]),
    ).toThrow();
    expect(() => vectorMagnitudeNormalizationCallback([[1], [1, 2]])).toThrow();
    expect(() => ratioNormalizationCallback([[1, Infinity]], [1, -1])).toThrow();
  });
});
