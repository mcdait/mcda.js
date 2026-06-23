export enum CriterionType {
    BENEFIT = 1, // higher values are better
    COST = -1, // lower values are better
}

export type DecisionMatrix = number[][];
export type Scores = number[];

export interface DecisionProblemInput {
    weights: number[];
    types: CriterionType[];
    matrix: DecisionMatrix;
    alternatives?: string[];
    criteria?: string[];
}

export type DecisionProblemArrayInput = [
    matrix: DecisionMatrix,
    weights: number[],
    types: CriterionType[],
    alternatives?: string[],
    criteria?: string[],
];

export type DecisionProblemSource =
    | DecisionProblemInput
    | DecisionProblemArrayInput;

export interface DecisionProblemInputAdapter<TInput = unknown> {
    supports(input: unknown): input is TInput;
    normalize(input: TInput): DecisionProblemInput;
}

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
