type NumericValues = number | readonly NumericValues[];

/** Round numerical test results to four decimal places; no tolerance comparison. */
export function round4(value: number): number;
export function round4(value: readonly number[]): number[];
export function round4(value: readonly (readonly number[])[]): number[][];
export function round4(value: NumericValues): NumericValues;
export function round4(value: NumericValues): NumericValues {
  if (typeof value !== "number") return value.map((item) => round4(item));
  if (!Number.isFinite(value)) throw new Error("Cannot round a non-finite test result.");
  const rounded = Math.round(value * 10000) / 10000;
  return Object.is(rounded, -0) ? 0 : rounded;
}
