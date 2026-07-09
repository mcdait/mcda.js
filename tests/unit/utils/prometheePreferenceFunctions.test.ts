import { describe, expect, test } from "@jest/globals";
import type { PreferenceFunction } from "../../../src/types/index.js";
import {
  gaussianPreference,
  levelPreference,
  linearPreference,
  usualPreference,
  uShapePreference,
  vShapePreference,
} from "../../../src/utils/prometheePreferenceFunctions.js";

const preferenceCases: Array<[string, PreferenceFunction, number]> = [
  ["usual", usualPreference, 1],
  ["u-shape", uShapePreference(1), 1],
  ["v-shape", vShapePreference(4), 0.5],
  ["level", levelPreference(4, 1), 0.5],
  ["linear", linearPreference(4, 1), 1 / 3],
  ["gaussian", gaussianPreference(4, 2), 1 - Math.exp(-(2 ** 2) / (2 * 3 ** 2))],
];

describe("PROMETHEE preference functions", () => {
  test.each(preferenceCases)(
    "%s calculates a preference",
    (_, preferenceFunction, expectedPreference) => {
      expect(preferenceFunction(2)).toBeCloseTo(expectedPreference);
    },
  );

  test.each(preferenceCases)(
    "%s returns no preference for a negative difference",
    (_, preferenceFunction) => {
      expect(preferenceFunction(-1)).toBe(0);
    },
  );

  test("validates non-negative finite thresholds", () => {
    expect(() => uShapePreference(-1)).toThrow(
      "PROMETHEE preference function threshold q must be a non-negative finite number.",
    );
    expect(() => linearPreference(Number.POSITIVE_INFINITY, 1)).toThrow(
      "PROMETHEE preference function threshold p must be a non-negative finite number.",
    );
  });

  test("validates a positive v-shape preference threshold", () => {
    expect(() => vShapePreference(0)).toThrow(
      "PROMETHEE preference function threshold p must be greater than 0.",
    );
  });

  test.each([
    ["level", () => levelPreference(1, 1)],
    ["linear", () => linearPreference(1, 1)],
    ["gaussian", () => gaussianPreference(1, 1)],
  ])("validates %s threshold order", (_, createPreferenceFunction) => {
    expect(createPreferenceFunction).toThrow(
      "PROMETHEE preference function threshold p must be greater than q.",
    );
  });
});
