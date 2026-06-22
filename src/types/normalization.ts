import type { DecisionMatrix } from "./types.js";

export type NormalizationCallback = (
    matrix: DecisionMatrix,
) => DecisionMatrix;

export interface ConfigurableNormalizationInterface {
    get normalizationCallback(): NormalizationCallback | undefined;
    set normalizationCallback(
        callback: NormalizationCallback | undefined,
    );
}
