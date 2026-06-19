import type { CriterionType } from "./criteria";
import type { DecisionMatrix } from "./decision";

export interface MatrixInputInterface {
    getMatrix(): DecisionMatrix;
    setMatrix(matrix: DecisionMatrix): void;
}

export interface WeightsInputInterface {
    getWeights(): number[];
    setWeights(weights: number[]): void;
}

export interface CriteriaTypesInputInterface {
    getTypes(): CriterionType[];
    setTypes(types: CriterionType[]): void;
}
