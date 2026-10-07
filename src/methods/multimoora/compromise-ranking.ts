import { vectorMagnitudeNormalizationCallback } from "../../utils/normalization";
import { rank } from "../../utils/ranking";
import { sum, validateMatrix } from "../shared/numeric";
import type { CompromiseRankingCallback } from "./types";

function validateRanks(ranks: number[][]): void {
  validateMatrix(ranks, ranks.length, ranks[0]?.length ?? 0);
  if (ranks.some((row) => row.some((r) => !Number.isInteger(r) || r < 1 || r > ranks.length))) {
    throw new Error(
      "Compromise rankings require integer ranks from 1 to the number of alternatives.",
    );
  }
}

export const dominanceDirectedGraph: CompromiseRankingCallback = (_preferences, ranks) => {
  validateRanks(ranks);
  return rank(
    ranks.map((row) => sum(row.map((r, j) => ranks.filter((other) => other[j] > r).length))),
  );
};

export const copeland: CompromiseRankingCallback = (_preferences, ranks) => {
  validateRanks(ranks);
  const wins = ranks.map((row) => sum(row.map((r) => ranks.length - r)));
  const total = sum(wins);
  return rank(wins.map((w) => 2 * w - total));
};

export const rankPosition: CompromiseRankingCallback = (_preferences, ranks) => {
  validateRanks(ranks);
  return rank(
    ranks.map((row) => 1 / sum(row.map((r) => 1 / r))),
    false,
  );
};

/** Uses the intended formula; pyrepo_mcda 0.1.8 passes an extra normalization argument. */
export const improvedBorda: CompromiseRankingCallback = (preferences, ranks) => {
  validateRanks(ranks);
  validateMatrix(ranks, ranks.length, 3);
  validateMatrix(preferences, ranks.length, 3);
  const normalized = vectorMagnitudeNormalizationCallback(preferences);
  const m = ranks.length;
  const denominator = (m * (m + 1)) / 2;
  return rank(
    normalized.map(
      (row, i) =>
        (row[0] * (m - ranks[i][0] + 1)) / denominator -
        (row[1] * ranks[i][1]) / denominator +
        (row[2] * (m - ranks[i][2] + 1)) / denominator,
    ),
  );
};
