export enum CriterionType {
  BENEFIT = 1, // higher values are better
  COST = -1, // lower values are better
}

export type DecisionMatrix = number[][];
export type DecisionMatrixObject = Record<string, Record<string, number>>;
export type Scores = number[];

export interface MatrixInputInterface {
  get matrix(): DecisionMatrix;
  set matrix(matrix: DecisionMatrix);
}

export interface MatrixObjectInputInterface {
  get matrixObj(): DecisionMatrixObject;
  set matrixObj(matrixObj: DecisionMatrixObject);
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

export type NormalizationCallback = (matrix: DecisionMatrix) => DecisionMatrix;

export interface ConfigurableNormalizationInterface {
  get normalizationCallback(): NormalizationCallback | undefined;
  set normalizationCallback(callback: NormalizationCallback | undefined);
}
