import type { DecisionMatrix, MatrixInputInterface } from "../types";
import { AbstractDebuggable } from "./abstract-debuggable";

/** Matrix storage and diagnostics; each analysis defines its axes and result. */
export abstract class AbstractMatrixAnalysis<TResult>
  extends AbstractDebuggable
  implements MatrixInputInterface
{
  protected _matrix: DecisionMatrix = [];

  public get matrix(): DecisionMatrix {
    return this._matrix;
  }

  public set matrix(value: DecisionMatrix) {
    this._matrix = value;
  }

  public abstract get result(): TResult;
}
