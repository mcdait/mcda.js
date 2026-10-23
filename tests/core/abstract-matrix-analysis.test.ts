import { describe, expect, test } from "@jest/globals";
import {
  AbstractDebuggable,
  AbstractMatrixAnalysis,
  DariaAnalysis,
  VikorSmaaAnalysis,
} from "../../src";

describe.each([DariaAnalysis, VikorSmaaAnalysis])("%p matrix storage", (Analysis) => {
  test("retains assigned references and keeps instance state separate", () => {
    const analysis = new Analysis();
    const other = new Analysis();
    expect(analysis).toBeInstanceOf(AbstractMatrixAnalysis);
    expect(analysis).toBeInstanceOf(AbstractDebuggable);
    expect(analysis.matrix).toEqual([]);
    expect(analysis.matrix).not.toBe(other.matrix);
    const matrix = [[1, 2]];
    analysis.matrix = matrix;
    expect(analysis.matrix).toBe(matrix);
    expect(analysis.matrix[0]).toBe(matrix[0]);
    matrix[0][0] = 3;
    expect(analysis.matrix).toEqual([[3, 2]]);
    expect(other.matrix).toEqual([]);
    analysis.enableDebug(true);
    analysis.addToDebugBag("note", "first instance");
    expect(other.debugBag).toBeUndefined();
  });
});
