import { AbstractDecisionProblem } from "../../core";
import type { Scores } from "../../types";
import { CriterionType } from "../../types";
import { columns, divide, finiteVector, quantile, sum, validateData } from "../shared/numeric";
import { PvmCriterionType } from "./types";

export class PvmDecisionProblem extends AbstractDecisionProblem {
  protected _pvmTypes: PvmCriterionType[] = [];
  protected _psi: number[] | undefined;
  protected _phi: number[] | undefined;
  public get pvmTypes(): PvmCriterionType[] {
    return this._pvmTypes;
  }
  public set pvmTypes(value: PvmCriterionType[]) {
    this._pvmTypes = value;
  }
  public override get types(): CriterionType[] {
    return this.pvmTypes.map((t) =>
      t === PvmCriterionType.STIMULANT || t === PvmCriterionType.DESIRED
        ? CriterionType.BENEFIT
        : CriterionType.COST,
    );
  }
  /** Benefit maps to m, cost to dm. Set pvmTypes for d and nd. */
  public override set types(value: CriterionType[]) {
    if (value.some((t) => t !== 1 && t !== -1)) throw new Error("Invalid criterion type.");
    this.pvmTypes = value.map((t) =>
      t === 1 ? PvmCriterionType.STIMULANT : PvmCriterionType.DESTIMULANT,
    );
  }
  public get psi(): number[] | undefined {
    return this._psi;
  }
  public set psi(value: number[] | undefined) {
    this._psi = value;
  }
  public get phi(): number[] | undefined {
    return this._phi;
  }
  public set phi(value: number[] | undefined) {
    this._phi = value;
  }

  protected override validate(): void {
    super.validate();
    validateData(this.matrix, this.weights, this.types);
    if (this.pvmTypes.some((t) => !Object.values(PvmCriterionType).includes(t)))
      throw new Error("PVM accepts only m, dm, d and nd types.");
    if ((this.psi === undefined) !== (this.phi === undefined))
      throw new Error("PVM psi and phi must be provided together.");
    if (this.psi !== undefined && this.phi !== undefined) {
      finiteVector(this.psi, this.weights.length, "PVM psi");
      finiteVector(this.phi, this.weights.length, "PVM phi");
    }
  }

  public override get scores(): Scores {
    this.validate();
    const cols = columns(this.matrix);
    const psi = this.psi
      ? [...this.psi]
      : cols.map((col, j) => {
          switch (this.pvmTypes[j]) {
            case PvmCriterionType.STIMULANT:
              return quantile(col, 0.75);
            case PvmCriterionType.DESTIMULANT:
              return quantile(col, 0.25);
            case PvmCriterionType.DESIRED:
              return Math.max(...col);
            case PvmCriterionType.UNDESIRED:
              return Math.min(...col);
          }
        });
    const phi = this.phi
      ? [...this.phi]
      : cols.map((col, j) => {
          switch (this.pvmTypes[j]) {
            case PvmCriterionType.STIMULANT:
              return quantile(col, 0.25);
            case PvmCriterionType.DESTIMULANT:
              return quantile(col, 0.75);
            case PvmCriterionType.DESIRED:
              return Math.min(...col);
            case PvmCriterionType.UNDESIRED:
              return Math.max(...col);
          }
        });
    const divisors = cols.map((col) => Math.hypot(...col));
    const normalizedMatrix = this.matrix.map((row) => row.map((x, j) => divide(x, divisors[j])));
    const normalizedPsi = psi.map((x, j) => divide(x, divisors[j]));
    const normalizedPhi = phi.map((x, j) => divide(x, divisors[j]));
    const differences = normalizedPsi.map((x, j) => x - normalizedPhi[j]);
    const length = Math.hypot(...differences);
    const direction = differences.map((x) => divide(x, length));
    const vectorCount = this.pvmTypes.filter((t) => t === "m" || t === "dm").length;
    const desiredCount = this.pvmTypes.filter((t) => t === "d").length;
    const undesiredCount = this.pvmTypes.filter((t) => t === "nd").length;
    const vectorScores = normalizedMatrix.map((row) =>
      sum(
        row.map((x, j) =>
          this.pvmTypes[j] === "m" || this.pvmTypes[j] === "dm"
            ? (x - normalizedPhi[j]) * direction[j] * this.weights[j]
            : 0,
        ),
      ),
    );
    const desiredDistances = normalizedMatrix.map((row) =>
      Math.sqrt(
        sum(
          row.map((x, j) =>
            this.pvmTypes[j] === "d" ? this.weights[j] ** 2 * (x - normalizedPsi[j]) ** 2 : 0,
          ),
        ),
      ),
    );
    const undesiredDistances = normalizedMatrix.map((row) =>
      Math.sqrt(
        sum(
          row.map((x, j) =>
            this.pvmTypes[j] === "nd" ? this.weights[j] ** 2 * (x - normalizedPsi[j]) ** 2 : 0,
          ),
        ),
      ),
    );
    const scores = vectorScores.map(
      (x, i) =>
        (x * vectorCount -
          desiredDistances[i] * desiredCount +
          undesiredDistances[i] * undesiredCount) /
        this.weights.length,
    );
    finiteVector(scores, this.matrix.length, "PVM scores");
    for (const [name, value] of Object.entries({
      normalizedMatrix,
      psi,
      phi,
      normalizedPsi,
      normalizedPhi,
      direction,
      vectorScores,
      desiredDistances,
      undesiredDistances,
      scores,
    }))
      this.addToDebugBag(name, value);
    return scores;
  }
}
