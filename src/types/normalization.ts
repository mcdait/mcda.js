import type { DecisionMatrix } from "./decision";

export type NormalizationCallback = (
    matrix: DecisionMatrix,
) => DecisionMatrix;

export interface ConfigurableNormalizationInterface {
    get normalizationCallback(): NormalizationCallback | undefined;
    set normalizationCallback(
        callback: NormalizationCallback | undefined,
    );
}
