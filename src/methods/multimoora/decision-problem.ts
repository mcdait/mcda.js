import { AbstractDecisionProblem } from "../../core";
import type { Scores } from "../../types";
import { vectorMagnitudeNormalizationCallback } from "../../utils/normalization";
import { rank } from "../../utils/ranking";
import { columns, divide, finiteVector, sum, validateData } from "../shared/numeric";
import { dominanceDirectedGraph } from "./compromise-ranking";
import type { CompromiseRankingCallback } from "./types";

abstract class MultimooraComponent extends AbstractDecisionProblem {
  protected override validate(): void {
    super.validate();
    validateData(this.matrix, this.weights, this.types);
  }
  protected normalizedMatrix(): number[][] {
    this.validate();
    const result = vectorMagnitudeNormalizationCallback(this.matrix);
    this.addToDebugBag("normalizedMatrix", result);
    return result;
  }
  protected result(scores: Scores): Scores {
    finiteVector(scores, this.matrix.length, "MULTIMOORA scores");
    this.addToDebugBag("scores", scores);
    return scores;
  }
}

export class MultimooraRsDecisionProblem extends MultimooraComponent {
  public override get scores(): Scores {
    return this.result(
      this.normalizedMatrix().map((row) =>
        sum(row.map((x, j) => x * this.weights[j] * this.types[j])),
      ),
    );
  }
}

export class MultimooraRpDecisionProblem extends MultimooraComponent {
  public override get scores(): Scores {
    const normalized = this.normalizedMatrix();
    const reference = columns(normalized).map((col, j) =>
      this.types[j] === 1 ? Math.max(...col) : Math.min(...col),
    );
    return this.result(
      normalized.map((row) =>
        Math.max(...row.map((x, j) => this.weights[j] * Math.abs(reference[j] - x))),
      ),
    );
  }
}

export class MultimooraFmfDecisionProblem extends MultimooraComponent {
  public override get scores(): Scores {
    const normalized = this.normalizedMatrix();
    if (normalized.some((row) => row.some((x) => x <= 0)))
      throw new Error("MULTIMOORA FMF requires positive values.");
    return this.result(
      normalized.map((row) => {
        let benefit = 1,
          cost = 1;
        row.forEach((x, j) => {
          if (this.types[j] === 1) benefit *= x * this.weights[j];
          else cost *= x * this.weights[j];
        });
        return divide(benefit, cost);
      }),
    );
  }
}

/** scores contains ranks (1 = best), not utility values. */
export class MultimooraDecisionProblem extends AbstractDecisionProblem {
  protected _compromiseRankingCallback: CompromiseRankingCallback = dominanceDirectedGraph;
  public get compromiseRankingCallback(): CompromiseRankingCallback {
    return this._compromiseRankingCallback;
  }
  public set compromiseRankingCallback(value: CompromiseRankingCallback) {
    this._compromiseRankingCallback = value;
  }
  public get ranks(): number[] {
    return this.scores;
  }
  public override get scores(): Scores {
    this.validate();
    validateData(this.matrix, this.weights, this.types);
    if (typeof this.compromiseRankingCallback !== "function")
      throw new Error("A compromise ranking callback is required.");
    const methods = [
      new MultimooraRsDecisionProblem(),
      new MultimooraRpDecisionProblem(),
      new MultimooraFmfDecisionProblem(),
    ];
    const componentScores = methods.map((method) => {
      method.matrix = this.matrix;
      method.types = this.types;
      method.weights = this.weights;
      return method.scores;
    });
    const componentRanks = componentScores.map((scores, j) => rank(scores, j !== 1));
    const preferences = columns(componentScores);
    const ranksMatrix = columns(componentRanks);
    const ranks = this.compromiseRankingCallback(
      preferences.map((r) => [...r]),
      ranksMatrix.map((r) => [...r]),
    );
    finiteVector(ranks, this.matrix.length, "Compromise ranks");
    if (ranks.some((r) => !Number.isInteger(r) || r < 1 || r > this.matrix.length))
      throw new Error("Compromise callback must return valid ranks.");
    this.addToDebugBag("preferences", preferences);
    this.addToDebugBag("componentRanks", ranksMatrix);
    this.addToDebugBag("ranks", ranks);
    return ranks;
  }
}
