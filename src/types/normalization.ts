import type { DecisionMatrix } from "./decision";

export type NormalizationCallback = (
    matrix: DecisionMatrix,
) => DecisionMatrix;

export interface ConfigurableNormalizationInterface {
    getNormalizationCallback(): NormalizationCallback | undefined;
    setNormalizationCallback(
        callback: NormalizationCallback | undefined,
    ): void;
}
