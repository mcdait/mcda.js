import type { CriterionType } from "./criteria";
import type { DecisionMatrix } from "./decision";

export interface MatrixInputInterface {
    get matrix(): DecisionMatrix;
    set matrix(matrix: DecisionMatrix);
}

export interface WeightsInputInterface {
    get weights(): number[];
    set weights(weights: number[]);
}

export interface CriteriaTypesInputInterface {
    get types(): CriterionType[];
    set types(types: CriterionType[]);
}

export interface AlternativesInputInterface {
    get alternatives(): string[];
    set alternatives(alternatives: string[]);
}

export interface CriteriaInputInterface {
    get criteria(): string[];
    set criteria(criteria: string[]);
}
