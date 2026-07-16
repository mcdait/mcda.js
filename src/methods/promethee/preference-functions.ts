import { PreferenceFunction } from "./types";

export const usualPreference: PreferenceFunction = (difference) => (difference <= 0 ? 0 : 1);

export function uShapePreference(q: number): PreferenceFunction {
  validateThreshold(q, "q");

  return (difference) => (difference <= q ? 0 : 1);
}

export function vShapePreference(p: number): PreferenceFunction {
  validatePositiveThreshold(p, "p");

  return (difference) => {
    if (difference <= 0) {
      return 0;
    }

    if (difference <= p) {
      return difference / p;
    }

    return 1;
  };
}

export function levelPreference(p: number, q: number): PreferenceFunction {
  validateOrderedThresholds(p, q);

  return (difference) => {
    if (difference <= q) {
      return 0;
    }

    if (difference <= p) {
      return 0.5;
    }

    return 1;
  };
}

export function linearPreference(p: number, q: number): PreferenceFunction {
  validateOrderedThresholds(p, q);

  return (difference) => {
    if (difference <= q) {
      return 0;
    }

    if (difference <= p) {
      return (difference - q) / (p - q);
    }

    return 1;
  };
}

export function gaussianPreference(p: number, q: number): PreferenceFunction {
  validateOrderedThresholds(p, q);
  const s = (p + q) / 2;

  return (difference) => {
    if (difference <= 0) {
      return 0;
    }

    return 1 - Math.exp(-(difference ** 2) / (2 * s ** 2));
  };
}

function validateThreshold(threshold: number, name: string): void {
  if (!Number.isFinite(threshold) || threshold < 0) {
    throw new Error(
      `PROMETHEE preference function threshold ${name} must be a non-negative finite number.`,
    );
  }
}

function validatePositiveThreshold(threshold: number, name: string): void {
  validateThreshold(threshold, name);

  if (threshold === 0) {
    throw new Error(`PROMETHEE preference function threshold ${name} must be greater than 0.`);
  }
}

function validateOrderedThresholds(p: number, q: number): void {
  validateThreshold(p, "p");
  validateThreshold(q, "q");

  if (p <= q) {
    throw new Error("PROMETHEE preference function threshold p must be greater than q.");
  }
}
